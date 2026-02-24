"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-02-24
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, INET

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("verification_code", sa.String(6), nullable=True),
        sa.Column("verification_expires", sa.DateTime(timezone=True), nullable=True),
        sa.Column("max_tunnels", sa.Integer(), nullable=False, server_default=sa.text("5")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "tunnels",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("subdomain", sa.String(63), unique=True, nullable=False),
        sa.Column("target_port", sa.Integer(), nullable=False, server_default=sa.text("8123")),
        sa.Column("vpn_ip", INET(), unique=True, nullable=False),
        sa.Column("client_private_key", sa.Text(), nullable=False),
        sa.Column("client_public_key", sa.Text(), nullable=False),
        sa.Column("server_public_key", sa.Text(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint(
            "subdomain ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'",
            name="chk_subdomain_format",
        ),
        sa.CheckConstraint(
            "target_port BETWEEN 1 AND 65535",
            name="chk_target_port",
        ),
    )


def downgrade() -> None:
    op.drop_table("tunnels")
    op.drop_table("users")
