from sqlalchemy import Column, Float, ForeignKey, Index, String, Text
from sqlalchemy.orm import relationship
import uuid

from app.models.base import Base, TimestampMixin


class InquiryLineItem(TimestampMixin, Base):
    """Editable working line items for an inquiry."""

    __tablename__ = "inquiry_line_items"
    __table_args__ = (Index("ix_inquiry_line_items_inquiry_id", "inquiry_id"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    inquiry_id = Column(String(36), ForeignKey("inquiries.id"), nullable=False)

    description = Column(Text, nullable=False)
    quantity = Column(Float, default=1.0, nullable=False)
    unit_price = Column(Float, nullable=False)
    vat_rate = Column(Float, default=0.0, nullable=False)
    line_total_net = Column(Float, nullable=False)
    line_total_vat = Column(Float, nullable=False)

    inquiry = relationship("Inquiry", back_populates="line_items")