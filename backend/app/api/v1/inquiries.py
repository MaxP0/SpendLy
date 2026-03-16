from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.inquiry_service import InquiryService
from app.schemas.inquiry_schema import InquiryCreate, InquiryUpdate, InquiryResponse
from app.api.v1.deps import get_current_user

router = APIRouter(prefix="/inquiries", tags=["inquiries"])


@router.post("", response_model=InquiryResponse)
async def create_inquiry(
    request: InquiryCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new inquiry."""
    try:
        service = InquiryService(db)
        inquiry = await service.create_inquiry(
            user_id=current_user["user_id"],
            customer_id=request.customer_id,
            title=request.title,
            description=request.description,
        )
        return inquiry
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("")
async def list_inquiries(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all inquiries for the current user."""
    service = InquiryService(db)
    inquiries = await service.list_user_inquiries(current_user["user_id"])
    return inquiries


@router.get("/{inquiry_id}", response_model=InquiryResponse)
async def get_inquiry(
    inquiry_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific inquiry."""
    try:
        service = InquiryService(db)
        inquiry = await service.get_inquiry(inquiry_id)
        if inquiry.user_id != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        return inquiry
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{inquiry_id}", response_model=InquiryResponse)
async def update_inquiry(
    inquiry_id: str,
    request: InquiryUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an inquiry."""
    try:
        service = InquiryService(db)
        inquiry = await service.get_inquiry(inquiry_id)
        if inquiry.user_id != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        inquiry = await service.update_inquiry(
            inquiry_id,
            **request.dict(exclude_unset=True)
        )
        return inquiry
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
