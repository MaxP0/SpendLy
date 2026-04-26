from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer
from app.models.invoice import Invoice
from app.repositories.customer_repo import CustomerRepository


class CustomerService:
    """Business logic for customer CRUD operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = CustomerRepository(db)

    async def create(
        self,
        *,
        user_id: str,
        name: str,
        email: str | None = None,
        phone: str | None = None,
        address: str | None = None,
    ) -> Customer:
        customer = Customer(
            user_id=user_id,
            name=name,
            email=email,
            phone=phone,
            address=address,
        )
        return await self.repository.create(customer)

    async def get(self, *, user_id: str, customer_id: str) -> Customer | None:
        customer = await self.repository.get_by_id(customer_id)
        if customer is None or customer.user_id != user_id:
            return None
        return customer

    async def list_for_user(
        self,
        *,
        user_id: str,
        limit: int,
        offset: int,
        search: str | None = None,
    ) -> tuple[list[Customer], int]:
        filters = [Customer.user_id == user_id]
        if search:
            filters.append(func.lower(Customer.name).contains(search.strip().lower()))

        total = await self.db.scalar(select(func.count(Customer.id)).where(*filters))
        result = await self.db.execute(
            select(Customer)
            .where(*filters)
            .order_by(Customer.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all()), int(total or 0)

    async def update(self, *, user_id: str, customer_id: str, **updates) -> Customer | None:
        customer = await self.get(user_id=user_id, customer_id=customer_id)
        if customer is None:
            return None

        payload = {key: value for key, value in updates.items() if value is not None}
        if not payload:
            return customer

        return await self.repository.update(customer_id, **payload)

    async def delete(self, *, user_id: str, customer_id: str) -> bool:
        customer = await self.get(user_id=user_id, customer_id=customer_id)
        if customer is None:
            return False

        invoice_count = await self.db.scalar(
            select(func.count(Invoice.id)).where(Invoice.customer_id == customer.id)
        )
        if invoice_count:
            raise ValueError("Customer has invoices")

        return await self.repository.delete(customer.id)