from sqlalchemy import Column, Date, DateTime, Enum as SQLEnum, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import JSON
from sqlalchemy.orm import relationship
import uuid
import enum
from app.models.base import Base, TimestampMixin


class InquiryStatus(str, enum.Enum):
    """Inquiry status enumeration."""
    DRAFT = "draft"
    SENT = "sent"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    DISCUSSION_REQUESTED = "discussion_requested"
    EXPIRED = "expired"
    INVOICED = "invoiced"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class Inquiry(TimestampMixin, Base):
    """Inquiry model (job/project)."""
    __tablename__ = "inquiries"
    __table_args__ = (
        Index("ix_inquiries_user_id", "user_id"),
        Index("ix_inquiries_customer_id", "customer_id"),
        Index("ix_inquiries_status", "status"),
        Index("ix_inquiries_user_id_created_at", "user_id", "created_at"),
        Index("ix_inquiries_public_token", "public_token"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=True)
    public_token = Column(String(36), nullable=True, unique=True)
    quote_amount = Column(Numeric(12, 2), nullable=True)
    quote_line_items = Column(JSONB().with_variant(JSON(), "sqlite"), nullable=True)
    sent_at = Column(DateTime, nullable=True)
    valid_until = Column(Date, nullable=True)
    accepted_at = Column(DateTime, nullable=True)
    rejected_at = Column(DateTime, nullable=True)
    discussion_requested_at = Column(DateTime, nullable=True)
    client_notes = Column(JSONB().with_variant(JSON(), "sqlite"), nullable=False, default=list)
    archived_from_status = Column(String(32), nullable=True)
    status = Column(SQLEnum(InquiryStatus), default=InquiryStatus.DRAFT, nullable=False)

    user = relationship("User", back_populates="inquiries")
    customer = relationship("Customer", back_populates="inquiries")
    line_items = relationship(
        "InquiryLineItem", back_populates="inquiry", cascade="all, delete-orphan"
    )
    invoices = relationship("Invoice", back_populates="inquiry")
    expenses = relationship("Expense", back_populates="inquiry")
    receipts = relationship("Receipt", back_populates="inquiry")
