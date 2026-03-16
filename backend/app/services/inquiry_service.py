from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.inquiry_repo import InquiryRepository
from app.models.inquiry import Inquiry
import uuid


class InquiryService:
    """Service for inquiry-related business logic."""
    
    def __init__(self, db: AsyncSession):
        self.repository = InquiryRepository(db)
        self.db = db
    
    async def create_inquiry(
        self,
        user_id: str,
        customer_id: str,
        title: str,
        description: str = None,
    ) -> Inquiry:
        """Create a new inquiry."""
        inquiry = Inquiry(
            id=str(uuid.uuid4()),
            user_id=user_id,
            customer_id=customer_id,
            title=title,
            description=description,
        )
        return await self.repository.create(inquiry)
    
    async def get_inquiry(self, inquiry_id: str) -> Inquiry:
        """Get inquiry by ID."""
        inquiry = await self.repository.get_by_id(inquiry_id)
        if not inquiry:
            raise ValueError("Inquiry not found")
        return inquiry
    
    async def list_user_inquiries(self, user_id: str) -> list:
        """List all inquiries for a user."""
        return await self.repository.get_by_user(user_id)
    
    async def update_inquiry(self, inquiry_id: str, **updates) -> Inquiry:
        """Update inquiry."""
        inquiry = await self.repository.update(inquiry_id, **updates)
        if not inquiry:
            raise ValueError("Inquiry not found")
        return inquiry
