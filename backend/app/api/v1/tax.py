from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.tax_engine import TaxEngine
from app.schemas.tax_schema import TaxSummaryResponse
from app.api.v1.deps import get_current_user

router = APIRouter(prefix="/tax", tags=["tax"])


@router.get("/summary")
async def get_tax_summary(
    period_start: str = None,
    period_end: str = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get tax summary for a period."""
    raise HTTPException(
        status_code=501,
        detail="Tax summary endpoint is not implemented yet.",
    )


@router.post("/calculate")
async def calculate_taxes(
    financial_data: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Calculate taxes using the appropriate strategy."""
    try:
        from app.services.user_service import UserService
        
        user_service = UserService(db)
        user = await user_service.get_user(current_user["user_id"])
        
        result = TaxEngine.calculate_taxes(user.role, financial_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/vat-return")
async def get_vat_return(
    period_start: str = None,
    period_end: str = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get VAT return (VAT3/RTD) for a period."""
    raise HTTPException(
        status_code=501,
        detail="VAT return generation is not implemented yet.",
    )


@router.get("/annual-summary")
async def get_annual_summary(
    year: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get annual income summary."""
    raise HTTPException(
        status_code=501,
        detail="Annual tax summary is not implemented yet.",
    )
