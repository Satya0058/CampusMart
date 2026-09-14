import os
import shutil
import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session
from backend.app.database import get_db, BASE_DIR
from backend.app.models.item import Item, ItemImage
from backend.app.models.favorite import Favorite
from backend.app.models.user import User
from backend.app.schemas.item import ItemCreate, ItemUpdate, ItemOut
from backend.app.services.auth_service import get_current_user, get_current_user_optional
from backend.app.services.ai import (
    SafetyService, 
    SafetyAnalysisRequest, 
    SafetyAnalysisResponse, 
    DecisionType
)

router = APIRouter(prefix="/api/items", tags=["items"])

UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def enrich_item(item: Item, current_user: Optional[User] = None, db: Optional[Session] = None) -> ItemOut:
    savings = None
    discount = None
    if item.original_price and item.selling_price and item.original_price > item.selling_price:
        savings = round(item.original_price - item.selling_price, 2)
        discount = int(round(((item.original_price - item.selling_price) / item.original_price) * 100))

    is_fav = False
    if current_user and db:
        fav = db.query(Favorite).filter(Favorite.user_id == current_user.id, Favorite.item_id == item.id).first()
        is_fav = fav is not None

    item_dict = ItemOut.model_validate(item).model_dump()
    item_dict["savings_amount"] = savings
    item_dict["discount_percentage"] = discount
    item_dict["is_favorited"] = is_fav
    return ItemOut(**item_dict)

@router.get("", response_model=List[ItemOut])
def list_items(
    q: Optional[str] = None,
    category: Optional[str] = None,
    mode: Optional[str] = None, # buy, rent, exchange
    condition: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    seller_id: Optional[int] = None,
    status_filter: Optional[str] = "active", # active, all, paused, sold
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    query = db.query(Item)

    if status_filter and status_filter != "all":
        query = query.filter(Item.status == status_filter)

    if seller_id:
        query = query.filter(Item.seller_id == seller_id)
    elif current_user:
        # When browsing as a buyer, exclude the current student's own items
        query = query.filter(Item.seller_id != current_user.id)

    if category and category != "All":
        query = query.filter(Item.category.ilike(f"%{category}%"))

    if mode:
        m = mode.lower()
        if m == "buy" or m == "sell":
            query = query.filter(Item.is_sell == True)
        elif m == "rent":
            query = query.filter(Item.is_rent == True)
        elif m == "exchange":
            query = query.filter(Item.is_exchange == True)

    if condition and condition != "All":
        query = query.filter(Item.condition == condition)

    if min_price is not None:
        query = query.filter(Item.selling_price >= min_price)

    if max_price is not None:
        query = query.filter(Item.selling_price <= max_price)

    if q:
        search = f"%{q.lower()}%"
        query = query.filter(
            (Item.title.ilike(search)) |
            (Item.description.ilike(search)) |
            (Item.category.ilike(search)) |
            (Item.exchange_preference.ilike(search))
        )

    items = query.order_by(Item.created_at.desc()).all()
    return [enrich_item(it, current_user, db) for it in items]

@router.get("/{item_id}", response_model=ItemOut)
def get_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found on campus marketplace.")
    
    # Increment view counter
    item.views = (item.views or 0) + 1
    db.commit()
    db.refresh(item)

    return enrich_item(item, current_user, db)

@router.post("/safety-check", response_model=SafetyAnalysisResponse)
def check_item_safety(
    payload: SafetyAnalysisRequest
):
    """
    Run CampusMart AI Safety Intelligence analysis on an uploaded image.
    Multi-stage verification:
    Validation -> Quality -> Vision & Domain -> Policy -> Consistency -> Synthesis.
    """
    # Resolve physical image path
    resolved_path = None
    if payload.image_path and os.path.exists(payload.image_path):
        resolved_path = payload.image_path
    elif payload.image_url:
        clean_name = os.path.basename(payload.image_url)
        candidate_path = os.path.join(UPLOAD_DIR, clean_name)
        if os.path.exists(candidate_path):
            resolved_path = candidate_path

    if not resolved_path:
        raise HTTPException(status_code=400, detail="Image file not found on server for safety verification.")

    response = SafetyService.analyze_listing(
        image_input=resolved_path,
        title=payload.title,
        description=payload.description,
        category=payload.category
    )
    return response

@router.post("", response_model=ItemOut)
def create_item(
    item_in: ItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Mandatory image presence check
    if not item_in.images or len(item_in.images) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Listing image is mandatory. Please upload at least one clear photo of your item."
        )

    # 2. Independent Backend AI Safety Verification
    primary_img_url = item_in.images[0]
    clean_name = os.path.basename(primary_img_url)
    img_path = os.path.join(UPLOAD_DIR, clean_name)
    if not os.path.exists(img_path):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Primary listing image could not be verified on the server."
        )

    safety_verdict = SafetyService.analyze_listing(
        image_input=img_path,
        title=item_in.title,
        description=item_in.description,
        category=item_in.category
    )

    # 3. Guardrail Publication Enforcement
    if safety_verdict.decision == DecisionType.BLOCK:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Listing blocked by CampusMart AI Safety Policy: {safety_verdict.reason}"
        )

    if safety_verdict.decision in [DecisionType.REVIEW, DecisionType.PENDING]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Listing cannot be published automatically. It requires manual student safety review: {safety_verdict.reason}"
        )

    # 4. Save verified listing in active state with AI audit records
    new_item = Item(
        seller_id=current_user.id,
        title=item_in.title,
        category=item_in.category,
        description=item_in.description,
        condition=item_in.condition,
        selling_price=item_in.selling_price,
        original_price=item_in.original_price,
        rental_price_per_day=item_in.rental_price_per_day,
        is_sell=item_in.is_sell,
        is_rent=item_in.is_rent,
        is_exchange=item_in.is_exchange,
        exchange_preference=item_in.exchange_preference,
        product_url=item_in.product_url,
        availability="Available",
        status="active",
        ai_decision="APPROVE",
        ai_confidence=safety_verdict.object_confidence,
        ai_risk_level=safety_verdict.risk_level.value,
        ai_reason=safety_verdict.reason,
        ai_scanned_at=datetime.utcnow()
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    # Attach images
    for idx, img_url in enumerate(item_in.images):
        img = ItemImage(
            item_id=new_item.id,
            image_url=img_url,
            is_primary=(idx == 0)
        )
        db.add(img)
    db.commit()
    db.refresh(new_item)

    return enrich_item(new_item, current_user, db)

@router.put("/{item_id}", response_model=ItemOut)
def update_item(
    item_id: int,
    item_in: ItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")
    if item.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this listing.")

    for field, val in item_in.model_dump(exclude_unset=True).items():
        setattr(item, field, val)

    db.commit()
    db.refresh(item)
    return enrich_item(item, current_user, db)

@router.put("/{item_id}/status")
def update_item_status(
    item_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")
    if item.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this listing.")

    new_status = payload.get("status")
    if new_status in ["active", "paused", "sold"]:
        item.status = new_status
        if new_status == "sold":
            item.availability = "Sold"
            current_user.transactions_count = (current_user.transactions_count or 0) + 1
        elif new_status == "active":
            item.availability = "Available"
        db.commit()
        return {"status": "success", "item_status": item.status}
    raise HTTPException(status_code=400, detail="Invalid status. Must be active, paused, or sold.")

@router.delete("/{item_id}")
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")
    if item.seller_id != current_user.id and current_user.email != "admin@gmail.com":
        raise HTTPException(status_code=403, detail="Not authorized to delete this listing.")

    db.delete(item)
    db.commit()
    return {"message": "Listing deleted successfully."}

@router.post("/upload-image")
def upload_item_image(
    file: UploadFile = File(...)
):
    extension = os.path.splitext(file.filename)[1] or ".jpg"
    safe_filename = f"{uuid.uuid4().hex}{extension}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"url": f"/uploads/{safe_filename}", "filename": safe_filename}

from pydantic import BaseModel
from datetime import datetime
from sqlalchemy import or_, and_
from backend.app.models.message import Conversation, Message
from backend.app.services.notification_service import NotificationService

class BuyRequestPayload(BaseModel):
    meetup_location: Optional[str] = "Main Campus Library Foyer"
    note: Optional[str] = ""

@router.post("/{item_id}/buy-request")
def send_buy_request(
    item_id: int,
    payload: BuyRequestPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")
    if item.seller_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot buy your own item.")

    # 1. Dispatch notification to seller
    notif_msg = f"{current_user.full_name} sent a buy request for '{item.title}' at ₹{item.selling_price}. Meetup spot: {payload.meetup_location}."
    if payload.note:
        notif_msg += f" Note: {payload.note}"

    NotificationService.send(
        db=db,
        user_id=item.seller_id,
        type="buy_request",
        title="New Buy Request Received! 🛍️",
        message=notif_msg,
        link="/messages"
    )

    # 2. Also create/update message thread
    conv = db.query(Conversation).filter(
        or_(
            and_(Conversation.user1_id == current_user.id, Conversation.user2_id == item.seller_id),
            and_(Conversation.user1_id == item.seller_id, Conversation.user2_id == current_user.id)
        )
    ).first()

    if not conv:
        conv = Conversation(
            user1_id=current_user.id,
            user2_id=item.seller_id,
            item_id=item.id,
            last_message=notif_msg
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
    else:
        conv.item_id = item.id

    seller_first_name = item.seller.full_name.split()[0] if item.seller and item.seller.full_name else "there"
    msg_body = f"Hi {seller_first_name}! I would like to buy your '{item.title}' for ₹{item.selling_price}. Preferred meetup location: {payload.meetup_location}."
    if payload.note:
        msg_body += f" Note: {payload.note}"

    msg = Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        content=msg_body,
        is_read=False
    )
    db.add(msg)
    conv.last_message = msg_body
    conv.updated_at = datetime.utcnow()
    db.commit()

    return {
        "status": "success",
        "message": "Buy request sent to seller!",
        "item_id": item.id,
        "seller_name": item.seller.full_name if item.seller else "Seller"
    }


