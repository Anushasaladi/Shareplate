from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.constants import CATEGORIES, LISTING_STATUSES
from app.database import get_db
from app.dependencies import get_current_user, refresh_expired_listings, require_donor
from app.models import FoodListing, User
from app.schemas.food import FoodCreate, FoodOut, FoodUpdate, MessageOut
from app.services import food_service

router = APIRouter(
    prefix="/api/foods",
    tags=["Food Listings"],
    dependencies=[Depends(refresh_expired_listings)],
)


@router.post("", response_model=FoodOut, status_code=status.HTTP_201_CREATED)
def create_food(data: FoodCreate, donor: User = Depends(require_donor), db: Session = Depends(get_db)):
    return food_service.create_listing(db, donor, data)


@router.get("", response_model=list[FoodOut])
def browse_foods(
    q: Optional[str] = Query(default=None, max_length=100, description="Search by name or description"),
    category: Optional[str] = Query(default=None),
    location: Optional[str] = Query(default=None, max_length=100),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if category and category not in CATEGORIES:
        raise HTTPException(status_code=422, detail="Unknown category")
    return food_service.list_available(db, q, category, location, skip, limit)


# NOTE: must be declared before "/{food_id}" so it is not captured as an id.
@router.get("/my-listings", response_model=list[FoodOut])
def my_listings(
    listing_status: Optional[str] = Query(default=None, alias="status"),
    donor: User = Depends(require_donor),
    db: Session = Depends(get_db),
):
    if listing_status and listing_status not in LISTING_STATUSES:
        raise HTTPException(status_code=422, detail="Unknown status")
    return food_service.my_listings(db, donor, listing_status)


@router.get("/{food_id}", response_model=FoodOut)
def get_food(food_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    listing = db.get(FoodListing, food_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Food listing not found")
    return listing


@router.put("/{food_id}", response_model=FoodOut)
def update_food(
    food_id: int,
    data: FoodUpdate,
    donor: User = Depends(require_donor),
    db: Session = Depends(get_db),
):
    return food_service.update_listing(db, food_id, donor, data)


@router.delete("/{food_id}", response_model=MessageOut)
def delete_food(food_id: int, donor: User = Depends(require_donor), db: Session = Depends(get_db)):
    food_service.cancel_listing(db, food_id, donor)
    return MessageOut(message="Food listing cancelled")
