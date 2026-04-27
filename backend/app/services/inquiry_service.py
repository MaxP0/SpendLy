from __future__ import annotations

from datetime import date, datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from uuid import uuid4

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.models import AuditLog, Customer, Inquiry, InquiryLineItem, InquiryStatus, Invoice, Payment, Receipt, Expense
from app.schemas.inquiry_schema import (
    EmailStubResponse,
    InquiryAuditEntry,
    InquiryInvoiceSummary,
    InquiryLineItemInput,
    InquiryLineItemResponse,
    InquiryNoteResponse,
    InquiryResponse,
    PublicInquiryActionResponse,
    PublicInquiryResponse,
)
from app.services.email_service import EmailService
from app.services.quote_pdf_service import QuotePDFService

settings = get_settings()
TERMINAL_STATUSES = {InquiryStatus.REJECTED, InquiryStatus.EXPIRED, InquiryStatus.COMPLETED}
EDITABLE_STATUSES = {InquiryStatus.DRAFT, InquiryStatus.DISCUSSION_REQUESTED}


class InquiryNotFoundError(ValueError):
    pass


class InvalidTransitionError(ValueError):
    pass


class InquiryConflictError(ValueError):
    pass


def _money(value: float | Decimal) -> Decimal:
    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


async def expire_inquiries_check(session: AsyncSession, user_id: str, today: date) -> None:
    result = await session.execute(
        select(Inquiry).where(
            Inquiry.user_id == user_id,
            Inquiry.status == InquiryStatus.SENT,
            Inquiry.valid_until.is_not(None),
            Inquiry.valid_until < today,
        )
    )
    expiring = list(result.scalars().all())
    if not expiring:
        return

    expired_at = datetime.utcnow()
    for inquiry in expiring:
        inquiry.status = InquiryStatus.EXPIRED
        session.add(
            AuditLog(
                user_id=user_id,
                entity_type="inquiry",
                entity_id=inquiry.id,
                action="inquiry.expired",
                diff={"valid_until": inquiry.valid_until.isoformat() if inquiry.valid_until else None},
            )
        )
    await session.commit()


class InquiryService:
    """State machine and CRUD operations for inquiries."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.email_service = EmailService(db)
        self.pdf_service = QuotePDFService()

    async def create_inquiry(
        self,
        *,
        user_id: str,
        customer_id: str,
        title: str,
        description: str | None = None,
        start_date: date | None = None,
        valid_until: date | None = None,
        line_items: list[InquiryLineItemInput] | None = None,
    ) -> InquiryResponse:
        await self._ensure_customer(user_id=user_id, customer_id=customer_id)
        inquiry = Inquiry(
            user_id=user_id,
            customer_id=customer_id,
            title=title,
            description=description,
            start_date=start_date,
            valid_until=valid_until,
            status=InquiryStatus.DRAFT,
            client_notes=[],
        )
        self.db.add(inquiry)
        await self.db.flush()
        for payload in line_items or []:
            self.db.add(self._build_line_item(inquiry.id, payload))
        self._add_audit(inquiry, "inquiry.created", {"title": title})
        await self.db.commit()
        return await self.get_inquiry_detail(user_id=user_id, inquiry_id=inquiry.id)

    async def list_user_inquiries(
        self,
        *,
        user_id: str,
        status_filters: list[str] | None = None,
        customer_id: str | None = None,
        search: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[InquiryResponse], int]:
        await expire_inquiries_check(self.db, user_id, date.today())
        filters = [Inquiry.user_id == user_id]
        if customer_id:
            filters.append(Inquiry.customer_id == customer_id)
        if status_filters:
            statuses = [InquiryStatus(value) for value in status_filters]
            filters.append(Inquiry.status.in_(statuses))
        if search:
            query = f"%{search.strip().lower()}%"
            filters.append(
                or_(
                    func.lower(Inquiry.title).like(query),
                    func.lower(Customer.name).like(query),
                )
            )

        total = await self.db.scalar(
            select(func.count(Inquiry.id)).join(Customer).where(*filters)
        )
        result = await self.db.execute(
            select(Inquiry)
            .join(Customer)
            .where(*filters)
            .options(
                selectinload(Inquiry.customer),
                selectinload(Inquiry.line_items),
                selectinload(Inquiry.invoices),
            )
            .order_by(Inquiry.updated_at.desc())
            .limit(limit)
            .offset(offset)
        )
        items = [await self._serialize_inquiry(inquiry) for inquiry in result.scalars().all()]
        return items, int(total or 0)

    async def get_inquiry_detail(self, *, user_id: str, inquiry_id: str) -> InquiryResponse:
        await expire_inquiries_check(self.db, user_id, date.today())
        inquiry = await self._get_inquiry_for_user(user_id=user_id, inquiry_id=inquiry_id)
        return await self._serialize_inquiry(inquiry, include_timeline=True)

    async def update_inquiry(self, *, user_id: str, inquiry_id: str, **updates) -> InquiryResponse:
        inquiry = await self._get_inquiry_for_user(user_id=user_id, inquiry_id=inquiry_id)
        if inquiry.status not in EDITABLE_STATUSES:
            raise InvalidTransitionError(
                f"Cannot edit {inquiry.status.value} inquiry. Valid states for editing: draft, discussion_requested."
            )

        if customer_id := updates.get("customer_id"):
            await self._ensure_customer(user_id=user_id, customer_id=customer_id)
            inquiry.customer_id = customer_id

        for field in ("title", "description", "start_date", "valid_until"):
            if field in updates and updates[field] is not None:
                setattr(inquiry, field, updates[field])

        if updates.get("line_items") is not None:
            inquiry.line_items.clear()
            await self.db.flush()
            for payload in updates["line_items"]:
                inquiry.line_items.append(self._build_line_item(inquiry.id, payload))

        self._add_audit(inquiry, "inquiry.updated", {"status": inquiry.status.value})
        await self.db.commit()
        return await self.get_inquiry_detail(user_id=user_id, inquiry_id=inquiry_id)

    async def delete_inquiry(self, *, user_id: str, inquiry_id: str) -> None:
        inquiry = await self._get_inquiry_for_user(user_id=user_id, inquiry_id=inquiry_id)
        if inquiry.status != InquiryStatus.DRAFT:
            raise InvalidTransitionError("Only draft inquiries can be deleted; use archive instead.")
        if inquiry.invoices or inquiry.expenses or inquiry.receipts:
            raise InvalidTransitionError("Draft inquiry has linked records; use archive instead.")
        await self.db.delete(inquiry)
        await self.db.commit()

    async def send_to_client(
        self,
        *,
        user_id: str,
        inquiry_id: str,
        valid_until_override: date | None = None,
    ) -> InquiryResponse:
        inquiry = await self._get_inquiry_for_user(user_id=user_id, inquiry_id=inquiry_id)
        if inquiry.status not in {InquiryStatus.DRAFT, InquiryStatus.DISCUSSION_REQUESTED}:
            valid = ["archive"] if inquiry.status not in {InquiryStatus.ARCHIVED} else ["unarchive"]
            raise InvalidTransitionError(
                f"Cannot transition inquiry from {inquiry.status.value} to sent. Valid options: {', '.join(valid)}."
            )
        if not inquiry.line_items:
            raise InvalidTransitionError("Inquiry must have at least one line item before sending.")

        snapshot, subtotal, vat_total, total = self._serialize_line_items(inquiry.line_items)
        now = datetime.utcnow()
        token = str(uuid4()) if inquiry.status == InquiryStatus.DISCUSSION_REQUESTED else (inquiry.public_token or str(uuid4()))
        inquiry.public_token = token
        inquiry.quote_line_items = snapshot
        inquiry.quote_amount = _money(total)
        inquiry.sent_at = now
        inquiry.valid_until = valid_until_override or (now.date() + timedelta(days=30))
        inquiry.status = InquiryStatus.SENT

        self.pdf_service.generate_quote_pdf(
            token=token,
            business_name=inquiry.user.business_name,
            business_address=inquiry.user.business_address,
            customer_name=inquiry.customer.name,
            customer_address=inquiry.customer.address,
            title=inquiry.title,
            valid_until=inquiry.valid_until.isoformat(),
            line_items=snapshot,
            subtotal=subtotal,
            vat_total=vat_total,
            total=total,
        )
        share_url = self._share_url(token)
        email_stub = await self.email_service.send_quote(
            inquiry=inquiry,
            customer=inquiry.customer,
            share_url=share_url,
        )
        self._add_audit(inquiry, "inquiry.sent", {"share_url": share_url})
        await self.db.commit()
        response = await self.get_inquiry_detail(user_id=user_id, inquiry_id=inquiry_id)
        return response.model_copy(update={"email_stub": EmailStubResponse(**email_stub)})

    async def archive(self, *, user_id: str, inquiry_id: str) -> InquiryResponse:
        inquiry = await self._get_inquiry_for_user(user_id=user_id, inquiry_id=inquiry_id)
        if inquiry.status == InquiryStatus.ARCHIVED:
            raise InvalidTransitionError("Inquiry is already archived.")
        inquiry.archived_from_status = inquiry.status.value
        inquiry.status = InquiryStatus.ARCHIVED
        self._add_audit(inquiry, "inquiry.archived", {"from": inquiry.archived_from_status})
        await self.db.commit()
        return await self.get_inquiry_detail(user_id=user_id, inquiry_id=inquiry_id)

    async def unarchive(self, *, user_id: str, inquiry_id: str) -> InquiryResponse:
        inquiry = await self._get_inquiry_for_user(user_id=user_id, inquiry_id=inquiry_id)
        if inquiry.status != InquiryStatus.ARCHIVED:
            raise InvalidTransitionError("Only archived inquiries can be restored.")
        restore = inquiry.archived_from_status
        if restore in {
            InquiryStatus.ACCEPTED.value,
            InquiryStatus.INVOICED.value,
            InquiryStatus.COMPLETED.value,
        }:
            inquiry.status = InquiryStatus(restore)
        else:
            inquiry.status = InquiryStatus.DRAFT
        inquiry.archived_from_status = None
        self._add_audit(inquiry, "inquiry.unarchived", {"restored_to": inquiry.status.value})
        await self.db.commit()
        return await self.get_inquiry_detail(user_id=user_id, inquiry_id=inquiry_id)

    async def get_quote_pdf_path(self, *, user_id: str, inquiry_id: str) -> str:
        inquiry = await self._get_inquiry_for_user(user_id=user_id, inquiry_id=inquiry_id)
        if not inquiry.public_token:
            raise InquiryNotFoundError("Quote PDF not found")
        path = self.pdf_service.get_quote_pdf_path(inquiry.public_token)
        if not path.exists():
            raise InquiryNotFoundError("Quote PDF not found")
        return str(path)

    async def get_public_inquiry(self, *, token: str) -> PublicInquiryResponse:
        inquiry = await self._get_inquiry_by_token(token)
        await expire_inquiries_check(self.db, inquiry.user_id, date.today())
        inquiry = await self._get_inquiry_by_token(token)
        if inquiry.status in {InquiryStatus.DRAFT, InquiryStatus.ARCHIVED}:
            raise InquiryNotFoundError("Quote not found")
        snapshot = inquiry.quote_line_items or []
        subtotal, vat_total, total = self._totals_from_snapshot(snapshot)
        return PublicInquiryResponse(
            business_name=inquiry.user.business_name,
            business_address=inquiry.user.business_address,
            customer_name=inquiry.customer.name,
            title=inquiry.title,
            line_items=[InquiryLineItemResponse(**item) for item in snapshot],
            subtotal=subtotal,
            vat_total=vat_total,
            total=total,
            valid_until=inquiry.valid_until,
            status=inquiry.status.value,
            available_actions=self._public_available_actions(inquiry.status),
            accepted_at=inquiry.accepted_at,
            rejected_at=inquiry.rejected_at,
            discussion_requested_at=inquiry.discussion_requested_at,
        )

    async def public_accept(self, *, token: str) -> PublicInquiryActionResponse:
        inquiry = await self._get_public_actionable_inquiry(token)
        if inquiry.status not in {InquiryStatus.SENT, InquiryStatus.DISCUSSION_REQUESTED}:
            raise self._public_conflict(inquiry.status)
        inquiry.status = InquiryStatus.ACCEPTED
        inquiry.accepted_at = datetime.utcnow()
        self._add_audit(inquiry, "inquiry.public_accepted", None)
        await self.db.commit()
        return PublicInquiryActionResponse(
            status=inquiry.status.value,
            accepted_at=inquiry.accepted_at,
            available_actions=self._public_available_actions(inquiry.status),
        )

    async def public_reject(self, *, token: str, reason: str | None = None) -> PublicInquiryActionResponse:
        inquiry = await self._get_public_actionable_inquiry(token)
        if inquiry.status not in {InquiryStatus.SENT, InquiryStatus.DISCUSSION_REQUESTED}:
            raise self._public_conflict(inquiry.status)
        inquiry.status = InquiryStatus.REJECTED
        inquiry.rejected_at = datetime.utcnow()
        if reason:
            inquiry.client_notes = self._append_note(
                inquiry.client_notes,
                note=reason,
                source="client",
            )
        self._add_audit(inquiry, "inquiry.public_rejected", {"reason": reason} if reason else None)
        await self.db.commit()
        return PublicInquiryActionResponse(
            status=inquiry.status.value,
            rejected_at=inquiry.rejected_at,
            available_actions=self._public_available_actions(inquiry.status),
        )

    async def public_request_discussion(self, *, token: str, note: str) -> PublicInquiryActionResponse:
        inquiry = await self._get_public_actionable_inquiry(token)
        if inquiry.status != InquiryStatus.SENT:
            raise self._public_conflict(inquiry.status)
        inquiry.status = InquiryStatus.DISCUSSION_REQUESTED
        inquiry.discussion_requested_at = datetime.utcnow()
        inquiry.client_notes = self._append_note(inquiry.client_notes, note=note, source="client")
        self._add_audit(inquiry, "inquiry.public_discussion_requested", {"note": note})
        await self.db.commit()
        return PublicInquiryActionResponse(
            status=inquiry.status.value,
            discussion_requested_at=inquiry.discussion_requested_at,
            available_actions=self._public_available_actions(inquiry.status),
        )

    async def mark_invoiced(self, *, inquiry_id: str) -> None:
        inquiry = await self._get_inquiry_by_id(inquiry_id)
        if inquiry.status == InquiryStatus.ACCEPTED:
            inquiry.status = InquiryStatus.INVOICED
            self._add_audit(inquiry, "inquiry.invoiced", None)

    async def mark_completed_from_invoice(self, *, invoice_id: str) -> None:
        invoice = await self.db.scalar(
            select(Invoice)
            .options(selectinload(Invoice.payments), selectinload(Invoice.inquiry))
            .where(Invoice.id == invoice_id)
        )
        if invoice is None or invoice.inquiry is None:
            return
        paid_total = sum(payment.amount for payment in invoice.payments)
        if paid_total + 0.0001 < invoice.total:
            return
        invoice.inquiry.status = InquiryStatus.COMPLETED
        self._add_audit(invoice.inquiry, "inquiry.completed", {"invoice_id": invoice.id})

    async def _get_inquiry_for_user(self, *, user_id: str, inquiry_id: str) -> Inquiry:
        inquiry = await self.db.scalar(
            select(Inquiry)
            .options(
                selectinload(Inquiry.customer),
                selectinload(Inquiry.user),
                selectinload(Inquiry.line_items),
                selectinload(Inquiry.invoices),
                selectinload(Inquiry.expenses),
                selectinload(Inquiry.receipts),
            )
            .where(Inquiry.id == inquiry_id, Inquiry.user_id == user_id)
        )
        if inquiry is None:
            raise InquiryNotFoundError("Inquiry not found")
        return inquiry

    async def _get_inquiry_by_id(self, inquiry_id: str) -> Inquiry:
        inquiry = await self.db.scalar(select(Inquiry).where(Inquiry.id == inquiry_id))
        if inquiry is None:
            raise InquiryNotFoundError("Inquiry not found")
        return inquiry

    async def _get_inquiry_by_token(self, token: str) -> Inquiry:
        inquiry = await self.db.scalar(
            select(Inquiry)
            .options(
                selectinload(Inquiry.customer),
                selectinload(Inquiry.user),
                selectinload(Inquiry.line_items),
            )
            .where(Inquiry.public_token == token)
        )
        if inquiry is None:
            raise InquiryNotFoundError("Quote not found")
        return inquiry

    async def _get_public_actionable_inquiry(self, token: str) -> Inquiry:
        inquiry = await self._get_inquiry_by_token(token)
        await expire_inquiries_check(self.db, inquiry.user_id, date.today())
        inquiry = await self._get_inquiry_by_token(token)
        if inquiry.status in {InquiryStatus.DRAFT, InquiryStatus.ARCHIVED}:
            raise InquiryNotFoundError("Quote not found")
        if inquiry.status == InquiryStatus.EXPIRED:
            raise InquiryConflictError("Quote has expired")
        return inquiry

    async def _ensure_customer(self, *, user_id: str, customer_id: str) -> Customer:
        customer = await self.db.scalar(
            select(Customer).where(Customer.id == customer_id, Customer.user_id == user_id)
        )
        if customer is None:
            raise InquiryNotFoundError("Customer not found")
        return customer

    def _build_line_item(self, inquiry_id: str, payload: InquiryLineItemInput | dict) -> InquiryLineItem:
        data = payload.model_dump() if hasattr(payload, "model_dump") else payload
        net = _money(data["quantity"] * data["unit_price"])
        vat = _money(net * Decimal(str(data["vat_rate"])) / Decimal("100"))
        return InquiryLineItem(
            inquiry_id=inquiry_id,
            description=data["description"],
            quantity=float(data["quantity"]),
            unit_price=float(data["unit_price"]),
            vat_rate=float(data["vat_rate"]),
            line_total_net=float(net),
            line_total_vat=float(vat),
        )

    def _serialize_line_items(self, line_items: list[InquiryLineItem]) -> tuple[list[dict[str, object]], float, float, float]:
        snapshot = []
        subtotal = Decimal("0.00")
        vat_total = Decimal("0.00")
        for item in line_items:
            entry = {
                "id": item.id,
                "description": item.description,
                "quantity": float(item.quantity),
                "unit_price": float(item.unit_price),
                "vat_rate": float(item.vat_rate),
                "line_total_net": float(item.line_total_net),
                "line_total_vat": float(item.line_total_vat),
            }
            snapshot.append(entry)
            subtotal += _money(item.line_total_net)
            vat_total += _money(item.line_total_vat)
        total = subtotal + vat_total
        return snapshot, float(subtotal), float(vat_total), float(total)

    def _totals_from_snapshot(self, snapshot: list[dict[str, object]]) -> tuple[float, float, float]:
        subtotal = sum(float(item["line_total_net"]) for item in snapshot)
        vat_total = sum(float(item["line_total_vat"]) for item in snapshot)
        return round(subtotal, 2), round(vat_total, 2), round(subtotal + vat_total, 2)

    async def _serialize_inquiry(self, inquiry: Inquiry, include_timeline: bool = False) -> InquiryResponse:
        line_items, subtotal, vat_total, total = self._serialize_line_items(list(inquiry.line_items))
        quote_snapshot = inquiry.quote_line_items or []
        audit_timeline = await self._get_audit_timeline(inquiry) if include_timeline else []
        related_invoices = [
            InquiryInvoiceSummary(
                id=invoice.id,
                invoice_number=invoice.invoice_number,
                status=invoice.status.value if hasattr(invoice.status, "value") else str(invoice.status),
                total=float(invoice.total),
            )
            for invoice in inquiry.invoices
        ]
        return InquiryResponse(
            id=inquiry.id,
            status=inquiry.status.value,
            customer_id=inquiry.customer_id,
            customer_name=inquiry.customer.name,
            title=inquiry.title,
            description=inquiry.description,
            start_date=inquiry.start_date,
            line_items=[InquiryLineItemResponse(**item) for item in line_items],
            subtotal=subtotal,
            vat_total=vat_total,
            total=total,
            quote_amount=float(inquiry.quote_amount) if inquiry.quote_amount is not None else None,
            quote_line_items=[InquiryLineItemResponse(**item) for item in quote_snapshot],
            public_token=inquiry.public_token,
            share_url=self._share_url(inquiry.public_token) if inquiry.public_token else None,
            valid_until=inquiry.valid_until,
            sent_at=inquiry.sent_at,
            accepted_at=inquiry.accepted_at,
            rejected_at=inquiry.rejected_at,
            discussion_requested_at=inquiry.discussion_requested_at,
            client_notes=[InquiryNoteResponse(**note) for note in (inquiry.client_notes or [])],
            audit_timeline=audit_timeline,
            related_invoices=related_invoices,
            created_at=inquiry.created_at,
            updated_at=inquiry.updated_at,
        )

    async def _get_audit_timeline(self, inquiry: Inquiry) -> list[InquiryAuditEntry]:
        result = await self.db.execute(
            select(AuditLog).where(AuditLog.entity_type == "inquiry", AuditLog.entity_id == inquiry.id)
        )
        entries = [
            InquiryAuditEntry(at=log.timestamp, action=log.action, detail=log.diff, source="system")
            for log in result.scalars().all()
        ]
        entries.extend(
            InquiryAuditEntry(at=note["at"], action="inquiry.note", detail={"note": note["note"]}, source="client")
            for note in (inquiry.client_notes or [])
        )
        entries.sort(key=lambda item: item.at, reverse=True)
        return entries

    def _public_available_actions(self, status: InquiryStatus) -> list[str]:
        if status == InquiryStatus.SENT:
            return ["accept", "reject", "request_discussion"]
        if status == InquiryStatus.DISCUSSION_REQUESTED:
            return ["accept", "reject"]
        return []

    def _add_audit(self, inquiry: Inquiry, action: str, diff: dict | None) -> None:
        self.db.add(
            AuditLog(
                user_id=inquiry.user_id,
                entity_type="inquiry",
                entity_id=inquiry.id,
                action=action,
                diff=diff,
            )
        )

    def _append_note(self, existing: list[dict] | None, *, note: str, source: str) -> list[dict]:
        notes = list(existing or [])
        notes.append({"at": datetime.utcnow().isoformat(), "note": note, "source": source})
        return notes

    def _share_url(self, token: str) -> str:
        return f"{settings.FRONTEND_BASE_URL.rstrip('/')}/q/{token}"

    def _public_conflict(self, status: InquiryStatus) -> InquiryConflictError:
        if status == InquiryStatus.ACCEPTED:
            return InquiryConflictError("Quote is already accepted")
        if status == InquiryStatus.REJECTED:
            return InquiryConflictError("Quote is already rejected")
        if status == InquiryStatus.DISCUSSION_REQUESTED:
            return InquiryConflictError("Quote is awaiting a revised response")
        if status == InquiryStatus.INVOICED:
            return InquiryConflictError("Quote has already been invoiced")
        if status == InquiryStatus.COMPLETED:
            return InquiryConflictError("Quote has already been completed")
        return InquiryConflictError(f"Quote cannot be changed from {status.value}")
