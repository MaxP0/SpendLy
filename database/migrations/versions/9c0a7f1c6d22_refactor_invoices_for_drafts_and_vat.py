"""refactor invoices for drafts and mixed VAT

Revision ID: 9c0a7f1c6d22
Revises: 4f7d2e8b1c2a
Create Date: 2026-04-27 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "9c0a7f1c6d22"
down_revision: Union[str, None] = "4f7d2e8b1c2a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("UPDATE invoices SET status = 'ISSUED' WHERE status = 'OVERDUE'")

    op.add_column("invoices", sa.Column("vat_total", sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column("invoices", sa.Column("currency", sa.String(length=3), nullable=False, server_default="EUR"))
    op.add_column("invoices", sa.Column("reference", sa.String(length=255), nullable=True))
    op.add_column("invoices", sa.Column("customer_name_snapshot", sa.String(length=255), nullable=True))
    op.add_column("invoices", sa.Column("customer_email_snapshot", sa.String(length=255), nullable=True))
    op.add_column("invoices", sa.Column("customer_phone_snapshot", sa.String(length=20), nullable=True))
    op.add_column("invoices", sa.Column("customer_address_snapshot", sa.Text(), nullable=True))

    op.execute("UPDATE invoices SET vat_total = vat_amount")
    op.execute(
        """
        UPDATE invoices
        SET customer_name_snapshot = customers.name,
            customer_email_snapshot = customers.email,
            customer_phone_snapshot = customers.phone,
            customer_address_snapshot = customers.address
        FROM customers
        WHERE customers.id = invoices.customer_id
        """
    )

    with op.batch_alter_table("invoice_line_items", schema=None) as batch_op:
        batch_op.alter_column("quantity", existing_type=sa.Float(), type_=sa.Numeric(precision=12, scale=2), existing_nullable=False)
        batch_op.alter_column("unit_price", existing_type=sa.Float(), type_=sa.Numeric(precision=12, scale=2), existing_nullable=False)
        batch_op.alter_column("vat_rate", existing_type=sa.Float(), type_=sa.Numeric(precision=5, scale=2), existing_nullable=False)
        batch_op.alter_column("line_total_net", existing_type=sa.Float(), type_=sa.Numeric(precision=12, scale=2), existing_nullable=False)
        batch_op.alter_column("line_total_vat", existing_type=sa.Float(), type_=sa.Numeric(precision=12, scale=2), existing_nullable=False)

    with op.batch_alter_table("invoices", schema=None) as batch_op:
        batch_op.alter_column("invoice_number", existing_type=sa.String(length=50), nullable=True)
        batch_op.alter_column("sequence_year", existing_type=sa.Integer(), nullable=True)
        batch_op.alter_column("sequence_number", existing_type=sa.Integer(), nullable=True)
        batch_op.alter_column(
            "subtotal",
            existing_type=sa.Float(),
            type_=sa.Numeric(precision=12, scale=2),
            existing_nullable=False,
        )
        batch_op.alter_column(
            "total",
            existing_type=sa.Float(),
            type_=sa.Numeric(precision=12, scale=2),
            existing_nullable=False,
        )
        batch_op.alter_column("due_at", existing_type=sa.DateTime(), type_=sa.Date(), postgresql_using="due_at::date")
        batch_op.alter_column("vat_total", existing_type=sa.Numeric(precision=12, scale=2), nullable=False)
        batch_op.alter_column("customer_name_snapshot", existing_type=sa.String(length=255), nullable=False)
        batch_op.drop_column("vat_amount")
        batch_op.drop_column("vat_rate")

    op.execute("ALTER TYPE invoicestatus RENAME TO invoicestatus_old")
    new_status = postgresql.ENUM("DRAFT", "ISSUED", "PAID", "CANCELLED", name="invoicestatus")
    new_status.create(op.get_bind())
    op.execute(
        """
        ALTER TABLE invoices
        ALTER COLUMN status TYPE invoicestatus
        USING status::text::invoicestatus
        """
    )
    op.execute("DROP TYPE invoicestatus_old")
    op.alter_column("invoices", "currency", server_default=None)


def downgrade() -> None:
    op.execute("ALTER TYPE invoicestatus RENAME TO invoicestatus_new")
    old_status = postgresql.ENUM("DRAFT", "ISSUED", "PAID", "OVERDUE", "CANCELLED", name="invoicestatus")
    old_status.create(op.get_bind())
    op.execute(
        """
        ALTER TABLE invoices
        ALTER COLUMN status TYPE invoicestatus
        USING status::text::invoicestatus
        """
    )
    op.execute("DROP TYPE invoicestatus_new")

    with op.batch_alter_table("invoices", schema=None) as batch_op:
        batch_op.add_column(sa.Column("vat_amount", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("vat_rate", sa.Float(), nullable=True))
        batch_op.alter_column("due_at", existing_type=sa.Date(), type_=sa.DateTime(), postgresql_using="due_at::timestamp")
        batch_op.alter_column("total", existing_type=sa.Numeric(precision=12, scale=2), type_=sa.Float(), existing_nullable=False)
        batch_op.alter_column("subtotal", existing_type=sa.Numeric(precision=12, scale=2), type_=sa.Float(), existing_nullable=False)
        batch_op.alter_column("sequence_number", existing_type=sa.Integer(), nullable=False)
        batch_op.alter_column("sequence_year", existing_type=sa.Integer(), nullable=False)
        batch_op.alter_column("invoice_number", existing_type=sa.String(length=50), nullable=False)
    op.execute("UPDATE invoices SET vat_amount = vat_total, vat_rate = 0")

    with op.batch_alter_table("invoices", schema=None) as batch_op:
        batch_op.drop_column("customer_address_snapshot")
        batch_op.drop_column("customer_phone_snapshot")
        batch_op.drop_column("customer_email_snapshot")
        batch_op.drop_column("customer_name_snapshot")
        batch_op.drop_column("reference")
        batch_op.drop_column("currency")
        batch_op.drop_column("vat_total")

    with op.batch_alter_table("invoice_line_items", schema=None) as batch_op:
        batch_op.alter_column("line_total_vat", existing_type=sa.Numeric(precision=12, scale=2), type_=sa.Float(), existing_nullable=False)
        batch_op.alter_column("line_total_net", existing_type=sa.Numeric(precision=12, scale=2), type_=sa.Float(), existing_nullable=False)
        batch_op.alter_column("vat_rate", existing_type=sa.Numeric(precision=5, scale=2), type_=sa.Float(), existing_nullable=False)
        batch_op.alter_column("unit_price", existing_type=sa.Numeric(precision=12, scale=2), type_=sa.Float(), existing_nullable=False)
        batch_op.alter_column("quantity", existing_type=sa.Numeric(precision=12, scale=2), type_=sa.Float(), existing_nullable=False)