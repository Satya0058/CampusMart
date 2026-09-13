from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    department = Column(String, default="Computer Science & Engineering")
    year = Column(String, default="3rd Year")
    gender = Column(String, default="Not Specified")
    profile_image = Column(String, nullable=True)
    bio = Column(Text, default="Passionate student at campus. Active on CampusMart!")
    is_verified = Column(Boolean, default=True)
    rating = Column(Float, default=4.8)
    review_count = Column(Integer, default=0)
    transactions_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    items = relationship("Item", back_populates="seller", cascade="all, delete-orphan", foreign_keys="Item.seller_id")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    market_requests = relationship("MarketRequest", back_populates="user", cascade="all, delete-orphan")

