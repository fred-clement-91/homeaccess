"""Increase default max_tunnels from 5 to 6

Revision ID: 003
Revises: 002
Create Date: 2026-02-25
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("users", "max_tunnels", server_default=sa.text("6"))
    op.execute("UPDATE users SET max_tunnels = 6 WHERE max_tunnels = 5")


def downgrade() -> None:
    op.alter_column("users", "max_tunnels", server_default=sa.text("5"))
    op.execute("UPDATE users SET max_tunnels = 5 WHERE max_tunnels = 6")
