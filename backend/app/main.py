import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.auth import router as auth_router
from app.core.database import engine
from app.models import user

user.Base.metadata.create_all(bind=engine)

origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    # Add the production frontend URL here when deployed.
]

app = FastAPI(
    title="MakeMyCV Backend API",
    description="RESTful API for the Resume Builder MVP",
    version="1.0.0"
)

# The frontend fetches this API directly from the browser (see
# backend/docs/frontend_setup_and_api.md), so CORS must be enabled for
# the dev frontend origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])

@app.get("/")
def root():
    return {"message": "Welcome to MakeMyCV API! Go to /docs for the interactive Swagger UI."}
