"""add user_id to tenants and units for per-user data isolation

Revision ID: 20260227_user_id
Revises:
Create Date: 2026-02-27

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260227_user_id"
down_revision = None
branch_labels = None
depends_on = None


def get_first_user_id(conn):
    result = conn.execute(sa.text("SELECT id FROM users ORDER BY id ASC LIMIT 1"))
    row = result.fetchone()
    return row[0] if row else None


def upgrade() -> None:
    # Add user_id as nullable first so we can backfill existing rows
    op.add_column("tenants", sa.Column("user_id", sa.Integer(), nullable=True))
    op.add_column("units", sa.Column("user_id", sa.Integer(), nullable=True))

    conn = op.get_bind()
    first_user_id = get_first_user_id(conn)
    if first_user_id is not None:
        conn.execute(sa.text("UPDATE tenants SET user_id = :uid"), {"uid": first_user_id})
        conn.execute(sa.text("UPDATE units SET user_id = :uid"), {"uid": first_user_id})

    # Now set NOT NULL and add FK
    op.alter_column(
        "tenants",
        "user_id",
        existing_type=sa.Integer(),
        nullable=False,
    )
    op.alter_column(
        "units",
        "user_id",
        existing_type=sa.Integer(),
        nullable=False,
    )
    op.create_foreign_key(
        "fk_tenants_user_id", "tenants", "users", ["user_id"], ["id"], ondelete="CASCADE"
    )
    op.create_foreign_key(
        "fk_units_user_id", "units", "users", ["user_id"], ["id"], ondelete="CASCADE"
    )
    op.create_index("ix_tenants_user_id", "tenants", ["user_id"], unique=False)
    op.create_index("ix_units_user_id", "units", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_units_user_id", table_name="units")
    op.drop_index("ix_tenants_user_id", table_name="tenants")
    op.drop_constraint("fk_units_user_id", "units", type_="foreignkey")
    op.drop_constraint("fk_tenants_user_id", "tenants", type_="foreignkey")
    op.drop_column("units", "user_id")
    op.drop_column("tenants", "user_id")
