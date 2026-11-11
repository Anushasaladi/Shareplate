"""SharePlate API entry point.  Run with:  uvicorn app.main:app --reload"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routers import auth, dashboard, foods, history, requests, uploads, users

os.makedirs(settings.upload_dir, exist_ok=True)

app = FastAPI(
    title="SharePlate API",
    description="Surplus food donation and redistribution platform.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(foods.router)
app.include_router(requests.router)
app.include_router(history.router)
app.include_router(dashboard.router)
app.include_router(uploads.router)

app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


@app.get("/api/health", tags=["Health"])
def health():
    return {"status": "ok"}
