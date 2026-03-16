from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum


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


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str


class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    business_name: Optional[str]
    business_address: Optional[str]
    
    class Config:
        from_attributes = True
