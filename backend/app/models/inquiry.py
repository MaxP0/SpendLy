from sqlalchemy import Column, Enum as SQLEnum, ForeignKey, Index, String, Text
from sqlalchemy.orm import relationship
import uuid
import enum
from app.models.base import Base, TimestampMixin


class InquiryStatus(str, enum.Enum):
    """Inquiry status enumeration."""
    DRAFT = "draft"
    ACTIVE = "active"
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
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(InquiryStatus), default=InquiryStatus.ACTIVE, nullable=False)

    user = relationship("User", back_populates="inquiries")
    customer = relationship("Customer", back_populates="inquiries")
    invoices = relationship("Invoice", back_populates="inquiry")
    expenses = relationship("Expense", back_populates="inquiry")
    receipts = relationship("Receipt", back_populates="inquiry")
