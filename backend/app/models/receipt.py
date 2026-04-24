from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Text, Index
import uuid
from app.models.base import Base, TimestampMixin


class Receipt(TimestampMixin, Base):
    """Receipt model."""
    __tablename__ = "receipts"
    __table_args__ = (
        Index("ix_receipts_user_id", "user_id"),
        Index("ix_receipts_inquiry_id", "inquiry_id"),
        Index("ix_receipts_date", "date"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    inquiry_id = Column(String(36), ForeignKey("inquiries.id"), nullable=True)
    
    file_path = Column(String(500), nullable=False)
    ocr_raw_text = Column(Text, nullable=True)
    ocr_confidence = Column(Float, nullable=True)
    
    merchant = Column(String(255), nullable=True)
    date = Column(DateTime, nullable=True)
    amount = Column(Float, nullable=True)
    currency = Column(String(3), default="EUR", nullable=False)
    vat_amount = Column(Float, nullable=True)
