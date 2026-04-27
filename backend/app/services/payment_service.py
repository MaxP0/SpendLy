from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from decimal import Decimal

from app.repositories.payment_repo import PaymentRepository
from app.models.payment import Payment
import uuid
from datetime import datetime

from app.models.invoice import Invoice, InvoiceStatus
from app.services.inquiry_service import InquiryService


class PaymentService:
    """Service for payment-related business logic."""
    
    def __init__(self, db: AsyncSession):
        self.repository = PaymentRepository(db)
        self.db = db
    
    async def record_payment(
        self,
        invoice_id: str,
        user_id: str,
        amount: float,
        payment_date: datetime = None,
        transaction_id: str = None,
    ) -> Payment:
        """Record a payment for an invoice."""
        if payment_date is None:
            payment_date = datetime.utcnow()
        
        payment = Payment(
            id=str(uuid.uuid4()),
            invoice_id=invoice_id,
            user_id=user_id,
            amount=amount,
            payment_date=payment_date,
            transaction_id=transaction_id,
        )
        created = await self.repository.create(payment)
        invoice = await self.db.scalar(select(Invoice).where(Invoice.id == invoice_id, Invoice.user_id == user_id))
        if invoice is not None and invoice.status == InvoiceStatus.ISSUED:
            paid_total = await self.db.scalar(
                select(func.coalesce(func.sum(Payment.amount), 0.0)).where(Payment.invoice_id == invoice_id)
            )
            if Decimal(str(paid_total or 0.0)) >= Decimal(str(invoice.total)):
                invoice.status = InvoiceStatus.PAID
                await InquiryService(self.db).mark_completed_from_invoice(invoice_id=invoice_id)
                await self.db.commit()
        return created
    
    async def get_payment(self, payment_id: str) -> Payment:
        """Get payment by ID."""
        payment = await self.repository.get_by_id(payment_id)
        if not payment:
            raise ValueError("Payment not found")
        return payment
    
    async def list_invoice_payments(self, invoice_id: str) -> list:
        """List all payments for an invoice."""
        return await self.repository.get_by_invoice(invoice_id)
    
    async def list_user_payments(self, user_id: str) -> list:
        """List all payments for a user."""
        return await self.repository.get_by_user(user_id)
