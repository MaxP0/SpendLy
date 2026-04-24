from datetime import datetime, timedelta, timezone
from typing import Literal, Optional
from uuid import uuid4

from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from .config import get_settings

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TokenClaims(BaseModel):
    """JWT token payload."""

    sub: str
    role: str
    exp: datetime
    iat: datetime
    jti: str
    type: Literal["access", "refresh"]
    refresh_jti: Optional[str] = None


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    refresh_jti: str


class TokenExpiredError(Exception):
    """Raised when a token has expired."""


class InvalidTokenError(Exception):
    """Raised when a token is invalid."""


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def _build_payload(
    *,
    user_id: str,
    role: str,
    token_type: Literal["access", "refresh"],
    expires_delta: timedelta,
    refresh_jti: Optional[str] = None,
) -> dict[str, object]:
    issued_at = datetime.now(timezone.utc)
    payload: dict[str, object] = {
        "sub": user_id,
        "role": role,
        "exp": issued_at + expires_delta,
        "iat": issued_at,
        "jti": str(uuid4()),
        "type": token_type,
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
    }
    if refresh_jti is not None:
        payload["refresh_jti"] = refresh_jti
    return payload


def create_access_token(
    user_id: str,
    role: str,
    refresh_jti: Optional[str] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a JWT access token."""
    payload = _build_payload(
        user_id=user_id,
        role=role,
        token_type="access",
        expires_delta=expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        refresh_jti=refresh_jti,
    )
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(
    user_id: str,
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> tuple[str, str]:
    """Create a refresh token and return the token plus its JTI."""
    payload = _build_payload(
        user_id=user_id,
        role=role,
        token_type="refresh",
        expires_delta=expires_delta or timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM), str(payload["jti"])


def create_token_pair(user_id: str, role: str) -> TokenPair:
    """Create a matching access and refresh token pair."""
    refresh_token, refresh_jti = create_refresh_token(user_id=user_id, role=role)
    access_token = create_access_token(user_id=user_id, role=role, refresh_jti=refresh_jti)
    return TokenPair(access_token=access_token, refresh_token=refresh_token, refresh_jti=refresh_jti)


def decode_token(token: str, expected_type: Optional[Literal["access", "refresh"]] = None) -> TokenClaims:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            issuer=settings.JWT_ISSUER,
            audience=settings.JWT_AUDIENCE,
        )
        claims = TokenClaims.model_validate(payload)
        if expected_type is not None and claims.type != expected_type:
            raise InvalidTokenError("Invalid token type")
        return claims
    except JWTError as exc:
        message = str(exc).lower()
        if "expired" in message:
            raise TokenExpiredError("Token expired") from exc
        raise InvalidTokenError("Invalid authentication credentials") from exc