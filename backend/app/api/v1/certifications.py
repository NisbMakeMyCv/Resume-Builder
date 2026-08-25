from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from pydantic import BaseModel

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.resume import Certification
from app.schemas.resume import CertificationCreate, CertificationUpdate, CertificationResponse
from app.models.user import User

router = APIRouter()

class ReorderRequest(BaseModel):
    ordered_ids: List[UUID]

@router.get("/", response_model=List[CertificationResponse])
def get_certifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Certification).filter(Certification.user_id == current_user.id)\
        .order_by(Certification.display_order.asc(), Certification.created_at.desc()).all()

@router.post("/", response_model=CertificationResponse, status_code=201)
def create_certification(cert: CertificationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_cert = Certification(**cert.dict(), user_id=current_user.id)
    db.add(new_cert)
    db.commit()
    db.refresh(new_cert)
    return new_cert

@router.put("/{cert_id}", response_model=CertificationResponse)
def update_certification(cert_id: UUID, cert: CertificationUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_cert = db.query(Certification).filter(Certification.id == cert_id, Certification.user_id == current_user.id).first()
    if not db_cert:
        raise HTTPException(status_code=404, detail="Certification record not found")
        
    update_data = cert.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_cert, key, value)
        
    db.commit()
    db.refresh(db_cert)
    return db_cert

@router.delete("/{cert_id}", status_code=204)
def delete_certification(cert_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_cert = db.query(Certification).filter(Certification.id == cert_id, Certification.user_id == current_user.id).first()
    if not db_cert:
        raise HTTPException(status_code=404, detail="Certification record not found")
        
    db.delete(db_cert)
    db.commit()
    return None

@router.post("/reorder", status_code=200)
def reorder_certifications(request: ReorderRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    records = db.query(Certification).filter(Certification.user_id == current_user.id).all()
    record_map = {str(r.id): r for r in records}
    
    for index, record_id in enumerate(request.ordered_ids):
        if str(record_id) in record_map:
            record_map[str(record_id)].display_order = index
            
    db.commit()
    return {"message": "Reordered successfully"}
