import os
import io
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload, MediaIoBaseDownload
from fastapi import HTTPException, status

SCOPES = ['https://www.googleapis.com/auth/drive.file']

def get_drive_service():
    """Initializes and returns the Google Drive API service."""
    creds_json = os.environ.get("GOOGLE_DRIVE_CREDENTIALS_JSON")
    
    if creds_json:
        # Load credentials from environment variable (useful for Docker/Vercel)
        creds_dict = json.loads(creds_json)
        creds = service_account.Credentials.from_service_account_info(
            creds_dict, scopes=SCOPES
        )
    else:
        # Fallback to default application credentials (e.g., local file)
        # Note: Set GOOGLE_APPLICATION_CREDENTIALS env var to the file path
        try:
            import google.auth
            creds, _ = google.auth.default(scopes=SCOPES)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Google Drive credentials not configured properly."
            )

    return build('drive', 'v3', credentials=creds)

def get_or_create_user_folder(user_id: str) -> str:
    """
    Finds or creates a specific folder for the user inside the main GOOGLE_DRIVE_FOLDER_ID.
    """
    service = get_drive_service()
    main_folder_id = os.environ.get("GOOGLE_DRIVE_FOLDER_ID")
    if not main_folder_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GOOGLE_DRIVE_FOLDER_ID is not set in environment."
        )

    folder_name = f"User_{user_id}"
    
    # 1. Search for existing folder
    query = f"name='{folder_name}' and '{main_folder_id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false"
    try:
        response = service.files().list(q=query, spaces='drive', fields='files(id, name)').execute()
        files = response.get('files', [])
        if files:
            return files[0].get('id')
            
        # 2. If not found, create it
        folder_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder',
            'parents': [main_folder_id]
        }
        folder = service.files().create(body=folder_metadata, fields='id').execute()
        return folder.get('id')
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to setup user directory in Google Drive: {str(e)}"
        )

def upload_encrypted_file(file_bytes: bytes, filename: str, user_id: str, mime_type: str = 'application/octet-stream') -> str:
    """
    Uploads an encrypted file (bytes) to the specific user's folder in Google Drive.
    Returns the Google Drive File ID.
    """
    service = get_drive_service()
    
    # Get the specific folder for this user
    user_folder_id = get_or_create_user_folder(user_id)
    
    file_metadata = {
        'name': filename,
        'parents': [user_folder_id]
    }

    media = MediaIoBaseUpload(io.BytesIO(file_bytes), mimetype=mime_type, resumable=True)
    
    try:
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id'
        ).execute()
        return file.get('id')
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file to Google Drive: {str(e)}"
        )

def download_encrypted_file(file_id: str) -> bytes:
    """
    Downloads an encrypted file from Google Drive given its File ID.
    Returns the file bytes.
    """
    service = get_drive_service()
    
    try:
        request = service.files().get_media(fileId=file_id)
        file_io = io.BytesIO()
        downloader = MediaIoBaseDownload(file_io, request)
        
        done = False
        while done is False:
            status_, done = downloader.next_chunk()
            
        return file_io.getvalue()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download file from Google Drive: {str(e)}"
        )

def delete_encrypted_file(file_id: str):
    """
    Deletes a file from Google Drive.
    """
    service = get_drive_service()
    try:
        service.files().delete(fileId=file_id).execute()
    except Exception as e:
        # We might not want to fail the whole request if deletion fails, just log it.
        # But for now, we'll raise an error.
        print(f"Warning: Failed to delete file {file_id} from Google Drive: {e}")
