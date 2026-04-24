from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, Text, Index
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
