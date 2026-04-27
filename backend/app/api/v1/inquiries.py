from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import FileResponse
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.v1.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.inquiry_schema import InquiryCreate, InquiryPageResponse, InquiryResponse, InquirySendRequest, InquiryUpdate
from app.services.inquiry_service import (
    InquiryConflictError,
    InquiryNotFoundError,
    InquiryService,
    InvalidTransitionError,
)

router = APIRouter(prefix="/inquiries", tags=["inquiries"])


@router.post("", response_model=InquiryResponse, status_code=status.HTTP_201_CREATED)
async def create_inquiry(
    request: InquiryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = InquiryService(db)
        return await service.create_inquiry(
            user_id=current_user.id,
            customer_id=request.customer_id,
            title=request.title,
            description=request.description,
            start_date=request.start_date,
            valid_until=request.valid_until,
            line_items=request.line_items,
        )
    except InquiryNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except (InvalidTransitionError, InquiryConflictError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("", response_model=InquiryPageResponse)
async def list_inquiries(
    status_filters: str | None = Query(default=None, alias="status"),
    customer_id: str | None = None,
    search: str | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = InquiryService(db)
    items, total = await service.list_user_inquiries(
        user_id=current_user.id,
        status_filters=[item for item in (status_filters or "").split(",") if item],
        customer_id=customer_id,
        search=search,
        limit=limit,
        offset=offset,
    )
    return InquiryPageResponse(items=items, total=total, limit=limit, offset=offset)


@router.get("/{inquiry_id}", response_model=InquiryResponse)
async def get_inquiry(
    inquiry_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = InquiryService(db)
        return await service.get_inquiry_detail(user_id=current_user.id, inquiry_id=inquiry_id)
    except InquiryNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.put("/{inquiry_id}", response_model=InquiryResponse)
async def update_inquiry(
    inquiry_id: str,
    request: InquiryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = InquiryService(db)
        return await service.update_inquiry(
            user_id=current_user.id,
            inquiry_id=inquiry_id,
            **request.model_dump(exclude_unset=True)
        )
    except InquiryNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except InvalidTransitionError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/{inquiry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_inquiry(
    inquiry_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = InquiryService(db)
        await service.delete_inquiry(user_id=current_user.id, inquiry_id=inquiry_id)
    except InquiryNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except InvalidTransitionError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{inquiry_id}/send", response_model=InquiryResponse)
async def send_inquiry(
    inquiry_id: str,
    request: InquirySendRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = InquiryService(db)
        return await service.send_to_client(
            user_id=current_user.id,
            inquiry_id=inquiry_id,
            valid_until_override=request.valid_until_override,
        )
    except InquiryNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except InvalidTransitionError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{inquiry_id}/archive", response_model=InquiryResponse)
async def archive_inquiry(
    inquiry_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = InquiryService(db)
        return await service.archive(user_id=current_user.id, inquiry_id=inquiry_id)
    except InquiryNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except InvalidTransitionError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{inquiry_id}/unarchive", response_model=InquiryResponse)
async def unarchive_inquiry(
    inquiry_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = InquiryService(db)
        return await service.unarchive(user_id=current_user.id, inquiry_id=inquiry_id)
    except InquiryNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except InvalidTransitionError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{inquiry_id}/quote-pdf")
async def get_quote_pdf(
    inquiry_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = InquiryService(db)
        pdf_path = await service.get_quote_pdf_path(user_id=current_user.id, inquiry_id=inquiry_id)
        return FileResponse(pdf_path, media_type="application/pdf", filename=Path(pdf_path).name)
    except InquiryNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
