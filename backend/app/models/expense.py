from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Boolean, Text
from sqlalchemy.orm import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()


class Expense(Base):
    """Expense model."""
    __tablename__ = "expenses"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    receipt_id = Column(String(36), ForeignKey("receipts.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    inquiry_id = Column(String(36), ForeignKey("inquiries.id"), nullable=True, index=True)
    
    amount = Column(Float, nullable=False)
    vat_amount = Column(Float, nullable=True)
    
    ml_suggested_category = Column(String(255), nullable=True)
    ml_confidence = Column(Float, nullable=True)
    user_confirmed_category = Column(String(255), nullable=True)
    
    is_vat_reclaimable = Column(Boolean, default=False, nullable=False)
