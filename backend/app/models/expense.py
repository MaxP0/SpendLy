from sqlalchemy import Column, String, ForeignKey, Float, Boolean, Index
import uuid
from app.models.base import Base, TimestampMixin


class Expense(TimestampMixin, Base):
    """Expense model."""
    __tablename__ = "expenses"
    __table_args__ = (
        Index("ix_expenses_receipt_id", "receipt_id"),
        Index("ix_expenses_user_id", "user_id"),
        Index("ix_expenses_inquiry_id", "inquiry_id"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    receipt_id = Column(String(36), ForeignKey("receipts.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    inquiry_id = Column(String(36), ForeignKey("inquiries.id"), nullable=True)
    
    amount = Column(Float, nullable=False)
    vat_amount = Column(Float, nullable=True)
    
    ml_suggested_category = Column(String(255), nullable=True)
    ml_confidence = Column(Float, nullable=True)
    user_confirmed_category = Column(String(255), nullable=True)
    
    is_vat_reclaimable = Column(Boolean, default=False, nullable=False)
