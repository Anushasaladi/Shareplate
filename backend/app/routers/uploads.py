import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile

from app.config import settings
from app.dependencies import get_current_user
from app.models import User

router = APIRouter(prefix="/api/uploads", tags=["Uploads"])

ALLOWED_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}


def _matches_signature(data: bytes, content_type: str) -> bool:
    if content_type == "image/jpeg":
        return data.startswith(b"\xff\xd8\xff")
    if content_type == "image/png":
        return data.startswith(b"\x89PNG\r\n\x1a\n")
    if content_type == "image/webp":
        return data[:4] == b"RIFF" and data[8:12] == b"WEBP"
    return False


@router.post("/image")
async def upload_image(file: UploadFile, _: User = Depends(get_current_user)):
    """Upload a JPEG/PNG/WebP image. Returns a URL path to use as image_url."""
    ext = ALLOWED_TYPES.get(file.content_type or "")
    if ext is None:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG or WebP images are allowed")
    max_bytes = settings.max_upload_mb * 1024 * 1024
    data = await file.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise HTTPException(status_code=413, detail=f"Image must be smaller than {settings.max_upload_mb} MB")
    if not _matches_signature(data, file.content_type):
        raise HTTPException(status_code=400, detail="File content does not match an image type")

    os.makedirs(settings.upload_dir, exist_ok=True)
    name = f"{uuid.uuid4().hex}{ext}"
    with open(os.path.join(settings.upload_dir, name), "wb") as fh:
        fh.write(data)
    return {"url": f"/uploads/{name}"}
