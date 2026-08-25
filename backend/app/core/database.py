from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from pathlib import Path

from dotenv import load_dotenv

# Always load .env from the backend root (2 levels up from app/core/)
load_dotenv(Path(__file__).resolve().parents[2] / ".env")


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://makemycv_user:supersecretpassword@127.0.0.1:5432/makemycv_db",
)


engine = create_engine(DATABASE_URL)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
