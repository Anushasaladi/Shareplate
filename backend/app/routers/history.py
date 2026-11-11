from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.constants import REQUEST_CANCELLED, REQUEST_COMPLETED, REQUEST_REJECTED
from app.database import get_db
from app.dependencies import refresh_expired_listings, require_donor, require_recipient
from app.models import User
from app.schemas.food_request import RequestOut
from app.services import request_service as svc

router = APIRouter(
    prefix="/api/history",
    tags=["Donation History"],
    dependencies=[Depends(refresh_expired_listings)],
)


@router.get("/donations", response_model=list[RequestOut])
def donor_history(donor: User = Depends(require_donor), db: Session = Depends(get_db)):
    """Completed donations made by the logged-in donor."""
    rows = svc.donor_requests(db, donor, (REQUEST_COMPLETED,))
    return [svc.serialize_request(r, donor) for r in rows]


@router.get("/requests", response_model=list[RequestOut])
def recipient_history(recipient: User = Depends(require_recipient), db: Session = Depends(get_db)):
    """Finished requests (completed, rejected or cancelled) of the logged-in recipient."""
    rows = svc.recipient_requests(db, recipient, (REQUEST_COMPLETED, REQUEST_REJECTED, REQUEST_CANCELLED))
    return [svc.serialize_request(r, recipient) for r in rows]
