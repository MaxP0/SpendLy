"""Tests for invoice model relationships and constraints."""
from __future__ import annotations

import uuid

import pytest
import pytest_asyncio
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.models import (
    Base,
    Customer,
    Invoice,
    InvoiceStatus,
    User,
    UserRole,
)


@pytest_asyncio.fixture()
async def session() -> AsyncSession:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    SessionMaker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with SessionMaker() as s:
        yield s
    await engine.dispose()


async def _make_user_and_customer(session: AsyncSession) -> tuple[User, Customer]:
    user = User(
        id=str(uuid.uuid4()),
        email=f"test-{uuid.uuid4().hex[:8]}@example.com",
        hashed_password="hashed",
        role=UserRole.SELF_EMPLOYED_VAT,
        business_name="Test Co",
    )
    session.add(user)
    await session.flush()

    customer = Customer(
        id=str(uuid.uuid4()),
        user_id=user.id,
        name="Acme Ltd",
    )
    session.add(customer)
    await session.flush()
    return user, customer


@pytest.mark.asyncio
async def test_user_invoice_relationship_navigates_both_ways(session: AsyncSession) -> None:
    user, customer = await _make_user_and_customer(session)

    invoice = Invoice(
        id=str(uuid.uuid4()),
        user_id=user.id,
        customer_id=customer.id,
        customer_name_snapshot=customer.name,
        invoice_number="INV-2025-0001",
        sequence_year=2025,
        sequence_number=1,
        status=InvoiceStatus.DRAFT,
        subtotal=100.0,
        vat_total=23.0,
        total=123.0,
        currency="EUR",
    )
    session.add(invoice)
    await session.commit()

    await session.refresh(user, attribute_names=["invoices"])
    await session.refresh(invoice, attribute_names=["user", "customer"])

    assert invoice in user.invoices
    assert invoice.user.id == user.id
    assert invoice.customer.id == customer.id


@pytest.mark.asyncio
async def test_invoice_number_unique_per_user(session: AsyncSession) -> None:
    user, customer = await _make_user_and_customer(session)

    first = Invoice(
        id=str(uuid.uuid4()),
        user_id=user.id,
        customer_id=customer.id,
        customer_name_snapshot=customer.name,
        invoice_number="INV-2025-0001",
        sequence_year=2025,
        sequence_number=1,
        status=InvoiceStatus.DRAFT,
        subtotal=100.0,
        vat_total=23.0,
        total=123.0,
        currency="EUR",
    )
    session.add(first)
    await session.commit()

    duplicate = Invoice(
        id=str(uuid.uuid4()),
        user_id=user.id,
        customer_id=customer.id,
        customer_name_snapshot=customer.name,
        invoice_number="INV-2025-0001",
        sequence_year=2025,
        sequence_number=2,
        status=InvoiceStatus.DRAFT,
        subtotal=50.0,
        vat_total=11.5,
        total=61.5,
        currency="EUR",
    )
    session.add(duplicate)
    with pytest.raises(IntegrityError):
        await session.commit()
