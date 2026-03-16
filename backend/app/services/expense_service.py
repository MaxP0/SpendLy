from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.expense_repo import ExpenseRepository
from app.models.expense import Expense
import uuid


class ExpenseService:
    """Service for expense-related business logic."""
    
    def __init__(self, db: AsyncSession):
        self.repository = ExpenseRepository(db)
        self.db = db
    
    async def create_expense(
        self,
        receipt_id: str,
        user_id: str,
        amount: float,
        inquiry_id: str = None,
        vat_amount: float = None,
        is_vat_reclaimable: bool = False,
    ) -> Expense:
        """Create a new expense."""
        expense = Expense(
            id=str(uuid.uuid4()),
            receipt_id=receipt_id,
            user_id=user_id,
            inquiry_id=inquiry_id,
            amount=amount,
            vat_amount=vat_amount,
            is_vat_reclaimable=is_vat_reclaimable,
        )
        return await self.repository.create(expense)
    
    async def get_expense(self, expense_id: str) -> Expense:
        """Get expense by ID."""
        expense = await self.repository.get_by_id(expense_id)
        if not expense:
            raise ValueError("Expense not found")
        return expense
    
    async def list_user_expenses(self, user_id: str) -> list:
        """List all expenses for a user."""
        return await self.repository.get_by_user(user_id)
    
    async def update_expense(self, expense_id: str, **updates) -> Expense:
        """Update expense."""
        expense = await self.repository.update(expense_id, **updates)
        if not expense:
            raise ValueError("Expense not found")
        return expense
