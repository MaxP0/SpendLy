from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ExpenseCreate(BaseModel):
    receipt_id: str
    inquiry_id: Optional[str] = None
    amount: float
    vat_amount: Optional[float] = None
    user_confirmed_category: Optional[str] = None
    is_vat_reclaimable: bool = False


class ExpenseUpdate(BaseModel):
    amount: Optional[float] = None
    vat_amount: Optional[float] = None
    user_confirmed_category: Optional[str] = None
    is_vat_reclaimable: Optional[bool] = None


class ExpenseResponse(BaseModel):
    id: str
    receipt_id: str
    user_id: str
    inquiry_id: Optional[str]
    amount: float
    vat_amount: Optional[float]
    ml_suggested_category: Optional[str]
    ml_confidence: Optional[float]
    user_confirmed_category: Optional[str]
    is_vat_reclaimable: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
