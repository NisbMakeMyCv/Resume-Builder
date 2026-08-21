import os
import tempfile

from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.auth import router as auth_router
from app.api.v1.profile import router as profile_router
from app.api.v1.education import router as edu_router
from app.api.v1.experience import router as exp_router
from app.api.v1.skills import router as skill_router
from app.api.v1.projects import router as project_router
from app.api.v1.ai.github import router as ai_github_router
from app.api.v1.ai.resume import router as ai_resume_router
from app.api.v1.resumes import router as resumes_router

from app.core.database import engine
from app.models import user, resume


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()


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

origins = (
    [
        origin.strip()
        for origin in allowed_origins_raw.split(",")
        if origin.strip()
    ]
    if allowed_origins_raw != "*"
    else ["*"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# AUTHENTICATION
# ============================================================

app.include_router(
    auth_router,
    prefix="/api/v1/auth",
    tags=["Authentication"],
)


# ============================================================
# PROFILE
# ============================================================

app.include_router(
    profile_router,
    prefix="/api/v1/profile",
    tags=["Profile"],
)


# ============================================================
# EDUCATION
# ============================================================

app.include_router(
    edu_router,
    prefix="/api/v1/education",
    tags=["Education"],
)


# ============================================================
# EXPERIENCE
# ============================================================

app.include_router(
    exp_router,
    prefix="/api/v1/experience",
    tags=["Experience"],
)


# ============================================================
# SKILLS
# ============================================================

app.include_router(
    skill_router,
    prefix="/api/v1/skills",
    tags=["Skills"],
)


# ============================================================
# PROJECTS
# ============================================================

app.include_router(
    project_router,
    prefix="/api/v1/projects",
    tags=["Projects"],
)


# ============================================================
# AI GITHUB ANALYZER
# ============================================================

app.include_router(
    ai_github_router,
    prefix="/api/v1/ai/github",
    tags=["AI GitHub"],
)


# ============================================================
# AI RESUME CHATBOT
# ============================================================

app.include_router(
    ai_resume_router,
    prefix="/api/v1/ai/resume",
    tags=["AI - Resume"],
)


# ============================================================
# RESUMES
# ============================================================

app.include_router(
    resumes_router,
    prefix="/api/v1/resumes",
    tags=["Resumes"],
)


# ============================================================
# UPLOADS
# ============================================================

UPLOAD_DIR = os.path.join(
    tempfile.gettempdir(),
    "makemycv_uploads",
)

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True,
)

app.mount(
    "/api/v1/uploads",
    StaticFiles(directory=UPLOAD_DIR),
    name="uploads",
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