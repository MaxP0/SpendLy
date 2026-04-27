from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import AuditLog, Customer, Inquiry, InquiryStatus, Invoice, InvoiceLineItem, InvoiceStatus, User, UserRole
from app.schemas.invoice_schema import (
    InvoiceCreate,
    InvoiceLineItemCreate,
    InvoiceLineItemResponse,
    InvoiceListResponse,
    InvoiceResponse,
    InvoiceUpdate,
    InvoiceVatBreakdown,
)
from app.services.inquiry_service import InquiryService
from app.services.invoice_pdf_service import InvoicePDFService


ALLOWED_VAT_RATES = {Decimal("0"), Decimal("9"), Decimal("13.5"), Decimal("23")}
NO_VAT_ROLES = {UserRole.SELF_EMPLOYED_NO_VAT, UserRole.PAYE_SIDE_INCOME}


class InvoiceNotFoundError(ValueError):
    pass


class InvoiceValidationError(ValueError):
    pass


class InvoiceConflictError(ValueError):
    pass


def _money(value: Decimal | float | int) -> Decimal:
    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _rate(value: Decimal | float | int) -> Decimal:
    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class InvoiceService:
    """Service for invoice-related business logic."""

    def __init__(self, db: AsyncSession):
        self.db = db

        self.pdf_service = InvoicePDFService()

    async def create_invoice(
        self,
        *,
        user: User,
        payload: InvoiceCreate,
    ) -> InvoiceResponse:
        customer = await self._get_customer(user_id=user.id, customer_id=payload.customer_id)
        inquiry = await self._validate_inquiry(
            user_id=user.id,
            inquiry_id=payload.inquiry_id,
            customer_id=payload.customer_id,
        )
        line_items, subtotal, vat_total, total = self._build_line_items(
            user=user,
            payloads=payload.line_items,
        )

        invoice = Invoice(
            id=str(uuid4()),
            user_id=user.id,
            customer_id=customer.id,
            inquiry_id=inquiry.id if inquiry else None,
            status=InvoiceStatus.DRAFT,
            subtotal=subtotal,
            vat_total=vat_total,
            total=total,
            due_at=payload.due_at,
            currency=(payload.currency or "EUR").upper(),
            reference=payload.reference.strip() if payload.reference else None,
            customer_name_snapshot=customer.name,
            customer_email_snapshot=customer.email,
            customer_phone_snapshot=customer.phone,
            customer_address_snapshot=customer.address,
            line_items=line_items,
        )
        self.db.add(invoice)
        self._add_audit(invoice, user.id, "invoice.created", {"inquiry_id": invoice.inquiry_id})
        await self.db.commit()
        return await self.get_invoice_detail(user_id=user.id, invoice_id=invoice.id)

    async def list_user_invoices(
        self,
        *,
        user_id: str,
        status: str | None = None,
        customer_id: str | None = None,
        from_date: date | None = None,
        to_date: date | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> InvoiceListResponse:
        filters = [Invoice.user_id == user_id]
        if status:
            filters.append(Invoice.status == InvoiceStatus(status))
        if customer_id:
            filters.append(Invoice.customer_id == customer_id)
        if from_date:
            filters.append(func.date(func.coalesce(Invoice.issued_at, Invoice.created_at)) >= from_date)
        if to_date:
            filters.append(func.date(func.coalesce(Invoice.issued_at, Invoice.created_at)) <= to_date)

        total = await self.db.scalar(select(func.count(Invoice.id)).where(*filters))
        result = await self.db.execute(
            select(Invoice)
            .options(
                selectinload(Invoice.line_items),
                selectinload(Invoice.customer),
            )
            .where(*filters)
            .order_by(func.coalesce(Invoice.issued_at, Invoice.created_at).desc())
            .limit(limit)
            .offset(offset)
        )
        items = [self._serialize_invoice(invoice) for invoice in result.scalars().all()]
        return InvoiceListResponse(items=items, total=int(total or 0), limit=limit, offset=offset)

    async def get_invoice_detail(self, *, user_id: str, invoice_id: str) -> InvoiceResponse:
        invoice = await self._get_invoice_for_user(user_id=user_id, invoice_id=invoice_id)
        return self._serialize_invoice(invoice)

    async def update_invoice(self, *, user: User, invoice_id: str, payload: InvoiceUpdate) -> InvoiceResponse:
        invoice = await self._get_invoice_for_user(user_id=user.id, invoice_id=invoice_id)
        if invoice.status != InvoiceStatus.DRAFT:
            raise InvoiceValidationError("cannot update issued invoice")

        customer = invoice.customer
        if payload.customer_id and payload.customer_id != invoice.customer_id:
            customer = await self._get_customer(user_id=user.id, customer_id=payload.customer_id)
            invoice.customer_id = customer.id

        if "inquiry_id" in payload.model_fields_set:
            inquiry_id = payload.inquiry_id
        else:
            inquiry_id = invoice.inquiry_id
        inquiry = await self._validate_inquiry(
            user_id=user.id,
            inquiry_id=inquiry_id,
            customer_id=invoice.customer_id,
        )
        invoice.inquiry_id = inquiry.id if inquiry else None

        if payload.due_at is not None:
            invoice.due_at = payload.due_at
        if payload.currency is not None:
            invoice.currency = payload.currency.upper()
        if payload.reference is not None:
            invoice.reference = payload.reference.strip() or None
        if payload.line_items is not None:
            invoice.line_items.clear()
            await self.db.flush()
            line_items, subtotal, vat_total, total = self._build_line_items(user=user, payloads=payload.line_items)
            invoice.line_items.extend(line_items)
            invoice.subtotal = subtotal
            invoice.vat_total = vat_total
            invoice.total = total

        invoice.customer_name_snapshot = customer.name
        invoice.customer_email_snapshot = customer.email
        invoice.customer_phone_snapshot = customer.phone
        invoice.customer_address_snapshot = customer.address
        self._add_audit(invoice, user.id, "invoice.updated", {"inquiry_id": invoice.inquiry_id})
        await self.db.commit()
        return await self.get_invoice_detail(user_id=user.id, invoice_id=invoice_id)

    async def issue_invoice(self, *, user: User, invoice_id: str) -> InvoiceResponse:
        invoice = await self._get_invoice_for_user(user_id=user.id, invoice_id=invoice_id)
        if invoice.status != InvoiceStatus.DRAFT:
            raise InvoiceValidationError("Only draft invoices can be issued.")

        customer = await self._get_customer(user_id=user.id, customer_id=invoice.customer_id)
        invoice.customer_name_snapshot = customer.name
        invoice.customer_email_snapshot = customer.email
        invoice.customer_phone_snapshot = customer.phone
        invoice.customer_address_snapshot = customer.address
        invoice.issued_at = datetime.utcnow()
        invoice.status = InvoiceStatus.ISSUED
        await self._assign_invoice_number(invoice)

        if invoice.inquiry_id:
            inquiry = await self._get_inquiry_for_user(user_id=user.id, inquiry_id=invoice.inquiry_id)
            if inquiry.status == InquiryStatus.ACCEPTED:
                await InquiryService(self.db).mark_invoiced(inquiry_id=inquiry.id)

        self._add_audit(invoice, user.id, "invoice.issued", {"invoice_number": invoice.invoice_number})
        await self.db.commit()
        return await self.get_invoice_detail(user_id=user.id, invoice_id=invoice.id)

    async def cancel_invoice(self, *, user_id: str, invoice_id: str) -> InvoiceResponse:
        invoice = await self._get_invoice_for_user(user_id=user_id, invoice_id=invoice_id)
        if invoice.status != InvoiceStatus.ISSUED:
            raise InvoiceValidationError("Only issued invoices can be cancelled.")
        invoice.status = InvoiceStatus.CANCELLED
        self._add_audit(invoice, user_id, "invoice.cancelled", {"invoice_number": invoice.invoice_number})
        await self.db.commit()
        return await self.get_invoice_detail(user_id=user_id, invoice_id=invoice.id)

    async def generate_pdf(self, *, user_id: str, invoice_id: str) -> tuple[bytes, str]:
        invoice = await self._get_invoice_for_user(user_id=user_id, invoice_id=invoice_id)
        pdf_bytes = self.pdf_service.generate_invoice_pdf(
            business_name=invoice.user.business_name,
            business_address=invoice.user.business_address,
            invoice_number=invoice.invoice_number,
            status=invoice.status.value,
            issued_at=invoice.issued_at.isoformat() if invoice.issued_at else None,
            due_at=invoice.due_at.isoformat() if invoice.due_at else None,
            customer_name=invoice.customer_name_snapshot,
            customer_address=invoice.customer_address_snapshot,
            customer_email=invoice.customer_email_snapshot,
            customer_phone=invoice.customer_phone_snapshot,
            currency=invoice.currency,
            reference=invoice.reference,
            line_items=[
                {
                    "description": item.description,
                    "quantity": float(item.quantity),
                    "unit_price": float(item.unit_price),
                    "vat_rate": float(item.vat_rate),
                    "line_total_net": float(item.line_total_net),
                    "line_total_vat": float(item.line_total_vat),
                }
                for item in invoice.line_items
            ],
            subtotal=float(invoice.subtotal),
            vat_total=float(invoice.vat_total),
            total=float(invoice.total),
            vat_breakdown=[item.model_dump() for item in self._vat_breakdown(invoice.line_items)],
        )
        file_name = invoice.invoice_number or f"draft-{invoice.id}"
        return pdf_bytes, f"{file_name}.pdf"

    async def _get_invoice_for_user(self, *, user_id: str, invoice_id: str) -> Invoice:
        invoice = await self.db.scalar(
            select(Invoice)
            .options(
                selectinload(Invoice.line_items),
                selectinload(Invoice.customer),
                selectinload(Invoice.user),
                selectinload(Invoice.inquiry),
                selectinload(Invoice.payments),
            )
            .where(Invoice.id == invoice_id, Invoice.user_id == user_id)
        )
        if invoice is None:
            raise InvoiceNotFoundError("Invoice not found")
        return invoice

    async def _get_customer(self, *, user_id: str, customer_id: str) -> Customer:
        customer = await self.db.scalar(
            select(Customer).where(Customer.id == customer_id, Customer.user_id == user_id)
        )
        if customer is None:
            raise InvoiceValidationError("Customer not found")
        return customer

    async def _get_inquiry_for_user(self, *, user_id: str, inquiry_id: str) -> Inquiry:
        inquiry = await self.db.scalar(
            select(Inquiry).where(Inquiry.id == inquiry_id, Inquiry.user_id == user_id)
        )
        if inquiry is None:
            raise InvoiceValidationError("Inquiry not found")
        return inquiry

    async def _validate_inquiry(
        self,
        *,
        user_id: str,
        inquiry_id: str | None,
        customer_id: str,
    ) -> Inquiry | None:
        if not inquiry_id:
            return None
        inquiry = await self._get_inquiry_for_user(user_id=user_id, inquiry_id=inquiry_id)
        if inquiry.customer_id != customer_id:
            raise InvoiceValidationError("Linked inquiry must belong to the selected customer.")
        if inquiry.status not in {InquiryStatus.ACCEPTED, InquiryStatus.INVOICED}:
            raise InvoiceValidationError(
                "Invoice can only be created for inquiries the client has accepted."
            )
        return inquiry

    def _build_line_items(
        self,
        *,
        user: User,
        payloads: list[InvoiceLineItemCreate],
    ) -> tuple[list[InvoiceLineItem], Decimal, Decimal, Decimal]:
        if not payloads:
            raise InvoiceValidationError("Invoice must include at least one line item.")
        line_items: list[InvoiceLineItem] = []
        subtotal = Decimal("0.00")
        vat_total = Decimal("0.00")
        for payload in payloads:
            vat_rate = self._validate_vat_rate(user, payload.vat_rate)
            quantity = _money(payload.quantity)
            unit_price = _money(payload.unit_price)
            line_total_net = _money(quantity * unit_price)
            line_total_vat = _money(line_total_net * vat_rate / Decimal("100"))
            subtotal += line_total_net
            vat_total += line_total_vat
            line_items.append(
                InvoiceLineItem(
                    id=str(uuid4()),
                    description=payload.description.strip(),
                    quantity=quantity,
                    unit_price=unit_price,
                    vat_rate=vat_rate,
                    line_total_net=line_total_net,
                    line_total_vat=line_total_vat,
                )
            )
        total = _money(subtotal + vat_total)
        return line_items, _money(subtotal), _money(vat_total), total

    def _validate_vat_rate(self, user: User, vat_rate: float) -> Decimal:
        rate = _rate(vat_rate)
        if user.role in NO_VAT_ROLES and rate != Decimal("0.00"):
            raise InvoiceValidationError("This user profile cannot apply VAT to invoices.")
        if rate not in {_rate(value) for value in ALLOWED_VAT_RATES}:
            raise InvoiceValidationError("VAT rate must be one of 0, 9, 13.5, or 23.")
        return rate

    async def _assign_invoice_number(self, invoice: Invoice) -> None:
        if invoice.issued_at is None:
            raise InvoiceConflictError("Issued invoices must have an issued timestamp.")
        year = invoice.issued_at.year
        for _ in range(5):
            try:
                async with self.db.begin_nested():
                    current = await self.db.scalar(
                        select(Invoice.sequence_number)
                        .where(Invoice.user_id == invoice.user_id, Invoice.sequence_year == year)
                        .order_by(Invoice.sequence_number.desc())
                        .limit(1)
                        .with_for_update()
                    )
                    next_sequence = int(current or 0) + 1
                    invoice.sequence_year = year
                    invoice.sequence_number = next_sequence
                    invoice.invoice_number = f"INV-{year}-{next_sequence:04d}"
                    await self.db.flush()
                return
            except IntegrityError:
                continue
        raise InvoiceConflictError("Unable to assign the next invoice number. Please retry.")

    def _vat_breakdown(self, line_items: list[InvoiceLineItem]) -> list[InvoiceVatBreakdown]:
        buckets: dict[Decimal, dict[str, Decimal]] = {}
        for item in line_items:
            rate = _rate(item.vat_rate)
            bucket = buckets.setdefault(rate, {"net": Decimal("0.00"), "vat": Decimal("0.00")})
            bucket["net"] += _money(item.line_total_net)
            bucket["vat"] += _money(item.line_total_vat)
        return [
            InvoiceVatBreakdown(rate=float(rate), net=float(_money(values["net"])), vat=float(_money(values["vat"])))
            for rate, values in sorted(buckets.items(), key=lambda item: item[0])
        ]

    def _serialize_invoice(self, invoice: Invoice) -> InvoiceResponse:
        line_items = [
            InvoiceLineItemResponse(
                id=item.id,
                description=item.description,
                quantity=float(item.quantity),
                unit_price=float(item.unit_price),
                vat_rate=float(item.vat_rate),
                line_total_net=float(item.line_total_net),
                line_total_vat=float(item.line_total_vat),
            )
            for item in invoice.line_items
        ]
        return InvoiceResponse(
            id=invoice.id,
            user_id=invoice.user_id,
            inquiry_id=invoice.inquiry_id,
            customer_id=invoice.customer_id,
            customer_name_snapshot=invoice.customer_name_snapshot,
            customer_email_snapshot=invoice.customer_email_snapshot,
            customer_phone_snapshot=invoice.customer_phone_snapshot,
            customer_address_snapshot=invoice.customer_address_snapshot,
            invoice_number=invoice.invoice_number,
            status=invoice.status.value if hasattr(invoice.status, "value") else str(invoice.status),
            subtotal=float(invoice.subtotal),
            vat_total=float(invoice.vat_total),
            total=float(invoice.total),
            vat_breakdown=self._vat_breakdown(invoice.line_items),
            line_items=line_items,
            issued_at=invoice.issued_at,
            due_at=invoice.due_at,
            currency=invoice.currency,
            reference=invoice.reference,
            created_at=invoice.created_at,
            updated_at=invoice.updated_at,
        )

    def _add_audit(self, invoice: Invoice, user_id: str, action: str, diff: dict[str, object] | None) -> None:
        self.db.add(
            AuditLog(
                user_id=user_id,
                entity_type="invoice",
                entity_id=invoice.id,
                action=action,
                diff=diff,
            )
        )
