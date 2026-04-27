from __future__ import annotations

import uuid
from datetime import date

import pytest

from app.services.invoice_pdf_service import InvoicePDFService


def _register_payload(email: str, role: str = "self_employed_vat") -> dict[str, str]:
    return {
        "email": email,
        "password": "Strong123",
        "role": role,
        "business_name": "Demo Consulting Ltd",
        "business_address": "12 Grafton St, Dublin 2",
    }


async def _register_and_authenticate(client, email: str, role: str = "self_employed_vat") -> tuple[str, str]:
    response = await client.post("/api/v1/auth/register", json=_register_payload(email, role))
    body = response.json()
    return body["user"]["id"], body["access_token"]


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def _create_customer(client, token: str, name: str = "O'Brien Plumbing Ltd") -> str:
    response = await client.post(
        "/api/v1/customers",
        json={"name": name, "email": "accounts@obrien.ie", "address": "5 Camden St, Dublin 2"},
        headers=_auth_headers(token),
    )
    assert response.status_code == 201
    return response.json()["id"]


async def _create_inquiry(client, token: str, customer_id: str) -> str:
    response = await client.post(
        "/api/v1/inquiries",
        json={
            "customer_id": customer_id,
            "title": "Stage billing quote",
            "line_items": [
                {"description": "Phase 1 labour", "quantity": 10, "unit_price": 80.0, "vat_rate": 13.5},
                {"description": "Materials", "quantity": 1, "unit_price": 200.0, "vat_rate": 23.0},
            ],
        },
        headers=_auth_headers(token),
    )
    assert response.status_code == 201
    return response.json()["id"]


async def _accept_inquiry(client, token: str, inquiry_id: str) -> str:
    send_response = await client.post(f"/api/v1/inquiries/{inquiry_id}/send", json={}, headers=_auth_headers(token))
    assert send_response.status_code == 200
    public_token = send_response.json()["public_token"]
    accept_response = await client.post(f"/api/v1/public/inquiries/{public_token}/accept", json={})
    assert accept_response.status_code == 200
    return public_token


@pytest.fixture(autouse=True)
def stub_invoice_pdf(monkeypatch):
    monkeypatch.setattr(InvoicePDFService, "generate_invoice_pdf", lambda self, **_: b"%PDF-1.4\n% Spendly invoice\n")


@pytest.mark.asyncio
async def test_create_invoice_with_mixed_vat_rates_computes_totals(client):
    _, token = await _register_and_authenticate(client, f"invoice-mixed-{uuid.uuid4().hex[:8]}@example.com")
    customer_id = await _create_customer(client, token)

    response = await client.post(
        "/api/v1/invoices",
        json={
            "customer_id": customer_id,
            "inquiry_id": None,
            "due_at": "2026-05-24",
            "currency": "EUR",
            "reference": "PO-2026-42",
            "line_items": [
                {"description": "Consulting hours", "quantity": 10, "unit_price": 120.0, "vat_rate": 23.0},
                {"description": "Travel expenses", "quantity": 1, "unit_price": 50.0, "vat_rate": 13.5},
            ],
        },
        headers=_auth_headers(token),
    )

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "draft"
    assert body["invoice_number"] is None
    assert body["subtotal"] == pytest.approx(1250.0)
    assert body["vat_total"] == pytest.approx(282.75)
    assert body["total"] == pytest.approx(1532.75)
    assert body["vat_breakdown"] == [
        {"rate": 13.5, "net": 50.0, "vat": 6.75},
        {"rate": 23.0, "net": 1200.0, "vat": 276.0},
    ]


@pytest.mark.asyncio
async def test_issue_assigns_sequential_numbers_per_year(client):
    _, token = await _register_and_authenticate(client, f"invoice-seq-{uuid.uuid4().hex[:8]}@example.com")
    customer_id = await _create_customer(client, token)
    payload = {
        "customer_id": customer_id,
        "inquiry_id": None,
        "due_at": date.today().isoformat(),
        "currency": "EUR",
        "line_items": [{"description": "Labour", "quantity": 2, "unit_price": 100.0, "vat_rate": 23.0}],
    }

    first_create = await client.post("/api/v1/invoices", json=payload, headers=_auth_headers(token))
    second_create = await client.post("/api/v1/invoices", json=payload, headers=_auth_headers(token))
    first_id = first_create.json()["id"]
    second_id = second_create.json()["id"]

    first_issue = await client.post(f"/api/v1/invoices/{first_id}/issue", json={}, headers=_auth_headers(token))
    second_issue = await client.post(f"/api/v1/invoices/{second_id}/issue", json={}, headers=_auth_headers(token))

    year = date.today().year
    assert first_issue.status_code == 200
    assert second_issue.status_code == 200
    assert first_issue.json()["invoice_number"] == f"INV-{year}-0001"
    assert second_issue.json()["invoice_number"] == f"INV-{year}-0002"


@pytest.mark.asyncio
async def test_parallel_issue_is_documented_but_skipped_for_sqlite():
    pytest.skip("SQLite test database cannot reliably simulate invoice numbering race conditions.")


@pytest.mark.asyncio
async def test_no_vat_user_cannot_submit_non_zero_vat(client):
    _, token = await _register_and_authenticate(
        client,
        f"invoice-novat-{uuid.uuid4().hex[:8]}@example.com",
        role="self_employed_no_vat",
    )
    customer_id = await _create_customer(client, token)

    response = await client.post(
        "/api/v1/invoices",
        json={
            "customer_id": customer_id,
            "inquiry_id": None,
            "due_at": "2026-05-24",
            "line_items": [{"description": "Work", "quantity": 1, "unit_price": 100.0, "vat_rate": 23.0}],
        },
        headers=_auth_headers(token),
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "This user profile cannot apply VAT to invoices."


@pytest.mark.asyncio
async def test_update_issued_invoice_returns_400(client):
    _, token = await _register_and_authenticate(client, f"invoice-update-{uuid.uuid4().hex[:8]}@example.com")
    customer_id = await _create_customer(client, token)
    create_response = await client.post(
        "/api/v1/invoices",
        json={
            "customer_id": customer_id,
            "inquiry_id": None,
            "due_at": "2026-05-24",
            "line_items": [{"description": "Work", "quantity": 1, "unit_price": 200.0, "vat_rate": 23.0}],
        },
        headers=_auth_headers(token),
    )
    invoice_id = create_response.json()["id"]
    await client.post(f"/api/v1/invoices/{invoice_id}/issue", json={}, headers=_auth_headers(token))

    response = await client.put(
        f"/api/v1/invoices/{invoice_id}",
        json={"reference": "UPDATED"},
        headers=_auth_headers(token),
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "cannot update issued invoice"


@pytest.mark.asyncio
async def test_inquiry_linkage_rules_and_auto_transition(client):
    _, token = await _register_and_authenticate(client, f"invoice-inquiry-{uuid.uuid4().hex[:8]}@example.com")
    customer_id = await _create_customer(client, token)

    draft_inquiry_id = await _create_inquiry(client, token, customer_id)
    invalid = await client.post(
        "/api/v1/invoices",
        json={
            "customer_id": customer_id,
            "inquiry_id": draft_inquiry_id,
            "due_at": "2026-05-24",
            "line_items": [{"description": "Deposit", "quantity": 1, "unit_price": 300.0, "vat_rate": 23.0}],
        },
        headers=_auth_headers(token),
    )
    assert invalid.status_code == 400
    assert invalid.json()["detail"] == "Invoice can only be created for inquiries the client has accepted."

    accepted_inquiry_id = await _create_inquiry(client, token, customer_id)
    await _accept_inquiry(client, token, accepted_inquiry_id)
    accepted_create = await client.post(
        "/api/v1/invoices",
        json={
            "customer_id": customer_id,
            "inquiry_id": accepted_inquiry_id,
            "due_at": "2026-05-24",
            "line_items": [{"description": "Deposit", "quantity": 1, "unit_price": 300.0, "vat_rate": 23.0}],
        },
        headers=_auth_headers(token),
    )
    assert accepted_create.status_code == 201

    inquiry_detail = await client.get(f"/api/v1/inquiries/{accepted_inquiry_id}", headers=_auth_headers(token))
    assert inquiry_detail.status_code == 200
    assert inquiry_detail.json()["status"] == "accepted"

    issue_response = await client.post(
        f"/api/v1/invoices/{accepted_create.json()['id']}/issue",
        json={},
        headers=_auth_headers(token),
    )
    assert issue_response.status_code == 200

    inquiry_after_issue = await client.get(f"/api/v1/inquiries/{accepted_inquiry_id}", headers=_auth_headers(token))
    assert inquiry_after_issue.status_code == 200
    assert inquiry_after_issue.json()["status"] == "invoiced"

    staged_create = await client.post(
        "/api/v1/invoices",
        json={
            "customer_id": customer_id,
            "inquiry_id": accepted_inquiry_id,
            "due_at": "2026-06-24",
            "line_items": [{"description": "Stage 2", "quantity": 1, "unit_price": 450.0, "vat_rate": 13.5}],
        },
        headers=_auth_headers(token),
    )
    assert staged_create.status_code == 201
    assert staged_create.json()["inquiry_id"] == accepted_inquiry_id


@pytest.mark.asyncio
async def test_standalone_invoice_and_pdf_download(client):
    _, token = await _register_and_authenticate(client, f"invoice-standalone-{uuid.uuid4().hex[:8]}@example.com")
    customer_id = await _create_customer(client, token)

    create_response = await client.post(
        "/api/v1/invoices",
        json={
            "customer_id": customer_id,
            "inquiry_id": None,
            "due_at": "2026-05-24",
            "line_items": [{"description": "Emergency call-out", "quantity": 1, "unit_price": 180.0, "vat_rate": 13.5}],
        },
        headers=_auth_headers(token),
    )
    assert create_response.status_code == 201
    invoice_id = create_response.json()["id"]
    assert create_response.json()["inquiry_id"] is None

    pdf_response = await client.get(f"/api/v1/invoices/{invoice_id}/pdf", headers=_auth_headers(token))
    assert pdf_response.status_code == 200
    assert pdf_response.headers["content-type"] == "application/pdf"
    assert pdf_response.content.startswith(b"%PDF-1.4")