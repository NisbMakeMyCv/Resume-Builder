import os
import requests
from fastapi import HTTPException, status

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_ANON_KEY")
BUCKET_NAME = os.getenv("SUPABASE_AVATARS_BUCKET", "avatars")


def upload_avatar_to_supabase(
    file_bytes: bytes,
    file_ext: str,
    user_id: str,
    content_type: str = "image/png"
) -> str:
    """
    Uploads a user's profile avatar to Supabase Storage.
    Returns the permanent, CDN-backed public URL.
    """
    clean_ext = file_ext.lstrip(".")
    if not clean_ext:
        clean_ext = "png"
    
    file_path = f"user_{user_id}.{clean_ext}"

    # If Supabase URL / Key is not yet configured, provide a safe local mock URL for development
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[WARNING] SUPABASE_URL or SUPABASE_KEY not set. Using fallback avatar URL.")
        return f"https://ui-avatars.com/api/?name=User&background=random"

    # Supabase Storage Upload Endpoint
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{file_path}"

    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "apiKey": SUPABASE_KEY,
        "Content-Type": content_type,
        "x-upsert": "true",  # Overwrite previous avatar for this user
    }

    try:
        response = requests.post(upload_url, headers=headers, data=file_bytes, timeout=15)
        
        # If bucket does not exist yet (404), attempt to create it as a public bucket
        if response.status_code == 404 and "Bucket not found" in response.text:
            _create_public_bucket(BUCKET_NAME)
            # Retry upload once after bucket creation
            response = requests.post(upload_url, headers=headers, data=file_bytes, timeout=15)

        if response.status_code not in (200, 201):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload image to Supabase Storage: {response.text}"
            )

        # Permanent public URL format for Supabase Storage
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{file_path}"
        return public_url

    except requests.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Network error while communicating with Supabase Storage: {str(e)}"
        )


def _create_public_bucket(bucket_name: str):
    """Helper to automatically create a public bucket if it doesn't exist yet."""
    bucket_url = f"{SUPABASE_URL}/storage/v1/bucket"
    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "apiKey": SUPABASE_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "id": bucket_name,
        "name": bucket_name,
        "public": True
    }
    try:
        requests.post(bucket_url, headers=headers, json=payload, timeout=10)
    except Exception as e:
        print(f"[Supabase Storage] Could not auto-create bucket '{bucket_name}': {e}")
