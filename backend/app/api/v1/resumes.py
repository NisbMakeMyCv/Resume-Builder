from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.resume import ResumeDocument
from app.schemas.resume import (
    ResumeDocumentCreate,
    ResumeDocumentUpdate,
    ResumeDocumentResponse
)

router = APIRouter()

@router.get("/", response_model=List[ResumeDocumentResponse])
def get_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all resume documents for the current user."""
    return db.query(ResumeDocument).filter(ResumeDocument.user_id == current_user.id).order_by(ResumeDocument.updated_at.desc()).all()

@router.post("/", response_model=ResumeDocumentResponse, status_code=status.HTTP_201_CREATED)
def create_resume(
    resume_in: ResumeDocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new resume document."""
    new_resume = ResumeDocument(
        user_id=current_user.id,
        title=resume_in.title,
        content=resume_in.content
    )
    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)
    return new_resume

@router.get("/{resume_id}", response_model=ResumeDocumentResponse)
def get_resume(
    resume_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific resume document by ID."""
    resume = db.query(ResumeDocument).filter(ResumeDocument.id == resume_id, ResumeDocument.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    return resume

@router.put("/{resume_id}", response_model=ResumeDocumentResponse)
def update_resume(
    resume_id: UUID,
    resume_in: ResumeDocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a specific resume document by ID."""
    resume = db.query(ResumeDocument).filter(ResumeDocument.id == resume_id, ResumeDocument.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    if resume_in.title is not None:
        resume.title = resume_in.title
    if resume_in.content is not None:
        resume.content = resume_in.content

    db.commit()
    db.refresh(resume)
    return resume

@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    resume_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a specific resume document by ID."""
    resume = db.query(ResumeDocument).filter(ResumeDocument.id == resume_id, ResumeDocument.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    db.delete(resume)
    db.commit()
    return
