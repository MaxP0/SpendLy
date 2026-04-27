from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.invoice_service import InvoiceConflictError, InvoiceNotFoundError, InvoiceService, InvoiceValidationError
from app.schemas.invoice_schema import InvoiceCreate, InvoiceIssueRequest, InvoiceListResponse, InvoiceResponse, InvoiceUpdate
from app.api.v1.deps import get_current_user

router = APIRouter(prefix="/invoices", tags=["invoices"])


@router.post("", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    request: InvoiceCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = InvoiceService(db)
        return await service.create_invoice(user=current_user, payload=request)
    except InvoiceValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("", response_model=InvoiceListResponse)
async def list_invoices(
    status_filter: str | None = Query(default=None, alias="status"),
    customer_id: str | None = Query(default=None),
    from_date: date | None = Query(default=None, alias="from"),
    to_date: date | None = Query(default=None, alias="to"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = InvoiceService(db)
    try:
        return await service.list_user_invoices(
            user_id=current_user.id,
            status=status_filter,
            customer_id=customer_id,
            from_date=from_date,
            to_date=to_date,
            limit=limit,
            offset=offset,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = InvoiceService(db)
        return await service.get_invoice_detail(user_id=current_user.id, invoice_id=invoice_id)
    except InvoiceNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.put("/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(
    invoice_id: str,
    request: InvoiceUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = InvoiceService(db)
        return await service.update_invoice(user=current_user, invoice_id=invoice_id, payload=request)
    except InvoiceNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except InvoiceValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{invoice_id}/issue", response_model=InvoiceResponse)
async def issue_invoice(
    invoice_id: str,
    _: InvoiceIssueRequest | None = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = InvoiceService(db)
        return await service.issue_invoice(user=current_user, invoice_id=invoice_id)
    except InvoiceNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except InvoiceValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except InvoiceConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.post("/{invoice_id}/cancel", response_model=InvoiceResponse)
async def cancel_invoice(
    invoice_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = InvoiceService(db)
        return await service.cancel_invoice(user_id=current_user.id, invoice_id=invoice_id)
    except InvoiceNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except InvoiceValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{invoice_id}/pdf")
async def get_invoice_pdf(
    invoice_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        pdf_bytes, file_name = await InvoiceService(db).generate_pdf(
            user_id=current_user.id,
            invoice_id=invoice_id,
        )
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{file_name}"'},
        )
    except InvoiceNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except InvoiceValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
