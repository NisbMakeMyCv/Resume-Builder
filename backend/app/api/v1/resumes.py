from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.resume import ResumeDocument
from app.schemas.resume import (
    ResumeDocumentResponse,
    ResumeDocumentUpdate
)
from app.services.drive_service import (
    upload_encrypted_file,
    download_encrypted_file,
    delete_encrypted_file
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
async def create_resume(
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new resume document by uploading an encrypted file to Google Drive."""
    import uuid
    import time
    
    # Read the encrypted bytes
    file_bytes = await file.read()
    
    # Generate unique filename
    safe_title = "".join([c for c in title if c.isalpha() or c.isdigit() or c==' ']).rstrip()
    unique_id = str(uuid.uuid4())[:8]
    timestamp = int(time.time())
    filename = f"resume_{safe_title}_{timestamp}_{unique_id}.enc"
    
    # Upload to Google Drive (nested in User's folder)
    drive_file_id = upload_encrypted_file(file_bytes, filename=filename, user_id=str(current_user.id))
    
    new_resume = ResumeDocument(
        user_id=current_user.id,
        title=title,
        drive_file_id=drive_file_id
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
    """Get a specific resume document metadata by ID."""
    resume = db.query(ResumeDocument).filter(ResumeDocument.id == resume_id, ResumeDocument.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    return resume

@router.get("/{resume_id}/download")
def download_resume(
    resume_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Download the encrypted resume file from Google Drive."""
    resume = db.query(ResumeDocument).filter(ResumeDocument.id == resume_id, ResumeDocument.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
        
    if not resume.drive_file_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume file not found in Google Drive")
        
    file_bytes = download_encrypted_file(resume.drive_file_id)
    return Response(content=file_bytes, media_type="application/octet-stream")

@router.put("/{resume_id}", response_model=ResumeDocumentResponse)
async def update_resume(
    resume_id: UUID,
    title: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a specific resume document by ID (title or file)."""
    resume = db.query(ResumeDocument).filter(ResumeDocument.id == resume_id, ResumeDocument.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    if title is not None:
        resume.title = title
        
    if file is not None:
        import uuid
        import time
        # Delete old file from Drive if it exists
        if resume.drive_file_id:
            delete_encrypted_file(resume.drive_file_id)
            
        file_bytes = await file.read()
        
        # Generate unique filename
        safe_title = "".join([c for c in resume.title if c.isalpha() or c.isdigit() or c==' ']).rstrip()
        unique_id = str(uuid.uuid4())[:8]
        timestamp = int(time.time())
        filename = f"resume_{safe_title}_{timestamp}_{unique_id}.enc"
        
        drive_file_id = upload_encrypted_file(file_bytes, filename=filename, user_id=str(current_user.id))
        resume.drive_file_id = drive_file_id

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

    if resume.drive_file_id:
        delete_encrypted_file(resume.drive_file_id)

    db.delete(resume)
    db.commit()
    return
