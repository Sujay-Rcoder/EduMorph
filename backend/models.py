"""
EduMorph RAG - Pydantic Models
Request and response models for API validation.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# ============== Document Models ==============

class DocumentMetadata(BaseModel):
    """Metadata for an uploaded document."""
    id: str
    filename: str
    file_type: str
    chunk_count: int
    uploaded_at: datetime
    file_size_bytes: int


class DocumentUploadResponse(BaseModel):
    """Response after successful document upload."""
    success: bool = True
    message: str
    document: DocumentMetadata


class DocumentListResponse(BaseModel):
    """Response with list of all documents."""
    total_documents: int
    documents: list[DocumentMetadata]


class DocumentDeleteResponse(BaseModel):
    """Response after document deletion."""
    success: bool
    message: str


# ============== Question-Answer Models ==============

class QuestionRequest(BaseModel):
    """Request model for asking a question."""
    question: str = Field(..., min_length=3, max_length=1000, description="The question to ask")


class SourceChunk(BaseModel):
    """A source chunk used in generating the answer."""
    document_id: str
    document_name: str
    chunk_id: str
    content_preview: str
    relevance_score: float


class AnswerResponse(BaseModel):
    """Response with answer and sources."""
    success: bool = True
    question: str
    answer: str
    sources: list[SourceChunk]
    processing_time_ms: float


class ErrorResponse(BaseModel):
    """Standard error response."""
    success: bool = False
    error: str
    detail: Optional[str] = None


# ============== Health & Status Models ==============

class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    documents_loaded: int
    vector_store_ready: bool


class SystemStats(BaseModel):
    """System statistics."""
    total_documents: int
    total_chunks: int
    embedding_model: str
    llm_model: str
