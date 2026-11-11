"""Business logic for food listings."""
from decimal import Decimal
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select, update
from sqlalchemy.orm import Session

from app.constants import (
    LISTING_AVAILABLE,
    LISTING_CANCELLED,
    LISTING_EXPIRED,
    LISTING_FULL,
    LISTING_PARTIAL,
    OPEN_LISTING_STATUSES,
    REQUEST_APPROVED,
    REQUEST_CANCELLED,
    REQUEST_PENDING,
    REQUEST_REJECTED,
    TERMINAL_LISTING_STATUSES,
)
from app.database import utcnow
from app.models import FoodListing, FoodRequest, User
from app.schemas.food import FoodCreate, FoodOut, FoodUpdate


def conflict(message: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=message)


def lock_listing(db: Session, food_id: int) -> FoodListing:
    """Load a listing with a row lock (SELECT ... FOR UPDATE) so concurrent approvals serialize."""
    listing = db.execute(
        select(FoodListing)
        .where(FoodListing.food_id == food_id)
        .with_for_update(of=FoodListing)
        .execution_options(populate_existing=True)
    ).scalar_one_or_none()
    if listing is None:
        raise HTTPException(status_code=404, detail="Food listing not found")
    return listing


def derive_status(listing: FoodListing) -> str:
    """Compute the listing status from its remaining quantity (terminal statuses are kept)."""
    if listing.listing_status in TERMINAL_LISTING_STATUSES:
        return listing.listing_status
    if listing.remaining_quantity <= 0:
        return LISTING_FULL
    if listing.remaining_quantity < listing.quantity:
        return LISTING_PARTIAL
    return LISTING_AVAILABLE


def expire_listings(db: Session) -> None:
    """Mark overdue open listings as Expired and cancel their pending requests."""
    now = utcnow()
    ids = db.scalars(
        select(FoodListing.food_id).where(
            FoodListing.available_until <= now,
            FoodListing.listing_status.in_(OPEN_LISTING_STATUSES),
        )
    ).all()
    if not ids:
        return
    db.execute(
        update(FoodListing)
        .where(FoodListing.food_id.in_(ids))
        .values(listing_status=LISTING_EXPIRED, updated_at=now)
    )
    db.execute(
        update(FoodRequest)
        .where(FoodRequest.food_id.in_(ids), FoodRequest.request_status == REQUEST_PENDING)
        .values(request_status=REQUEST_CANCELLED, updated_at=now)
    )
    db.commit()


def _like(term: str) -> str:
    escaped = term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


def list_available(
    db: Session,
    q: Optional[str],
    category: Optional[str],
    location: Optional[str],
    skip: int,
    limit: int,
) -> list[FoodListing]:
    stmt = select(FoodListing).where(
        FoodListing.listing_status.in_(OPEN_LISTING_STATUSES),
        FoodListing.available_until > utcnow(),
        FoodListing.remaining_quantity > 0,
    )
    if q:
        pattern = _like(q.strip())
        stmt = stmt.where(
            or_(
                FoodListing.food_name.ilike(pattern, escape="\\"),
                FoodListing.description.ilike(pattern, escape="\\"),
            )
        )
    if category:
        stmt = stmt.where(FoodListing.category == category)
    if location:
        stmt = stmt.where(FoodListing.pickup_location.ilike(_like(location.strip()), escape="\\"))
    stmt = stmt.order_by(FoodListing.available_until.asc(), FoodListing.food_id.desc())
    return list(db.scalars(stmt.offset(skip).limit(limit)).all())


def my_listings(db: Session, donor: User, listing_status: Optional[str]) -> list[FoodOut]:
    stmt = select(FoodListing).where(FoodListing.donor_id == donor.user_id)
    if listing_status:
        stmt = stmt.where(FoodListing.listing_status == listing_status)
    listings = db.scalars(stmt.order_by(FoodListing.created_at.desc())).all()

    counts = dict(
        db.execute(
            select(FoodRequest.food_id, func.count(FoodRequest.request_id))
            .join(FoodListing, FoodListing.food_id == FoodRequest.food_id)
            .where(FoodListing.donor_id == donor.user_id, FoodRequest.request_status == REQUEST_PENDING)
            .group_by(FoodRequest.food_id)
        ).all()
    )
    result = []
    for listing in listings:
        out = FoodOut.model_validate(listing)
        out.pending_request_count = counts.get(listing.food_id, 0)
        result.append(out)
    return result


def create_listing(db: Session, donor: User, data: FoodCreate) -> FoodListing:
    listing = FoodListing(
        donor_id=donor.user_id,
        food_name=data.food_name.strip(),
        description=data.description.strip(),
        category=data.category,
        quantity=data.quantity,
        remaining_quantity=data.quantity,
        unit=data.unit,
        image_url=data.image_url,
        pickup_location=data.pickup_location.strip(),
        prepared_at=data.prepared_at,
        available_from=data.available_from,
        available_until=data.available_until,
        listing_status=LISTING_AVAILABLE,
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


def _ensure_owner(listing: FoodListing, user: User) -> None:
    if listing.donor_id != user.user_id:
        raise HTTPException(status_code=403, detail="You can only manage your own food listings")


def update_listing(db: Session, food_id: int, user: User, data: FoodUpdate) -> FoodListing:
    listing = lock_listing(db, food_id)
    _ensure_owner(listing, user)
    if listing.listing_status in TERMINAL_LISTING_STATUSES:
        raise conflict(f"A {listing.listing_status.lower()} listing can no longer be edited")

    fields = data.model_dump(exclude_unset=True)
    for required in ("food_name", "description", "category", "unit", "pickup_location", "available_until"):
        if required in fields and fields[required] is None:
            raise HTTPException(status_code=422, detail=f"{required} cannot be empty")

    if "quantity" in fields:
        if fields["quantity"] is None:
            raise HTTPException(status_code=422, detail="quantity cannot be empty")
        reserved = listing.quantity - listing.remaining_quantity
        new_qty: Decimal = fields.pop("quantity")
        if new_qty < reserved:
            raise conflict(
                f"Quantity cannot be lower than the {reserved} already reserved for approved requests"
            )
        listing.quantity = new_qty
        listing.remaining_quantity = new_qty - reserved

    new_from = fields.get("available_from", listing.available_from)
    new_until = fields.get("available_until", listing.available_until)
    if new_from and new_until and new_from >= new_until:
        raise HTTPException(status_code=422, detail="Availability time must be before the pickup deadline")

    for key, value in fields.items():
        if isinstance(value, str):
            value = value.strip()
        setattr(listing, key, value)

    listing.listing_status = derive_status(listing)
    db.commit()
    db.refresh(listing)
    return listing


def cancel_listing(db: Session, food_id: int, user: User) -> None:
    """Soft-delete: the record stays so that donation history is preserved."""
    listing = lock_listing(db, food_id)
    _ensure_owner(listing, user)
    if listing.listing_status == LISTING_CANCELLED:
        return
    if listing.listing_status == "Completed":
        raise conflict("Completed listings are kept for your donation history")
    approved = db.scalar(
        select(func.count())
        .select_from(FoodRequest)
        .where(FoodRequest.food_id == food_id, FoodRequest.request_status == REQUEST_APPROVED)
    )
    if approved:
        raise conflict("This listing has approved requests waiting for collection. Complete them first.")

    now = utcnow()
    db.execute(
        update(FoodRequest)
        .where(FoodRequest.food_id == food_id, FoodRequest.request_status == REQUEST_PENDING)
        .values(request_status=REQUEST_REJECTED, updated_at=now)
    )
    listing.listing_status = LISTING_CANCELLED
    db.commit()
