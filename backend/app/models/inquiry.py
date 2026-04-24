from sqlalchemy import Column, String, ForeignKey, Enum as SQLEnum, Text, Index
import uuid
import enum
from app.models.base import Base, TimestampMixin


class InquiryStatus(str, enum.Enum):
    """Inquiry status enumeration."""
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
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(InquiryStatus), default=InquiryStatus.ACTIVE, nullable=False)
