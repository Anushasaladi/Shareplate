from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.constants import (
    OPEN_LISTING_STATUSES,
    REQUEST_APPROVED,
    REQUEST_COMPLETED,
    REQUEST_PENDING,
)
from app.database import get_db, utcnow
from app.dependencies import refresh_expired_listings, require_donor, require_recipient
from app.models import FoodListing, FoodRequest, User
from app.schemas.food_request import DonorStats, RecipientStats

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
    dependencies=[Depends(refresh_expired_listings)],
)


def _count(db: Session, stmt) -> int:
    return db.scalar(stmt) or 0


@router.get("/donor", response_model=DonorStats)
def donor_stats(donor: User = Depends(require_donor), db: Session = Depends(get_db)):
    mine = FoodListing.donor_id == donor.user_id
    req_base = select(func.count()).select_from(FoodRequest).join(
        FoodListing, FoodListing.food_id == FoodRequest.food_id
    )
    return DonorStats(
        total_listings=_count(db, select(func.count()).select_from(FoodListing).where(mine)),
        available_listings=_count(
            db,
            select(func.count())
            .select_from(FoodListing)
            .where(mine, FoodListing.listing_status.in_(OPEN_LISTING_STATUSES)),
        ),
        pending_requests=_count(db, req_base.where(mine, FoodRequest.request_status == REQUEST_PENDING)),
        completed_donations=_count(db, req_base.where(mine, FoodRequest.request_status == REQUEST_COMPLETED)),
    )


@router.get("/recipient", response_model=RecipientStats)
def recipient_stats(recipient: User = Depends(require_recipient), db: Session = Depends(get_db)):
    mine = FoodRequest.recipient_id == recipient.user_id
    base = select(func.count()).select_from(FoodRequest)
    return RecipientStats(
        available_food=_count(
            db,
            select(func.count())
            .select_from(FoodListing)
            .where(
                FoodListing.listing_status.in_(OPEN_LISTING_STATUSES),
                FoodListing.available_until > utcnow(),
                FoodListing.remaining_quantity > 0,
            ),
        ),
        pending_requests=_count(db, base.where(mine, FoodRequest.request_status == REQUEST_PENDING)),
        approved_requests=_count(db, base.where(mine, FoodRequest.request_status == REQUEST_APPROVED)),
        completed_donations=_count(db, base.where(mine, FoodRequest.request_status == REQUEST_COMPLETED)),
    )
