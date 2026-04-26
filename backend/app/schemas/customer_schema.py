from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class CustomerCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class CustomerListResponse(BaseModel):
    items: list[CustomerResponse]
    total: int
    limit: int
    offset: int
