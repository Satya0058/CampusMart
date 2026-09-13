from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from backend.app.database import get_db
from backend.app.models.message import Conversation, Message
from backend.app.models.user import User
from backend.app.models.item import Item
from backend.app.schemas.message import MessageCreate, MessageOut, ConversationOut
from backend.app.services.auth_service import get_current_user
from backend.app.services.notification_service import NotificationService

router = APIRouter(prefix="/api/messages", tags=["messages"])

@router.get("/conversations", response_model=List[ConversationOut])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    convs = db.query(Conversation).filter(
        or_(
            Conversation.user1_id == current_user.id,
            Conversation.user2_id == current_user.id
        )
    ).order_by(Conversation.updated_at.desc()).all()

    result = []
    for c in convs:
        unread = db.query(Message).filter(
            Message.conversation_id == c.id,
            Message.sender_id != current_user.id,
            Message.is_read == False
        ).count()
        c_dict = ConversationOut.model_validate(c).model_dump()
        c_dict["unread_count"] = unread
        result.append(ConversationOut(**c_dict))
    return result

@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageOut])
def get_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    if conv.user1_id != current_user.id and conv.user2_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this conversation.")

    # Mark unread messages as read
    db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.sender_id != current_user.id,
        Message.is_read == False
    ).update({"is_read": True})
    db.commit()

    messages = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at.asc()).all()
    return messages

@router.post("/send", response_model=MessageOut)
def send_message(
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conv = None
    if payload.conversation_id:
        conv = db.query(Conversation).filter(Conversation.id == payload.conversation_id).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found.")
        recipient_id = conv.user2_id if conv.user1_id == current_user.id else conv.user1_id
    elif payload.recipient_id:
        recipient_id = payload.recipient_id
        if recipient_id == current_user.id:
            raise HTTPException(status_code=400, detail="Cannot message yourself.")
        
        # Check if conversation already exists between these 2 users (optionally with item_id)
        conv = db.query(Conversation).filter(
            or_(
                and_(Conversation.user1_id == current_user.id, Conversation.user2_id == recipient_id),
                and_(Conversation.user1_id == recipient_id, Conversation.user2_id == current_user.id)
            )
        ).first()

        if not conv:
            conv = Conversation(
                user1_id=current_user.id,
                user2_id=recipient_id,
                item_id=payload.item_id,
                last_message=payload.content,
                updated_at=datetime.utcnow()
            )
            db.add(conv)
            db.commit()
            db.refresh(conv)
    else:
        raise HTTPException(status_code=400, detail="Either conversation_id or recipient_id is required.")

    msg = Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        content=payload.content,
        is_read=False
    )
    db.add(msg)

    # Update conversation's last message and item if needed
    conv.last_message = payload.content
    conv.updated_at = datetime.utcnow()
    if payload.item_id and not conv.item_id:
        conv.item_id = payload.item_id

    db.commit()
    db.refresh(msg)

    # Dispatch notification to recipient
    NotificationService.send(
        db=db,
        user_id=recipient_id,
        type="message",
        title=f"New Message from {current_user.full_name}",
        message=payload.content[:60] + ("..." if len(payload.content) > 60 else ""),
        link="/messages"
    )

    return msg

