from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database import Base

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, index=True, nullable=False)
    category = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=False)
    condition = Column(String, default="Like New") # Brand New, Like New, Good, Fair
    
    # Financials
    selling_price = Column(Float, nullable=True) # in INR
    original_price = Column(Float, nullable=True) # in INR
    rental_price_per_day = Column(Float, nullable=True) # in INR / day

    # Modes available
    is_sell = Column(Boolean, default=True)
    is_rent = Column(Boolean, default=False)
    is_exchange = Column(Boolean, default=False)
    
    exchange_preference = Column(String, nullable=True)
    product_url = Column(String, nullable=True)
    availability = Column(String, default="Available") # Available, In Rental, Reserved, Sold
    status = Column(String, default="active") # active, paused, sold
    views = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # AI Safety & Moderation
    ai_decision = Column(String, default="PENDING") # PENDING, APPROVE, REVIEW, BLOCK
    ai_confidence = Column(Float, nullable=True)
    ai_risk_level = Column(String, nullable=True) # LOW, MEDIUM, HIGH
    ai_reason = Column(Text, nullable=True)
    ai_scanned_at = Column(DateTime, nullable=True)

    # Relationships
    seller = relationship("User", back_populates="items", foreign_keys=[seller_id])
    images = relationship("ItemImage", back_populates="item", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="item", cascade="all, delete-orphan")

class ItemImage(Base):
    __tablename__ = "item_images"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    image_url = Column(String, nullable=False)
    is_primary = Column(Boolean, default=False)

    item = relationship("Item", back_populates="images")

