from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Enum as SQLEnum, Index
import uuid
import enum
from app.models.base import Base, TimestampMixin


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


class TaxSummary(TimestampMixin, Base):
    """Tax summary model."""
    __tablename__ = "tax_summaries"
    __table_args__ = (
        Index("ix_tax_summaries_user_id", "user_id"),
        Index("ix_tax_summaries_period_start", "period_start"),
        Index("ix_tax_summaries_period_end", "period_end"),
        Index("ix_tax_summaries_summary_type", "summary_type"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
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
