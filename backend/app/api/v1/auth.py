from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.user_service import UserService
from app.schemas.auth_schema import RegisterRequest, LoginRequest, TokenResponse
from app.api.v1.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user."""
    try:
        service = UserService(db)
        user = await service.register_user(
            email=request.email,
            password=request.password,
            role=request.role.value,
            business_name=request.business_name,
            business_address=request.business_address,
        )
        
        token_data = await service.authenticate_user(request.email, request.password)
        
        return TokenResponse(
            access_token=token_data["access_token"],
            user_id=token_data["user_id"],
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Login user and return access token."""
    try:
        service = UserService(db)
        token_data = await service.authenticate_user(
            email=request.email,
            password=request.password,
        )
        
        return TokenResponse(
            access_token=token_data["access_token"],
            user_id=token_data["user_id"],
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/me")
async def get_current_user_info(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user information."""
    service = UserService(db)
    user = await service.get_user(current_user["user_id"])
    
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "business_name": user.business_name,
    }
