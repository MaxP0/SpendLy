from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, Text
from sqlalchemy.orm import declarative_base
from datetime import datetime
import uuid
import enum

Base = declarative_base()


class UserRole(str, enum.Enum):
    """User role enumeration."""
    SELF_EMPLOYED_VAT = "self_employed_vat"
    SELF_EMPLOYED_NO_VAT = "self_employed_no_vat"
    PAYE_SIDE_INCOME = "paye_side_income"


class User(Base):
    """User model."""
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    business_name = Column(String(255), nullable=True)
    business_address = Column(Text, nullable=True)
    gdpr_consent_at = Column(DateTime, nullable=True)
