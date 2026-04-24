from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.ai_insights_service import AIInsightsService
from app.core.config import get_settings
from app.api.v1.deps import get_current_user

router = APIRouter(prefix="/insights", tags=["insights"])

settings = get_settings()


@router.get("/spending")
async def get_spending_insights(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get AI-powered spending insights."""
    try:
        service = AIInsightsService(settings.OPENAI_API_KEY)
        insights = await service.generate_expense_insights(
            user_id=current_user.id,
            expenses_data=[],
        )
        return insights
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/tax-optimization")
async def get_tax_optimization(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get tax optimization recommendations."""
    try:
        service = AIInsightsService(settings.OPENAI_API_KEY)
        tips = await service.generate_tax_optimization_tips(
            user_id=current_user.id,
            user_role="",
            financial_data={},
        )
        return tips
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/cash-flow")
async def analyze_cash_flow(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Analyze cash flow patterns."""
    try:
        service = AIInsightsService(settings.OPENAI_API_KEY)
        analysis = await service.analyze_cash_flow(
            user_id=current_user.id,
            transactions=[],
            invoices=[],
        )
        return analysis
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
