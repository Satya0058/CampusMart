from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.notification import Notification
from backend.app.models.user import User
from backend.app.schemas.notification import NotificationOut
from backend.app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

@router.get("", response_model=List[NotificationOut])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notifs = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(30).all()
    return notifs

@router.put("/{notif_id}/read")
def mark_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    notif.is_read = True
    db.commit()
    return {"status": "success"}

@router.put("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"status": "success"}

