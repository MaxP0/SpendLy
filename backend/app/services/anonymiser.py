import hashlib
from typing import Dict, Any


class Anonymiser:
    """Proxy pattern implementation for anonymizing PII before sending to AI."""
    
    PII_FIELDS = [
        "name",
        "email",
        "phone",
        "address",
        "merchant",
        "description",
        "customer_name",
        "business_name",
    ]
    
    @staticmethod
    def _hash_user_id(user_id: str) -> str:
        """Create a one-way SHA-256 hash of user_id."""
        return hashlib.sha256(user_id.encode()).hexdigest()[:16]
    
    @staticmethod
    def _remove_pii(data: Dict[str, Any]) -> Dict[str, Any]:
        """Remove or sanitize PII fields from data."""
        sanitized = {}
        for key, value in data.items():
            if key.lower() in Anonymiser.PII_FIELDS:
                # Skip PII fields entirely
                continue
            else:
                sanitized[key] = value
        return sanitized
    
    @classmethod
    def prepare_for_ai(cls, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Prepare financial data for external AI processing.
        
        - Removes all PII
        - Replaces user_id with one-way hash
        - Returns only aggregated, safe data
        """
        # Remove PII from the data
        safe_data = cls._remove_pii(data)
        
        # Replace user_id with hash
        anon_payload = {
            "user_hash": cls._hash_user_id(user_id),
            **safe_data,
        }
        
        return anon_payload
    
    @classmethod
    def anonymise_expenses(cls, user_id: str, expenses: list) -> Dict[str, Any]:
        """Anonymise a list of expenses for AI analysis."""
        total_amount = sum(e.get("amount", 0) for e in expenses)
        total_vat = sum(e.get("vat_amount", 0) for e in expenses)
        count = len(expenses)
        
        return cls.prepare_for_ai(
            user_id,
            {
                "total_expenses": total_amount,
                "total_vat": total_vat,
                "expense_count": count,
            },
        )
