from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.receipt_repo import ReceiptRepository
from app.models.receipt import Receipt
import uuid


class ReceiptService:
    """Service for receipt-related business logic."""
    
    def __init__(self, db: AsyncSession):
        self.repository = ReceiptRepository(db)
        self.db = db
    
    async def create_receipt(
        self,
        user_id: str,
        file_path: str,
        inquiry_id: str = None,
        merchant: str = None,
        date = None,
        amount: float = None,
        currency: str = "EUR",
        vat_amount: float = None,
    ) -> Receipt:
        """Create a new receipt."""
        receipt = Receipt(
            id=str(uuid.uuid4()),
            user_id=user_id,
            inquiry_id=inquiry_id,
            file_path=file_path,
            merchant=merchant,
            date=date,
            amount=amount,
            currency=currency,
            vat_amount=vat_amount,
        )
        return await self.repository.create(receipt)
    
    async def get_receipt(self, receipt_id: str) -> Receipt:
        """Get receipt by ID."""
        receipt = await self.repository.get_by_id(receipt_id)
        if not receipt:
            raise ValueError("Receipt not found")
        return receipt
    
    async def list_user_receipts(self, user_id: str) -> list:
        """List all receipts for a user."""
        return await self.repository.get_by_user(user_id)
    
    async def update_receipt(self, receipt_id: str, **updates) -> Receipt:
        """Update receipt."""
        receipt = await self.repository.update(receipt_id, **updates)
        if not receipt:
            raise ValueError("Receipt not found")
        return receipt
