from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.expense import Expense
from typing import Optional, List


class ExpenseRepository:
    """Repository for Expense model operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, expense_id: str) -> Optional[Expense]:
        """Get expense by ID."""
        result = await self.db.execute(select(Expense).where(Expense.id == expense_id))
        return result.scalar_one_or_none()
    
    async def get_by_user(self, user_id: str) -> List[Expense]:
        """Get all expenses for a user."""
        result = await self.db.execute(select(Expense).where(Expense.user_id == user_id))
        return result.scalars().all()
    
    async def get_by_receipt(self, receipt_id: str) -> List[Expense]:
        """Get all expenses for a receipt."""
        result = await self.db.execute(select(Expense).where(Expense.receipt_id == receipt_id))
        return result.scalars().all()
    
    async def create(self, expense: Expense) -> Expense:
        """Create a new expense."""
        self.db.add(expense)
        await self.db.commit()
        await self.db.refresh(expense)
        return expense
    
    async def update(self, expense_id: str, **kwargs) -> Optional[Expense]:
        """Update expense by ID."""
        expense = await self.get_by_id(expense_id)
        if expense:
            for key, value in kwargs.items():
                if hasattr(expense, key):
                    setattr(expense, key, value)
            await self.db.commit()
            await self.db.refresh(expense)
        return expense
    
    async def delete(self, expense_id: str) -> bool:
        """Delete expense by ID."""
        expense = await self.get_by_id(expense_id)
        if expense:
            await self.db.delete(expense)
            await self.db.commit()
            return True
        return False
