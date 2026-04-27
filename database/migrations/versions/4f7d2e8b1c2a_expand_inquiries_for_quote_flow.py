"""expand inquiries for quote flow

Revision ID: 4f7d2e8b1c2a
Revises: 16d4e21bafd7
Create Date: 2026-04-26 22:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "4f7d2e8b1c2a"
down_revision: Union[str, None] = "16d4e21bafd7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("inquiries", sa.Column("start_date", sa.Date(), nullable=True))
    op.add_column("inquiries", sa.Column("public_token", sa.String(length=36), nullable=True))
    op.add_column("inquiries", sa.Column("quote_amount", sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column("inquiries", sa.Column("quote_line_items", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column("inquiries", sa.Column("sent_at", sa.DateTime(), nullable=True))
    op.add_column("inquiries", sa.Column("valid_until", sa.Date(), nullable=True))
    op.add_column("inquiries", sa.Column("accepted_at", sa.DateTime(), nullable=True))
    op.add_column("inquiries", sa.Column("rejected_at", sa.DateTime(), nullable=True))
    op.add_column("inquiries", sa.Column("discussion_requested_at", sa.DateTime(), nullable=True))
    op.add_column("inquiries", sa.Column("client_notes", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")))
    op.add_column("inquiries", sa.Column("archived_from_status", sa.String(length=32), nullable=True))
    op.create_index("ix_inquiries_public_token", "inquiries", ["public_token"], unique=True)

    op.create_table(
        "inquiry_line_items",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("inquiry_id", sa.String(length=36), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("quantity", sa.Float(), nullable=False),
        sa.Column("unit_price", sa.Float(), nullable=False),
        sa.Column("vat_rate", sa.Float(), nullable=False),
        sa.Column("line_total_net", sa.Float(), nullable=False),
        sa.Column("line_total_vat", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["inquiry_id"], ["inquiries.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_inquiry_line_items_inquiry_id", "inquiry_line_items", ["inquiry_id"], unique=False)

    op.execute("UPDATE inquiries SET status = 'DRAFT' WHERE status = 'ACTIVE'")
    op.execute("ALTER TYPE inquirystatus RENAME TO inquirystatus_old")

    new_status = postgresql.ENUM(
        "DRAFT",
        "SENT",
        "ACCEPTED",
        "REJECTED",
        "DISCUSSION_REQUESTED",
        "EXPIRED",
        "INVOICED",
        "COMPLETED",
        "ARCHIVED",
        name="inquirystatus",
    )
    new_status.create(op.get_bind())
    op.execute(
        """
        ALTER TABLE inquiries
        ALTER COLUMN status TYPE inquirystatus
        USING status::text::inquirystatus
        """
    )
    op.execute("DROP TYPE inquirystatus_old")
    op.alter_column("inquiries", "client_notes", server_default=None)


def downgrade() -> None:
    op.execute("ALTER TYPE inquirystatus RENAME TO inquirystatus_new")
    old_status = postgresql.ENUM("DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED", name="inquirystatus")
    old_status.create(op.get_bind())
    op.execute(
        """
        ALTER TABLE inquiries
        ALTER COLUMN status TYPE inquirystatus
        USING (
            CASE status::text
                WHEN 'SENT' THEN 'ACTIVE'
                WHEN 'ACCEPTED' THEN 'ACTIVE'
                WHEN 'REJECTED' THEN 'ACTIVE'
                WHEN 'DISCUSSION_REQUESTED' THEN 'ACTIVE'
                WHEN 'EXPIRED' THEN 'ACTIVE'
                WHEN 'INVOICED' THEN 'ACTIVE'
                ELSE status::text
            END
        )::inquirystatus
        """
    )
    op.execute("DROP TYPE inquirystatus_new")

    op.drop_index("ix_inquiry_line_items_inquiry_id", table_name="inquiry_line_items")
    op.drop_table("inquiry_line_items")
    op.drop_index("ix_inquiries_public_token", table_name="inquiries")
    op.drop_column("inquiries", "archived_from_status")
    op.drop_column("inquiries", "client_notes")
    op.drop_column("inquiries", "discussion_requested_at")
    op.drop_column("inquiries", "rejected_at")
    op.drop_column("inquiries", "accepted_at")
    op.drop_column("inquiries", "valid_until")
    op.drop_column("inquiries", "sent_at")
    op.drop_column("inquiries", "quote_line_items")
    op.drop_column("inquiries", "quote_amount")
    op.drop_column("inquiries", "public_token")
    op.drop_column("inquiries", "start_date")