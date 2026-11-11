import os

# Use a throw-away SQLite file for tests; must be set before the app is imported.
os.environ["DATABASE_URL"] = "sqlite:///./test_shareplate.db"
os.environ["UPLOAD_DIR"] = "test_uploads"

from datetime import datetime, timedelta, timezone  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture()
def client():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)


def register(client, email, role, name="Test User"):
    return client.post(
        "/api/auth/register",
        json={
            "full_name": name,
            "email": email,
            "password": "Passw0rdX",
            "phone": "9876543210",
            "address": "Some street",
            "role": role,
        },
    )


def login_headers(client, email):
    res = client.post("/api/auth/login", json={"email": email, "password": "Passw0rdX"})
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def food_payload(**overrides):
    payload = {
        "food_name": "Veg biryani",
        "description": "Freshly cooked, packed in boxes",
        "category": "Vegetarian",
        "quantity": 10,
        "unit": "Meals",
        "pickup_location": "12 Market Road",
        "available_until": (datetime.now(timezone.utc) + timedelta(hours=5)).isoformat(),
    }
    payload.update(overrides)
    return payload


@pytest.fixture()
def users(client):
    register(client, "donor@example.com", "Donor", "Dana Donor")
    register(client, "other.donor@example.com", "Donor", "Other Donor")
    register(client, "r1@example.com", "Recipient", "Rita Recipient")
    register(client, "r2@example.com", "Recipient", "Ravi Recipient")
    return {
        "donor": login_headers(client, "donor@example.com"),
        "other_donor": login_headers(client, "other.donor@example.com"),
        "r1": login_headers(client, "r1@example.com"),
        "r2": login_headers(client, "r2@example.com"),
    }
