from sqlalchemy import Column, DateTime, Enum as SQLEnum, Index, String, Text
from sqlalchemy.orm import relationship
import uuid
import enum
from app.models.base import Base, TimestampMixin


class UserRole(str, enum.Enum):
    """User role enumeration."""
    SELF_EMPLOYED_VAT = "self_employed_vat"
    SELF_EMPLOYED_NO_VAT = "self_employed_no_vat"
    PAYE_SIDE_INCOME = "paye_side_income"


class User(TimestampMixin, Base):
    """User model."""
    __tablename__ = "users"
    __table_args__ = (Index("ix_users_email", "email"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    business_name = Column(String(255), nullable=True)
    business_address = Column(Text, nullable=True)
    gdpr_consent_at = Column(DateTime, nullable=True)

    customers = relationship("Customer", back_populates="user", cascade="all, delete-orphan")
    inquiries = relationship("Inquiry", back_populates="user", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="user", cascade="all, delete-orphan")
    receipts = relationship("Receipt", back_populates="user", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="user", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="user", cascade="all, delete-orphan")
    bank_transactions = relationship("BankTransaction", back_populates="user", cascade="all, delete-orphan")
    tax_summaries = relationship("TaxSummary", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")

