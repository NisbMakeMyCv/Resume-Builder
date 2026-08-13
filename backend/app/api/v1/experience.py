from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from pydantic import BaseModel

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.resume import Experience
from app.schemas.resume import ExperienceCreate, ExperienceUpdate, ExperienceResponse
from app.models.user import User

router = APIRouter()

class ReorderRequest(BaseModel):
    ordered_ids: List[UUID]

@router.get("/", response_model=List[ExperienceResponse])
def get_experience(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Experience).filter(Experience.user_id == current_user.id)\
        .order_by(Experience.display_order.asc(), Experience.start_date.desc()).all()

@router.post("/", response_model=ExperienceResponse, status_code=201)
def create_experience(exp: ExperienceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_exp = Experience(**exp.dict(), user_id=current_user.id)
    db.add(new_exp)
    db.commit()
    db.refresh(new_exp)
    return new_exp

@router.put("/{exp_id}", response_model=ExperienceResponse)
def update_experience(exp_id: UUID, exp: ExperienceUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_exp = db.query(Experience).filter(Experience.id == exp_id, Experience.user_id == current_user.id).first()
    if not db_exp:
        raise HTTPException(status_code=404, detail="Experience record not found")
        
    update_data = exp.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_exp, key, value)
        
    db.commit()
    db.refresh(db_exp)
    return db_exp

@router.delete("/{exp_id}", status_code=204)
def delete_experience(exp_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_exp = db.query(Experience).filter(Experience.id == exp_id, Experience.user_id == current_user.id).first()
    if not db_exp:
        raise HTTPException(status_code=404, detail="Experience record not found")
        
    db.delete(db_exp)
    db.commit()
    return None

@router.post("/reorder", status_code=200)
def reorder_experience(request: ReorderRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    records = db.query(Experience).filter(Experience.user_id == current_user.id).all()
    record_map = {str(r.id): r for r in records}
    
    for index, record_id in enumerate(request.ordered_ids):
        if str(record_id) in record_map:
            record_map[str(record_id)].display_order = index
            
    db.commit()
    return {"message": "Reordered successfully"}
