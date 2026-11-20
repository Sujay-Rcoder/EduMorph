"""
EduMorph RAG - File Validators
Utilities for validating uploaded files.
"""

import hashlib
from pathlib import Path
from fastapi import UploadFile, HTTPException, status

from backend.config import get_settings


async def validate_file(file: UploadFile) -> tuple[str, bytes]:
    """
    Validate an uploaded file.
    
    Args:
        file: The uploaded file to validate
        
    Returns:
        Tuple of (file extension, file content)
        
    Raises:
        HTTPException: If validation fails
    """
    settings = get_settings()
    
    # Check filename exists
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required"
        )
    
    # Check file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in settings.supported_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {file_ext}. Supported types: {settings.supported_extensions}"
        )
    
    # Read file content
    content = await file.read()
    await file.seek(0)  # Reset for potential re-read
    
    # Check if file is empty
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is empty"
        )
    
    # Check file size
    if len(content) > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {settings.max_file_size_mb}MB"
        )
    
    return file_ext, content


def compute_content_hash(content: bytes) -> str:
    """Compute SHA-256 hash of content for duplicate detection."""
    return hashlib.sha256(content).hexdigest()


def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe storage."""
    # Remove path components and keep only the filename
    name = Path(filename).name
    # Replace problematic characters
    for char in ['<', '>', ':', '"', '/', '\\', '|', '?', '*']:
        name = name.replace(char, '_')
    return name
