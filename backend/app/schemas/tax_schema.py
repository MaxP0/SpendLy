from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class TaxSummaryType(str, Enum):
    ANNUAL = "annual"
    VAT3 = "vat3"
    RTD = "rtd"


class TaxSummaryStatus(str, Enum):
    DRAFT = "draft"
    REVIEWED = "reviewed"
    LOCKED = "locked"


class TaxSummaryResponse(BaseModel):
    id: str
    user_id: str
    period_start: datetime
    period_end: datetime
    summary_type: str
    total_income: float
    total_expenses: float
    vat_collected: float
    vat_reclaimable: float
    vat_due: float
    taxable_income: float
    status: str
    generated_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True
