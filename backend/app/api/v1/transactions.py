from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.transaction_service import TransactionService
from app.schemas.transaction_schema import (
    BankTransactionCreate,
    BankTransactionUpdate,
    BankTransactionResponse,
)
from app.api.v1.deps import get_current_user

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post("", response_model=BankTransactionResponse)
async def import_transaction(
    request: BankTransactionCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Import a bank transaction."""
    try:
        service = TransactionService(db)
        transaction = await service.import_transaction(
            user_id=current_user["user_id"],
            date=request.date,
            amount=request.amount,
            description=request.description,
        )
        return transaction
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("")
async def list_transactions(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all transactions for the current user."""
    service = TransactionService(db)
    transactions = await service.list_user_transactions(current_user["user_id"])
    return transactions


@router.get("/{transaction_id}", response_model=BankTransactionResponse)
async def get_transaction(
    transaction_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific transaction."""
    try:
        service = TransactionService(db)
        transaction = await service.get_transaction(transaction_id)
        if transaction.user_id != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        return transaction
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{transaction_id}", response_model=BankTransactionResponse)
async def update_transaction(
    transaction_id: str,
    request: BankTransactionUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update transaction reconciliation status."""
    try:
        service = TransactionService(db)
        transaction = await service.get_transaction(transaction_id)
        if transaction.user_id != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        if request.reconciliation_status:
            transaction = await service.reconcile_transaction(
                transaction_id,
                request.reconciliation_status.value,
            )
        return transaction
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
