import sys
import os

# Automatically add project root to sys.path so the backend can run from ANY directory
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.database import Base, engine, BASE_DIR
from backend.app.routers import (
    auth_router,
    users_router,
    items_router,
    exchanges_router,
    rentals_router,
    requests_router,
    messages_router,
    favorites_router,
    notifications_router,
    analytics_router,
    seed_router
)

# Ensure database tables exist in campusmate.db
Base.metadata.create_all(bind=engine)

# Ensure uploads directory exists
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="CampusMart API",
    description="CampusMart: Private student marketplace backend for campus buying, selling, renting, and peer exchange.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local uploads directory
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(items_router)
app.include_router(exchanges_router)
app.include_router(rentals_router)
app.include_router(requests_router)
app.include_router(messages_router)
app.include_router(favorites_router)
app.include_router(notifications_router)
app.include_router(analytics_router)
app.include_router(seed_router)

@app.get("/")
def root():
    return {
        "app": "CampusMart API",
        "status": "online",
        "docs_url": "/docs",
        "version": "1.0.0"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "campusmart-backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)

