from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class TunnelCreate(BaseModel):
    subdomain: str = Field(
        ..., min_length=1, max_length=63, pattern=r"^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$"
    )
    target_port: int = Field(default=8123, ge=1, le=65535)


class TunnelUpdate(BaseModel):
    target_port: Optional[int] = Field(None, ge=1, le=65535)
    is_active: Optional[bool] = None


class TunnelResponse(BaseModel):
    id: UUID
    subdomain: str
    target_port: int
    vpn_ip: str
    device_ip: str
    is_active: bool
    full_domain: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SubdomainCheck(BaseModel):
    subdomain: str
    available: bool
