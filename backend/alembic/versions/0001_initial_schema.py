"""Initial schema: users, food_listings, food_requests

Revision ID: 0001
Revises:
Create Date: 2026-11-10
"""
import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("user_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("full_name", sa.String(100), nullable=False),
        sa.Column("email", sa.String(150), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("profile_image_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("role IN ('Donor', 'Recipient')", name="ck_users_role"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "food_listings",
        sa.Column("food_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("donor_id", sa.Integer(), sa.ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False),
        sa.Column("food_name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("quantity", sa.Numeric(10, 2), nullable=False),
        sa.Column("remaining_quantity", sa.Numeric(10, 2), nullable=False),
        sa.Column("unit", sa.String(20), nullable=False),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("pickup_location", sa.Text(), nullable=False),
        sa.Column("prepared_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("available_from", sa.DateTime(timezone=True), nullable=True),
        sa.Column("available_until", sa.DateTime(timezone=True), nullable=False),
        sa.Column("listing_status", sa.String(30), nullable=False, server_default="Available"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("quantity > 0", name="ck_food_quantity_positive"),
        sa.CheckConstraint("remaining_quantity >= 0 AND remaining_quantity <= quantity", name="ck_food_remaining_range"),
        sa.CheckConstraint(
            "listing_status IN ('Available', 'Partially Reserved', 'Fully Reserved', "
            "'Completed', 'Expired', 'Cancelled')",
            name="ck_food_listing_status",
        ),
    )
    op.create_index("ix_food_listings_donor_id", "food_listings", ["donor_id"])
    op.create_index("ix_food_listings_category", "food_listings", ["category"])
    op.create_index("ix_food_listings_status_deadline", "food_listings", ["listing_status", "available_until"])

    op.create_table(
        "food_requests",
        sa.Column("request_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("food_id", sa.Integer(), sa.ForeignKey("food_listings.food_id", ondelete="CASCADE"), nullable=False),
        sa.Column("recipient_id", sa.Integer(), sa.ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False),
        sa.Column("requested_quantity", sa.Numeric(10, 2), nullable=False),
        sa.Column("request_status", sa.String(20), nullable=False, server_default="Pending"),
        sa.Column("request_date", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("requested_quantity > 0", name="ck_request_quantity_positive"),
        sa.CheckConstraint(
            "request_status IN ('Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed')",
            name="ck_request_status",
        ),
    )
    op.create_index("ix_food_requests_food_id", "food_requests", ["food_id"])
    op.create_index("ix_food_requests_recipient_id", "food_requests", ["recipient_id"])
    op.create_index("ix_food_requests_request_status", "food_requests", ["request_status"])


def downgrade() -> None:
    op.drop_table("food_requests")
    op.drop_table("food_listings")
    op.drop_table("users")
