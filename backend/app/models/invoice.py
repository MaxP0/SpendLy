from sqlalchemy import Column, Date, DateTime, Enum as SQLEnum, ForeignKey, Index, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
import uuid
import enum
from app.models.base import Base, TimestampMixin


class InvoiceStatus(str, enum.Enum):
    """Invoice status enumeration."""
    DRAFT = "draft"
    ISSUED = "issued"
    PAID = "paid"
    CANCELLED = "cancelled"


class Invoice(TimestampMixin, Base):
    """Invoice model."""
    __tablename__ = "invoices"
    __table_args__ = (
        UniqueConstraint("user_id", "invoice_number", name="uq_invoices_user_invoice_number"),
        UniqueConstraint("user_id", "sequence_year", "sequence_number", name="uq_invoices_user_year_seq"),
        Index("ix_invoices_user_id", "user_id"),
        Index("ix_invoices_inquiry_id", "inquiry_id"),
        Index("ix_invoices_customer_id", "customer_id"),
        Index("ix_invoices_user_id_created_at", "user_id", "created_at"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    issued_at = Column(DateTime, nullable=True)
    due_at = Column(Date, nullable=True)

    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    inquiry_id = Column(String(36), ForeignKey("inquiries.id"), nullable=True)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False)

    invoice_number = Column(String(50), nullable=True)
    sequence_year = Column(Integer, nullable=True)
    sequence_number = Column(Integer, nullable=True)
    status = Column(SQLEnum(InvoiceStatus), default=InvoiceStatus.DRAFT, nullable=False)

    subtotal = Column(Numeric(12, 2), nullable=False)
    vat_total = Column(Numeric(12, 2), nullable=False)
    total = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), nullable=False, default="EUR")
    reference = Column(String(255), nullable=True)
    customer_name_snapshot = Column(String(255), nullable=False)
    customer_email_snapshot = Column(String(255), nullable=True)
    customer_phone_snapshot = Column(String(20), nullable=True)
    customer_address_snapshot = Column(Text, nullable=True)

    user = relationship("User", back_populates="invoices")
    customer = relationship("Customer", back_populates="invoices")
    inquiry = relationship("Inquiry", back_populates="invoices")
    line_items = relationship(
        "InvoiceLineItem", back_populates="invoice", cascade="all, delete-orphan"
    )
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")

