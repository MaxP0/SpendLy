from abc import ABC, abstractmethod
from typing import Dict, Any
from datetime import datetime


class TaxStrategy(ABC):
    """Abstract base class for tax calculation strategies."""
    
    @abstractmethod
    def calculate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate taxes based on user's role."""
        pass


class SelfEmployedVATStrategy(TaxStrategy):
    """Tax strategy for self-employed users with VAT."""
    
    def calculate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate VAT3/RTD reports for VAT-registered businesses.
        Requires: total_income, total_expenses, vat_collected, vat_reclaimable
        """
        total_income = data.get("total_income", 0)
        total_expenses = data.get("total_expenses", 0)
        vat_collected = data.get("vat_collected", 0)
        vat_reclaimable = data.get("vat_reclaimable", 0)
        
        vat_due = vat_collected - vat_reclaimable
        taxable_income = total_income - total_expenses
        
        return {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "taxable_income": taxable_income,
            "vat_collected": vat_collected,
            "vat_reclaimable": vat_reclaimable,
            "vat_due": vat_due,
            "strategy": "self_employed_vat",
            "form_type": "VAT3",
        }


class SelfEmployedNoVATStrategy(TaxStrategy):
    """Tax strategy for self-employed users without VAT."""
    
    def calculate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate income summary for non-VAT businesses.
        Requires: total_income, total_expenses
        """
        total_income = data.get("total_income", 0)
        total_expenses = data.get("total_expenses", 0)
        
        taxable_income = total_income - total_expenses
        
        return {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "taxable_income": taxable_income,
            "vat_collected": 0,
            "vat_reclaimable": 0,
            "vat_due": 0,
            "strategy": "self_employed_no_vat",
            "form_type": "Annual Income Summary",
        }


class PAYESideIncomeStrategy(TaxStrategy):
    """Tax strategy for PAYE employees with side income."""
    
    def calculate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate side income summary for PAYE employees.
        Requires: total_income (side income only), total_expenses
        """
        total_income = data.get("total_income", 0)
        total_expenses = data.get("total_expenses", 0)
        
        taxable_income = total_income - total_expenses
        
        return {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "taxable_income": taxable_income,
            "vat_collected": 0,
            "vat_reclaimable": 0,
            "vat_due": 0,
            "strategy": "paye_side_income",
            "form_type": "Side Income Summary",
        }


class TaxEngine:
    """Tax calculation engine using Strategy pattern."""
    
    _strategies = {
        "self_employed_vat": SelfEmployedVATStrategy(),
        "self_employed_no_vat": SelfEmployedNoVATStrategy(),
        "paye_side_income": PAYESideIncomeStrategy(),
    }
    
    @classmethod
    def get_strategy(cls, role: str) -> TaxStrategy:
        """Get the appropriate tax strategy for a user role."""
        strategy = cls._strategies.get(role)
        if strategy is None:
            raise ValueError(f"Unknown role: {role}")
        return strategy
    
    @classmethod
    def calculate_taxes(cls, role: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate taxes for a user based on their role."""
        strategy = cls.get_strategy(role)
        return strategy.calculate(data)
