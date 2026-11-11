import re
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

PHONE_RE = re.compile(r"^\+?[0-9]{7,15}$")


def _clean_phone(value: str) -> str:
    cleaned = re.sub(r"[\s\-()]", "", value or "")
    if not PHONE_RE.match(cleaned):
        raise ValueError("Enter a valid phone number (7-15 digits, optional leading +)")
    return cleaned


class UserRegister(BaseModel):
    model_config = ConfigDict(extra="forbid")

    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    phone: str
    address: Optional[str] = Field(default=None, max_length=500)
    role: Literal["Donor", "Recipient"]

    @field_validator("full_name")
    @classmethod
    def _strip_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Full name must be at least 2 characters")
        return v

    @field_validator("email")
    @classmethod
    def _lower_email(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("phone")
    @classmethod
    def _check_phone(cls, v: str) -> str:
        return _clean_phone(v)

    @field_validator("password")
    @classmethod
    def _check_password(cls, v: str) -> str:
        if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
            raise ValueError("Password must contain at least one letter and one number")
        return v

    @field_validator("address")
    @classmethod
    def _strip_address(cls, v: Optional[str]) -> Optional[str]:
        v = (v or "").strip()
        return v or None


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=200)

    @field_validator("email")
    @classmethod
    def _lower_email(cls, v: str) -> str:
        return v.strip().lower()


class UserUpdate(BaseModel):
    """Role and email cannot be changed here; unknown fields are rejected."""

    model_config = ConfigDict(extra="forbid")

    full_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    phone: Optional[str] = None
    address: Optional[str] = Field(default=None, max_length=500)
    profile_image_url: Optional[str] = Field(default=None, max_length=500)

    @field_validator("phone")
    @classmethod
    def _check_phone(cls, v: Optional[str]) -> Optional[str]:
        return None if v is None else _clean_phone(v)

    @field_validator("profile_image_url")
    @classmethod
    def _check_image(cls, v: Optional[str]) -> Optional[str]:
        if v and not (v.startswith("/uploads/") or v.startswith(("http://", "https://"))):
            raise ValueError("Invalid image URL")
        return v or None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    full_name: str
    email: str
    phone: str
    address: Optional[str] = None
    role: str
    profile_image_url: Optional[str] = None
    created_at: datetime


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
