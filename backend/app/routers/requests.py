from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.constants import REQUEST_STATUSES
from app.database import get_db
from app.dependencies import (
    get_current_user,
    refresh_expired_listings,
    require_donor,
    require_recipient,
)
from app.models import User
from app.schemas.food_request import RequestCreate, RequestCreated, RequestOut
from app.services import request_service as svc

router = APIRouter(
    prefix="/api/requests",
    tags=["Food Requests"],
    dependencies=[Depends(refresh_expired_listings)],
)


def _status_filter(value: Optional[str]) -> Optional[tuple]:
    if not value:
        return None
    if value not in REQUEST_STATUSES:
        raise HTTPException(status_code=422, detail="Unknown status")
    return (value,)


@router.post("", response_model=RequestCreated, status_code=status.HTTP_201_CREATED)
def submit_request(
    data: RequestCreate,
    recipient: User = Depends(require_recipient),
    db: Session = Depends(get_db),
):
    req = svc.create_request(db, recipient, data)
    return RequestCreated(
        message="Food request submitted successfully",
        request_id=req.request_id,
        food_id=req.food_id,
        requested_quantity=req.requested_quantity,
        request_status=req.request_status,
    )


# NOTE: fixed paths first so they are not captured by "/{request_id}".
@router.get("/my-requests", response_model=list[RequestOut])
def my_requests(
    request_status: Optional[str] = Query(default=None, alias="status"),
    recipient: User = Depends(require_recipient),
    db: Session = Depends(get_db),
):
    rows = svc.recipient_requests(db, recipient, _status_filter(request_status))
    return [svc.serialize_request(r, recipient) for r in rows]


@router.get("/incoming", response_model=list[RequestOut])
def incoming_requests(
    request_status: Optional[str] = Query(default=None, alias="status"),
    donor: User = Depends(require_donor),
    db: Session = Depends(get_db),
):
    rows = svc.donor_requests(db, donor, _status_filter(request_status))
    return [svc.serialize_request(r, donor) for r in rows]


@router.get("/{request_id}", response_model=RequestOut)
def get_request(request_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    req = svc.get_request_or_404(db, request_id)
    svc.assert_can_view(req, user)
    return svc.serialize_request(req, user)


@router.patch("/{request_id}/approve", response_model=RequestOut)
def approve(request_id: int, donor: User = Depends(require_donor), db: Session = Depends(get_db)):
    return svc.serialize_request(svc.approve_request(db, request_id, donor), donor)


@router.patch("/{request_id}/reject", response_model=RequestOut)
def reject(request_id: int, donor: User = Depends(require_donor), db: Session = Depends(get_db)):
    return svc.serialize_request(svc.reject_request(db, request_id, donor), donor)


@router.patch("/{request_id}/cancel", response_model=RequestOut)
def cancel(request_id: int, recipient: User = Depends(require_recipient), db: Session = Depends(get_db)):
    return svc.serialize_request(svc.cancel_request(db, request_id, recipient), recipient)


@router.patch("/{request_id}/complete", response_model=RequestOut)
def complete(request_id: int, donor: User = Depends(require_donor), db: Session = Depends(get_db)):
    return svc.serialize_request(svc.complete_request(db, request_id, donor), donor)
