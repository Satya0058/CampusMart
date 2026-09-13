from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Date, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database import Base

class MarketRequest(Base):
    __tablename__ = "market_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    budget = Column(Float, nullable=False) # max price willing to pay
    needed_before = Column(String, nullable=False) # Date string or readable deadline
    status = Column(String, default="open") # open, fulfilled, closed
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="market_requests")
    responses = relationship("RequestResponse", back_populates="request", cascade="all, delete-orphan")

class RequestResponse(Base):
    __tablename__ = "request_responses"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("market_requests.id"), nullable=False)
    responder_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=True)
    message = Column(Text, nullable=False)
    offered_price = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    request = relationship("MarketRequest", back_populates="responses")
    responder = relationship("User", foreign_keys=[responder_id])
    item = relationship("Item", foreign_keys=[item_id])

