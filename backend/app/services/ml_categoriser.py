"""
ML Categorizer for expense categorization.

This is a placeholder service that would integrate with:
- scikit-learn for local categorization
- OpenAI API for smarter categorization
- Custom trained models
"""

from typing import Dict, Any, Tuple


class MLCategoriser:
    """Machine learning service for categorizing expenses."""
    
    # Common expense categories for Irish businesses
    CATEGORIES = [
        "travel",
        "accommodation",
        "meals",
        "office_supplies",
        "equipment",
        "software",
        "utilities",
        "rent",
        "insurance",
        "professional_fees",
        "marketing",
        "vehicle",
        "training",
        "other",
    ]
    
    @staticmethod
    def suggest_category(
        merchant: str,
        amount: float,
        description: str = None,
    ) -> Tuple[str, float]:
        """
        Suggest an expense category based on merchant and description.
        
        Returns:
            (category: str, confidence: float 0-1)
        
        Placeholder implementation.
        """
        return ("other", 0.0)
    
    @staticmethod
    def categorise_batch(expenses: list) -> list:
        """
        Categorise multiple expenses in batch.
        
        Placeholder implementation.
        """
        return [
            {
                **expense,
                "ml_suggested_category": "other",
                "ml_confidence": 0.0,
            }
            for expense in expenses
        ]
