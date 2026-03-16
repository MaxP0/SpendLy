from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.receipt import Receipt
from typing import Optional, List


class ReceiptRepository:
    """Repository for Receipt model operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, receipt_id: str) -> Optional[Receipt]:
        """Get receipt by ID."""
        result = await self.db.execute(select(Receipt).where(Receipt.id == receipt_id))
        return result.scalar_one_or_none()
    
    async def get_by_user(self, user_id: str) -> List[Receipt]:
        """Get all receipts for a user."""
        result = await self.db.execute(select(Receipt).where(Receipt.user_id == user_id))
        return result.scalars().all()
    
    async def get_by_inquiry(self, inquiry_id: str) -> List[Receipt]:
        """Get all receipts for an inquiry."""
        result = await self.db.execute(select(Receipt).where(Receipt.inquiry_id == inquiry_id))
        return result.scalars().all()
    
    async def create(self, receipt: Receipt) -> Receipt:
        """Create a new receipt."""
        self.db.add(receipt)
        await self.db.commit()
        await self.db.refresh(receipt)
        return receipt
    
    async def update(self, receipt_id: str, **kwargs) -> Optional[Receipt]:
        """Update receipt by ID."""
        receipt = await self.get_by_id(receipt_id)
        if receipt:
            for key, value in kwargs.items():
                if hasattr(receipt, key):
                    setattr(receipt, key, value)
            await self.db.commit()
            await self.db.refresh(receipt)
        return receipt
    
    async def delete(self, receipt_id: str) -> bool:
        """Delete receipt by ID."""
        receipt = await self.get_by_id(receipt_id)
        if receipt:
            await self.db.delete(receipt)
            await self.db.commit()
            return True
        return False
