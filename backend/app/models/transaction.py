from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Enum as SQLEnum, Boolean, Index
import uuid
import enum
from app.models.base import Base, TimestampMixin


class ReconciliationStatus(str, enum.Enum):
    """Bank transaction reconciliation status."""
    UNMATCHED = "unmatched"
    MATCHED = "matched"
    IGNORED = "ignored"


class BankTransaction(TimestampMixin, Base):
    """Bank transaction model."""
    __tablename__ = "bank_transactions"
    __table_args__ = (
        Index("ix_bank_transactions_user_id", "user_id"),
        Index("ix_bank_transactions_date", "date"),
        Index("ix_bank_transactions_reconciliation_status", "reconciliation_status"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    date = Column(DateTime, nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String(500), nullable=True)
    
    reconciliation_status = Column(
        SQLEnum(ReconciliationStatus),
        default=ReconciliationStatus.UNMATCHED,
        nullable=False
    )
    is_immutable = Column(Boolean, default=True, nullable=False)
