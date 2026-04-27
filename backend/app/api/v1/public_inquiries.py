from __future__ import annotations

from collections import defaultdict, deque
from time import monotonic

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.inquiry_schema import (
    PublicInquiryActionResponse,
    PublicInquiryDiscussionRequest,
    PublicInquiryRejectRequest,
    PublicInquiryResponse,
)
from app.services.inquiry_service import InquiryConflictError, InquiryNotFoundError, InquiryService

router = APIRouter(prefix="/public/inquiries", tags=["public-inquiries"])
_REQUESTS: dict[str, deque[float]] = defaultdict(deque)
_WINDOW_SECONDS = 60
_REQUEST_LIMIT = 30


def _enforce_rate_limit(token: str) -> None:
    now = monotonic()
    bucket = _REQUESTS[token]
    while bucket and now - bucket[0] > _WINDOW_SECONDS:
        bucket.popleft()
    if len(bucket) >= _REQUEST_LIMIT:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many requests for this quote")
    bucket.append(now)


@router.get("/{token}", response_model=PublicInquiryResponse)
async def get_public_inquiry(token: str, db: AsyncSession = Depends(get_db)):
    _enforce_rate_limit(token)
    try:
        return await InquiryService(db).get_public_inquiry(token=token)
    except InquiryNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/{token}/accept", response_model=PublicInquiryActionResponse)
async def accept_public_inquiry(token: str, db: AsyncSession = Depends(get_db)):
    _enforce_rate_limit(token)
    try:
        return await InquiryService(db).public_accept(token=token)
    except InquiryNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except InquiryConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.post("/{token}/reject", response_model=PublicInquiryActionResponse)
async def reject_public_inquiry(
    token: str,
    request: PublicInquiryRejectRequest,
    db: AsyncSession = Depends(get_db),
):
    _enforce_rate_limit(token)
    try:
        return await InquiryService(db).public_reject(token=token, reason=request.reason)
    except InquiryNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except InquiryConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.post("/{token}/request-discussion", response_model=PublicInquiryActionResponse)
async def request_public_discussion(
    token: str,
    request: PublicInquiryDiscussionRequest,
    db: AsyncSession = Depends(get_db),
):
    _enforce_rate_limit(token)
    try:
        return await InquiryService(db).public_request_discussion(token=token, note=request.note)
    except InquiryNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except InquiryConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc