from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.transaction_repo import TransactionRepository
from app.models.transaction import BankTransaction
import uuid
from datetime import datetime


class TransactionService:
    """Service for bank transaction-related business logic."""
    
    def __init__(self, db: AsyncSession):
        self.repository = TransactionRepository(db)
        self.db = db
    
    async def import_transaction(
        self,
        user_id: str,
        date: datetime,
        amount: float,
        description: str = None,
    ) -> BankTransaction:
        """Import a bank transaction."""
        transaction = BankTransaction(
            id=str(uuid.uuid4()),
            user_id=user_id,
            date=date,
            amount=amount,
            description=description,
        )
        return await self.repository.create(transaction)
    
    async def get_transaction(self, transaction_id: str) -> BankTransaction:
        """Get transaction by ID."""
        transaction = await self.repository.get_by_id(transaction_id)
        if not transaction:
            raise ValueError("Transaction not found")
        return transaction
    
    async def list_user_transactions(self, user_id: str) -> list:
        """List all transactions for a user."""
        return await self.repository.get_by_user(user_id)
    
    async def reconcile_transaction(
        self,
        transaction_id: str,
        status: str,
    ) -> BankTransaction:
        """Update reconciliation status of a transaction."""
        transaction = await self.repository.update(transaction_id, reconciliation_status=status)
        if not transaction:
            raise ValueError("Transaction not found")
        return transaction
