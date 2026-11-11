from datetime import datetime, timezone
from decimal import Decimal
from typing import Annotated, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.constants import CATEGORIES, UNITS
from app.database import utcnow

Quantity = Annotated[Decimal, Field(gt=0, max_digits=10, decimal_places=2)]


def _aware(v: Optional[datetime]) -> Optional[datetime]:
    if v is None:
        return None
    if v.tzinfo is None:
        return v.replace(tzinfo=timezone.utc)
    return v.astimezone(timezone.utc)


def _check_image(v: Optional[str]) -> Optional[str]:
    if v and not (v.startswith("/uploads/") or v.startswith(("http://", "https://"))):
        raise ValueError("Invalid image URL")
    return v or None


class _FoodValidators(BaseModel):
    @field_validator("category", check_fields=False)
    @classmethod
    def _category(cls, v):
        if v is not None and v not in CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(CATEGORIES)}")
        return v

    @field_validator("unit", check_fields=False)
    @classmethod
    def _unit(cls, v):
        if v is not None and v not in UNITS:
            raise ValueError(f"Unit must be one of: {', '.join(UNITS)}")
        return v

    @field_validator("image_url", check_fields=False)
    @classmethod
    def _image(cls, v):
        return _check_image(v)

    @field_validator("prepared_at", "available_from", "available_until", check_fields=False)
    @classmethod
    def _dates(cls, v):
        return _aware(v)


class FoodCreate(_FoodValidators):
    model_config = ConfigDict(extra="forbid")

    food_name: str = Field(min_length=2, max_length=100)
    description: str = Field(min_length=5, max_length=2000)
    category: str
    quantity: Quantity
    unit: str
    image_url: Optional[str] = Field(default=None, max_length=500)
    pickup_location: str = Field(min_length=3, max_length=500)
    prepared_at: Optional[datetime] = None
    available_from: Optional[datetime] = None
    available_until: datetime

    @model_validator(mode="after")
    def _check_times(self):
        if self.available_until <= utcnow():
            raise ValueError("Pickup deadline must be in the future")
        if self.available_from and self.available_from >= self.available_until:
            raise ValueError("Availability time must be before the pickup deadline")
        return self


class FoodUpdate(_FoodValidators):
    model_config = ConfigDict(extra="forbid")

    food_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    description: Optional[str] = Field(default=None, min_length=5, max_length=2000)
    category: Optional[str] = None
    quantity: Optional[Quantity] = None
    unit: Optional[str] = None
    image_url: Optional[str] = Field(default=None, max_length=500)
    pickup_location: Optional[str] = Field(default=None, min_length=3, max_length=500)
    prepared_at: Optional[datetime] = None
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None

    @model_validator(mode="after")
    def _check_times(self):
        if self.available_until is not None and self.available_until <= utcnow():
            raise ValueError("Pickup deadline must be in the future")
        if self.available_from and self.available_until and self.available_from >= self.available_until:
            raise ValueError("Availability time must be before the pickup deadline")
        return self


class FoodOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    food_id: int
    donor_id: int
    donor_name: str
    donor_address: Optional[str] = None
    food_name: str
    description: str
    category: str
    quantity: float
    remaining_quantity: float
    unit: str
    image_url: Optional[str] = None
    pickup_location: str
    prepared_at: Optional[datetime] = None
    available_from: Optional[datetime] = None
    available_until: datetime
    listing_status: str
    created_at: datetime
    updated_at: datetime
    pending_request_count: Optional[int] = None


class MessageOut(BaseModel):
    message: str
