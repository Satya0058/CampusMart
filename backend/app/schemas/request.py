from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from backend.app.schemas.user import UserOut
from backend.app.schemas.item import ItemOut

class MarketRequestCreate(BaseModel):
    title: str
    category: str
    description: str
    budget: float
    needed_before: str

class RequestResponseCreate(BaseModel):
    item_id: Optional[int] = None
    message: str
    offered_price: Optional[float] = None

class RequestResponseOut(BaseModel):
    id: int
    request_id: int
    responder_id: int
    item_id: Optional[int] = None
    message: str
    offered_price: Optional[float] = None
    created_at: datetime
    responder: Optional[UserOut] = None
    item: Optional[ItemOut] = None
    conversation_id: Optional[int] = None

    class Config:
        from_attributes = True

class MarketRequestOut(BaseModel):
    id: int
    user_id: int
    title: str
    category: str
    description: str
    budget: float
    needed_before: str
    status: str
    created_at: datetime
    user: Optional[UserOut] = None
    responses: List[RequestResponseOut] = []

    class Config:
        from_attributes = True

