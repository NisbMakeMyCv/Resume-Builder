from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.ai.resume.chat import process_resume_chat
from app.ai.resume.renderer import render_resume_latex
from app.ai.resume.pdf_generator import PDFGenerationError, generate_pdf
from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.models.user import User, Conversation, ConversationMessage
from app.schemas.resume_ai import ResumeChatRequest, ResumeChatResponse, ResumeData


router = APIRouter()

WELCOME_MESSAGE = (
    "Hi! I'm your Resume Chatbot. I can help you add, edit, improve, "
    "and analyze your resume. You can also paste a job description "
    "and I'll identify the relevant skills."
)


def _conversation_or_404(
    db: Session,
    current_user: User,
    conversation_id: UUID,
) -> Conversation:
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
        .first()
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return conversation


def _serialize_conversation(conversation: Conversation) -> dict:
    messages = [
        {
            "id": str(message.id),
            "role": message.role,
            "content": message.content,
            "created_at": message.created_at.isoformat(),
        }
        for message in conversation.messages
    ]

    return {
        "id": str(conversation.id),
        "title": conversation.title,
        "created_at": conversation.created_at.isoformat(),
        "updated_at": conversation.updated_at.isoformat(),
        "message_count": len(messages),
        "messages": messages,
    }


def _serialize_summary(conversation: Conversation) -> dict:
    return {
        "id": str(conversation.id),
        "title": conversation.title,
        "created_at": conversation.created_at.isoformat(),
        "updated_at": conversation.updated_at.isoformat(),
        "message_count": len(conversation.messages),
    }


def _make_title(message: str) -> str:
    title = " ".join(message.strip().split())
    if not title:
        return "New conversation"
    return title if len(title) <= 60 else f"{title[:60]}…"


# =========================================================
# CONVERSATION HISTORY
# =========================================================

@router.get("/conversations")
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversations = (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )

    return [_serialize_summary(item) for item in conversations]


@router.post("/conversations")
def create_conversation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = Conversation(
        user_id=current_user.id,
        title="New conversation",
    )
    db.add(conversation)
    db.flush()

    db.add(
        ConversationMessage(
            conversation_id=conversation.id,
            role="assistant",
            content=WELCOME_MESSAGE,
        )
    )

    db.commit()
    db.refresh(conversation)

    return _serialize_conversation(conversation)


@router.get("/conversations/{conversation_id}")
def get_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = _conversation_or_404(db, current_user, conversation_id)
    return _serialize_conversation(conversation)


@router.patch("/conversations/{conversation_id}")
def rename_conversation(
    conversation_id: UUID,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = _conversation_or_404(db, current_user, conversation_id)

    title = str(payload.get("title", "")).strip()
    if not title:
        raise HTTPException(status_code=422, detail="Conversation title cannot be empty")

    conversation.title = title[:200]
    conversation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(conversation)

    return _serialize_summary(conversation)


@router.delete("/conversations/{conversation_id}", status_code=204)
def delete_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = _conversation_or_404(db, current_user, conversation_id)
    db.delete(conversation)
    db.commit()
    return Response(status_code=204)


# =========================================================
# AI RESUME CHAT
# =========================================================

@router.post("/chat", response_model=ResumeChatResponse)
def resume_chat(
    request: ResumeChatRequest,
    conversation_id: UUID | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        if conversation_id is None:
            conversation = Conversation(
                user_id=current_user.id,
                title=_make_title(request.message),
            )
            db.add(conversation)
            db.flush()

            db.add(
                ConversationMessage(
                    conversation_id=conversation.id,
                    role="assistant",
                    content=WELCOME_MESSAGE,
                )
            )
            db.flush()
        else:
            conversation = _conversation_or_404(
                db,
                current_user,
                conversation_id,
            )

        # Everything already stored remains in the database.
        # The AI function itself controls how much context it sends
        # to the model so very long chats do not exceed model limits.
        history = [
            {
                "role": item.role,
                "content": item.content,
            }
            for item in conversation.messages
            if item.role in {"user", "assistant"}
        ]

        # The current message is saved before calling the model so a
        # failed request can still be diagnosed/retried from history.
        db.add(
            ConversationMessage(
                conversation_id=conversation.id,
                role="user",
                content=request.message.strip(),
            )
        )
        db.flush()

        result = process_resume_chat(
            message=request.message,
            resume=request.resume,
            history=history,
        )

        db.add(
            ConversationMessage(
                conversation_id=conversation.id,
                role="assistant",
                content=result.reply,
            )
        )

        if conversation.title == "New conversation":
            conversation.title = _make_title(request.message)

        conversation.updated_at = datetime.utcnow()
        db.commit()

        result.conversation_id = str(conversation.id)
        return result

    except HTTPException:
        db.rollback()
        raise
    except RuntimeError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Resume AI request failed: {str(exc)}",
        ) from exc


# =========================================================
# PDF RESUME GENERATION
# =========================================================

@router.post("/generate")
def generate_resume(resume: ResumeData):
    try:
        latex_content = render_resume_latex(resume)
        pdf_content = generate_pdf(latex_content)
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": 'attachment; filename="resume.pdf"'
            },
        )
    except PDFGenerationError as exc:
        return Response(
            content=str(exc),
            status_code=500,
            media_type="text/plain",
        )
