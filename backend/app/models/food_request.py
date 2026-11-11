from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import CheckConstraint, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.constants import REQUEST_PENDING
from app.database import Base, UTCDateTime, utcnow
from app.models.food import FoodListing
from app.models.user import User


class FoodRequest(Base):
    __tablename__ = "food_requests"
    __table_args__ = (
        CheckConstraint("requested_quantity > 0", name="ck_request_quantity_positive"),
        CheckConstraint(
            "request_status IN ('Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed')",
            name="ck_request_status",
        ),
    )

    request_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    food_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("food_listings.food_id", ondelete="CASCADE"), nullable=False, index=True
    )
    recipient_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True
    )
    requested_quantity: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    request_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=REQUEST_PENDING, index=True
    )
    request_date: Mapped[datetime] = mapped_column(UTCDateTime, nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        UTCDateTime, nullable=False, default=utcnow, onupdate=utcnow
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(UTCDateTime, nullable=True)

    food: Mapped[FoodListing] = relationship(
        FoodListing, back_populates="requests", lazy="joined", innerjoin=True
    )
    recipient: Mapped[User] = relationship(User, lazy="joined", innerjoin=True)
