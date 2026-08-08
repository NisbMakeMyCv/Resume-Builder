# Frontend Developer Guide

## How to Boot the Backend
You do not need to install Python. We have fully Dockerized the backend environment!
1. Ensure Docker Desktop is running.
2. Open a terminal in the `backend/` folder.
3. Run: `docker-compose pull && docker-compose up -d`
4. The API is now running at `http://localhost:8000`
5. The Interactive Swagger UI is available at `http://localhost:8000/docs`

> **Note for UI Testing:** If you don't have the real Google SMTP passwords in a `.env.local` file, the backend won't send real emails. Instead, it will instantly print the 6-digit OTP codes directly into your terminal logs! Run `docker logs makemycv-api` to see the codes during testing.

## 1. Authentication & Identity APIs

### 1. Request OTP
`POST /api/v1/auth/request-otp`
- **Body:** `{ "email": "user@example.com" }`
- **Action:** Sends a 6-digit code to the user's email.

### 2. Register (Auto-Logins User)
`POST /api/v1/auth/register`
- **Body:** `{ "email": "...", "password": "...", "full_name": "...", "otp_code": "123456" }`
- **Response:** `{ "access_token": "eyJhb...", "token_type": "bearer" }` (Instantly logs them in).

### 3. Login
`POST /api/v1/auth/login`
- **Body:** `{ "email": "...", "password": "...", "otp_code": "123456" }`
- **Response:** `{ "access_token": "eyJhb...", "token_type": "bearer" }`

### 4. Google Login
`POST /api/v1/auth/google`
- **Body:** `{ "token": "GOOGLE_JWT_ID_TOKEN" }`
- **Response:** `{ "access_token": "...", "token_type": "bearer" }`

### 5. Fetch Identity
`GET /api/v1/auth/me`
- **Headers:** `Authorization: Bearer <access_token>`
- **Response:** Includes `id`, `email`, `full_name`, and `profile_picture` (Generated UI-Avatar or Google profile picture).

### 6. Delete Account (GDPR)
`DELETE /api/v1/auth/me`
- **Headers:** `Authorization: Bearer <access_token>`
- **Action:** Permanently wipes the user's identity, profile, and all resume data.

### 7. Forgot / Reset Password
`POST /api/v1/auth/forgot-password` (Requires `email`)
`POST /api/v1/auth/reset-password` (Requires `email`, `otp_code`, `new_password`)


## 2. Resume Data APIs (Protected by JWT)
*Note: All of these endpoints require the `Authorization: Bearer <access_token>` header.*

### Profile
`GET /api/v1/profile/`
- **Action:** Fetches the current user's profile text (Headline, Summary, Location). If they don't have one, it auto-generates a blank one so you don't get a 404!

`PATCH /api/v1/profile/`
- **Body:** `{ "headline": "Software Engineer" }` (Send only the fields you want to update).
- **Action:** Used for UI Auto-Saving. Safely updates partial profile data without destroying other fields.
