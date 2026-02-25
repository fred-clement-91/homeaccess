"""Add system_flags table for background daemon flags

Revision ID: 006
Revises: 005
Create Date: 2026-02-25
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "system_flags",
        sa.Column("key", sa.String(50), primary_key=True),
        sa.Column("value", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.execute(
        "INSERT INTO system_flags (key, value) VALUES ('haproxy_reload_needed', false)"
    )


def downgrade() -> None:
    op.drop_table("system_flags")
