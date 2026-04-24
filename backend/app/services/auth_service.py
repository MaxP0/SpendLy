from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import (
    InvalidTokenError,
    TokenExpiredError,
    TokenPair,
    create_access_token,
    create_token_pair,
    decode_token,
    hash_password,
    verify_password,
)
from app.models import AuditLog, RefreshToken, User, UserRole
from app.repositories.user_repo import UserRepository


settings = get_settings()


class AuthService:
    """Authentication business logic."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.users = UserRepository(db)

    async def register_user(
        self,
        *,
        email: str,
        password: str,
        role: str,
        business_name: str | None = None,
        business_address: str | None = None,
    ) -> tuple[User, TokenPair]:
        if await self.users.get_by_email(email):
            raise ValueError("User with this email already exists")

        user = User(
            email=email,
            hashed_password=hash_password(password),
            role=UserRole(role),
            business_name=business_name,
            business_address=business_address,
        )
        self.db.add(user)
        await self.db.flush()
        tokens = await self._create_session(user, action="auth.register")
        await self.db.commit()
        await self.db.refresh(user)
        return user, tokens

    async def authenticate_user(self, *, email: str, password: str) -> tuple[User, TokenPair]:
        user = await self.users.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise ValueError("Invalid email or password")

        tokens = await self._create_session(user, action="auth.login")
        await self.db.commit()
        return user, tokens

    async def refresh_access_token(self, *, refresh_token: str) -> str:
        try:
            claims = decode_token(refresh_token, expected_type="refresh")
        except TokenExpiredError as exc:
            raise ValueError("Token expired") from exc
        except InvalidTokenError as exc:
            raise ValueError("Invalid authentication credentials") from exc

        result = await self.db.execute(select(RefreshToken).where(RefreshToken.jti == claims.jti))
        stored_refresh_token = result.scalar_one_or_none()
        if stored_refresh_token is None or stored_refresh_token.revoked:
            raise ValueError("Refresh token revoked or expired")

        if stored_refresh_token.user_id != claims.sub:
            raise ValueError("Invalid authentication credentials")

        if stored_refresh_token.expires_at <= datetime.utcnow():
            raise ValueError("Refresh token revoked or expired")

        user = await self.users.get_by_id(claims.sub)
        if user is None:
            raise ValueError("User not found")

        return create_access_token(user.id, user.role.value, refresh_jti=stored_refresh_token.jti)

    async def logout(self, *, access_token: str, current_user: User) -> None:
        try:
            claims = decode_token(access_token, expected_type="access")
        except TokenExpiredError as exc:
            raise ValueError("Token expired") from exc
        except InvalidTokenError as exc:
            raise ValueError("Invalid authentication credentials") from exc

        if claims.refresh_jti:
            result = await self.db.execute(select(RefreshToken).where(RefreshToken.jti == claims.refresh_jti))
            stored_refresh_token = result.scalar_one_or_none()
            if stored_refresh_token is not None:
                stored_refresh_token.revoked = True

        self.db.add(
            AuditLog(
                user_id=current_user.id,
                entity_type="auth",
                entity_id=current_user.id,
                action="auth.logout",
                diff={"email": current_user.email},
            )
        )
        await self.db.commit()

    async def _create_session(self, user: User, action: str) -> TokenPair:
        tokens = create_token_pair(user.id, user.role.value)
        self.db.add(
            RefreshToken(
                user_id=user.id,
                jti=tokens.refresh_jti,
                issued_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
                revoked=False,
            )
        )
        self.db.add(
            AuditLog(
                user_id=user.id,
                entity_type="auth",
                entity_id=user.id,
                action=action,
                diff={"email": user.email},
            )
        )
        return tokens