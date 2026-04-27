from __future__ import annotations

from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.inquiry import InquiryStatus


class InquiryLineItemInput(BaseModel):
    description: str
    quantity: float
    unit_price: float
    vat_rate: float


class InquiryLineItemResponse(InquiryLineItemInput):
    id: Optional[str] = None
    line_total_net: float
    line_total_vat: float


class InquiryNoteResponse(BaseModel):
    at: datetime
    note: str
    source: Literal["client", "entrepreneur"]


class InquiryAuditEntry(BaseModel):
    at: datetime
    action: str
    detail: Optional[dict] = None
    source: Literal["system", "client"] = "system"


class InquiryInvoiceSummary(BaseModel):
    id: str
    invoice_number: Optional[str] = None
    status: str
    total: float


class EmailStubResponse(BaseModel):
    to: Optional[str] = None
    delivered: bool
    note: str


class InquiryCreate(BaseModel):
    customer_id: str
    title: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    valid_until: Optional[date] = None
    line_items: list[InquiryLineItemInput] = Field(default_factory=list)


class InquiryUpdate(BaseModel):
    customer_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    valid_until: Optional[date] = None
    line_items: Optional[list[InquiryLineItemInput]] = None


class InquirySendRequest(BaseModel):
    valid_until_override: Optional[date] = None


class InquiryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: str
    customer_id: str
    customer_name: str
    title: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    line_items: list[InquiryLineItemResponse] = Field(default_factory=list)
    subtotal: float
    vat_total: float
    total: float
    quote_amount: Optional[float] = None
    quote_line_items: list[InquiryLineItemResponse] = Field(default_factory=list)
    public_token: Optional[str] = None
    share_url: Optional[str] = None
    valid_until: Optional[date] = None
    sent_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    discussion_requested_at: Optional[datetime] = None
    client_notes: list[InquiryNoteResponse] = Field(default_factory=list)
    audit_timeline: list[InquiryAuditEntry] = Field(default_factory=list)
    related_invoices: list[InquiryInvoiceSummary] = Field(default_factory=list)
    email_stub: Optional[EmailStubResponse] = None
    created_at: datetime
    updated_at: datetime


class InquiryPageResponse(BaseModel):
    items: list[InquiryResponse]
    total: int
    limit: int
    offset: int


class PublicInquiryResponse(BaseModel):
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    customer_name: str
    title: str
    line_items: list[InquiryLineItemResponse]
    subtotal: float
    vat_total: float
    total: float
    valid_until: Optional[date] = None
    status: str
    available_actions: list[str] = Field(default_factory=list)
    accepted_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    discussion_requested_at: Optional[datetime] = None


class PublicInquiryRejectRequest(BaseModel):
    reason: Optional[str] = Field(default=None, max_length=500)


class PublicInquiryDiscussionRequest(BaseModel):
    note: str = Field(min_length=1, max_length=1000)


class PublicInquiryActionResponse(BaseModel):
    status: str
    available_actions: list[str] = Field(default_factory=list)
    accepted_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    discussion_requested_at: Optional[datetime] = None
