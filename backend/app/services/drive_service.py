import os
import io
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload, MediaIoBaseDownload
from fastapi import HTTPException, status

SCOPES = ['https://www.googleapis.com/auth/drive.file']

from google.oauth2.credentials import Credentials

def get_drive_service():
    """Initializes and returns the Google Drive API service using User OAuth2 credentials."""
    refresh_token = os.environ.get("GOOGLE_DRIVE_REFRESH_TOKEN")
    client_id = os.environ.get("GOOGLE_DRIVE_CLIENT_ID")
    client_secret = os.environ.get("GOOGLE_DRIVE_CLIENT_SECRET")
    
    if refresh_token and client_id and client_secret:
        creds = Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=client_id,
            client_secret=client_secret,
            scopes=SCOPES
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google Drive OAuth credentials not fully configured in .env.local"
        )

    try:
        return build('drive', 'v3', credentials=creds)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to build Google Drive API client: {str(e)}"
        )

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
        response = service.files().list(
            q=query, spaces='drive', fields='files(id, name)',
            includeItemsFromAllDrives=True, supportsAllDrives=True
        ).execute()
        files = response.get('files', [])
        if files:
            return files[0].get('id')
            
        # 2. If not found, create it
        folder_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder',
            'parents': [main_folder_id]
        }
        folder = service.files().create(
            body=folder_metadata, fields='id',
            supportsAllDrives=True
        ).execute()
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
            fields='id',
            supportsAllDrives=True
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
        request = service.files().get_media(fileId=file_id, supportsAllDrives=True)
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
        service.files().delete(fileId=file_id, supportsAllDrives=True).execute()
    except Exception as e:
        # We might not want to fail the whole request if deletion fails, just log it.
        # But for now, we'll raise an error.
        print(f"Warning: Failed to delete file {file_id} from Google Drive: {e}")
