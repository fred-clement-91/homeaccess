"""Add service_type to tunnels

Revision ID: 004
Revises: 003
Create Date: 2026-02-25
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("tunnels", sa.Column("service_type", sa.String(32), nullable=True))
    # Backfill existing tunnels based on port
    op.execute("UPDATE tunnels SET service_type = 'homeassistant' WHERE target_port = 8123")
    op.execute("UPDATE tunnels SET service_type = 'jellyfin' WHERE target_port = 8096")
    op.execute("UPDATE tunnels SET service_type = 'nextcloud' WHERE target_port = 443")
    op.execute("UPDATE tunnels SET service_type = 'plex' WHERE target_port = 32400")
    op.execute("UPDATE tunnels SET service_type = 'http' WHERE target_port = 80 AND service_type IS NULL")
    op.execute("UPDATE tunnels SET service_type = 'custom' WHERE service_type IS NULL")


def downgrade() -> None:
    op.drop_column("tunnels", "service_type")
