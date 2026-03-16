from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Enum as SQLEnum
from sqlalchemy.orm import declarative_base
from datetime import datetime
import uuid
import enum

Base = declarative_base()


class InvoiceStatus(str, enum.Enum):
    """Invoice status enumeration."""
    DRAFT = "draft"
    ISSUED = "issued"
    PAID = "paid"
    CANCELLED = "cancelled"


class Invoice(Base):
    """Invoice model."""
    __tablename__ = "invoices"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    inquiry_id = Column(String(36), ForeignKey("inquiries.id"), nullable=True, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False, index=True)
    
    invoice_number = Column(String(50), nullable=False, unique=True, index=True)
    status = Column(SQLEnum(InvoiceStatus), default=InvoiceStatus.DRAFT, nullable=False)
    
    subtotal = Column(Float, nullable=False)
    vat_rate = Column(Float, default=0.0, nullable=False)
    vat_amount = Column(Float, default=0.0, nullable=False)
    total = Column(Float, nullable=False)
    
    issued_at = Column(DateTime, nullable=True)
    due_at = Column(DateTime, nullable=True)
