import uuid
from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import INET, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Tunnel(Base):
    __tablename__ = "tunnels"
    __table_args__ = (
        CheckConstraint(
            "subdomain ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'",
            name="chk_subdomain_format",
        ),
        CheckConstraint(
            "target_port BETWEEN 1 AND 65535",
            name="chk_target_port",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    subdomain: Mapped[str] = mapped_column(String(63), unique=True, nullable=False)
    target_port: Mapped[int] = mapped_column(Integer, nullable=False, default=8123)
    vpn_ip: Mapped[str] = mapped_column(INET, unique=True, nullable=False)
    client_private_key: Mapped[str] = mapped_column(Text, nullable=False)
    client_public_key: Mapped[str] = mapped_column(Text, nullable=False)
    server_public_key: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", back_populates="tunnels")
