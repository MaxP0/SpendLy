"""Seed demo data for the Spendly application.

Creates one demo user (self_employed_vat) with ~6 months of realistic data:
  - 3 customers (Irish-flavoured names)
  - 8 inquiries (various statuses)
  - 12 invoices (7 paid / 3 overdue / 2 draft) with line items
  - 20 expenses with receipts
  - 40 bank transactions (mix of reconciled + unmatched)

Idempotent: re-running does not duplicate data.

Run:
    python -m app.scripts.seed_demo
"""
from __future__ import annotations

import asyncio
import random
import uuid
from datetime import datetime, timedelta
from typing import List

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import (
    BankTransaction,
    Customer,
    Expense,
    Inquiry,
    InquiryStatus,
    Invoice,
    InvoiceLineItem,
    InvoiceStatus,
    OCRStatus,
    Payment,
    Receipt,
    ReconciledWithType,
    ReconciliationStatus,
    User,
    UserRole,
)


DEMO_EMAIL = "demo@spendly.test"
DEMO_PASSWORD = "Demo1234!"
DEMO_BUSINESS = "Demo Consulting Ltd"

# Deterministic seed so counts/numbers are stable between runs.
random.seed(20260101)


CUSTOMERS = [
    {
        "name": "O'Brien Plumbing Ltd",
        "email": "accounts@obrienplumbing.ie",
        "phone": "+353 1 555 0101",
        "address": "14 Grafton Street, Dublin 2, D02 AB12",
    },
    {
        "name": "Galway Events Co",
        "email": "finance@galwayevents.ie",
        "phone": "+353 91 555 0202",
        "address": "3 Shop Street, Galway, H91 CD34",
    },
    {
        "name": "Kerry Artisan Bakery",
        "email": "hello@kerryartisan.ie",
        "phone": "+353 66 555 0303",
        "address": "22 Main Street, Killarney, V93 EF56",
    },
]

INQUIRY_TITLES = [
    "Website redesign and SEO",
    "Monthly bookkeeping retainer",
    "Q4 tax planning engagement",
    "Event staffing for summer festival",
    "Bakery POS integration",
    "Plumbing fit-out consultation",
    "Brand refresh workshop",
    "VAT return review",
]

EXPENSE_CATEGORIES = [
    "fuel",
    "office-supplies",
    "software",
    "travel",
    "meals",
    "utilities",
]

EXPENSE_MERCHANTS = {
    "fuel": ["Circle K Dublin", "Applegreen M50", "Topaz Galway"],
    "office-supplies": ["Easons", "Viking Direct IE"],
    "software": ["GitHub", "Adobe Ireland", "Atlassian"],
    "travel": ["Irish Rail", "Aircoach", "Bus Eireann"],
    "meals": ["Avoca Cafe", "Insomnia Coffee", "The Bakehouse"],
    "utilities": ["Electric Ireland", "Vodafone Ireland", "Virgin Media IE"],
}


def _months_ago(n: int) -> datetime:
    # Use a stable reference point so seeded dates don't drift each run.
    reference = datetime(2026, 4, 1)
    return reference - timedelta(days=30 * n)


async def _get_or_create_user(session) -> User:
    result = await session.execute(select(User).where(User.email == DEMO_EMAIL))
    existing = result.scalar_one_or_none()
    if existing:
        return existing

    user = User(
        id=str(uuid.uuid4()),
        email=DEMO_EMAIL,
        hashed_password=hash_password(DEMO_PASSWORD),
        role=UserRole.SELF_EMPLOYED_VAT,
        business_name=DEMO_BUSINESS,
        business_address="1 Baggot Street, Dublin 2, D02 XY99",
        gdpr_consent_at=datetime(2025, 10, 1),
    )
    session.add(user)
    await session.flush()
    return user


async def _seed_customers(session, user: User) -> List[Customer]:
    customers: List[Customer] = []
    for data in CUSTOMERS:
        res = await session.execute(
            select(Customer).where(
                Customer.user_id == user.id, Customer.name == data["name"]
            )
        )
        existing = res.scalar_one_or_none()
        if existing:
            customers.append(existing)
            continue
        customer = Customer(
            id=str(uuid.uuid4()),
            user_id=user.id,
            **data,
        )
        session.add(customer)
        customers.append(customer)
    await session.flush()
    return customers


async def _seed_inquiries(
    session, user: User, customers: List[Customer]
) -> List[Inquiry]:
    res = await session.execute(select(Inquiry).where(Inquiry.user_id == user.id))
    if res.scalars().first():
        return list((await session.execute(
            select(Inquiry).where(Inquiry.user_id == user.id)
        )).scalars().all())

    statuses = [
        InquiryStatus.COMPLETED,
        InquiryStatus.COMPLETED,
        InquiryStatus.COMPLETED,
        InquiryStatus.ACTIVE,
        InquiryStatus.ACTIVE,
        InquiryStatus.ACTIVE,
        InquiryStatus.DRAFT,
        InquiryStatus.DRAFT,
    ]
    inquiries: List[Inquiry] = []
    for idx, title in enumerate(INQUIRY_TITLES):
        inquiry = Inquiry(
            id=str(uuid.uuid4()),
            user_id=user.id,
            customer_id=customers[idx % len(customers)].id,
            title=title,
            description=f"Engagement: {title}.",
            status=statuses[idx],
            created_at=_months_ago(6 - (idx % 6)),
        )
        session.add(inquiry)
        inquiries.append(inquiry)
    await session.flush()
    return inquiries


async def _seed_invoices(
    session, user: User, customers: List[Customer], inquiries: List[Inquiry]
) -> List[Invoice]:
    res = await session.execute(select(Invoice).where(Invoice.user_id == user.id))
    if res.scalars().first():
        return list((await session.execute(
            select(Invoice).where(Invoice.user_id == user.id)
        )).scalars().all())

    # Status layout: 7 paid, 3 overdue, 2 draft
    statuses = (
        [InvoiceStatus.PAID] * 7
        + [InvoiceStatus.OVERDUE] * 3
        + [InvoiceStatus.DRAFT] * 2
    )

    invoices: List[Invoice] = []
    year = 2025
    for idx, status in enumerate(statuses, start=1):
        issued_at = _months_ago(6) + timedelta(days=idx * 14)
        due_at = issued_at + timedelta(days=30)
        vat_rate = 23.0 if idx % 3 else 13.5

        line_items_spec = []
        n_lines = random.randint(2, 4)
        for _ in range(n_lines):
            qty = random.choice([1, 2, 5, 10])
            unit_price = round(random.uniform(75, 450), 2)
            net = round(qty * unit_price, 2)
            vat = round(net * (vat_rate / 100), 2)
            line_items_spec.append(
                {
                    "description": "Consulting services",
                    "quantity": float(qty),
                    "unit_price": unit_price,
                    "vat_rate": vat_rate,
                    "line_total_net": net,
                    "line_total_vat": vat,
                }
            )

        subtotal = round(sum(li["line_total_net"] for li in line_items_spec), 2)
        vat_amount = round(sum(li["line_total_vat"] for li in line_items_spec), 2)
        total = round(subtotal + vat_amount, 2)

        invoice = Invoice(
            id=str(uuid.uuid4()),
            user_id=user.id,
            customer_id=customers[idx % len(customers)].id,
            inquiry_id=inquiries[idx % len(inquiries)].id,
            invoice_number=f"INV-{year}-{idx:04d}",
            sequence_year=year,
            sequence_number=idx,
            status=status,
            subtotal=subtotal,
            vat_rate=vat_rate,
            vat_amount=vat_amount,
            total=total,
            issued_at=issued_at if status != InvoiceStatus.DRAFT else None,
            due_at=due_at if status != InvoiceStatus.DRAFT else None,
            created_at=issued_at,
        )
        session.add(invoice)
        await session.flush()

        for spec in line_items_spec:
            session.add(
                InvoiceLineItem(
                    id=str(uuid.uuid4()),
                    invoice_id=invoice.id,
                    **spec,
                )
            )
        invoices.append(invoice)

    await session.flush()
    return invoices


async def _seed_expenses_and_receipts(
    session, user: User, inquiries: List[Inquiry]
) -> List[tuple[Expense, str]]:
    res = await session.execute(select(Expense).where(Expense.user_id == user.id))
    if res.scalars().first():
        existing = (await session.execute(
            select(Expense, Receipt.merchant)
            .join(Receipt, Expense.receipt_id == Receipt.id)
            .where(Expense.user_id == user.id)
        )).all()
        return [(row[0], row[1]) for row in existing]

    expenses: List[tuple[Expense, str]] = []
    for idx in range(20):
        category = EXPENSE_CATEGORIES[idx % len(EXPENSE_CATEGORIES)]
        merchant = random.choice(EXPENSE_MERCHANTS[category])
        date = _months_ago(6) + timedelta(days=idx * 9)
        amount = round(random.uniform(12, 320), 2)
        vat_amount = round(amount * 0.23 / 1.23, 2)

        receipt = Receipt(
            id=str(uuid.uuid4()),
            user_id=user.id,
            inquiry_id=inquiries[idx % len(inquiries)].id if idx % 2 == 0 else None,
            file_path=f"uploads/receipts/demo_{idx:03d}.pdf",
            mime_type="application/pdf",
            ocr_status=OCRStatus.OK,
            ocr_confidence=0.92,
            merchant=merchant,
            date=date,
            amount=amount,
            currency="EUR",
            vat_amount=vat_amount,
            created_at=date,
        )
        session.add(receipt)
        await session.flush()

        expense = Expense(
            id=str(uuid.uuid4()),
            receipt_id=receipt.id,
            user_id=user.id,
            inquiry_id=receipt.inquiry_id,
            amount=amount,
            vat_amount=vat_amount,
            category=category,
            description=f"{category.replace('-', ' ').title()} at {merchant}",
            ml_suggested_category=category,
            ml_confidence=0.88,
            user_confirmed_category=category,
            is_vat_reclaimable=True,
            created_at=date,
        )
        session.add(expense)
        expenses.append((expense, merchant))

    await session.flush()
    return expenses


async def _seed_transactions_and_payments(
    session,
    user: User,
    invoices: List[Invoice],
    expenses: List[tuple[Expense, str]],
    customer_names: dict[str, str],
) -> None:
    res = await session.execute(
        select(BankTransaction).where(BankTransaction.user_id == user.id)
    )
    if res.scalars().first():
        return

    paid_invoices = [inv for inv in invoices if inv.status == InvoiceStatus.PAID]

    transactions: List[BankTransaction] = []

    # 1) Inflow transactions reconciled to paid invoices (7)
    for idx, invoice in enumerate(paid_invoices):
        posted = (invoice.issued_at or _months_ago(5)) + timedelta(days=12)
        tx = BankTransaction(
            id=str(uuid.uuid4()),
            user_id=user.id,
            date=posted,
            amount=invoice.total,
            description=f"Payment for {invoice.invoice_number}",
            counterparty=customer_names.get(invoice.customer_id, "Customer"),
            reconciliation_status=ReconciliationStatus.MATCHED,
            reconciled_with_type=ReconciledWithType.INVOICE,
            reconciled_with_id=invoice.id,
            imported_at=posted,
        )
        session.add(tx)
        await session.flush()
        transactions.append(tx)

        # Payment records (first 5 linked to bank tx, remaining 2 unmatched)
        payment = Payment(
            id=str(uuid.uuid4()),
            invoice_id=invoice.id,
            user_id=user.id,
            amount=invoice.total,
            payment_date=posted,
            transaction_id=tx.id if idx < 5 else None,
            created_at=posted,
        )
        session.add(payment)

    # 2) Outflow transactions reconciled to expenses (first 15 expenses)
    for expense, merchant in expenses[:15]:
        posted = expense.created_at
        tx = BankTransaction(
            id=str(uuid.uuid4()),
            user_id=user.id,
            date=posted,
            amount=-expense.amount,
            description=expense.description,
            counterparty=merchant,
            reconciliation_status=ReconciliationStatus.MATCHED,
            reconciled_with_type=ReconciledWithType.EXPENSE,
            reconciled_with_id=expense.id,
            imported_at=posted,
        )
        session.add(tx)
        transactions.append(tx)

    # 3) Top up to exactly 40 transactions with unmatched ones
    remaining = 40 - len(transactions)
    for i in range(remaining):
        posted = _months_ago(5) + timedelta(days=i * 4)
        amount = round(random.choice([-1, 1]) * random.uniform(15, 260), 2)
        tx = BankTransaction(
            id=str(uuid.uuid4()),
            user_id=user.id,
            date=posted,
            amount=amount,
            description="ATM withdrawal" if amount < 0 else "Unmatched deposit",
            counterparty=None,
            reconciliation_status=ReconciliationStatus.UNMATCHED,
            imported_at=posted,
        )
        session.add(tx)
        transactions.append(tx)

    await session.flush()


async def seed() -> None:
    async with SessionLocal() as session:
        user = await _get_or_create_user(session)
        customers = await _seed_customers(session, user)
        customer_names = {c.id: c.name for c in customers}
        inquiries = await _seed_inquiries(session, user, customers)
        invoices = await _seed_invoices(session, user, customers, inquiries)
        expenses = await _seed_expenses_and_receipts(session, user, inquiries)
        await _seed_transactions_and_payments(
            session, user, invoices, expenses, customer_names
        )
        await session.commit()
    print(
        f"Seed complete: user={DEMO_EMAIL}, customers=3, inquiries=8, "
        f"invoices=12 (7 paid / 3 overdue / 2 draft), expenses=20, "
        f"bank_transactions=40."
    )


if __name__ == "__main__":
    asyncio.run(seed())
