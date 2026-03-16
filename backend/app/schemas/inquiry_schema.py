from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class InquiryStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class InquiryCreate(BaseModel):
    customer_id: str
    title: str
    description: Optional[str] = None


class InquiryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[InquiryStatus] = None


class InquiryResponse(BaseModel):
    id: str
    user_id: str
    customer_id: str
    title: str
    description: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
