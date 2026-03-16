from sqlalchemy import Column, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()


class Payment(Base):
    """Payment model."""
    __tablename__ = "payments"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    invoice_id = Column(String(36), ForeignKey("invoices.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    
    amount = Column(Float, nullable=False)
    payment_date = Column(DateTime, nullable=False)
    
    transaction_id = Column(String(36), ForeignKey("bank_transactions.id"), nullable=True, index=True)
