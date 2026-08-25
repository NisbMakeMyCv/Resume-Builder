from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import os

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.resume import ResumeDocument
from app.schemas.resume import (
    ResumeDocumentResponse,
    ResumeDocumentUpdate
)

router = APIRouter()

DRIVE_AVAILABLE = bool(os.environ.get("GOOGLE_DRIVE_REFRESH_TOKEN") and os.environ.get("GOOGLE_DRIVE_FOLDER_ID"))


def _try_drive_upload(file_bytes: bytes, filename: str, user_id: str, mime_type: str = 'application/octet-stream') -> Optional[str]:
    """Upload to Google Drive; return file ID or None if Drive isn't configured."""
    if not DRIVE_AVAILABLE:
        return None
    try:
        from app.services.drive_service import upload_encrypted_file
        return upload_encrypted_file(file_bytes, filename=filename, user_id=user_id, mime_type=mime_type)
    except Exception as exc:
        # Drive is configured but the call failed — surface the error
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Google Drive upload failed: {exc}",
        )


def _try_drive_update(old_file_id: str, file_bytes: bytes, filename: str, user_id: str, mime_type: str = 'application/octet-stream') -> Optional[str]:
    """Delete old Drive file and upload new one; return new file ID or None."""
    if not DRIVE_AVAILABLE:
        return None
    try:
        from app.services.drive_service import upload_encrypted_file, delete_encrypted_file
        try:
            delete_encrypted_file(old_file_id)
        except Exception:
            pass  # Non-fatal if old deletion fails
        return upload_encrypted_file(file_bytes, filename=filename, user_id=user_id, mime_type=mime_type)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Google Drive update failed: {exc}",
        )


def _try_drive_delete(file_id: str):
    """Delete a Drive file if Drive is configured."""
    if not DRIVE_AVAILABLE or not file_id:
        return
    try:
        from app.services.drive_service import delete_encrypted_file
        delete_encrypted_file(file_id)
    except Exception:
        pass  # Non-fatal


def _try_drive_download(file_id: str) -> Optional[bytes]:
    """Download from Drive; return bytes or None."""
    if not DRIVE_AVAILABLE or not file_id:
        return None
    try:
        from app.services.drive_service import download_encrypted_file
        return download_encrypted_file(file_id)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Google Drive download failed: {exc}",
        )


# ─── Routes ─────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[ResumeDocumentResponse])
def get_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all resume documents for the current user."""
    return (
        db.query(ResumeDocument)
        .filter(ResumeDocument.user_id == current_user.id)
        .order_by(ResumeDocument.updated_at.desc())
        .all()
    )


@router.post("/", response_model=ResumeDocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_resume(
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new resume document. Stores in Google Drive if configured, otherwise in the DB."""
    import uuid, time, os

    file_bytes = await file.read()

    # Safely extract extension and construct filename
    safe_title = "".join([c for c in title if c.isalpha() or c.isdigit() or c == " "]).rstrip()
    unique_id = str(uuid.uuid4())[:8]
    timestamp = int(time.time())
    
    original_filename = file.filename or "resume.pdf"
    _, ext = os.path.splitext(original_filename)
    if not ext:
        ext = ".enc"  # fallback for completely unknown files
        
    filename = f"resume_{safe_title}_{timestamp}_{unique_id}{ext}"
    mime_type = file.content_type or "application/octet-stream"

    drive_file_id = _try_drive_upload(file_bytes, filename=filename, user_id=str(current_user.id), mime_type=mime_type)

    new_resume = ResumeDocument(
        user_id=current_user.id,
        title=title,
        file_name=original_filename,
        mime_type=mime_type,
        drive_file_id=drive_file_id,
        # Store blob locally if Drive is not available
        file_blob=None if drive_file_id else file_bytes,
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
    resume = db.query(ResumeDocument).filter(
        ResumeDocument.id == resume_id,
        ResumeDocument.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    return resume


@router.get("/{resume_id}/download")
def download_resume(
    resume_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Download the resume file (from Drive or local DB) with correct headers."""
    resume = db.query(ResumeDocument).filter(
        ResumeDocument.id == resume_id,
        ResumeDocument.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    mime_type = resume.mime_type or "application/octet-stream"
    download_name = resume.file_name or f"{resume.title}.pdf"

    headers = {
        "Content-Disposition": f'attachment; filename="{download_name}"'
    }

    # Prefer Drive; fall back to local blob
    if resume.drive_file_id:
        file_bytes = _try_drive_download(resume.drive_file_id)
        if file_bytes:
            return Response(content=file_bytes, media_type=mime_type, headers=headers)

    if resume.file_blob:
        return Response(content=resume.file_blob, media_type=mime_type, headers=headers)

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume file data not found")


@router.put("/{resume_id}", response_model=ResumeDocumentResponse)
async def update_resume(
    resume_id: UUID,
    title: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a specific resume document (title or file)."""
    resume = db.query(ResumeDocument).filter(
        ResumeDocument.id == resume_id,
        ResumeDocument.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    if title is not None:
        resume.title = title

    if file is not None:
        import uuid, time, os
        file_bytes = await file.read()

        safe_title = "".join([c for c in (resume.title or "resume") if c.isalpha() or c.isdigit() or c == " "]).rstrip()
        unique_id = str(uuid.uuid4())[:8]
        timestamp = int(time.time())
        
        original_filename = file.filename or "resume.pdf"
        _, ext = os.path.splitext(original_filename)
        if not ext:
            ext = ".enc"
            
        filename = f"resume_{safe_title}_{timestamp}_{unique_id}{ext}"
        mime_type = file.content_type or "application/octet-stream"

        if DRIVE_AVAILABLE and resume.drive_file_id:
            new_drive_id = _try_drive_update(resume.drive_file_id, file_bytes, filename, str(current_user.id), mime_type=mime_type)
            resume.drive_file_id = new_drive_id
            resume.file_blob = None
        else:
            # No Drive — store/overwrite locally
            resume.file_blob = file_bytes
            resume.drive_file_id = None
            
        resume.file_name = original_filename
        resume.mime_type = mime_type

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
    resume = db.query(ResumeDocument).filter(
        ResumeDocument.id == resume_id,
        ResumeDocument.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    _try_drive_delete(resume.drive_file_id)

    db.delete(resume)
    db.commit()
