from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.review import Review, Report
from backend.app.schemas.user import UserOut, UserProfileUpdate
from backend.app.schemas.review import ReviewCreate, ReviewOut, ReportCreate
from backend.app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/me", response_model=UserOut)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserOut)
def update_my_profile(
    update_data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if update_data.full_name is not None:
        current_user.full_name = update_data.full_name
    if update_data.department is not None:
        current_user.department = update_data.department
    if update_data.year is not None:
        current_user.year = update_data.year
    if update_data.gender is not None:
        current_user.gender = update_data.gender
    if update_data.bio is not None:
        current_user.bio = update_data.bio
    if update_data.profile_image is not None:
        current_user.profile_image = update_data.profile_image

    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/{user_id}", response_model=UserOut)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student profile not found.")
    return user

@router.get("/{user_id}/reviews", response_model=List[ReviewOut])
def get_user_reviews(user_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.target_user_id == user_id).order_by(Review.created_at.desc()).all()
    return reviews

@router.post("/reviews", response_model=ReviewOut)
def create_review(
    review_in: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.id == review_in.target_user_id:
        raise HTTPException(status_code=400, detail="You cannot review yourself.")

    target_user = db.query(User).filter(User.id == review_in.target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target student not found.")

    review = Review(
        reviewer_id=current_user.id,
        target_user_id=review_in.target_user_id,
        item_id=review_in.item_id,
        rating=review_in.rating,
        comment=review_in.comment,
        transaction_type=review_in.transaction_type or "buy"
    )
    db.add(review)

    # Recalculate target user rating and review count
    all_target_reviews = db.query(Review).filter(Review.target_user_id == review_in.target_user_id).all()
    total_rating = sum([r.rating for r in all_target_reviews]) + review_in.rating
    count = len(all_target_reviews) + 1
    target_user.rating = round(total_rating / count, 1)
    target_user.review_count = count
    target_user.transactions_count = target_user.transactions_count + 1

    db.commit()
    db.refresh(review)
    return review

@router.post("/report")
def report_item_or_user(
    report_in: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = Report(
        reporter_id=current_user.id,
        target_type=report_in.target_type,
        target_id=report_in.target_id,
        reason=report_in.reason,
        details=report_in.details,
        status="pending"
    )
    db.add(report)
    db.commit()
    return {"message": "Report logged securely. Campus administrators will review this within 24 hours."}

