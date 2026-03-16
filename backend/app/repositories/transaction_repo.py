from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.transaction import BankTransaction
from typing import Optional, List


class TransactionRepository:
    """Repository for BankTransaction model operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, transaction_id: str) -> Optional[BankTransaction]:
        """Get transaction by ID."""
        result = await self.db.execute(select(BankTransaction).where(BankTransaction.id == transaction_id))
        return result.scalar_one_or_none()
    
    async def get_by_user(self, user_id: str) -> List[BankTransaction]:
        """Get all transactions for a user."""
        result = await self.db.execute(select(BankTransaction).where(BankTransaction.user_id == user_id))
        return result.scalars().all()
    
    async def create(self, transaction: BankTransaction) -> BankTransaction:
        """Create a new transaction."""
        self.db.add(transaction)
        await self.db.commit()
        await self.db.refresh(transaction)
        return transaction
    
    async def update(self, transaction_id: str, **kwargs) -> Optional[BankTransaction]:
        """Update transaction by ID."""
        transaction = await self.get_by_id(transaction_id)
        if transaction:
            for key, value in kwargs.items():
                if hasattr(transaction, key):
                    setattr(transaction, key, value)
            await self.db.commit()
            await self.db.refresh(transaction)
        return transaction
    
    async def delete(self, transaction_id: str) -> bool:
        """Delete transaction by ID."""
        transaction = await self.get_by_id(transaction_id)
        if transaction:
            await self.db.delete(transaction)
            await self.db.commit()
            return True
        return False
