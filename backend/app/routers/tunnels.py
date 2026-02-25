from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import PlainTextResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.services.activity import log_activity
from app.models.tunnel import Tunnel
from app.models.user import User
from app.schemas.tunnel import SubdomainCheck, TunnelCreate, TunnelResponse, TunnelUpdate
from app.services.crypto import decrypt_key, encrypt_key
from app.services.certbot import certbot_service
from app.services.haproxy import haproxy_service
from app.services.ip_allocator import ip_allocator
from app.services.email import send_tunnel_created_email
from app.services.wireguard import wireguard_service

router = APIRouter()

RESERVED_SUBDOMAINS = {
    "www", "api", "admin", "mail", "ftp", "ns1", "ns2", "vpn",
    "wg", "status", "health", "app", "portal", "dashboard",
    "smtp", "imap", "pop", "dns", "cdn", "static",
}


def _to_response(tunnel: Tunnel) -> TunnelResponse:
    return TunnelResponse(
        id=tunnel.id,
        subdomain=tunnel.subdomain,
        target_port=tunnel.target_port,
        vpn_ip=str(tunnel.vpn_ip),
        device_ip=str(tunnel.device_ip),
        is_active=tunnel.is_active,
        full_domain=f"{tunnel.subdomain}.{settings.domain}",
        created_at=tunnel.created_at,
        updated_at=tunnel.updated_at,
    )


@router.get("/check-subdomain", response_model=SubdomainCheck)
async def check_subdomain(
    subdomain: str = Query(..., min_length=1, max_length=63),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    subdomain = subdomain.lower()
    if subdomain in RESERVED_SUBDOMAINS:
        return SubdomainCheck(subdomain=subdomain, available=False)
    result = await db.execute(select(Tunnel).where(Tunnel.subdomain == subdomain))
    exists = result.scalar_one_or_none()
    return SubdomainCheck(subdomain=subdomain, available=exists is None)


@router.get("/status")
async def tunnels_status(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return WireGuard connection status for each of the user's tunnels."""
    result = await db.execute(
        select(Tunnel).where(Tunnel.user_id == user.id)
    )
    tunnels = result.scalars().all()
    peers_status = wireguard_service.get_peers_status()
    default = {"connected": False, "connected_since": 0}
    return {
        str(t.id): peers_status.get(t.client_public_key, default)
        for t in tunnels
    }


@router.get("/", response_model=list[TunnelResponse])
async def list_tunnels(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Tunnel).where(Tunnel.user_id == user.id).order_by(Tunnel.created_at.desc())
    )
    tunnels = result.scalars().all()
    return [_to_response(t) for t in tunnels]


@router.post("/", response_model=TunnelResponse, status_code=status.HTTP_201_CREATED)
async def create_tunnel(
    data: TunnelCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check tunnel quota
    count_result = await db.execute(
        select(func.count()).select_from(Tunnel).where(Tunnel.user_id == user.id)
    )
    tunnel_count = count_result.scalar()
    if tunnel_count >= user.max_tunnels:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Tunnel limit reached ({user.max_tunnels})",
        )

    subdomain = data.subdomain.lower()

    # Check reserved
    if subdomain in RESERVED_SUBDOMAINS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This subdomain is reserved",
        )

    # Check uniqueness
    result = await db.execute(select(Tunnel).where(Tunnel.subdomain == subdomain))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Subdomain already taken",
        )

    # Allocate IPs
    vpn_ip = await ip_allocator.allocate_next_ip(db)
    device_ip = await ip_allocator.allocate_next_device_ip(db)

    # Generate WireGuard keypair
    private_key, public_key = wireguard_service.generate_keypair()
    server_public_key = wireguard_service.get_server_public_key()

    # Create tunnel in DB
    tunnel = Tunnel(
        user_id=user.id,
        subdomain=subdomain,
        target_port=data.target_port,
        vpn_ip=vpn_ip,
        device_ip=device_ip,
        client_private_key=encrypt_key(private_key),
        client_public_key=public_key,
        server_public_key=server_public_key,
    )
    db.add(tunnel)
    await db.commit()
    await db.refresh(tunnel)

    # Add WireGuard peer
    try:
        wireguard_service.add_peer(public_key, vpn_ip, device_ip)
    except Exception as e:
        await db.delete(tunnel)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to configure WireGuard: {e}",
        )

    # Regenerate HAProxy config
    await haproxy_service.regenerate_config(db)

    # Request SSL certificate for the subdomain (non-blocking failure)
    certbot_service.request_cert(subdomain)

    await log_activity(user.email, "tunnel_create", detail=subdomain)

    # Send welcome email with WireGuard config attached
    try:
        private_key = decrypt_key(tunnel.client_private_key)
        config_text = wireguard_service.generate_client_config(
            private_key=private_key,
            vpn_ip=vpn_ip,
            device_ip=device_ip,
            server_public_key=tunnel.server_public_key,
        )
        send_tunnel_created_email(
            to_email=user.email,
            subdomain=subdomain,
            full_domain=f"{subdomain}.{settings.domain}",
            vpn_ip=vpn_ip,
            device_ip=device_ip,
            target_port=data.target_port,
            config_text=config_text,
        )
    except Exception:
        pass  # non-blocking: don't fail tunnel creation if email fails

    return _to_response(tunnel)


@router.get("/{tunnel_id}", response_model=TunnelResponse)
async def get_tunnel(
    tunnel_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tunnel = await _get_user_tunnel(tunnel_id, user.id, db)
    return _to_response(tunnel)


@router.patch("/{tunnel_id}", response_model=TunnelResponse)
async def update_tunnel(
    tunnel_id: UUID,
    data: TunnelUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tunnel = await _get_user_tunnel(tunnel_id, user.id, db)

    if data.target_port is not None:
        tunnel.target_port = data.target_port
    if data.is_active is not None:
        tunnel.is_active = data.is_active
        if data.is_active:
            wireguard_service.add_peer(tunnel.client_public_key, str(tunnel.vpn_ip), str(tunnel.device_ip))
        else:
            try:
                wireguard_service.remove_peer(tunnel.client_public_key)
            except Exception:
                pass

    await db.commit()
    await db.refresh(tunnel)

    await haproxy_service.regenerate_config(db)

    if data.is_active is not None:
        state = "actif" if tunnel.is_active else "inactif"
        await log_activity(user.email, "tunnel_toggle", detail=f"{tunnel.subdomain} → {state}")

    return _to_response(tunnel)


@router.delete("/{tunnel_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tunnel(
    tunnel_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tunnel = await _get_user_tunnel(tunnel_id, user.id, db)
    subdomain = tunnel.subdomain

    # Remove WireGuard peer
    try:
        wireguard_service.remove_peer(tunnel.client_public_key)
    except Exception:
        pass

    await db.delete(tunnel)
    await db.commit()

    # Regenerate HAProxy config
    await haproxy_service.regenerate_config(db)

    await log_activity(user.email, "tunnel_delete", detail=subdomain)


@router.get("/{tunnel_id}/config")
async def download_config(
    tunnel_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tunnel = await _get_user_tunnel(tunnel_id, user.id, db)
    private_key = decrypt_key(tunnel.client_private_key)

    config = wireguard_service.generate_client_config(
        private_key=private_key,
        vpn_ip=str(tunnel.vpn_ip),
        device_ip=str(tunnel.device_ip),
        server_public_key=tunnel.server_public_key,
    )

    return PlainTextResponse(
        content=config,
        media_type="text/plain",
        headers={
            "Content-Disposition": f'attachment; filename="homevpn-{tunnel.subdomain}.conf"'
        },
    )


async def _get_user_tunnel(tunnel_id: UUID, user_id: UUID, db: AsyncSession) -> Tunnel:
    result = await db.execute(
        select(Tunnel).where(Tunnel.id == tunnel_id, Tunnel.user_id == user_id)
    )
    tunnel = result.scalar_one_or_none()
    if not tunnel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tunnel not found",
        )
    return tunnel
