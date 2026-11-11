from datetime import datetime
from decimal import Decimal
from typing import Annotated, Optional

from pydantic import BaseModel, ConfigDict, Field

Quantity = Annotated[Decimal, Field(gt=0, max_digits=10, decimal_places=2)]


class RequestCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    food_id: int = Field(gt=0)
    requested_quantity: Quantity


class RequestOut(BaseModel):
    request_id: int
    food_id: int
    recipient_id: int
    requested_quantity: float
    request_status: str
    request_date: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    # Food listing summary
    food_name: str
    food_category: str
    food_image_url: Optional[str] = None
    unit: str
    listing_status: str
    available_until: datetime
    pickup_location: str

    # Donor info (contact details only revealed once a request is approved)
    donor_id: int
    donor_name: str
    donor_phone: Optional[str] = None
    donor_email: Optional[str] = None

    # Recipient info (shown to the listing owner)
    recipient_name: str
    recipient_phone: Optional[str] = None
    recipient_email: Optional[str] = None


class RequestCreated(BaseModel):
    message: str
    request_id: int
    food_id: int
    requested_quantity: float
    request_status: str


class DonorStats(BaseModel):
    total_listings: int
    available_listings: int
    pending_requests: int
    completed_donations: int


class RecipientStats(BaseModel):
    available_food: int
    pending_requests: int
    approved_requests: int
    completed_donations: int
