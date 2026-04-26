from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.customer_schema import (
    CustomerCreate,
    CustomerListResponse,
    CustomerResponse,
    CustomerUpdate,
)
from app.services.customer_service import CustomerService

router = APIRouter(prefix="/customers", tags=["customers"])


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    request: CustomerCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = CustomerService(db)
    customer = await service.create(user_id=current_user.id, **request.model_dump())
    return customer


@router.get("", response_model=CustomerListResponse)
async def list_customers(
    search: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = CustomerService(db)
    items, total = await service.list_for_user(
        user_id=current_user.id,
        limit=limit,
        offset=offset,
        search=search,
    )
    return CustomerListResponse(items=items, total=total, limit=limit, offset=offset)


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = CustomerService(db)
    customer = await service.get(user_id=current_user.id, customer_id=customer_id)
    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: str,
    request: CustomerUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = CustomerService(db)
    customer = await service.update(
        user_id=current_user.id,
        customer_id=customer_id,
        **request.model_dump(exclude_unset=True),
    )
    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(
    customer_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = CustomerService(db)
    try:
        deleted = await service.delete(user_id=current_user.id, customer_id=customer_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Customer has invoices") from exc

    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
