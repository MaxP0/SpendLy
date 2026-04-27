from app.models import AuditLog, Customer, Inquiry


class EmailService:
    """Stub email service used for MVP demos."""

    def __init__(self, db):
        self.db = db

    async def send_quote(self, *, inquiry: Inquiry, customer: Customer, share_url: str) -> dict[str, object]:
        self.db.add(
            AuditLog(
                user_id=inquiry.user_id,
                entity_type="inquiry",
                entity_id=inquiry.id,
                action="inquiry.email_stub_sent",
                diff={
                    "to": customer.email,
                    "share_url": share_url,
                    "status": "stubbed",
                },
            )
        )
        return {
            "to": customer.email,
            "delivered": False,
            "note": "Email integration is stubbed in MVP — share the link manually.",
        }