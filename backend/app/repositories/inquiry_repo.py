from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.inquiry import Inquiry
from typing import Optional, List


class InquiryRepository:
    """Repository for Inquiry model operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, inquiry_id: str) -> Optional[Inquiry]:
        """Get inquiry by ID."""
        result = await self.db.execute(select(Inquiry).where(Inquiry.id == inquiry_id))
        return result.scalar_one_or_none()
    
    async def get_by_user(self, user_id: str) -> List[Inquiry]:
        """Get all inquiries for a user."""
        result = await self.db.execute(select(Inquiry).where(Inquiry.user_id == user_id))
        return result.scalars().all()
    
    async def get_by_customer(self, customer_id: str) -> List[Inquiry]:
        """Get all inquiries for a customer."""
        result = await self.db.execute(select(Inquiry).where(Inquiry.customer_id == customer_id))
        return result.scalars().all()
    
    async def create(self, inquiry: Inquiry) -> Inquiry:
        """Create a new inquiry."""
        self.db.add(inquiry)
        await self.db.commit()
        await self.db.refresh(inquiry)
        return inquiry
    
    async def update(self, inquiry_id: str, **kwargs) -> Optional[Inquiry]:
        """Update inquiry by ID."""
        inquiry = await self.get_by_id(inquiry_id)
        if inquiry:
            for key, value in kwargs.items():
                if hasattr(inquiry, key):
                    setattr(inquiry, key, value)
            await self.db.commit()
            await self.db.refresh(inquiry)
        return inquiry
    
    async def delete(self, inquiry_id: str) -> bool:
        """Delete inquiry by ID."""
        inquiry = await self.get_by_id(inquiry_id)
        if inquiry:
            await self.db.delete(inquiry)
            await self.db.commit()
            return True
        return False
