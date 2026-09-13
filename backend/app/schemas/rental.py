from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from backend.app.schemas.user import UserOut
from backend.app.schemas.item import ItemOut

class RentalCreate(BaseModel):
    item_id: int
    start_date: date
    end_date: date

class RentalStatusUpdate(BaseModel):
    status: str # approved, reserved, rented, returned, completed, cancelled

class RentalOut(BaseModel):
    id: int
    renter_id: int
    owner_id: int
    item_id: int
    start_date: date
    end_date: date
    total_days: int
    daily_rate: float
    total_amount: float
    status: str
    created_at: datetime

    renter: Optional[UserOut] = None
    owner: Optional[UserOut] = None
    item: Optional[ItemOut] = None

    class Config:
        from_attributes = True

