from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import CheckConstraint, ForeignKey, Index, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.constants import LISTING_AVAILABLE
from app.database import Base, UTCDateTime, utcnow
from app.models.user import User


class FoodListing(Base):
    __tablename__ = "food_listings"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_food_quantity_positive"),
        CheckConstraint(
            "remaining_quantity >= 0 AND remaining_quantity <= quantity",
            name="ck_food_remaining_range",
        ),
        CheckConstraint(
            "listing_status IN ('Available', 'Partially Reserved', 'Fully Reserved', "
            "'Completed', 'Expired', 'Cancelled')",
            name="ck_food_listing_status",
        ),
        Index("ix_food_listings_status_deadline", "listing_status", "available_until"),
    )

    food_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    donor_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True
    )
    food_name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    remaining_quantity: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pickup_location: Mapped[str] = mapped_column(Text, nullable=False)
    prepared_at: Mapped[Optional[datetime]] = mapped_column(UTCDateTime, nullable=True)
    available_from: Mapped[Optional[datetime]] = mapped_column(UTCDateTime, nullable=True)
    available_until: Mapped[datetime] = mapped_column(UTCDateTime, nullable=False)
    listing_status: Mapped[str] = mapped_column(
        String(30), nullable=False, default=LISTING_AVAILABLE
    )
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        UTCDateTime, nullable=False, default=utcnow, onupdate=utcnow
    )

    donor: Mapped[User] = relationship(User, lazy="joined", innerjoin=True)
    requests: Mapped[list["FoodRequest"]] = relationship(  # noqa: F821
        "FoodRequest", back_populates="food", lazy="select"
    )

    @property
    def donor_name(self) -> str:
        return self.donor.full_name

    @property
    def donor_address(self) -> Optional[str]:
        return self.donor.address
