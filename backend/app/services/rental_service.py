from datetime import date
from sqlalchemy.orm import Session
from fastapi import HTTPException
from backend.app.models.rental import RentalBooking
from backend.app.models.item import Item

class RentalService:
    @staticmethod
    def calculate_cost(daily_rate: float, start_date: date, end_date: date) -> tuple[int, float]:
        if end_date < start_date:
            raise HTTPException(status_code=400, detail="End date must be on or after start date.")
        
        # Inclusive days or difference (minimum 1 day)
        days = (end_date - start_date).days
        total_days = max(1, days)
        total_amount = round(total_days * daily_rate, 2)
        return total_days, total_amount

    @staticmethod
    def validate_availability(db: Session, item_id: int, start_date: date, end_date: date, exclude_booking_id: int = None) -> bool:
        """
        Check for any overlapping bookings with active or reserved statuses.
        Two periods [A_start, A_end] and [B_start, B_end] overlap if:
        A_start <= B_end AND A_end >= B_start
        """
        query = db.query(RentalBooking).filter(
            RentalBooking.item_id == item_id,
            RentalBooking.status.in_(["approved", "reserved", "rented"]),
            RentalBooking.start_date <= end_date,
            RentalBooking.end_date >= start_date
        )
        if exclude_booking_id:
            query = query.filter(RentalBooking.id != exclude_booking_id)
        
        overlapping = query.first()
        return overlapping is None

