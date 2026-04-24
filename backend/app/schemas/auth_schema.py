import re
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr, ConfigDict, field_validator


class UserRole(str, Enum):
    SELF_EMPLOYED_VAT = "self_employed_vat"
    SELF_EMPLOYED_NO_VAT = "self_employed_no_vat"
    PAYE_SIDE_INCOME = "paye_side_income"


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: UserRole
    business_name: Optional[str] = None
    business_address: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 8 or not re.search(r"[A-Za-z]", value) or not re.search(r"\d", value):
            raise ValueError("Password must be at least 8 characters long and include at least one letter and one digit")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class AuthUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    role: str
    business_name: Optional[str] = None


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: AuthUserResponse


class MeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    role: str
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    gdpr_consent_at: Optional[datetime] = None
