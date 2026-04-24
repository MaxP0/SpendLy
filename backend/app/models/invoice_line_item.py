from sqlalchemy import Column, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import relationship
import uuid
from app.models.base import Base, TimestampMixin


class InvoiceLineItem(TimestampMixin, Base):
    """Line item for an invoice (used for VAT calculation)."""

    __tablename__ = "invoice_line_items"
    __table_args__ = (Index("ix_invoice_line_items_invoice_id", "invoice_id"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String(36), ForeignKey("invoices.id"), nullable=False)

    description = Column(Text, nullable=False)
    quantity = Column(Float, default=1.0, nullable=False)
    unit_price = Column(Float, nullable=False)
    vat_rate = Column(Float, default=0.0, nullable=False)
    line_total_net = Column(Float, nullable=False)
    line_total_vat = Column(Float, nullable=False)

    invoice = relationship("Invoice", back_populates="line_items")
