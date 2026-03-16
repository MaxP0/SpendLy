from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class ReconciliationStatus(str, Enum):
    UNMATCHED = "unmatched"
    MATCHED = "matched"
    IGNORED = "ignored"


class BankTransactionCreate(BaseModel):
    date: datetime
    amount: float
    description: Optional[str] = None


class BankTransactionUpdate(BaseModel):
    reconciliation_status: Optional[ReconciliationStatus] = None


class BankTransactionResponse(BaseModel):
    id: str
    user_id: str
    date: datetime
    amount: float
    description: Optional[str]
    reconciliation_status: str
    is_immutable: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
