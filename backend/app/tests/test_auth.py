from datetime import timedelta
from uuid import uuid4

import pytest
from sqlalchemy import select

from app.core.security import create_access_token, decode_token
from app.models import AuditLog, RefreshToken


def _register_payload(email: str) -> dict[str, str]:
    return {
        "email": email,
        "password": "Strong123",
        "role": "self_employed_vat",
        "business_name": "Maks Consulting",
        "business_address": "12 Grafton St, Dublin 2",
    }


@pytest.mark.asyncio
async def test_register_happy_path_returns_tokens_and_me(client):
    email = f"maks-{uuid4().hex[:8]}@example.com"
    response = await client.post("/api/v1/auth/register", json=_register_payload(email))

    assert response.status_code == 201
    body = response.json()
    assert body["token_type"] == "bearer"
    assert set(body.keys()) == {"access_token", "refresh_token", "token_type", "user"}
    assert body["user"]["email"] == email
    assert body["user"]["role"] == "self_employed_vat"
    assert body["user"]["business_name"] == "Maks Consulting"

    me_response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {body['access_token']}"},
    )
    assert me_response.status_code == 200
    me_body = me_response.json()
    assert me_body["email"] == email
    assert me_body["business_address"] == "12 Grafton St, Dublin 2"
    assert me_body["gdpr_consent_at"] is None


@pytest.mark.asyncio
async def test_login_happy_path_returns_tokens(client):
    email = f"maks-{uuid4().hex[:8]}@example.com"
    await client.post("/api/v1/auth/register", json=_register_payload(email))

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Strong123"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["user"]["email"] == email
    assert body["user"]["business_name"] == "Maks Consulting"
    assert body["access_token"]
    assert body["refresh_token"]


@pytest.mark.asyncio
async def test_login_wrong_password_returns_401(client):
    email = f"maks-{uuid4().hex[:8]}@example.com"
    await client.post("/api/v1/auth/register", json=_register_payload(email))

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Wrong123"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


@pytest.mark.asyncio
async def test_protected_endpoint_without_token_and_expired_token_returns_401(client):
    unauthenticated_response = await client.get("/api/v1/auth/me")
    assert unauthenticated_response.status_code == 401

    email = f"maks-{uuid4().hex[:8]}@example.com"
    register_response = await client.post("/api/v1/auth/register", json=_register_payload(email))
    user_id = register_response.json()["user"]["id"]

    expired_token = create_access_token(
        user_id=user_id,
        role="self_employed_vat",
        expires_delta=timedelta(minutes=-1),
    )

    expired_response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert expired_response.status_code == 401
    assert expired_response.json()["detail"] == "Token expired"


@pytest.mark.asyncio
async def test_refresh_flow_returns_new_access_token(client):
    email = f"maks-{uuid4().hex[:8]}@example.com"
    register_response = await client.post("/api/v1/auth/register", json=_register_payload(email))
    refresh_token = register_response.json()["refresh_token"]

    refresh_response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )

    assert refresh_response.status_code == 200
    body = refresh_response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


@pytest.mark.asyncio
async def test_logout_revokes_refresh_token_and_records_audit_logs(client, test_db_session):
    email = f"maks-{uuid4().hex[:8]}@example.com"
    register_response = await client.post("/api/v1/auth/register", json=_register_payload(email))
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Strong123"},
    )

    login_body = login_response.json()
    logout_response = await client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {login_body['access_token']}"},
    )
    assert logout_response.status_code == 204

    revoked_refresh_response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": login_body["refresh_token"]},
    )
    assert revoked_refresh_response.status_code == 401
    assert revoked_refresh_response.json()["detail"] == "Refresh token revoked or expired"

    result = await test_db_session.execute(select(AuditLog.action))
    actions = [row[0] for row in result.all()]
    assert "auth.register" in actions
    assert "auth.login" in actions
    assert "auth.logout" in actions

    refresh_claims = decode_token(login_body["refresh_token"], expected_type="refresh")
    token_result = await test_db_session.execute(select(RefreshToken).where(RefreshToken.jti == refresh_claims.jti))
    stored_token = token_result.scalar_one_or_none()
    assert stored_token is not None
    assert stored_token.revoked is True