from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from pydantic import BaseModel

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.resume import Project
from app.schemas.resume import ProjectCreate, ProjectUpdate, ProjectResponse
from app.models.user import User

router = APIRouter()

class ReorderRequest(BaseModel):
    ordered_ids: List[UUID]

@router.get("/", response_model=List[ProjectResponse])
def get_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Project).filter(Project.user_id == current_user.id)\
        .order_by(Project.display_order.asc(), Project.created_at.desc()).all()

@router.post("/", response_model=ProjectResponse, status_code=201)
def create_project(project: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_project = Project(**project.dict(), user_id=current_user.id)
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: UUID, project: ProjectUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project record not found")
        
    update_data = project.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_project, key, value)
        
    db.commit()
    db.refresh(db_project)
    return db_project

@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project record not found")
        
    db.delete(db_project)
    db.commit()
    return None

@router.post("/reorder", status_code=200)
def reorder_projects(request: ReorderRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    records = db.query(Project).filter(Project.user_id == current_user.id).all()
    record_map = {str(r.id): r for r in records}
    
    for index, record_id in enumerate(request.ordered_ids):
        if str(record_id) in record_map:
            record_map[str(record_id)].display_order = index
            
    db.commit()
    return {"message": "Reordered successfully"}
