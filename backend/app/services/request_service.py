"""Business logic for food requests, approvals and donation completion."""
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.constants import (
    LISTING_CANCELLED,
    LISTING_COMPLETED,
    LISTING_EXPIRED,
    OPEN_LISTING_STATUSES,
    REQUEST_APPROVED,
    REQUEST_CANCELLED,
    REQUEST_COMPLETED,
    REQUEST_PENDING,
    REQUEST_REJECTED,
)
from app.database import utcnow
from app.models import FoodListing, FoodRequest, User
from app.schemas.food_request import RequestCreate, RequestOut
from app.services.food_service import conflict, derive_status, lock_listing


def serialize_request(req: FoodRequest, viewer: User) -> RequestOut:
    food = req.food
    donor = food.donor
    recipient = req.recipient
    is_recipient_view = viewer.user_id == req.recipient_id
    unlocked = req.request_status in (REQUEST_APPROVED, REQUEST_COMPLETED)

    data = dict(
        request_id=req.request_id,
        food_id=req.food_id,
        recipient_id=req.recipient_id,
        requested_quantity=req.requested_quantity,
        request_status=req.request_status,
        request_date=req.request_date,
        updated_at=req.updated_at,
        completed_at=req.completed_at,
        food_name=food.food_name,
        food_category=food.category,
        food_image_url=food.image_url,
        unit=food.unit,
        listing_status=food.listing_status,
        available_until=food.available_until,
        pickup_location=food.pickup_location,
        donor_id=food.donor_id,
        donor_name=donor.full_name,
        recipient_name=recipient.full_name,
    )
    if is_recipient_view:
        if unlocked:  # collection details only after approval
            data["donor_phone"] = donor.phone
            data["donor_email"] = donor.email
    else:
        data["recipient_phone"] = recipient.phone
        data["recipient_email"] = recipient.email
    return RequestOut(**data)


def get_request_or_404(db: Session, request_id: int) -> FoodRequest:
    req = db.get(FoodRequest, request_id)
    if req is None:
        raise HTTPException(status_code=404, detail="Request not found")
    return req


def assert_can_view(req: FoodRequest, user: User) -> None:
    if user.user_id not in (req.recipient_id, req.food.donor_id):
        raise HTTPException(status_code=403, detail="You do not have access to this request")


def create_request(db: Session, recipient: User, data: RequestCreate) -> FoodRequest:
    listing = lock_listing(db, data.food_id)
    now = utcnow()
    if listing.listing_status not in OPEN_LISTING_STATUSES or listing.available_until <= now:
        raise conflict("This food listing is no longer accepting requests")
    if data.requested_quantity > listing.remaining_quantity:
        raise conflict(
            f"Requested quantity exceeds the available quantity ({listing.remaining_quantity} {listing.unit})"
        )
    duplicate = db.scalar(
        select(func.count())
        .select_from(FoodRequest)
        .where(
            FoodRequest.food_id == listing.food_id,
            FoodRequest.recipient_id == recipient.user_id,
            FoodRequest.request_status == REQUEST_PENDING,
        )
    )
    if duplicate:
        raise conflict("You already have a pending request for this listing. Cancel it to submit a new one.")

    req = FoodRequest(
        food_id=listing.food_id,
        recipient_id=recipient.user_id,
        requested_quantity=data.requested_quantity,
        request_status=REQUEST_PENDING,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


def _lock_for_decision(db: Session, request_id: int):
    """Lock the parent listing, then re-read the request so state checks use current data."""
    req = get_request_or_404(db, request_id)
    listing = lock_listing(db, req.food_id)
    db.refresh(req)
    return req, listing


def approve_request(db: Session, request_id: int, donor: User) -> FoodRequest:
    req, listing = _lock_for_decision(db, request_id)
    if listing.donor_id != donor.user_id:
        raise HTTPException(status_code=403, detail="You can only approve requests for your own listings")
    if req.request_status != REQUEST_PENDING:
        raise conflict("Only pending requests can be approved")
    if listing.listing_status in (LISTING_CANCELLED, LISTING_EXPIRED) or listing.available_until <= utcnow():
        raise conflict("This listing has expired or was cancelled")
    if req.requested_quantity > listing.remaining_quantity:
        raise conflict(
            f"Not enough food left to approve this request (remaining: {listing.remaining_quantity} {listing.unit})"
        )

    listing.remaining_quantity = listing.remaining_quantity - req.requested_quantity
    listing.listing_status = derive_status(listing)
    req.request_status = REQUEST_APPROVED
    db.commit()
    db.refresh(req)
    return req


def reject_request(db: Session, request_id: int, donor: User) -> FoodRequest:
    req, listing = _lock_for_decision(db, request_id)
    if listing.donor_id != donor.user_id:
        raise HTTPException(status_code=403, detail="You can only reject requests for your own listings")
    if req.request_status != REQUEST_PENDING:
        raise conflict("Only pending requests can be rejected")
    req.request_status = REQUEST_REJECTED
    db.commit()
    db.refresh(req)
    return req


def cancel_request(db: Session, request_id: int, recipient: User) -> FoodRequest:
    req, _listing = _lock_for_decision(db, request_id)
    if req.recipient_id != recipient.user_id:
        raise HTTPException(status_code=403, detail="You can only cancel your own requests")
    if req.request_status != REQUEST_PENDING:
        raise conflict("Only pending requests can be cancelled")
    req.request_status = REQUEST_CANCELLED
    db.commit()
    db.refresh(req)
    return req


def complete_request(db: Session, request_id: int, donor: User) -> FoodRequest:
    req, listing = _lock_for_decision(db, request_id)
    if listing.donor_id != donor.user_id:
        raise HTTPException(status_code=403, detail="You can only complete donations for your own listings")
    if req.request_status != REQUEST_APPROVED:
        raise conflict("Only approved requests can be marked as collected")

    now = utcnow()
    req.request_status = REQUEST_COMPLETED
    req.completed_at = now
    db.flush()

    # The listing is completed once all food is allocated and every approved request is collected.
    outstanding = db.scalar(
        select(func.count())
        .select_from(FoodRequest)
        .where(
            FoodRequest.food_id == listing.food_id,
            FoodRequest.request_status == REQUEST_APPROVED,
        )
    )
    if listing.remaining_quantity <= 0 and not outstanding and listing.listing_status not in (
        LISTING_CANCELLED,
        LISTING_EXPIRED,
    ):
        listing.listing_status = LISTING_COMPLETED
        db.execute(
            update(FoodRequest)
            .where(FoodRequest.food_id == listing.food_id, FoodRequest.request_status == REQUEST_PENDING)
            .values(request_status=REQUEST_REJECTED, updated_at=now)
        )
    db.commit()
    db.refresh(req)
    return req


def recipient_requests(db: Session, recipient: User, statuses: Optional[tuple] = None) -> list[FoodRequest]:
    stmt = select(FoodRequest).where(FoodRequest.recipient_id == recipient.user_id)
    if statuses:
        stmt = stmt.where(FoodRequest.request_status.in_(statuses))
    return list(db.scalars(stmt.order_by(FoodRequest.request_date.desc())).all())


def donor_requests(db: Session, donor: User, statuses: Optional[tuple] = None) -> list[FoodRequest]:
    stmt = (
        select(FoodRequest)
        .join(FoodListing, FoodListing.food_id == FoodRequest.food_id)
        .where(FoodListing.donor_id == donor.user_id)
    )
    if statuses:
        stmt = stmt.where(FoodRequest.request_status.in_(statuses))
    return list(db.scalars(stmt.order_by(FoodRequest.request_date.desc())).all())
