import sys
import os
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine

def migrate():
    db = SessionLocal()
    try:
        print("Checking/Adding missing columns to DB...")
        
        # Check and add dob to profiles
        try:
            db.execute(text("ALTER TABLE profiles ADD COLUMN dob DATE;"))
            db.commit()
            print("Successfully added 'dob' to 'profiles'.")
        except Exception as e:
            db.rollback()
            if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                print("'dob' already exists in 'profiles'.")
            else:
                print(f"Error adding 'dob': {e}")

        # Check and add phone to profiles
        try:
            db.execute(text("ALTER TABLE profiles ADD COLUMN phone VARCHAR;"))
            db.commit()
            print("Successfully added 'phone' to 'profiles'.")
        except Exception as e:
            db.rollback()
            if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                print("'phone' already exists in 'profiles'.")
            else:
                print(f"Error adding 'phone': {e}")

        # Check and add social columns to profiles
        social_cols = ["linkedin_url", "linkedin_text", "github_url", "github_text", "portfolio_url", "portfolio_text"]
        for col in social_cols:
            try:
                db.execute(text(f"ALTER TABLE profiles ADD COLUMN {col} VARCHAR;"))
                db.commit()
                print(f"Successfully added '{col}' to 'profiles'.")
            except Exception as e:
                db.rollback()
                if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                    print(f"'{col}' already exists in 'profiles'.")
                else:
                    print(f"Error adding '{col}': {e}")
                
        # Check and add github_link_text to projects
        try:
            db.execute(text("ALTER TABLE projects ADD COLUMN github_link_text VARCHAR;"))
            db.commit()
            print("Successfully added 'github_link_text' to 'projects'.")
        except Exception as e:
            db.rollback()
            if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                print("'github_link_text' already exists in 'projects'.")
            else:
                print(f"Error adding 'github_link_text': {e}")
                
        print("Migration check completed!")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
