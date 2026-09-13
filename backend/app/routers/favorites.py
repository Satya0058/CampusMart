from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.favorite import Favorite
from backend.app.models.item import Item
from backend.app.models.user import User
from backend.app.schemas.item import ItemOut
from backend.app.routers.items import enrich_item
from backend.app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/favorites", tags=["favorites"])

@router.get("", response_model=List[ItemOut])
def get_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    favs = db.query(Favorite).filter(Favorite.user_id == current_user.id).all()
    item_ids = [f.item_id for f in favs]
    items = db.query(Item).filter(Item.id.in_(item_ids)).all()
    return [enrich_item(it, current_user, db) for it in items]

@router.post("/toggle/{item_id}")
def toggle_favorite(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")

    fav = db.query(Favorite).filter(Favorite.user_id == current_user.id, Favorite.item_id == item_id).first()
    if fav:
        db.delete(fav)
        db.commit()
        return {"status": "removed", "is_favorited": False}
    else:
        new_fav = Favorite(user_id=current_user.id, item_id=item_id)
        db.add(new_fav)
        db.commit()
        return {"status": "added", "is_favorited": True}

