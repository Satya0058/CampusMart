from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from backend.app.database import get_db
from backend.app.models.request import MarketRequest, RequestResponse
from backend.app.models.message import Conversation, Message
from backend.app.models.user import User
from backend.app.models.item import Item
from backend.app.schemas.request import MarketRequestCreate, RequestResponseCreate, MarketRequestOut, RequestResponseOut
from backend.app.services.auth_service import get_current_user, get_current_user_optional
from backend.app.services.notification_service import NotificationService

router = APIRouter(prefix="/api/requests", tags=["requests"])

@router.get("", response_model=List[MarketRequestOut])
def list_requests(
    category: Optional[str] = None,
    status_filter: Optional[str] = "open",
    exclude_me: Optional[bool] = True,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    query = db.query(MarketRequest)
    if status_filter and status_filter != "all":
        query = query.filter(MarketRequest.status == status_filter)
    if category and category != "All":
        query = query.filter(MarketRequest.category.ilike(f"%{category}%"))
    if exclude_me and current_user:
        query = query.filter(MarketRequest.user_id != current_user.id)

    requests = query.order_by(MarketRequest.created_at.desc()).all()
    return requests

@router.post("/create", response_model=MarketRequestOut)
def create_request(
    payload: MarketRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = MarketRequest(
        user_id=current_user.id,
        title=payload.title,
        category=payload.category,
        description=payload.description,
        budget=payload.budget,
        needed_before=payload.needed_before,
        status="open"
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req

@router.post("/{request_id}/respond", response_model=RequestResponseOut)
def respond_to_request(
    request_id: int,
    payload: RequestResponseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = db.query(MarketRequest).filter(MarketRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found.")
    if req.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot respond to your own item request.")

    resp = RequestResponse(
        request_id=req.id,
        responder_id=current_user.id,
        item_id=payload.item_id,
        message=payload.message,
        offered_price=payload.offered_price or req.budget
    )
    db.add(resp)
    db.commit()
    db.refresh(resp)

    # 1. Create or retrieve active message conversation between responder (Account 2 seller) and requester (Account 1 buyer)
    conv = db.query(Conversation).filter(
        or_(
            and_(Conversation.user1_id == current_user.id, Conversation.user2_id == req.user_id),
            and_(Conversation.user1_id == req.user_id, Conversation.user2_id == current_user.id)
        )
    ).first()

    chat_content = f"💡 [Peer Demand: '{req.title}'] (Offered: ₹{payload.offered_price or req.budget})\n{payload.message}"

    if not conv:
        conv = Conversation(
            user1_id=current_user.id,
            user2_id=req.user_id,
            item_id=payload.item_id,
            last_message=chat_content,
            updated_at=datetime.utcnow()
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
    else:
        if payload.item_id and not conv.item_id:
            conv.item_id = payload.item_id
        conv.last_message = chat_content
        conv.updated_at = datetime.utcnow()

    # 2. Add message to the conversation
    msg = Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        content=chat_content,
        is_read=False
    )
    db.add(msg)
    db.commit()

    # 3. Notify requester with direct link to messages
    NotificationService.send(
        db=db,
        user_id=req.user_id,
        type="message",
        title="Student Responded: 'I Have This!' 💡",
        message=f"{current_user.full_name} responded to your request for '{req.title}' (₹{payload.offered_price or req.budget}). Check your Messages!",
        link="/messages"
    )

    resp_out = RequestResponseOut.model_validate(resp)
    resp_out.conversation_id = conv.id
    return resp_out

@router.put("/{request_id}/status")
def update_request_status(
    request_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = db.query(MarketRequest).filter(MarketRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found.")
    if req.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only creator can modify this request.")

    new_status = payload.get("status")
    if new_status in ["open", "fulfilled", "closed"]:
        req.status = new_status
        db.commit()
        return {"status": "success", "request_status": req.status}
    raise HTTPException(status_code=400, detail="Invalid status.")

