from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from backend.app.schemas.user import UserOut
from backend.app.schemas.item import ItemOut

class MessageCreate(BaseModel):
    conversation_id: Optional[int] = None
    recipient_id: Optional[int] = None
    item_id: Optional[int] = None
    content: str

class MessageOut(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str
    is_read: bool
    created_at: datetime
    sender: Optional[UserOut] = None

    class Config:
        from_attributes = True

class ConversationOut(BaseModel):
    id: int
    user1_id: int
    user2_id: int
    item_id: Optional[int] = None
    last_message: Optional[str] = None
    updated_at: datetime
    user1: Optional[UserOut] = None
    user2: Optional[UserOut] = None
    item: Optional[ItemOut] = None
    unread_count: Optional[int] = 0

    class Config:
        from_attributes = True

