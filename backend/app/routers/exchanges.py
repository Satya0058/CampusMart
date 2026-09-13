from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from backend.app.database import get_db
from backend.app.models.exchange import ExchangeRequest
from backend.app.models.item import Item
from backend.app.models.user import User
from backend.app.models.message import Conversation, Message
from backend.app.schemas.exchange import ExchangeCreate, ExchangeRespond, ExchangeOut, ExchangeMatchOut
from backend.app.services.auth_service import get_current_user
from backend.app.services.matching_service import ExchangeMatchingService
from backend.app.services.notification_service import NotificationService

router = APIRouter(prefix="/api/exchanges", tags=["exchanges"])

@router.post("/propose", response_model=ExchangeOut)
def propose_exchange(
    payload: ExchangeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify target item exists and is open for exchange
    target_item = db.query(Item).filter(Item.id == payload.requested_item_id).first()
    if not target_item:
        raise HTTPException(status_code=404, detail="Target item not found.")
    if not target_item.is_exchange:
        raise HTTPException(status_code=400, detail="This item is not marked for exchange.")
    if target_item.seller_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot propose an exchange with your own item.")

    # Verify requester owns the offered item
    my_item = db.query(Item).filter(Item.id == payload.requester_item_id).first()
    if not my_item:
        raise HTTPException(status_code=404, detail="Your offered item was not found.")
    if my_item.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not own the item you are offering to swap.")

    # Calculate match compatibility score
    score, reason = ExchangeMatchingService.calculate_compatibility(my_item, target_item)

    exchange = ExchangeRequest(
        requester_id=current_user.id,
        owner_id=target_item.seller_id,
        requester_item_id=my_item.id,
        requested_item_id=target_item.id,
        message=payload.message or f"Hi! I'd like to trade my {my_item.title} for your {target_item.title}.",
        status="pending",
        compatibility_score=score
    )
    db.add(exchange)
    db.commit()
    db.refresh(exchange)

    # Create or update message conversation between requester and owner
    conv = db.query(Conversation).filter(
        or_(
            and_(Conversation.user1_id == current_user.id, Conversation.user2_id == target_item.seller_id),
            and_(Conversation.user1_id == target_item.seller_id, Conversation.user2_id == current_user.id)
        )
    ).first()

    seller_name = target_item.seller.full_name.split()[0] if target_item.seller and target_item.seller.full_name else "there"
    chat_content = f"🔄 [Exchange Proposal] Hi {seller_name}! I'd like to trade my '{my_item.title}' (Est. ₹{my_item.selling_price or my_item.original_price or 0}) for your '{target_item.title}' ({score}% Match).\nNote: {exchange.message}"

    if not conv:
        conv = Conversation(
            user1_id=current_user.id,
            user2_id=target_item.seller_id,
            item_id=target_item.id,
            last_message=chat_content,
            updated_at=datetime.utcnow()
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
    else:
        conv.item_id = target_item.id
        conv.last_message = chat_content
        conv.updated_at = datetime.utcnow()

    msg = Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        content=chat_content,
        is_read=False
    )
    db.add(msg)
    db.commit()

    # Notify owner
    NotificationService.send(
        db=db,
        user_id=target_item.seller_id,
        type="exchange",
        title="New Exchange Proposal Received! 🔄",
        message=f"{current_user.full_name} proposed trading '{my_item.title}' for your '{target_item.title}' ({score}% Match)",
        link="/exchange"
    )

    return exchange

@router.get("/my-requests")
def get_my_exchanges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    incoming = db.query(ExchangeRequest).filter(
        ExchangeRequest.owner_id == current_user.id
    ).order_by(ExchangeRequest.created_at.desc()).all()

    outgoing = db.query(ExchangeRequest).filter(
        ExchangeRequest.requester_id == current_user.id
    ).order_by(ExchangeRequest.created_at.desc()).all()

    return {
        "incoming": [ExchangeOut.model_validate(e) for e in incoming],
        "outgoing": [ExchangeOut.model_validate(e) for e in outgoing]
    }

@router.put("/{exchange_id}/respond", response_model=ExchangeOut)
def respond_exchange(
    exchange_id: int,
    payload: ExchangeRespond,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exchange = db.query(ExchangeRequest).filter(ExchangeRequest.id == exchange_id).first()
    if not exchange:
        raise HTTPException(status_code=404, detail="Exchange request not found.")

    if exchange.owner_id != current_user.id and exchange.requester_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to respond to this request.")

    new_status = payload.status.lower()
    if new_status not in ["accepted", "rejected", "completed"]:
        raise HTTPException(status_code=400, detail="Invalid status.")

    exchange.status = new_status

    if new_status == "completed":
        # Mark both items as exchanged
        req_item = db.query(Item).filter(Item.id == exchange.requester_item_id).first()
        target_item = db.query(Item).filter(Item.id == exchange.requested_item_id).first()
        if req_item:
            req_item.availability = "Exchanged"
            req_item.status = "sold"
        if target_item:
            target_item.availability = "Exchanged"
            target_item.status = "sold"

        # Update transaction counts
        exchange.owner.transactions_count = (exchange.owner.transactions_count or 0) + 1
        exchange.requester.transactions_count = (exchange.requester.transactions_count or 0) + 1

    db.commit()
    db.refresh(exchange)

    # Notify counterpart
    other_user_id = exchange.requester_id if current_user.id == exchange.owner_id else exchange.owner_id
    NotificationService.send(
        db=db,
        user_id=other_user_id,
        type="exchange",
        title=f"Exchange Request {new_status.capitalize()}",
        message=f"{current_user.full_name} has {new_status} the exchange for '{exchange.requested_item.title}'.",
        link="/exchange"
    )

    # Add message in conversation informing counterpart
    conv = db.query(Conversation).filter(
        or_(
            and_(Conversation.user1_id == current_user.id, Conversation.user2_id == other_user_id),
            and_(Conversation.user1_id == other_user_id, Conversation.user2_id == current_user.id)
        )
    ).first()

    status_msg = f"🔄 [Exchange Update] {current_user.full_name} has {new_status} the exchange of '{exchange.requester_item.title}' for '{exchange.requested_item.title}'."
    if conv:
        conv.last_message = status_msg
        conv.updated_at = datetime.utcnow()
        msg = Message(
            conversation_id=conv.id,
            sender_id=current_user.id,
            content=status_msg,
            is_read=False
        )
        db.add(msg)
        db.commit()

    return exchange

@router.get("/matches", response_model=List[ExchangeMatchOut])
def get_exchange_matches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_items = db.query(Item).filter(
        Item.seller_id == current_user.id,
        Item.is_exchange == True,
        Item.status == "active"
    ).all()

    market_items = db.query(Item).filter(
        Item.seller_id != current_user.id,
        Item.is_exchange == True,
        Item.status == "active"
    ).all()

    matches = ExchangeMatchingService.find_potential_matches(user_items, market_items)
    return matches

