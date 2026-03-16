from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.invoice_service import InvoiceService
from app.schemas.invoice_schema import InvoiceCreate, InvoiceUpdate, InvoiceResponse
from app.api.v1.deps import get_current_user

router = APIRouter(prefix="/invoices", tags=["invoices"])


@router.post("", response_model=InvoiceResponse)
async def create_invoice(
    request: InvoiceCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new invoice."""
    try:
        service = InvoiceService(db)
        invoice = await service.create_invoice(
            user_id=current_user["user_id"],
            customer_id=request.customer_id,
            subtotal=request.subtotal,
            vat_rate=request.vat_rate,
            inquiry_id=request.inquiry_id,
            due_at=request.due_at,
        )
        return invoice
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("")
async def list_invoices(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all invoices for the current user."""
    service = InvoiceService(db)
    invoices = await service.list_user_invoices(current_user["user_id"])
    return invoices


@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific invoice."""
    try:
        service = InvoiceService(db)
        invoice = await service.get_invoice(invoice_id)
        if invoice.user_id != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        return invoice
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(
    invoice_id: str,
    request: InvoiceUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an invoice."""
    try:
        service = InvoiceService(db)
        invoice = await service.get_invoice(invoice_id)
        if invoice.user_id != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        invoice = await service.update_invoice(
            invoice_id,
            **request.dict(exclude_unset=True)
        )
        return invoice
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
