import smtplib
import os
import random
from datetime import datetime, timedelta
from email.message import EmailMessage
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests

from app.schemas.user import UserLoginRequest, UserRegisterRequest, GoogleLoginRequest, OTPRequest
from app.core.database import get_db
from app.models.user import User, UserAuthMethod, EmailOTP
from app.core.security import get_password_hash, verify_password, create_access_token
from app.api.dependencies import get_current_user

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

router = APIRouter()

def verify_and_delete_otp(db: Session, email: str, otp_code: str):
    """Helper function to verify and consume OTP during registration or login"""
    otp_record = db.query(EmailOTP).filter(
        EmailOTP.email == email,
        EmailOTP.otp_code == otp_code
    ).order_by(EmailOTP.expires_at.desc()).first()
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid OTP code")
    if datetime.utcnow() > otp_record.expires_at:
        raise HTTPException(status_code=400, detail="OTP has expired")
        
    db.delete(otp_record)
    db.commit()

@router.post("/request-otp")
def request_otp(request: OTPRequest, db: Session = Depends(get_db)):
    otp = str(random.randint(100000, 999999))
    expiration = datetime.utcnow() + timedelta(minutes=5)
    
    new_otp = EmailOTP(email=request.email, otp_code=otp, expires_at=expiration)
    db.add(new_otp)
    db.commit()
    
    sender_email = os.getenv("SMTP_EMAIL")
    sender_password = os.getenv("SMTP_PASSWORD")

    if sender_email and sender_password and sender_email != "paste_your_team_gmail_here@gmail.com":
        msg = EmailMessage()
        msg.set_content(f"Your MakeMyCV Login Code is: {otp}\nThis code will expire in 5 minutes.")
        msg['Subject'] = 'MakeMyCV Verification Code'
        msg['From'] = sender_email
        msg['To'] = request.email

        try:
            server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
            server.login(sender_email, sender_password)
            server.send_message(msg)
            server.quit()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to send email: {e}")
    else:
        print(f"\n📧 [FALLBACK] SENDING EMAIL TO: {request.email} | CODE: {otp}\n")
    
    return {"message": f"OTP has been sent to {request.email}"}

@router.post("/register", status_code=201)
def register_user(request: UserRegisterRequest, db: Session = Depends(get_db)):
    # 1. First, prove they own the email by verifying the OTP
    verify_and_delete_otp(db, request.email, request.otp_code)

    existing_user = db.query(User).filter(User.email == request.email).first()
    
    if existing_user:
        email_auth = next((auth for auth in existing_user.auth_methods if auth.provider == "EMAIL"), None)
        if email_auth:
            raise HTTPException(status_code=400, detail="Email already registered with a password")
        
        new_auth = UserAuthMethod(user_id=existing_user.id, provider="EMAIL", hashed_password=get_password_hash(request.password))
        db.add(new_auth)
        
        if existing_user.full_name in ["New User", "New OTP User"]:
            existing_user.full_name = request.full_name
            
        db.commit()
        return {"message": "Password successfully linked to your existing account!", "email": existing_user.email}

    new_user = User(email=request.email, full_name=request.full_name)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    auth_method = UserAuthMethod(user_id=new_user.id, provider="EMAIL", hashed_password=get_password_hash(request.password))
    db.add(auth_method)
    db.commit()

    return {"message": "User registered successfully", "email": new_user.email}

@router.post("/login")
def login_user(request: UserLoginRequest, db: Session = Depends(get_db)):
    # 1. 2FA Check! Ensure they typed the OTP from their email
    verify_and_delete_otp(db, request.email, request.otp_code)

    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    email_auth = next((auth for auth in user.auth_methods if auth.provider == "EMAIL"), None)
    
    if not email_auth or not verify_password(request.password, email_auth.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/google")
def google_login(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    try:
        idinfo = id_token.verify_oauth2_token(request.token, requests.Request(), GOOGLE_CLIENT_ID)
        email = idinfo.get("email")
        full_name = idinfo.get("name")
        google_id = idinfo.get("sub")
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(email=email, full_name=full_name)
            db.add(user)
            db.commit()
            db.refresh(user)
            
        google_auth = next((auth for auth in user.auth_methods if auth.provider == "GOOGLE"), None)
        if not google_auth:
            new_auth = UserAuthMethod(user_id=user.id, provider="GOOGLE", provider_account_id=google_id)
            db.add(new_auth)
            db.commit()
            
        access_token = create_access_token(data={"sub": str(user.id)})
        return {"access_token": access_token, "token_type": "bearer"}
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google Token")

@router.get("/me")
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name
    }
