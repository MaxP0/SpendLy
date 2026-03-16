from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CustomerCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class CustomerResponse(BaseModel):
    id: str
    user_id: str
    name: str
    email: Optional[str]
    phone: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True
