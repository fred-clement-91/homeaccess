from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_admin
from app.models.activity_log import ActivityLog
from app.models.tunnel import Tunnel
from app.models.user import User
from app.schemas.user import AdminTunnelResponse, AdminUserResponse, AdminUserUpdate
from app.services.activity import log_activity
from app.services.haproxy import haproxy_service
from app.services.wireguard import wireguard_service

router = APIRouter()


# ---- Users ----


@router.get("/users", response_model=list[AdminUserResponse])
async def list_users(
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    tunnel_count_sq = (
        select(Tunnel.user_id, func.count().label("tunnel_count"))
        .group_by(Tunnel.user_id)
        .subquery()
    )
    result = await db.execute(
        select(User, func.coalesce(tunnel_count_sq.c.tunnel_count, 0).label("tc"))
        .outerjoin(tunnel_count_sq, User.id == tunnel_count_sq.c.user_id)
        .order_by(User.created_at.desc())
    )
    return [
        AdminUserResponse(
            id=user.id,
            email=user.email,
            is_active=user.is_active,
            is_verified=user.is_verified,
            is_admin=user.is_admin,
            is_beta_tester=user.is_beta_tester,
            max_tunnels=user.max_tunnels,
            tunnel_count=tc,
            created_at=user.created_at,
        )
        for user, tc in result.all()
    ]


@router.patch("/users/{user_id}", response_model=AdminUserResponse)
async def update_user(
    user_id: UUID,
    data: AdminUserUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify your own admin account",
        )
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if data.is_active is not None:
        user.is_active = data.is_active
        # Remove/restore all WireGuard peers on ban/unban
        tunnels_result = await db.execute(
            select(Tunnel).where(Tunnel.user_id == user.id)
        )
        for tunnel in tunnels_result.scalars().all():
            try:
                if data.is_active:
                    wireguard_service.add_peer(tunnel.client_public_key, str(tunnel.vpn_ip), str(tunnel.device_ip))
                else:
                    wireguard_service.remove_peer(tunnel.client_public_key)
            except Exception:
                pass
    if data.is_beta_tester is not None:
        user.is_beta_tester = data.is_beta_tester
    if data.max_tunnels is not None:
        old_max = user.max_tunnels
        user.max_tunnels = data.max_tunnels

    await db.commit()
    await db.refresh(user)

    # Log activity after commit (separate session, never blocks)
    if data.is_active is not None:
        action = "admin_unban" if data.is_active else "admin_ban"
        await log_activity(admin.email, action, detail=user.email)
    if data.max_tunnels is not None:
        await log_activity(admin.email, "admin_update_quota", detail=f"{user.email}: {old_max} → {data.max_tunnels}")

    count_result = await db.execute(
        select(func.count()).select_from(Tunnel).where(Tunnel.user_id == user.id)
    )
    tunnel_count = count_result.scalar()

    return AdminUserResponse(
        id=user.id,
        email=user.email,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_admin=user.is_admin,
        is_beta_tester=user.is_beta_tester,
        max_tunnels=user.max_tunnels,
        tunnel_count=tunnel_count,
        created_at=user.created_at,
    )


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own admin account",
        )
    result = await db.execute(
        select(User).options(selectinload(User.tunnels)).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user_email = user.email

    # Remove all WireGuard peers before DB cascade delete
    for tunnel in user.tunnels:
        try:
            wireguard_service.remove_peer(tunnel.client_public_key)
        except Exception:
            pass

    await db.delete(user)
    await db.commit()

    # Regenerate HAProxy config
    await haproxy_service.regenerate_config(db)

    await log_activity(admin.email, "admin_delete_user", detail=user_email)


# ---- Tunnels ----


@router.get("/tunnels", response_model=list[AdminTunnelResponse])
async def list_all_tunnels(
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Tunnel).options(selectinload(Tunnel.user)).order_by(Tunnel.created_at.desc())
    )
    tunnels = result.scalars().all()
    return [
        AdminTunnelResponse(
            id=t.id,
            user_id=t.user_id,
            user_email=t.user.email,
            subdomain=t.subdomain,
            target_port=t.target_port,
            vpn_ip=str(t.vpn_ip),
            device_ip=str(t.device_ip),
            is_active=t.is_active,
            full_domain=f"{t.subdomain}.{settings.domain}",
            created_at=t.created_at,
        )
        for t in tunnels
    ]


@router.get("/tunnels/status")
async def all_tunnels_status(
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Return WireGuard connection status for ALL tunnels."""
    result = await db.execute(select(Tunnel))
    tunnels = result.scalars().all()
    peers_status = wireguard_service.get_peers_status()
    default = {"connected": False, "connected_since": 0}
    return {
        str(t.id): peers_status.get(t.client_public_key, default)
        for t in tunnels
    }


@router.patch("/tunnels/{tunnel_id}", response_model=AdminTunnelResponse)
async def admin_update_tunnel(
    tunnel_id: UUID,
    data: dict,
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Tunnel).options(selectinload(Tunnel.user)).where(Tunnel.id == tunnel_id)
    )
    tunnel = result.scalar_one_or_none()
    if not tunnel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tunnel not found")

    if "is_active" in data:
        tunnel.is_active = data["is_active"]
        if data["is_active"]:
            wireguard_service.add_peer(tunnel.client_public_key, str(tunnel.vpn_ip), str(tunnel.device_ip))
        else:
            try:
                wireguard_service.remove_peer(tunnel.client_public_key)
            except Exception:
                pass

    await db.commit()
    await db.refresh(tunnel)

    await haproxy_service.regenerate_config(db)

    if "is_active" in data:
        state = "actif" if tunnel.is_active else "inactif"
        await log_activity(_admin.email, "admin_toggle_tunnel", detail=f"{tunnel.subdomain} → {state}")

    return AdminTunnelResponse(
        id=tunnel.id,
        user_id=tunnel.user_id,
        user_email=tunnel.user.email,
        subdomain=tunnel.subdomain,
        target_port=tunnel.target_port,
        vpn_ip=str(tunnel.vpn_ip),
        device_ip=str(tunnel.device_ip),
        is_active=tunnel.is_active,
        full_domain=f"{tunnel.subdomain}.{settings.domain}",
        created_at=tunnel.created_at,
    )


# ---- Activity log ----


@router.get("/activity")
async def list_activity(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    search: str = Query(default="", max_length=200),
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Return recent activity log entries (newest first), optionally filtered."""
    query = select(ActivityLog)
    if search:
        pattern = f"%{search}%"
        query = query.where(
            ActivityLog.user_email.ilike(pattern)
            | ActivityLog.action.ilike(pattern)
            | ActivityLog.detail.ilike(pattern)
        )
    query = query.order_by(ActivityLog.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    logs = result.scalars().all()
    return [
        {
            "id": str(log.id),
            "user_email": log.user_email,
            "action": log.action,
            "detail": log.detail,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]
