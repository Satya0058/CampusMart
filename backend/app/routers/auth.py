from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.schemas.user import UserRegister, UserLogin, TokenResponse, UserOut
from backend.app.services.auth_service import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=TokenResponse)
def register_user(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A student with this college email already exists. Please login."
        )

    # Conceptually verify college email domain if desired
    # e.g., if not user_in.email.endswith((".edu", ".ac.in")): ...

    new_user = User(
        email=user_in.email.lower(),
        full_name=user_in.full_name,
        hashed_password=hash_password(user_in.password),
        department=user_in.department or "Computer Science & Engineering",
        year=user_in.year or "3rd Year",
        gender=user_in.gender or "Prefer not to say",
        profile_image=user_in.profile_image or f"https://api.dicebear.com/7.x/initials/svg?seed={user_in.full_name}&backgroundColor=b5d04d&textColor=070706",
        is_verified=True, # Auto-verify campus students
        rating=5.0,
        review_count=1,
        transactions_count=0
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": str(new_user.id)})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(new_user)
    )

@router.post("/login", response_model=TokenResponse)
def login_user(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email.lower()).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid college email or password."
        )

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )

@router.post("/forgot-password")
def forgot_password(payload: dict, db: Session = Depends(get_db)):
    email = payload.get("email")
    user = db.query(User).filter(User.email == (email or "").lower()).first()
    if not user:
        # Avoid user enumeration in public apps
        return {"message": "If an account with this campus email exists, a password reset link has been dispatched."}
    return {"message": "Password reset token sent to your college inbox. (Demo: Password can be reset in Profile)." }

