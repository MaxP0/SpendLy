from sqlalchemy import (
    Column,
    DateTime,
    Enum as SQLEnum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
import uuid
import enum
from app.models.base import Base, TimestampMixin


class InvoiceStatus(str, enum.Enum):
    """Invoice status enumeration."""
    DRAFT = "draft"
    ISSUED = "issued"
    PAID = "paid"
    OVERDUE = "overdue"
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
    due_at = Column(DateTime, nullable=True)

    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    inquiry_id = Column(String(36), ForeignKey("inquiries.id"), nullable=True)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False)

    invoice_number = Column(String(50), nullable=False)
    sequence_year = Column(Integer, nullable=False)
    sequence_number = Column(Integer, nullable=False)
    status = Column(SQLEnum(InvoiceStatus), default=InvoiceStatus.DRAFT, nullable=False)

    subtotal = Column(Float, nullable=False)
    vat_rate = Column(Float, default=0.0, nullable=False)
    vat_amount = Column(Float, default=0.0, nullable=False)
    total = Column(Float, nullable=False)

    user = relationship("User", back_populates="invoices")
    customer = relationship("Customer", back_populates="invoices")
    inquiry = relationship("Inquiry", back_populates="invoices")
    line_items = relationship(
        "InvoiceLineItem", back_populates="invoice", cascade="all, delete-orphan"
    )
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")

