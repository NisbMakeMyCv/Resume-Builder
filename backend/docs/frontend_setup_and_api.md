# Frontend Developer Guide

## How to Boot the Backend
You do not need to install Python. We have fully Dockerized the backend environment!
1. Ensure Docker Desktop is running.
2. Open a terminal in the `backend/` folder.
3. Run: `docker-compose pull && docker-compose up -d`
4. The API is now running at `http://localhost:8000`
5. The Interactive Swagger UI is available at `http://localhost:8000/docs`

> **Note for UI Testing:** If you don't have the real Google SMTP passwords in a `.env.local` file, the backend won't send real emails. Instead, it will instantly print the 6-digit OTP codes directly into your terminal logs! Run `docker logs makemycv-api` to see the codes during testing.

### 🐘 How to view the Database (DBeaver)
Because Docker maps port `5432` to your machine, your team can connect to the live local database using DBeaver to visually inspect the data!
- **Host:** `localhost`
- **Port:** `5432`
- **Database:** `makemycv_db`
- **Username:** `makemycv_user`
- **Password:** `supersecretpassword`
- **Direct Connection String:** `postgresql://makemycv_user:supersecretpassword@localhost:5432/makemycv_db`

## Core API Endpoints

### 1. Request OTP (Required for Login & Register)
`POST /api/v1/auth/request-otp`
- **Body:** `{ "email": "user@example.com" }`
- **Action:** Sends a 6-digit code to the user's email.

### 2. Register
`POST /api/v1/auth/register`
- **Body:** `{ "email": "...", "password": "...", "full_name": "...", "otp_code": "123456" }`
- **Response:** 201 Created

### 3. Login
`POST /api/v1/auth/login`
- **Body:** `{ "email": "...", "password": "...", "otp_code": "123456" }`
- **Response:** `{ "access_token": "eyJhb...", "token_type": "bearer" }`

### 4. Google Login
`POST /api/v1/auth/google`
- **Body:** `{ "token": "GOOGLE_JWT_ID_TOKEN" }`
- **Response:** `{ "access_token": "...", "token_type": "bearer" }`

### 5. Fetch Profile (Protected)
`GET /api/v1/auth/me`
- **Headers:** `Authorization: Bearer <access_token>`

### 6. Forgot Password
`POST /api/v1/auth/forgot-password`
- **Body:** `{ "email": "user@example.com" }`
- **Action:** Sends a password reset OTP to the user's email. (Fails gracefully if the user logged in via Google).

### 7. Reset Password
`POST /api/v1/auth/reset-password`
- **Body:** `{ "email": "...", "otp_code": "123456", "new_password": "new_secure_password" }`
- **Response:** 200 OK (Password updated, user can now log in).
