from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from pydantic import BaseModel

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.resume import Education
from app.schemas.resume import EducationCreate, EducationUpdate, EducationResponse
from app.models.user import User

router = APIRouter()

class ReorderRequest(BaseModel):
    ordered_ids: List[UUID]

@router.get("/", response_model=List[EducationResponse])
def get_education(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Education).filter(Education.user_id == current_user.id)\
        .order_by(Education.display_order.asc(), Education.start_date.desc()).all()

@router.post("/", response_model=EducationResponse, status_code=201)
def create_education(edu: EducationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_edu = Education(**edu.dict(), user_id=current_user.id)
    db.add(new_edu)
    db.commit()
    db.refresh(new_edu)
    return new_edu

@router.put("/{edu_id}", response_model=EducationResponse)
def update_education(edu_id: UUID, edu: EducationUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_edu = db.query(Education).filter(Education.id == edu_id, Education.user_id == current_user.id).first()
    if not db_edu:
        raise HTTPException(status_code=404, detail="Education record not found")
        
    update_data = edu.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_edu, key, value)
        
    db.commit()
    db.refresh(db_edu)
    return db_edu

@router.delete("/{edu_id}", status_code=204)
def delete_education(edu_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_edu = db.query(Education).filter(Education.id == edu_id, Education.user_id == current_user.id).first()
    if not db_edu:
        raise HTTPException(status_code=404, detail="Education record not found")
        
    db.delete(db_edu)
    db.commit()
    return None

@router.post("/reorder", status_code=200)
def reorder_education(request: ReorderRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    records = db.query(Education).filter(Education.user_id == current_user.id).all()
    record_map = {str(r.id): r for r in records}
    
    for index, record_id in enumerate(request.ordered_ids):
        if str(record_id) in record_map:
            record_map[str(record_id)].display_order = index
            
    db.commit()
    return {"message": "Reordered successfully"}
