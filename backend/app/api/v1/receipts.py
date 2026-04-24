from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.receipt_service import ReceiptService
from app.schemas.receipt_schema import ReceiptCreate, ReceiptUpdate, ReceiptResponse
from app.api.v1.deps import get_current_user

router = APIRouter(prefix="/receipts", tags=["receipts"])


@router.post("", response_model=ReceiptResponse)
async def create_receipt(
    request: ReceiptCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new receipt."""
    try:
        service = ReceiptService(db)
        receipt = await service.create_receipt(
            user_id=current_user["user_id"],
            file_path="placeholder_path",
            inquiry_id=request.inquiry_id,
            merchant=request.merchant,
            date=request.date,
            amount=request.amount,
            currency=request.currency,
            vat_amount=request.vat_amount,
        )
        return receipt
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/upload")
async def upload_receipt(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a receipt file."""
    raise HTTPException(
        status_code=501,
        detail="Receipt upload/OCR pipeline is not implemented yet and will be added in a later prompt.",
    )


@router.get("")
async def list_receipts(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all receipts for the current user."""
    service = ReceiptService(db)
    receipts = await service.list_user_receipts(current_user["user_id"])
    return receipts


@router.get("/{receipt_id}", response_model=ReceiptResponse)
async def get_receipt(
    receipt_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific receipt."""
    try:
        service = ReceiptService(db)
        receipt = await service.get_receipt(receipt_id)
        if receipt.user_id != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        return receipt
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{receipt_id}", response_model=ReceiptResponse)
async def update_receipt(
    receipt_id: str,
    request: ReceiptUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a receipt."""
    try:
        service = ReceiptService(db)
        receipt = await service.get_receipt(receipt_id)
        if receipt.user_id != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        receipt = await service.update_receipt(
            receipt_id,
            **request.dict(exclude_unset=True)
        )
        return receipt
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
