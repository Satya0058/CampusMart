from sqlalchemy.orm import Session
from backend.app.models.notification import Notification

class NotificationService:
    @staticmethod
    def send(
        db: Session,
        user_id: int,
        type: str,
        title: str,
        message: str,
        link: str = None
    ) -> Notification:
        notif = Notification(
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            link=link,
            is_read=False
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif

