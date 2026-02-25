from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    email: EmailStr


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class UserResponse(BaseModel):
    id: UUID
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserProfile(BaseModel):
    id: UUID
    email: str
    is_admin: bool
    is_beta_tester: bool
    max_tunnels: int
    tunnel_count: int

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# --- Admin schemas ---


class AdminUserResponse(BaseModel):
    id: UUID
    email: str
    is_active: bool
    is_verified: bool
    is_admin: bool
    is_beta_tester: bool
    max_tunnels: int
    tunnel_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminTunnelResponse(BaseModel):
    id: UUID
    user_id: UUID
    user_email: str
    subdomain: str
    target_port: int
    service_type: str | None = None
    vpn_ip: str
    device_ip: str
    use_device_ip: bool
    is_active: bool
    full_domain: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminUserUpdate(BaseModel):
    is_active: bool | None = None
    is_beta_tester: bool | None = None
    max_tunnels: int | None = None
