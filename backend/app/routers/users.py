from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas.user import UserOut, UserUpdate

router = APIRouter(prefix="/api/users", tags=["User Profile"])


@router.get("/me", response_model=UserOut)
def get_profile(user: User = Depends(get_current_user)):
    return user


@router.put("/me", response_model=UserOut)
def update_profile(data: UserUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    fields = data.model_dump(exclude_unset=True)
    for key, value in fields.items():
        if key in ("full_name", "phone") and value is None:
            continue
        if isinstance(value, str):
            value = value.strip() or None
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user
