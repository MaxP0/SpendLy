from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class InvoiceLineItemCreate(BaseModel):
    description: str = Field(min_length=1)
    quantity: float = Field(gt=0)
    unit_price: float = Field(ge=0)
    vat_rate: float


class InvoiceLineItemResponse(InvoiceLineItemCreate):
    id: Optional[str] = None
    line_total_net: float
    line_total_vat: float


class InvoiceVatBreakdown(BaseModel):
    rate: float
    net: float
    vat: float


class InvoiceCreate(BaseModel):
    customer_id: str
    inquiry_id: Optional[str] = None
    due_at: date
    currency: str = "EUR"
    reference: Optional[str] = None
    line_items: list[InvoiceLineItemCreate] = Field(min_length=1)


class InvoiceUpdate(BaseModel):
    customer_id: Optional[str] = None
    inquiry_id: Optional[str] = None
    due_at: Optional[date] = None
    currency: Optional[str] = None
    reference: Optional[str] = None
    line_items: Optional[list[InvoiceLineItemCreate]] = Field(default=None, min_length=1)


class InvoiceIssueRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")


class InvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    inquiry_id: Optional[str]
    customer_id: str
    customer_name_snapshot: str
    customer_email_snapshot: Optional[str] = None
    customer_phone_snapshot: Optional[str] = None
    customer_address_snapshot: Optional[str] = None
    invoice_number: Optional[str]
    status: str
    subtotal: float
    vat_total: float
    total: float
    vat_breakdown: list[InvoiceVatBreakdown]
    line_items: list[InvoiceLineItemResponse]
    issued_at: Optional[datetime]
    due_at: Optional[date]
    currency: str
    reference: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class InvoiceListResponse(BaseModel):
    items: list[InvoiceResponse]
    total: int
    limit: int
    offset: int
