from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    ISSUED = "issued"
    PAID = "paid"
    CANCELLED = "cancelled"


class InvoiceCreate(BaseModel):
    inquiry_id: Optional[str] = None
    customer_id: str
    subtotal: float
    vat_rate: float = 0.0
    due_at: Optional[datetime] = None


class InvoiceUpdate(BaseModel):
    subtotal: Optional[float] = None
    vat_rate: Optional[float] = None
    status: Optional[InvoiceStatus] = None
    due_at: Optional[datetime] = None


class InvoiceResponse(BaseModel):
    id: str
    user_id: str
    inquiry_id: Optional[str]
    customer_id: str
    invoice_number: str
    status: str
    subtotal: float
    vat_rate: float
    vat_amount: float
    total: float
    issued_at: Optional[datetime]
    due_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True
