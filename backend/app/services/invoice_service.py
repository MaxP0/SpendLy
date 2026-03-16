from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.invoice_repo import InvoiceRepository
from app.models.invoice import Invoice
import uuid


class InvoiceService:
    """Service for invoice-related business logic."""
    
    def __init__(self, db: AsyncSession):
        self.repository = InvoiceRepository(db)
        self.db = db
    
    async def create_invoice(
        self,
        user_id: str,
        customer_id: str,
        subtotal: float,
        vat_rate: float = 0.0,
        inquiry_id: str = None,
        due_at = None,
    ) -> Invoice:
        """Create a new invoice."""
        # Generate unique invoice number
        invoice_number = f"INV-{user_id[:8]}-{str(uuid.uuid4())[:8]}".upper()
        
        vat_amount = subtotal * (vat_rate / 100)
        total = subtotal + vat_amount
        
        invoice = Invoice(
            id=str(uuid.uuid4()),
            user_id=user_id,
            customer_id=customer_id,
            inquiry_id=inquiry_id,
            invoice_number=invoice_number,
            subtotal=subtotal,
            vat_rate=vat_rate,
            vat_amount=vat_amount,
            total=total,
            due_at=due_at,
        )
        return await self.repository.create(invoice)
    
    async def get_invoice(self, invoice_id: str) -> Invoice:
        """Get invoice by ID."""
        invoice = await self.repository.get_by_id(invoice_id)
        if not invoice:
            raise ValueError("Invoice not found")
        return invoice
    
    async def list_user_invoices(self, user_id: str) -> list:
        """List all invoices for a user."""
        return await self.repository.get_by_user(user_id)
    
    async def update_invoice(self, invoice_id: str, **updates) -> Invoice:
        """Update invoice."""
        invoice = await self.repository.update(invoice_id, **updates)
        if not invoice:
            raise ValueError("Invoice not found")
        return invoice
