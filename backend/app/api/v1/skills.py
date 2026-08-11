from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from pydantic import BaseModel

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.resume import Skill
from app.schemas.resume import SkillCreate, SkillUpdate, SkillResponse
from app.models.user import User

router = APIRouter()

class ReorderRequest(BaseModel):
    ordered_ids: List[UUID]

@router.get("/", response_model=List[SkillResponse])
def get_skills(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Skill).filter(Skill.user_id == current_user.id)\
        .order_by(Skill.display_order.asc(), Skill.created_at.desc()).all()

@router.post("/", response_model=SkillResponse, status_code=201)
def create_skill(skill: SkillCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_skill = Skill(**skill.dict(), user_id=current_user.id)
    db.add(new_skill)
    db.commit()
    db.refresh(new_skill)
    return new_skill

@router.put("/{skill_id}", response_model=SkillResponse)
def update_skill(skill_id: UUID, skill: SkillUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_skill = db.query(Skill).filter(Skill.id == skill_id, Skill.user_id == current_user.id).first()
    if not db_skill:
        raise HTTPException(status_code=404, detail="Skill record not found")
        
    update_data = skill.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_skill, key, value)
        
    db.commit()
    db.refresh(db_skill)
    return db_skill

@router.delete("/{skill_id}", status_code=204)
def delete_skill(skill_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_skill = db.query(Skill).filter(Skill.id == skill_id, Skill.user_id == current_user.id).first()
    if not db_skill:
        raise HTTPException(status_code=404, detail="Skill record not found")
        
    db.delete(db_skill)
    db.commit()
    return None

@router.post("/reorder", status_code=200)
def reorder_skills(request: ReorderRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    records = db.query(Skill).filter(Skill.user_id == current_user.id).all()
    record_map = {str(r.id): r for r in records}
    
    for index, record_id in enumerate(request.ordered_ids):
        if str(record_id) in record_map:
            record_map[str(record_id)].display_order = index
            
    db.commit()
    return {"message": "Reordered successfully"}
