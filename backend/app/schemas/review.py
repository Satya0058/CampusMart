from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from backend.app.schemas.user import UserOut

class ReviewCreate(BaseModel):
    target_user_id: int
    item_id: Optional[int] = None
    rating: float
    comment: str
    transaction_type: Optional[str] = "buy"

class ReviewOut(BaseModel):
    id: int
    reviewer_id: int
    target_user_id: int
    item_id: Optional[int] = None
    rating: float
    comment: str
    transaction_type: str
    created_at: datetime
    reviewer: Optional[UserOut] = None

    class Config:
        from_attributes = True

class ReportCreate(BaseModel):
    target_type: str # item, user
    target_id: int
    reason: str
    details: Optional[str] = None

