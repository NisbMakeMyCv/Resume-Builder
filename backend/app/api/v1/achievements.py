from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from pydantic import BaseModel

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.resume import Achievement
from app.schemas.resume import AchievementCreate, AchievementUpdate, AchievementResponse
from app.models.user import User

router = APIRouter()

class ReorderRequest(BaseModel):
    ordered_ids: List[UUID]

@router.get("/", response_model=List[AchievementResponse])
def get_achievements(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Achievement).filter(Achievement.user_id == current_user.id)\
        .order_by(Achievement.display_order.asc(), Achievement.created_at.desc()).all()

@router.post("/", response_model=AchievementResponse, status_code=201)
def create_achievement(achievement: AchievementCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_ach = Achievement(**achievement.dict(), user_id=current_user.id)
    db.add(new_ach)
    db.commit()
    db.refresh(new_ach)
    return new_ach

@router.put("/{ach_id}", response_model=AchievementResponse)
def update_achievement(ach_id: UUID, achievement: AchievementUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_ach = db.query(Achievement).filter(Achievement.id == ach_id, Achievement.user_id == current_user.id).first()
    if not db_ach:
        raise HTTPException(status_code=404, detail="Achievement record not found")
        
    update_data = achievement.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_ach, key, value)
        
    db.commit()
    db.refresh(db_ach)
    return db_ach

@router.delete("/{ach_id}", status_code=204)
def delete_achievement(ach_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_ach = db.query(Achievement).filter(Achievement.id == ach_id, Achievement.user_id == current_user.id).first()
    if not db_ach:
        raise HTTPException(status_code=404, detail="Achievement record not found")
        
    db.delete(db_ach)
    db.commit()
    return None

@router.post("/reorder", status_code=200)
def reorder_achievements(request: ReorderRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    records = db.query(Achievement).filter(Achievement.user_id == current_user.id).all()
    record_map = {str(r.id): r for r in records}
    
    for index, record_id in enumerate(request.ordered_ids):
        if str(record_id) in record_map:
            record_map[str(record_id)].display_order = index
            
    db.commit()
    return {"message": "Reordered successfully"}
