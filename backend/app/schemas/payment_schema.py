from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PaymentCreate(BaseModel):
    invoice_id: str
    amount: float
    payment_date: datetime
    transaction_id: Optional[str] = None


class PaymentUpdate(BaseModel):
    amount: Optional[float] = None
    payment_date: Optional[datetime] = None
    transaction_id: Optional[str] = None


class PaymentResponse(BaseModel):
    id: str
    invoice_id: str
    user_id: str
    amount: float
    payment_date: datetime
    transaction_id: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True
