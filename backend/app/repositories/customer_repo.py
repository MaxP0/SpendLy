from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.customer import Customer
from typing import Optional, List


class CustomerRepository:
    """Repository for Customer model operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, customer_id: str) -> Optional[Customer]:
        """Get customer by ID."""
        result = await self.db.execute(select(Customer).where(Customer.id == customer_id))
        return result.scalar_one_or_none()
    
    async def get_by_user(self, user_id: str) -> List[Customer]:
        """Get all customers for a user."""
        result = await self.db.execute(select(Customer).where(Customer.user_id == user_id))
        return result.scalars().all()
    
    async def create(self, customer: Customer) -> Customer:
        """Create a new customer."""
        self.db.add(customer)
        await self.db.commit()
        await self.db.refresh(customer)
        return customer
    
    async def update(self, customer_id: str, **kwargs) -> Optional[Customer]:
        """Update customer by ID."""
        customer = await self.get_by_id(customer_id)
        if customer:
            for key, value in kwargs.items():
                if hasattr(customer, key):
                    setattr(customer, key, value)
            await self.db.commit()
            await self.db.refresh(customer)
        return customer
    
    async def delete(self, customer_id: str) -> bool:
        """Delete customer by ID."""
        customer = await self.get_by_id(customer_id)
        if customer:
            await self.db.delete(customer)
            await self.db.commit()
            return True
        return False
