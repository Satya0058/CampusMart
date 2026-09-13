from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database import Base

class RentalBooking(Base):
    __tablename__ = "rental_bookings"

    id = Column(Integer, primary_key=True, index=True)
    renter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_days = Column(Integer, nullable=False)
    daily_rate = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(String, default="requested") # requested, approved, reserved, rented, returned, completed, cancelled
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    renter = relationship("User", foreign_keys=[renter_id])
    owner = relationship("User", foreign_keys=[owner_id])
    item = relationship("Item", foreign_keys=[item_id])

