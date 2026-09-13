from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database import Base

class ExchangeRequest(Base):
    __tablename__ = "exchange_requests"

    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    requester_item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    requested_item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    message = Column(Text, nullable=True)
    status = Column(String, default="pending") # pending, accepted, rejected, completed
    compatibility_score = Column(Float, default=90.0) # Match % estimated by algorithm
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    requester = relationship("User", foreign_keys=[requester_id])
    owner = relationship("User", foreign_keys=[owner_id])
    requester_item = relationship("Item", foreign_keys=[requester_item_id])
    requested_item = relationship("Item", foreign_keys=[requested_item_id])

