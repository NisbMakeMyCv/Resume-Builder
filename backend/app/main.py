import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from app.api.v1.auth import router as auth_router
from app.core.database import engine
from app.models import user

user.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MakeMyCV Backend API",
    description="RESTful API for the Resume Builder MVP",
    version="1.0.0"
)

app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])

@app.get("/")
def root():
    return {"message": "Welcome to MakeMyCV API! Go to /docs for the interactive Swagger UI."}
