from pydantic import BaseModel, EmailStr

class OTPRequest(BaseModel):
    email: EmailStr

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str
    otp_code: str

class UserRegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    otp_code: str

class GoogleLoginRequest(BaseModel):
    token: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str
