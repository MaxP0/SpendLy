from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user, security
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth_schema import (
    AuthResponse,
    AuthUserResponse,
    LoginRequest,
    MeResponse,
    RefreshRequest,
    RegisterRequest,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


def _user_payload(user: User) -> AuthUserResponse:
    return AuthUserResponse(
        id=user.id,
        email=user.email,
        role=user.role.value,
        business_name=user.business_name,
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    try:
        user, tokens = await service.register_user(
            email=request.email,
            password=request.password,
            role=request.role.value,
            business_name=request.business_name,
            business_address=request.business_address,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return AuthResponse(
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        user=_user_payload(user),
    )


@router.post("/login", response_model=AuthResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    try:
        user, tokens = await service.authenticate_user(
            email=request.email,
            password=request.password,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    return AuthResponse(
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        user=_user_payload(user),
    )


@router.post("/refresh")
async def refresh(
    request: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    try:
        access_token = await service.refresh_access_token(refresh_token=request.refresh_token)
    except ValueError as exc:
        message = str(exc)
        status_code = status.HTTP_401_UNAUTHORIZED if message in {"Token expired", "Invalid authentication credentials", "Refresh token revoked or expired", "User not found"} else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=message) from exc

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    try:
        await service.logout(access_token=credentials.credentials, current_user=current_user)
    except ValueError as exc:
        message = str(exc)
        status_code = status.HTTP_401_UNAUTHORIZED if message in {"Token expired", "Invalid authentication credentials"} else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=message) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=MeResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return MeResponse.model_validate(current_user)