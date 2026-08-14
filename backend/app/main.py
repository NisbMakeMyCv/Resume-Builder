import os

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.auth import router as auth_router
from app.api.v1.ai.github import router as github_ai_router
from app.api.v1.ai.resume import router as resume_ai_router

from app.core.database import engine
from app.models import user


# ============================================================
# DATABASE
# ============================================================

user.Base.metadata.create_all(bind=engine)


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="MakeMyCV Backend API",
    description="RESTful API for the Resume Builder MVP",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

allowed_origins_raw = os.getenv(
    "ALLOWED_ORIGINS",
    "*",
)

if allowed_origins_raw == "*":
    origins = ["*"]
else:
    origins = [
        origin.strip()
        for origin in allowed_origins_raw.split(",")
        if origin.strip()
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# AUTHENTICATION ROUTES
# ============================================================

app.include_router(
    auth_router,
    prefix="/api/v1/auth",
    tags=["Authentication"],
)


# ============================================================
# AI - GITHUB ANALYZER
# ============================================================

app.include_router(
    github_ai_router,
    prefix="/api/v1/ai/github",
    tags=["AI - GitHub"],
)


# ============================================================
# AI - RESUME CHATBOT
# ============================================================

app.include_router(
    resume_ai_router,
    prefix="/api/v1/ai/resume",
    tags=["AI - Resume"],
)


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():
    return {
        "message": (
            "Welcome to MakeMyCV API! "
            "Go to /docs for the interactive Swagger UI."
        )
    }