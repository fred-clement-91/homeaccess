from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.tunnel import Tunnel
from app.models.user import User
from app.schemas.user import (
    ForgotPasswordRequest,
    TokenResponse,
    UserLogin,
    UserProfile,
    UserRegister,
    UserResponse,
)
from app.services.auth import create_access_token, hash_password, verify_password
from app.services.activity import log_activity
from app.services.email import (
    generate_password,
    generate_verification_code,
    send_new_password_email,
    send_new_user_notification,
    send_verification_email,
)

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class VerifyRequest(BaseModel):
    email: str
    code: str


class ResendRequest(BaseModel):
    email: str


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/hour")
async def register(request: Request, data: UserRegister, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    code = generate_verification_code()
    password = generate_password()

    user = User(
        email=data.email,
        password_hash=hash_password(password),
        is_verified=False,
        verification_code=code,
        verification_expires=datetime.now(timezone.utc) + timedelta(minutes=15),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    try:
        send_verification_email(data.email, code, password)
    except Exception:
        pass

    try:
        send_new_user_notification(data.email)
    except Exception:
        pass

    await log_activity(data.email, "register")

    return user


@router.post("/verify", response_model=TokenResponse)
@limiter.limit("10/minute")
async def verify_email(request: Request, data: VerifyRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.is_verified:
        return TokenResponse(access_token=create_access_token(user.id))

    if not user.verification_code or user.verification_code != data.code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code")

    if user.verification_expires and user.verification_expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification code expired")

    user.is_verified = True
    user.verification_code = None
    user.verification_expires = None
    await db.commit()

    token = create_access_token(user.id)
    return TokenResponse(access_token=token)


@router.post("/resend-code")
@limiter.limit("3/hour")
async def resend_code(request: Request, data: ResendRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or user.is_verified:
        return {"message": "If the account exists, a new code has been sent"}

    code = generate_verification_code()
    password = generate_password()

    user.verification_code = code
    user.verification_expires = datetime.now(timezone.utc) + timedelta(minutes=15)
    user.password_hash = hash_password(password)
    await db.commit()

    try:
        send_verification_email(data.email, code, password)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email",
        )

    return {"message": "If the account exists, a new code has been sent"}


@router.post("/forgot-password")
@limiter.limit("3/hour")
async def forgot_password(request: Request, data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if user and user.is_active:
        new_password = generate_password()
        user.password_hash = hash_password(new_password)
        await db.commit()

        try:
            send_new_password_email(data.email, new_password)
        except Exception:
            pass

    # Always return same message (anti-enumeration)
    return {"message": "Si ce compte existe, un nouveau mot de passe a ete envoye par email."}


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ce compte a \u00e9t\u00e9 d\u00e9sactiv\u00e9",
        )
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="not_verified",
        )
    await log_activity(user.email, "login")

    token = create_access_token(user.id)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserProfile)
async def get_me(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(func.count()).select_from(Tunnel).where(Tunnel.user_id == user.id)
    )
    tunnel_count = result.scalar()
    return UserProfile(
        id=user.id,
        email=user.email,
        is_admin=user.is_admin,
        max_tunnels=user.max_tunnels,
        tunnel_count=tunnel_count,
    )
