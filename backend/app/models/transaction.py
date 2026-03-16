from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Enum as SQLEnum, Boolean
from sqlalchemy.orm import declarative_base
from datetime import datetime
import uuid
import enum

Base = declarative_base()


class ReconciliationStatus(str, enum.Enum):
    """Bank transaction reconciliation status."""
    UNMATCHED = "unmatched"
    MATCHED = "matched"
    IGNORED = "ignored"


class BankTransaction(Base):
    """Bank transaction model."""
    __tablename__ = "bank_transactions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    
    date = Column(DateTime, nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String(500), nullable=True)
    
    reconciliation_status = Column(
        SQLEnum(ReconciliationStatus),
        default=ReconciliationStatus.UNMATCHED,
        nullable=False
    )
    is_immutable = Column(Boolean, default=True, nullable=False)
