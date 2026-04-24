from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.payment_service import PaymentService
from app.schemas.payment_schema import PaymentCreate, PaymentUpdate, PaymentResponse
from app.api.v1.deps import get_current_user

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("", response_model=PaymentResponse)
async def create_payment(
    request: PaymentCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Record a payment for an invoice."""
    try:
        service = PaymentService(db)
        payment = await service.record_payment(
            invoice_id=request.invoice_id,
            user_id=current_user.id,
            amount=request.amount,
            payment_date=request.payment_date,
            transaction_id=request.transaction_id,
        )
        return payment
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("")
async def list_payments(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all payments for the current user."""
    service = PaymentService(db)
    payments = await service.list_user_payments(current_user.id)
    return payments


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific payment."""
    try:
        service = PaymentService(db)
        payment = await service.get_payment(payment_id)
        if payment.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        return payment
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
