from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta
from pathlib import Path

import pytest
from sqlalchemy import select

from app.models import AuditLog, Customer, Inquiry, InquiryLineItem, InquiryStatus, Invoice, InvoiceStatus, Payment
from app.services.inquiry_service import InquiryService
from app.services.quote_pdf_service import QuotePDFService


def _register_payload(email: str) -> dict[str, str]:
    return {
        "email": email,
        "password": "Strong123",
        "role": "self_employed_vat",
        "business_name": "Demo Consulting Ltd",
        "business_address": "12 Grafton St, Dublin 2",
    }


async def _register_and_authenticate(client, email: str) -> tuple[str, str]:
    response = await client.post("/api/v1/auth/register", json=_register_payload(email))
    body = response.json()
    return body["user"]["id"], body["access_token"]


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def _create_customer(client, token: str, name: str = "O'Brien Plumbing Ltd") -> str:
    response = await client.post(
        "/api/v1/customers",
        json={"name": name, "email": "invoices@obrien.ie", "address": "5 Camden St, Dublin 2"},
        headers=_auth_headers(token),
    )
    return response.json()["id"]


async def _create_inquiry(client, token: str, customer_id: str, valid_until: str | None = None) -> str:
    payload = {
        "customer_id": customer_id,
        "title": "Kitchen renovation — Galway project",
        "description": "Full kitchen refurb, 4 weeks",
        "line_items": [
            {"description": "Labour", "quantity": 80, "unit_price": 45.0, "vat_rate": 13.5},
            {"description": "Materials", "quantity": 1, "unit_price": 2500.0, "vat_rate": 23.0},
        ],
    }
    if valid_until:
        payload["valid_until"] = valid_until
    response = await client.post("/api/v1/inquiries", json=payload, headers=_auth_headers(token))
    assert response.status_code == 201
    return response.json()["id"]


@pytest.fixture(autouse=True)
def stub_quote_pdf(monkeypatch, tmp_path: Path):
    def _fake_generate(self, *, token: str, **_: object) -> Path:
        path = tmp_path / "quotes"
        path.mkdir(parents=True, exist_ok=True)
        pdf_path = path / f"{token}.pdf"
        pdf_path.write_bytes(b"%PDF-1.4\n% Spendly test quote\n")
        return pdf_path

    def _fake_path(self, token: str) -> Path:
        path = tmp_path / "quotes"
        path.mkdir(parents=True, exist_ok=True)
        return path / f"{token}.pdf"

    monkeypatch.setattr(QuotePDFService, "generate_quote_pdf", _fake_generate)
    monkeypatch.setattr(QuotePDFService, "get_quote_pdf_path", _fake_path)


@pytest.mark.asyncio
async def test_send_generates_token_snapshot_pdf_and_email_stub(client, test_db_session):
    _, token = await _register_and_authenticate(client, f"inquiry-send-{uuid.uuid4().hex[:8]}@example.com")
    customer_id = await _create_customer(client, token)
    inquiry_id = await _create_inquiry(client, token, customer_id, valid_until="2026-05-30")

    response = await client.post(f"/api/v1/inquiries/{inquiry_id}/send", json={}, headers=_auth_headers(token))

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "sent"
    assert body["public_token"]
    assert body["share_url"].endswith(body["public_token"])
    assert body["quote_amount"] == pytest.approx(7161.0)
    assert body["email_stub"]["delivered"] is False

    pdf_path = QuotePDFService().get_quote_pdf_path(body["public_token"])
    assert pdf_path.exists()

    audit_logs = (await test_db_session.execute(select(AuditLog).where(AuditLog.entity_id == inquiry_id))).scalars().all()
    assert any(log.action == "inquiry.email_stub_sent" for log in audit_logs)


@pytest.mark.asyncio
async def test_public_get_and_accept_require_no_auth_and_second_accept_conflicts(client):
    _, token = await _register_and_authenticate(client, f"inquiry-public-{uuid.uuid4().hex[:8]}@example.com")
    customer_id = await _create_customer(client, token)
    inquiry_id = await _create_inquiry(client, token, customer_id)
    send_response = await client.post(f"/api/v1/inquiries/{inquiry_id}/send", json={}, headers=_auth_headers(token))
    public_token = send_response.json()["public_token"]

    public_get = await client.get(f"/api/v1/public/inquiries/{public_token}")
    assert public_get.status_code == 200
    assert public_get.json()["available_actions"] == ["accept", "reject", "request_discussion"]

    accepted = await client.post(f"/api/v1/public/inquiries/{public_token}/accept", json={})
    assert accepted.status_code == 200
    assert accepted.json()["status"] == "accepted"

    second_accept = await client.post(f"/api/v1/public/inquiries/{public_token}/accept", json={})
    assert second_accept.status_code == 409
    assert second_accept.json()["detail"] == "Quote is already accepted"


@pytest.mark.asyncio
async def test_discussion_request_appends_note_and_resend_rotates_token(client):
    _, token = await _register_and_authenticate(client, f"inquiry-discuss-{uuid.uuid4().hex[:8]}@example.com")
    customer_id = await _create_customer(client, token)
    inquiry_id = await _create_inquiry(client, token, customer_id)
    send_response = await client.post(f"/api/v1/inquiries/{inquiry_id}/send", json={}, headers=_auth_headers(token))
    first_token = send_response.json()["public_token"]

    discussion = await client.post(
        f"/api/v1/public/inquiries/{first_token}/request-discussion",
        json={"note": "Could you reduce labour rate to €40/hr?"},
    )
    assert discussion.status_code == 200
    assert discussion.json()["status"] == "discussion_requested"

    detail = await client.get(f"/api/v1/inquiries/{inquiry_id}", headers=_auth_headers(token))
    assert detail.status_code == 200
    assert detail.json()["client_notes"][0]["note"] == "Could you reduce labour rate to €40/hr?"

    resend = await client.post(
        f"/api/v1/inquiries/{inquiry_id}/send",
        json={"valid_until_override": "2026-06-15"},
        headers=_auth_headers(token),
    )
    assert resend.status_code == 200
    second_token = resend.json()["public_token"]
    assert second_token != first_token

    old_public = await client.get(f"/api/v1/public/inquiries/{first_token}")
    assert old_public.status_code == 404


@pytest.mark.asyncio
async def test_auto_expiry_and_edit_lock_on_sent_inquiry(client):
    _, token = await _register_and_authenticate(client, f"inquiry-expire-{uuid.uuid4().hex[:8]}@example.com")
    customer_id = await _create_customer(client, token)
    inquiry_id = await _create_inquiry(client, token, customer_id)
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    send_response = await client.post(
        f"/api/v1/inquiries/{inquiry_id}/send",
        json={"valid_until_override": yesterday},
        headers=_auth_headers(token),
    )
    public_token = send_response.json()["public_token"]

    detail = await client.get(f"/api/v1/inquiries/{inquiry_id}", headers=_auth_headers(token))
    assert detail.status_code == 200
    assert detail.json()["status"] == "expired"

    expired_accept = await client.post(f"/api/v1/public/inquiries/{public_token}/accept", json={})
    assert expired_accept.status_code == 409
    assert expired_accept.json()["detail"] == "Quote has expired"

    update = await client.put(
        f"/api/v1/inquiries/{inquiry_id}",
        json={"title": "Cannot edit now"},
        headers=_auth_headers(token),
    )
    assert update.status_code == 400
    assert "Cannot edit expired inquiry" in update.json()["detail"]


@pytest.mark.asyncio
async def test_invalid_transition_lists_valid_options(client):
    _, token = await _register_and_authenticate(client, f"inquiry-invalid-{uuid.uuid4().hex[:8]}@example.com")
    customer_id = await _create_customer(client, token)
    inquiry_id = await _create_inquiry(client, token, customer_id)
    await client.post(f"/api/v1/inquiries/{inquiry_id}/send", json={}, headers=_auth_headers(token))

    resend = await client.post(f"/api/v1/inquiries/{inquiry_id}/send", json={}, headers=_auth_headers(token))
    assert resend.status_code == 400
    assert "Valid options" in resend.json()["detail"]


@pytest.mark.asyncio
async def test_public_get_returns_404_for_bogus_or_draft_tokens(client, test_db_session):
    bogus = await client.get("/api/v1/public/inquiries/not-a-real-token")
    assert bogus.status_code == 404

    user_id, token = await _register_and_authenticate(client, f"inquiry-draft-{uuid.uuid4().hex[:8]}@example.com")
    customer_id = await _create_customer(client, token)
    inquiry_id = await _create_inquiry(client, token, customer_id)
    inquiry = await test_db_session.scalar(select(Inquiry).where(Inquiry.id == inquiry_id))
    inquiry.public_token = str(uuid.uuid4())
    await test_db_session.commit()

    draft_public = await client.get(f"/api/v1/public/inquiries/{inquiry.public_token}")
    assert user_id
    assert draft_public.status_code == 404


@pytest.mark.asyncio
async def test_auto_transitions_to_invoiced_and_completed(test_db_session):
    user_id = str(uuid.uuid4())
    customer = Customer(id=str(uuid.uuid4()), user_id=user_id, name="Customer")
    inquiry = Inquiry(
        id=str(uuid.uuid4()),
        user_id=user_id,
        customer_id=customer.id,
        title="Accepted inquiry",
        status=InquiryStatus.ACCEPTED,
        client_notes=[],
    )
    line_item = InquiryLineItem(
        inquiry_id=inquiry.id,
        description="Labour",
        quantity=1,
        unit_price=100,
        vat_rate=23,
        line_total_net=100,
        line_total_vat=23,
    )
    test_db_session.add_all([customer, inquiry, line_item])
    await test_db_session.commit()

    service = InquiryService(test_db_session)
    await service.mark_invoiced(inquiry_id=inquiry.id)
    await test_db_session.commit()

    stored = await test_db_session.scalar(select(Inquiry).where(Inquiry.id == inquiry.id))
    assert stored.status == InquiryStatus.INVOICED

    invoice = Invoice(
        id=str(uuid.uuid4()),
        user_id=user_id,
        inquiry_id=inquiry.id,
        customer_id=customer.id,
        customer_name_snapshot=customer.name,
        invoice_number="INV-2026-0001",
        sequence_year=2026,
        sequence_number=1,
        status=InvoiceStatus.ISSUED,
        subtotal=100,
        vat_total=23,
        total=123,
        issued_at=datetime.utcnow(),
        currency="EUR",
    )
    payment = Payment(
        id=str(uuid.uuid4()),
        invoice_id=invoice.id,
        user_id=user_id,
        amount=123,
        payment_date=datetime.utcnow(),
    )
    test_db_session.add_all([invoice, payment])
    await test_db_session.commit()

    await service.mark_completed_from_invoice(invoice_id=invoice.id)
    await test_db_session.commit()

    completed = await test_db_session.scalar(select(Inquiry).where(Inquiry.id == inquiry.id))
    assert completed.status == InquiryStatus.COMPLETED