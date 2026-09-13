from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.seed_data import seed_database

router = APIRouter(prefix="/api/seed", tags=["seed"])

@router.post("")
def trigger_seed(db: Session = Depends(get_db)):
    result = seed_database(db)
    return result

