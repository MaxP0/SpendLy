from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Enum as SQLEnum, Index
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
        Index("ix_invoices_user_id", "user_id"),
        Index("ix_invoices_inquiry_id", "inquiry_id"),
        Index("ix_invoices_customer_id", "customer_id"),
        Index("ix_invoices_invoice_number", "invoice_number"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    issued_at = Column(DateTime, nullable=True)
    due_at = Column(DateTime, nullable=True)

    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    inquiry_id = Column(String(36), ForeignKey("inquiries.id"), nullable=True)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False)
    
    invoice_number = Column(String(50), nullable=False, unique=True)
    status = Column(SQLEnum(InvoiceStatus), default=InvoiceStatus.DRAFT, nullable=False)
    
    subtotal = Column(Float, nullable=False)
    vat_rate = Column(Float, default=0.0, nullable=False)
    vat_amount = Column(Float, default=0.0, nullable=False)
    total = Column(Float, nullable=False)
    

