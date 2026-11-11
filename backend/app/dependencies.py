"""Shared FastAPI dependencies: authentication, role checks and listing expiry."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.constants import ROLE_DONOR, ROLE_RECIPIENT
from app.database import get_db
from app.models import User
from app.security import decode_access_token
from app.services.food_service import expire_listings

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required or token is invalid",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized
    payload = decode_access_token(credentials.credentials)
    if not payload or "sub" not in payload:
        raise unauthorized
    try:
        user_id = int(payload["sub"])
    except (TypeError, ValueError):
        raise unauthorized
    user = db.get(User, user_id)
    if user is None:
        raise unauthorized
    return user


def require_donor(user: User = Depends(get_current_user)) -> User:
    # The role always comes from the database, never from the token or the client.
    if user.role != ROLE_DONOR:
        raise HTTPException(status_code=403, detail="Only donors can perform this action")
    return user


def require_recipient(user: User = Depends(get_current_user)) -> User:
    if user.role != ROLE_RECIPIENT:
        raise HTTPException(status_code=403, detail="Only recipients can perform this action")
    return user


def refresh_expired_listings(db: Session = Depends(get_db)) -> None:
    expire_listings(db)
