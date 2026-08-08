from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.resume import Profile
from app.schemas.resume import ProfileResponse, ProfileUpdate
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=ProfileResponse)
def get_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Fetch the current user's profile."""
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    
    # If the user doesn't have a profile yet, auto-create a blank one!
    # This prevents the frontend from throwing a 404 error and makes their life easier.
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
        
    return profile

@router.patch("/", response_model=ProfileResponse)
def update_profile(
    profile_update: ProfileUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Update partial profile details (optimized for frontend auto-saving)."""
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)
        db.flush() # Flush to get the ID without fully committing yet

    # exclude_unset=True ensures we ONLY update fields the frontend actually sent us!
    update_data = profile_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)
    return profile
