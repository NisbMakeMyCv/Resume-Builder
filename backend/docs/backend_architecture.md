# MakeMyCV - Backend Architecture 

## Overview
This backend is built on **FastAPI (Python)**, utilizing **PostgreSQL** as the primary relational database and **SQLAlchemy** as the ORM. The application follows Domain-Driven Design (DDD) principles.

## Database Schema (Authentication)
To support a robust, enterprise-grade authentication system, we implemented a Many-to-One (M:1) provider strategy.

### Tables:
1. **users:** The core entity representing a human being.
   - `id` (UUID), `email` (Unique), `full_name`, `created_at`
2. **user_auth_methods:** Stores all the different ways a specific user is allowed to log in.
   - `id` (UUID), `user_id` (FK), `provider` (EMAIL, GOOGLE, OTP), `hashed_password` (Optional), `provider_account_id` (Optional)
3. **email_otps:** A temporary table that holds 6-digit verification codes for Two-Factor Authentication.

## Authentication Flow
We use **JWT (JSON Web Tokens)** for stateless session management.
- All secure endpoints require a Bearer token in the `Authorization` header.
- The token payload contains the user's UUID in the `sub` claim.
