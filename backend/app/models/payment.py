from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, String
from sqlalchemy.orm import relationship
import uuid
from app.models.base import Base, TimestampMixin


class Payment(TimestampMixin, Base):
    """Payment model."""
    __tablename__ = "payments"
    __table_args__ = (
        Index("ix_payments_invoice_id", "invoice_id"),
        Index("ix_payments_user_id", "user_id"),
        Index("ix_payments_transaction_id", "transaction_id"),
        Index("ix_payments_payment_date", "payment_date"),
        Index("ix_payments_user_id_created_at", "user_id", "created_at"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    invoice_id = Column(String(36), ForeignKey("invoices.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)

    amount = Column(Float, nullable=False)
    payment_date = Column(DateTime, nullable=False)

    transaction_id = Column(String(36), ForeignKey("bank_transactions.id"), nullable=True)

    user = relationship("User", back_populates="payments")
    invoice = relationship("Invoice", back_populates="payments")
    bank_transaction = relationship("BankTransaction", back_populates="payments")
