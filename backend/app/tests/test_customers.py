from __future__ import annotations

import uuid

import pytest
from sqlalchemy import select

from app.models import Customer, Invoice, InvoiceStatus


def _register_payload(email: str) -> dict[str, str]:
    return {
        "email": email,
        "password": "Strong123",
        "role": "self_employed_vat",
        "business_name": "Test Business",
        "business_address": "12 Grafton St, Dublin 2",
    }


async def _register_and_authenticate(client, email: str) -> tuple[str, str]:
    response = await client.post("/api/v1/auth/register", json=_register_payload(email))
    body = response.json()
    return body["user"]["id"], body["access_token"]


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_create_customer_returns_201(client):
    _, access_token = await _register_and_authenticate(client, f"customers-{uuid.uuid4().hex[:8]}@example.com")

    response = await client.post(
        "/api/v1/customers",
        json={
            "name": "O'Brien Plumbing Ltd",
            "email": "invoices@obrien.ie",
            "phone": "+353 1 234 5678",
            "address": "5 Camden St, Dublin 2",
        },
        headers=_auth_headers(access_token),
    )

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "O'Brien Plumbing Ltd"
    assert body["email"] == "invoices@obrien.ie"
    assert body["phone"] == "+353 1 234 5678"
    assert body["address"] == "5 Camden St, Dublin 2"
    assert body["id"]
    assert body["created_at"]
    assert body["updated_at"]


@pytest.mark.asyncio
async def test_list_customers_returns_only_current_users_customers(client):
    _, first_token = await _register_and_authenticate(client, f"first-{uuid.uuid4().hex[:8]}@example.com")
    _, second_token = await _register_and_authenticate(client, f"second-{uuid.uuid4().hex[:8]}@example.com")

    await client.post(
        "/api/v1/customers",
        json={"name": "First User Customer"},
        headers=_auth_headers(first_token),
    )
    await client.post(
        "/api/v1/customers",
        json={"name": "Second User Customer"},
        headers=_auth_headers(second_token),
    )

    response = await client.get("/api/v1/customers", headers=_auth_headers(first_token))

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert len(body["items"]) == 1
    assert body["items"][0]["name"] == "First User Customer"


@pytest.mark.asyncio
async def test_update_customer_returns_200(client):
    _, access_token = await _register_and_authenticate(client, f"update-{uuid.uuid4().hex[:8]}@example.com")
    create_response = await client.post(
        "/api/v1/customers",
        json={"name": "Original Name"},
        headers=_auth_headers(access_token),
    )
    customer_id = create_response.json()["id"]

    response = await client.put(
        f"/api/v1/customers/{customer_id}",
        json={"name": "Updated Name", "address": "1 Dame St, Dublin"},
        headers=_auth_headers(access_token),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Updated Name"
    assert body["address"] == "1 Dame St, Dublin"


@pytest.mark.asyncio
async def test_delete_customer_without_invoices_returns_204(client):
    _, access_token = await _register_and_authenticate(client, f"delete-{uuid.uuid4().hex[:8]}@example.com")
    create_response = await client.post(
        "/api/v1/customers",
        json={"name": "Delete Me"},
        headers=_auth_headers(access_token),
    )
    customer_id = create_response.json()["id"]

    response = await client.delete(
        f"/api/v1/customers/{customer_id}",
        headers=_auth_headers(access_token),
    )

    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_customer_with_invoices_returns_409(client, test_db_session):
    user_id, access_token = await _register_and_authenticate(client, f"conflict-{uuid.uuid4().hex[:8]}@example.com")
    create_response = await client.post(
        "/api/v1/customers",
        json={"name": "Has Invoice"},
        headers=_auth_headers(access_token),
    )
    customer_id = create_response.json()["id"]

    customer = await test_db_session.scalar(select(Customer).where(Customer.id == customer_id))
    test_db_session.add(
        Invoice(
            id=str(uuid.uuid4()),
            user_id=user_id,
            customer_id=customer_id,
            inquiry_id=None,
            customer_name_snapshot="Has Invoice",
            invoice_number="INV-2026-0001",
            sequence_year=2026,
            sequence_number=1,
            status=InvoiceStatus.DRAFT,
            subtotal=100.0,
            vat_total=23.0,
            total=123.0,
            currency="EUR",
        )
    )
    await test_db_session.commit()

    response = await client.delete(
        f"/api/v1/customers/{customer_id}",
        headers=_auth_headers(access_token),
    )

    assert customer is not None
    assert response.status_code == 409
    assert response.json()["detail"] == "Customer has invoices"