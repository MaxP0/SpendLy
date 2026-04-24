from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.expense_service import ExpenseService
from app.schemas.expense_schema import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from app.api.v1.deps import get_current_user

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.post("", response_model=ExpenseResponse)
async def create_expense(
    request: ExpenseCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new expense."""
    try:
        service = ExpenseService(db)
        expense = await service.create_expense(
            receipt_id=request.receipt_id,
            user_id=current_user.id,
            amount=request.amount,
            inquiry_id=request.inquiry_id,
            vat_amount=request.vat_amount,
            is_vat_reclaimable=request.is_vat_reclaimable,
        )
        return expense
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("")
async def list_expenses(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all expenses for the current user."""
    service = ExpenseService(db)
    expenses = await service.list_user_expenses(current_user.id)
    return expenses


@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(
    expense_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific expense."""
    try:
        service = ExpenseService(db)
        expense = await service.get_expense(expense_id)
        if expense.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        return expense
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: str,
    request: ExpenseUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an expense."""
    try:
        service = ExpenseService(db)
        expense = await service.get_expense(expense_id)
        if expense.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        expense = await service.update_expense(
            expense_id,
            **request.dict(exclude_unset=True)
        )
        return expense
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
