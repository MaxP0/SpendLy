from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReceiptCreate(BaseModel):
    inquiry_id: Optional[str] = None
    merchant: Optional[str] = None
    date: Optional[datetime] = None
    amount: Optional[float] = None
    currency: str = "EUR"
    vat_amount: Optional[float] = None


class ReceiptUpdate(BaseModel):
    merchant: Optional[str] = None
    date: Optional[datetime] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    vat_amount: Optional[float] = None


class ReceiptResponse(BaseModel):
    id: str
    user_id: str
    inquiry_id: Optional[str]
    file_path: str
    merchant: Optional[str]
    date: Optional[datetime]
    amount: Optional[float]
    currency: str
    vat_amount: Optional[float]
    ocr_confidence: Optional[float]
    created_at: datetime
    
    class Config:
        from_attributes = True
