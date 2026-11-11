"""Shared constants: roles, statuses, categories and units."""

ROLE_DONOR = "Donor"
ROLE_RECIPIENT = "Recipient"
ROLES = (ROLE_DONOR, ROLE_RECIPIENT)

# Food listing statuses
LISTING_AVAILABLE = "Available"
LISTING_PARTIAL = "Partially Reserved"
LISTING_FULL = "Fully Reserved"
LISTING_COMPLETED = "Completed"
LISTING_EXPIRED = "Expired"
LISTING_CANCELLED = "Cancelled"
LISTING_STATUSES = (
    LISTING_AVAILABLE,
    LISTING_PARTIAL,
    LISTING_FULL,
    LISTING_COMPLETED,
    LISTING_EXPIRED,
    LISTING_CANCELLED,
)
# Listings that can still accept new requests
OPEN_LISTING_STATUSES = (LISTING_AVAILABLE, LISTING_PARTIAL)
# Listings whose status never changes automatically
TERMINAL_LISTING_STATUSES = (LISTING_COMPLETED, LISTING_EXPIRED, LISTING_CANCELLED)

# Food request statuses
REQUEST_PENDING = "Pending"
REQUEST_APPROVED = "Approved"
REQUEST_REJECTED = "Rejected"
REQUEST_CANCELLED = "Cancelled"
REQUEST_COMPLETED = "Completed"
REQUEST_STATUSES = (
    REQUEST_PENDING,
    REQUEST_APPROVED,
    REQUEST_REJECTED,
    REQUEST_CANCELLED,
    REQUEST_COMPLETED,
)

CATEGORIES = (
    "Vegetarian",
    "Non-Vegetarian",
    "Vegan",
    "Fruits & Vegetables",
    "Bakery",
    "Dairy",
    "Packaged Food",
    "Beverages",
    "Other",
)

UNITS = ("Kg", "Litres", "Packets", "Meals", "Plates", "Pieces")
