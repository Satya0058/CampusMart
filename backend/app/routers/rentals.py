from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.rental import RentalBooking
from backend.app.models.item import Item
from backend.app.models.user import User
from backend.app.schemas.rental import RentalCreate, RentalStatusUpdate, RentalOut
from backend.app.services.auth_service import get_current_user
from backend.app.services.rental_service import RentalService
from backend.app.services.notification_service import NotificationService

router = APIRouter(prefix="/api/rentals", tags=["rentals"])

@router.post("/book", response_model=RentalOut)
def book_rental(
    payload: RentalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(Item).filter(Item.id == payload.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")
    if not item.is_rent or not item.rental_price_per_day:
        raise HTTPException(status_code=400, detail="This item is not currently offered for campus rental.")
    if item.seller_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot rent your own item.")

    # 1. Validate dates and calculate cost
    total_days, total_amount = RentalService.calculate_cost(
        daily_rate=item.rental_price_per_day,
        start_date=payload.start_date,
        end_date=payload.end_date
    )

    # 2. Check for date conflict / overlap
    is_available = RentalService.validate_availability(
        db=db,
        item_id=item.id,
        start_date=payload.start_date,
        end_date=payload.end_date
    )
    if not is_available:
        raise HTTPException(
            status_code=400,
            detail="Item is already reserved or rented for the chosen dates. Please choose another date range."
        )

    # 3. Create booking
    booking = RentalBooking(
        renter_id=current_user.id,
        owner_id=item.seller_id,
        item_id=item.id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        total_days=total_days,
        daily_rate=item.rental_price_per_day,
        total_amount=total_amount,
        status="requested"
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    # 4. Notify owner
    NotificationService.send(
        db=db,
        user_id=item.seller_id,
        type="rental",
        title="New Rental Request Received! 📅",
        message=f"{current_user.full_name} requested to rent '{item.title}' for {total_days} days (₹{total_amount}).",
        link="/rentals"
    )

    return booking

@router.get("/my-rentals")
def get_my_rentals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Rentals as borrower (renter)
    as_renter = db.query(RentalBooking).filter(
        RentalBooking.renter_id == current_user.id
    ).order_by(RentalBooking.created_at.desc()).all()

    # Rentals as owner (lender)
    as_owner = db.query(RentalBooking).filter(
        RentalBooking.owner_id == current_user.id
    ).order_by(RentalBooking.created_at.desc()).all()

    return {
        "borrowed": [RentalOut.model_validate(r) for r in as_renter],
        "lent": [RentalOut.model_validate(r) for r in as_owner]
    }

@router.put("/{rental_id}/status", response_model=RentalOut)
def update_rental_status(
    rental_id: int,
    payload: RentalStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = db.query(RentalBooking).filter(RentalBooking.id == rental_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Rental booking not found.")

    if booking.owner_id != current_user.id and booking.renter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this rental.")

    valid_transitions = ["approved", "reserved", "rented", "returned", "completed", "cancelled"]
    new_status = payload.status.lower()
    if new_status not in valid_transitions:
        raise HTTPException(status_code=400, detail=f"Invalid status: {new_status}")

    # Re-check overlap before approving or reserving
    if new_status in ["approved", "reserved", "rented"]:
        is_free = RentalService.validate_availability(
            db=db,
            item_id=booking.item_id,
            start_date=booking.start_date,
            end_date=booking.end_date,
            exclude_booking_id=booking.id
        )
        if not is_free:
            raise HTTPException(status_code=400, detail="Cannot approve: Overlapping booking already active for these dates.")

    booking.status = new_status

    # Update item availability
    item = db.query(Item).filter(Item.id == booking.item_id).first()
    if item:
        if new_status in ["reserved", "rented"]:
            item.availability = "In Rental"
        elif new_status in ["returned", "completed", "cancelled"]:
            item.availability = "Available"

    if new_status == "completed":
        booking.owner.transactions_count = (booking.owner.transactions_count or 0) + 1
        booking.renter.transactions_count = (booking.renter.transactions_count or 0) + 1

    db.commit()
    db.refresh(booking)

    # Notify counterpart
    other_user_id = booking.renter_id if current_user.id == booking.owner_id else booking.owner_id
    NotificationService.send(
        db=db,
        user_id=other_user_id,
        type="rental",
        title=f"Rental Status: {new_status.capitalize()}",
        message=f"Rental for '{booking.item.title}' is now marked as {new_status}.",
        link="/rentals"
    )

    return booking

