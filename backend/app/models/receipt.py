from sqlalchemy import Column, DateTime, Enum as SQLEnum, Float, ForeignKey, Index, String, Text
from sqlalchemy.orm import relationship
import uuid
import enum
from app.models.base import Base, TimestampMixin


class OCRStatus(str, enum.Enum):
    """OCR processing status for a receipt."""
    PENDING = "pending"
    OK = "ok"
    FAILED = "failed"


class Receipt(TimestampMixin, Base):
    """Receipt model."""
    __tablename__ = "receipts"
    __table_args__ = (
        Index("ix_receipts_user_id", "user_id"),
        Index("ix_receipts_inquiry_id", "inquiry_id"),
        Index("ix_receipts_date", "date"),
        Index("ix_receipts_user_id_created_at", "user_id", "created_at"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    inquiry_id = Column(String(36), ForeignKey("inquiries.id"), nullable=True)

    file_path = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=True)

    ocr_raw_text = Column(Text, nullable=True)
    ocr_confidence = Column(Float, nullable=True)
    ocr_status = Column(SQLEnum(OCRStatus), default=OCRStatus.PENDING, nullable=False)

    merchant = Column(String(255), nullable=True)
    date = Column(DateTime, nullable=True)
    amount = Column(Float, nullable=True)
    currency = Column(String(3), default="EUR", nullable=False)
    vat_amount = Column(Float, nullable=True)

    user = relationship("User", back_populates="receipts")
    inquiry = relationship("Inquiry", back_populates="receipts")
    expense = relationship("Expense", back_populates="receipt", uselist=False)
