import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    profile_picture = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    auth_methods = relationship("UserAuthMethod", back_populates="user")

class UserAuthMethod(Base):
    __tablename__ = "user_auth_methods"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    provider = Column(String, nullable=False)
    provider_account_id = Column(String, nullable=True)
    hashed_password = Column(String, nullable=True)

    user = relationship("User", back_populates="auth_methods")

class EmailOTP(Base):
    __tablename__ = "email_otps"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, index=True, nullable=False)
    otp_code = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
