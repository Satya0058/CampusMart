from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from backend.app.schemas.user import UserOut
from backend.app.schemas.item import ItemOut

class ExchangeCreate(BaseModel):
    owner_id: int
    requester_item_id: int
    requested_item_id: int
    message: Optional[str] = "Hey! Would love to swap this item with you on campus."

class ExchangeRespond(BaseModel):
    status: str # accepted, rejected, completed

class ExchangeOut(BaseModel):
    id: int
    requester_id: int
    owner_id: int
    requester_item_id: int
    requested_item_id: int
    message: Optional[str] = None
    status: str
    compatibility_score: float
    created_at: datetime
    updated_at: datetime
    
    requester: Optional[UserOut] = None
    owner: Optional[UserOut] = None
    requester_item: Optional[ItemOut] = None
    requested_item: Optional[ItemOut] = None

    class Config:
        from_attributes = True

class ExchangeMatchOut(BaseModel):
    my_item: ItemOut
    target_item: ItemOut
    target_user: UserOut
    compatibility_score: float
    reason: str

