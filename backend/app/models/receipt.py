from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()


class Receipt(Base):
    """Receipt model."""
    __tablename__ = "receipts"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    inquiry_id = Column(String(36), ForeignKey("inquiries.id"), nullable=True, index=True)
    
    file_path = Column(String(500), nullable=False)
    ocr_raw_text = Column(Text, nullable=True)
    ocr_confidence = Column(Float, nullable=True)
    
    merchant = Column(String(255), nullable=True)
    date = Column(DateTime, nullable=True)
    amount = Column(Float, nullable=True)
    currency = Column(String(3), default="EUR", nullable=False)
    vat_amount = Column(Float, nullable=True)
