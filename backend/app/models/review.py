from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=True)
    rating = Column(Float, nullable=False) # 1.0 to 5.0
    comment = Column(Text, nullable=False)
    transaction_type = Column(String, default="buy") # buy, sell, rent, exchange
    created_at = Column(DateTime, default=datetime.utcnow)

    reviewer = relationship("User", foreign_keys=[reviewer_id])
    target_user = relationship("User", foreign_keys=[target_user_id])
    item = relationship("Item", foreign_keys=[item_id])

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_type = Column(String, nullable=False) # item, user
    target_id = Column(Integer, nullable=False)
    reason = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    status = Column(String, default="pending") # pending, resolved, dismissed
    created_at = Column(DateTime, default=datetime.utcnow)

    reporter = relationship("User", foreign_keys=[reporter_id])

