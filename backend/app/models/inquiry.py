from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import declarative_base
from datetime import datetime
import uuid
import enum

Base = declarative_base()


class InquiryStatus(str, enum.Enum):
    """Inquiry status enumeration."""
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class Inquiry(Base):
    """Inquiry model (job/project)."""
    __tablename__ = "inquiries"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(InquiryStatus), default=InquiryStatus.ACTIVE, nullable=False)
