from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserRegister(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    department: Optional[str] = "Computer Science & Engineering"
    year: Optional[str] = "3rd Year"
    gender: Optional[str] = "Prefer not to say"
    profile_image: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    year: Optional[str] = None
    gender: Optional[str] = None
    bio: Optional[str] = None
    profile_image: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    department: str
    year: str
    gender: str
    profile_image: Optional[str] = None
    bio: Optional[str] = None
    is_verified: bool
    rating: float
    review_count: int
    transactions_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

