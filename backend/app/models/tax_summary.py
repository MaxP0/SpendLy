from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Enum as SQLEnum, Text
from sqlalchemy.orm import declarative_base
from datetime import datetime
import uuid
import enum

Base = declarative_base()


class TaxSummaryType(str, enum.Enum):
    """Tax summary type enumeration."""
    ANNUAL = "annual"
    VAT3 = "vat3"
    RTD = "rtd"


class TaxSummaryStatus(str, enum.Enum):
    """Tax summary status enumeration."""
    DRAFT = "draft"
    REVIEWED = "reviewed"
    LOCKED = "locked"


class TaxSummary(Base):
    """Tax summary model."""
    __tablename__ = "tax_summaries"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    summary_type = Column(SQLEnum(TaxSummaryType), nullable=False)
    
    total_income = Column(Float, default=0.0, nullable=False)
    total_expenses = Column(Float, default=0.0, nullable=False)
    vat_collected = Column(Float, default=0.0, nullable=False)
    vat_reclaimable = Column(Float, default=0.0, nullable=False)
    vat_due = Column(Float, default=0.0, nullable=False)
    taxable_income = Column(Float, default=0.0, nullable=False)
    
    status = Column(SQLEnum(TaxSummaryStatus), default=TaxSummaryStatus.DRAFT, nullable=False)
    generated_at = Column(DateTime, nullable=True)
