from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SQLEnum,
    Float,
    ForeignKey,
    Index,
    String,
)
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.models.base import Base, TimestampMixin


class ReconciliationStatus(str, enum.Enum):
    """Bank transaction reconciliation status."""
    UNMATCHED = "unmatched"
    MATCHED = "matched"
    IGNORED = "ignored"


class ReconciledWithType(str, enum.Enum):
    """Type of entity a bank transaction is reconciled with."""
    INVOICE = "invoice"
    EXPENSE = "expense"


class BankTransaction(TimestampMixin, Base):
    """Bank transaction model."""
    __tablename__ = "bank_transactions"
    __table_args__ = (
        Index("ix_bank_transactions_user_id", "user_id"),
        Index("ix_bank_transactions_date", "date"),
        Index("ix_bank_transactions_reconciliation_status", "reconciliation_status"),
        Index("ix_bank_transactions_user_id_created_at", "user_id", "created_at"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)

    date = Column(DateTime, nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String(500), nullable=True)
    counterparty = Column(String(255), nullable=True)

    reconciliation_status = Column(
        SQLEnum(ReconciliationStatus),
        default=ReconciliationStatus.UNMATCHED,
        nullable=False,
    )
    reconciled_with_type = Column(SQLEnum(ReconciledWithType), nullable=True)
    reconciled_with_id = Column(String(36), nullable=True)

    imported_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_immutable = Column(Boolean, default=True, nullable=False)

    user = relationship("User", back_populates="bank_transactions")
    payments = relationship("Payment", back_populates="bank_transaction")
