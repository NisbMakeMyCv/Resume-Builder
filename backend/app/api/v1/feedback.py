import logging
from typing import Optional
from fastapi import APIRouter, BackgroundTasks, status
from pydantic import BaseModel, Field
from app.api.v1.auth import send_email

logger = logging.getLogger(__name__)

router = APIRouter()


class FeedbackCreate(BaseModel):
    message: str = Field(..., min_length=3, max_length=2000)
    category: str = Field(default="general")
    email: Optional[str] = None


class FeedbackResponse(BaseModel):
    status: str
    message: str


@router.post("/", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(payload: FeedbackCreate, background_tasks: BackgroundTasks):
    """
    Accept anonymous user feedback, bug reports, or feature requests.
    Logs submission and emails nisbmakemycv@gmail.com via BackgroundTasks.
    """
    sender = payload.email.strip() if payload.email and payload.email.strip() else "Anonymous User"
    cat_upper = payload.category.upper()
    
    logger.info(
        f"[FEEDBACK] Category: {payload.category} | From: {sender} | Message: {payload.message}"
    )
    print(f"\n📩 ANONYMOUS FEEDBACK ({cat_upper}):")
    print(f"   From: {sender}")
    print(f"   Content: {payload.message}\n")
    
    # Send email notification to nisbmakemycv@gmail.com
    subject = f"📩 New Feedback [{cat_upper}] from {sender}"
    body = (
        f"New Feedback Submitted on NISB-MakeMyCV!\n\n"
        f"Category: {payload.category}\n"
        f"Sender: {sender}\n\n"
        f"Message:\n{payload.message}\n"
    )
    background_tasks.add_task(send_email, "nisbmakemycv@gmail.com", subject, body)
    
    return FeedbackResponse(
        status="success",
        message="Thank you! Your feedback has been submitted anonymously and emailed to our team."
    )
