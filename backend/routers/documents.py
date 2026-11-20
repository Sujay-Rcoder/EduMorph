"""
EduMorph RAG - Document Router
Endpoints for document upload, listing, and management.
"""

import uuid
import logging
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, HTTPException, status

from backend.models import (
    DocumentUploadResponse,
    DocumentListResponse,
    DocumentDeleteResponse,
    DocumentMetadata,
    ErrorResponse
)
from backend.utils.validators import validate_file, compute_content_hash, sanitize_filename
from backend.services.document_processor import get_document_processor
from backend.services.chunker import get_chunker
from backend.services.vector_store import get_vector_store

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid file"},
        409: {"model": ErrorResponse, "description": "Duplicate document"},
        500: {"model": ErrorResponse, "description": "Processing error"}
    }
)
async def upload_document(file: UploadFile = File(...)):
    """
    Upload an educational document for processing.
    
    Supports: PDF, TXT, MD, MARKDOWN files.
    
    The document will be:
    1. Validated for type and size
    2. Checked for duplicates
    3. Text extracted
    4. Split into chunks
    5. Embedded and stored for retrieval
    """
    try:
        # Validate the file
        file_ext, content = await validate_file(file)
        filename = sanitize_filename(file.filename or "document")
        
        logger.info(f"Processing upload: {filename}")
        
        # Check for duplicates
        content_hash = compute_content_hash(content)
        vector_store = get_vector_store()
        
        existing_doc = vector_store.get_document_by_hash(content_hash)
        if existing_doc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"This document has already been uploaded as '{existing_doc.get('filename', 'unknown')}'"
            )
        
        # Extract text
        processor = get_document_processor()
        text = processor.extract_text(content, file_ext, filename)
        
        # Chunk the text
        chunker = get_chunker()
        chunks = chunker.chunk_text(text)
        
        if not chunks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not extract any meaningful content from the document"
            )
        
        # Generate document ID and store
        document_id = str(uuid.uuid4())
        chunk_texts = [chunk.content for chunk in chunks]
        
        num_chunks = vector_store.add_document(
            document_id=document_id,
            chunks=chunk_texts,
            filename=filename,
            content_hash=content_hash,
            file_type=file_ext,
            file_size=len(content)
        )
        
        logger.info(f"Successfully processed {filename}: {num_chunks} chunks")
        
        return DocumentUploadResponse(
            success=True,
            message=f"Document uploaded successfully. Extracted {num_chunks} chunks for retrieval.",
            document=DocumentMetadata(
                id=document_id,
                filename=filename,
                file_type=file_ext,
                chunk_count=num_chunks,
                uploaded_at=datetime.utcnow(),
                file_size_bytes=len(content)
            )
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error processing document: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process document: {str(e)}"
        )


@router.get(
    "",
    response_model=DocumentListResponse
)
async def list_documents():
    """
    List all uploaded documents.
    
    Returns metadata for each document including filename, type, chunk count, and upload time.
    """
    try:
        vector_store = get_vector_store()
        documents = vector_store.get_all_documents()
        
        doc_list = []
        for doc in documents:
            # Parse the datetime string if needed
            uploaded_at = doc.get("uploaded_at")
            if isinstance(uploaded_at, str):
                try:
                    uploaded_at = datetime.fromisoformat(uploaded_at)
                except:
                    uploaded_at = datetime.utcnow()
            
            doc_list.append(DocumentMetadata(
                id=doc["id"],
                filename=doc.get("filename", "Unknown"),
                file_type=doc.get("file_type", "unknown"),
                chunk_count=doc.get("chunk_count", 0),
                uploaded_at=uploaded_at,
                file_size_bytes=doc.get("file_size_bytes", 0)
            ))
        
        return DocumentListResponse(
            total_documents=len(doc_list),
            documents=doc_list
        )
        
    except Exception as e:
        logger.error(f"Error listing documents: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list documents: {str(e)}"
        )


@router.delete(
    "/{document_id}",
    response_model=DocumentDeleteResponse
)
async def delete_document(document_id: str):
    """
    Delete a document and all its chunks.
    
    Args:
        document_id: The ID of the document to delete
    """
    try:
        vector_store = get_vector_store()
        success = vector_store.delete_document(document_id)
        
        if success:
            return DocumentDeleteResponse(
                success=True,
                message=f"Document {document_id} deleted successfully"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document {document_id} not found"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document: {str(e)}"
        )
