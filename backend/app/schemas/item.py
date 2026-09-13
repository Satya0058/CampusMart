from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from backend.app.schemas.user import UserOut

class ItemImageOut(BaseModel):
    id: int
    image_url: str
    is_primary: bool

    class Config:
        from_attributes = True

class ItemCreate(BaseModel):
    title: str
    category: str
    description: str
    condition: str = "Like New"
    selling_price: Optional[float] = None
    original_price: Optional[float] = None
    rental_price_per_day: Optional[float] = None
    is_sell: bool = True
    is_rent: bool = False
    is_exchange: bool = False
    exchange_preference: Optional[str] = None
    product_url: Optional[str] = None
    images: Optional[List[str]] = [] # URLs or paths

class ItemUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    condition: Optional[str] = None
    selling_price: Optional[float] = None
    original_price: Optional[float] = None
    rental_price_per_day: Optional[float] = None
    is_sell: Optional[bool] = None
    is_rent: Optional[bool] = None
    is_exchange: Optional[bool] = None
    exchange_preference: Optional[str] = None
    product_url: Optional[str] = None
    availability: Optional[str] = None
    status: Optional[str] = None

class ItemOut(BaseModel):
    id: int
    seller_id: int
    title: str
    category: str
    description: str
    condition: str
    selling_price: Optional[float] = None
    original_price: Optional[float] = None
    rental_price_per_day: Optional[float] = None
    is_sell: bool
    is_rent: bool
    is_exchange: bool
    exchange_preference: Optional[str] = None
    product_url: Optional[str] = None
    availability: Optional[str] = "Available"
    status: Optional[str] = "active"
    views: Optional[int] = 0
    created_at: Optional[datetime] = None
    images: List[ItemImageOut] = []
    seller: Optional[UserOut] = None

    # Computed fields for frontend convenience
    savings_amount: Optional[float] = None
    discount_percentage: Optional[int] = None
    is_favorited: Optional[bool] = False

    class Config:
        from_attributes = True

