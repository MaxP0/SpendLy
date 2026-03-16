from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.invoice import Invoice
from typing import Optional, List


class InvoiceRepository:
    """Repository for Invoice model operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, invoice_id: str) -> Optional[Invoice]:
        """Get invoice by ID."""
        result = await self.db.execute(select(Invoice).where(Invoice.id == invoice_id))
        return result.scalar_one_or_none()
    
    async def get_by_number(self, invoice_number: str) -> Optional[Invoice]:
        """Get invoice by number."""
        result = await self.db.execute(select(Invoice).where(Invoice.invoice_number == invoice_number))
        return result.scalar_one_or_none()
    
    async def get_by_user(self, user_id: str) -> List[Invoice]:
        """Get all invoices for a user."""
        result = await self.db.execute(select(Invoice).where(Invoice.user_id == user_id))
        return result.scalars().all()
    
    async def create(self, invoice: Invoice) -> Invoice:
        """Create a new invoice."""
        self.db.add(invoice)
        await self.db.commit()
        await self.db.refresh(invoice)
        return invoice
    
    async def update(self, invoice_id: str, **kwargs) -> Optional[Invoice]:
        """Update invoice by ID."""
        invoice = await self.get_by_id(invoice_id)
        if invoice:
            for key, value in kwargs.items():
                if hasattr(invoice, key):
                    setattr(invoice, key, value)
            await self.db.commit()
            await self.db.refresh(invoice)
        return invoice
    
    async def delete(self, invoice_id: str) -> bool:
        """Delete invoice by ID."""
        invoice = await self.get_by_id(invoice_id)
        if invoice:
            await self.db.delete(invoice)
            await self.db.commit()
            return True
        return False
