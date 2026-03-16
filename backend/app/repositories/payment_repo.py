from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.payment import Payment
from typing import Optional, List


class PaymentRepository:
    """Repository for Payment model operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, payment_id: str) -> Optional[Payment]:
        """Get payment by ID."""
        result = await self.db.execute(select(Payment).where(Payment.id == payment_id))
        return result.scalar_one_or_none()
    
    async def get_by_invoice(self, invoice_id: str) -> List[Payment]:
        """Get all payments for an invoice."""
        result = await self.db.execute(select(Payment).where(Payment.invoice_id == invoice_id))
        return result.scalars().all()
    
    async def get_by_user(self, user_id: str) -> List[Payment]:
        """Get all payments for a user."""
        result = await self.db.execute(select(Payment).where(Payment.user_id == user_id))
        return result.scalars().all()
    
    async def create(self, payment: Payment) -> Payment:
        """Create a new payment."""
        self.db.add(payment)
        await self.db.commit()
        await self.db.refresh(payment)
        return payment
    
    async def update(self, payment_id: str, **kwargs) -> Optional[Payment]:
        """Update payment by ID."""
        payment = await self.get_by_id(payment_id)
        if payment:
            for key, value in kwargs.items():
                if hasattr(payment, key):
                    setattr(payment, key, value)
            await self.db.commit()
            await self.db.refresh(payment)
        return payment
    
    async def delete(self, payment_id: str) -> bool:
        """Delete payment by ID."""
        payment = await self.get_by_id(payment_id)
        if payment:
            await self.db.delete(payment)
            await self.db.commit()
            return True
        return False
