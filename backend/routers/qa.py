"""
EduMorph RAG - Question-Answer Router
Endpoints for asking questions and system health.
"""

import time
import logging

from fastapi import APIRouter, HTTPException, status

from backend.config import get_settings
from backend.models import (
    QuestionRequest,
    AnswerResponse,
    SourceChunk,
    HealthResponse,
    SystemStats,
    ErrorResponse
)
from backend.services.vector_store import get_vector_store
from backend.services.llm_service import get_llm_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Question-Answering"])


@router.post(
    "/ask",
    response_model=AnswerResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid question"},
        503: {"model": ErrorResponse, "description": "LLM service unavailable"}
    }
)
async def ask_question(request: QuestionRequest):
    """
    Ask a question about the uploaded educational materials.
    
    The system will:
    1. Search for relevant content in uploaded documents
    2. Generate an educational, structured answer
    3. Cite sources from the materials
    
    If no relevant information is found, the system will clearly indicate this.
    """
    start_time = time.time()
    
    try:
        question = request.question.strip()
        
        if len(question) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Question is too short. Please provide more context."
            )
        
        logger.info(f"Processing question: {question[:100]}...")
        
        vector_store = get_vector_store()
        llm_service = get_llm_service()
        
        # Check if LLM is configured
        if not llm_service.is_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="LLM service not configured. Please set GROQ_API_KEY in environment variables."
            )
        
        # Check if we have any documents
        if not vector_store.has_documents():
            answer = await llm_service.generate_no_context_response(question)
            processing_time = (time.time() - start_time) * 1000
            
            return AnswerResponse(
                success=True,
                question=question,
                answer=answer,
                sources=[],
                processing_time_ms=processing_time
            )
        
        # Query the vector store
        settings = get_settings()
        results = vector_store.query(
            query_text=question,
            n_results=settings.max_context_chunks
        )
        
        # Prepare context chunks for LLM
        context_chunks = []
        source_chunks = []
        
        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]
        ids = results.get("ids", [[]])[0]
        
        for i, (doc, meta, dist, chunk_id) in enumerate(zip(documents, metadatas, distances, ids)):
            if doc:  # Skip empty results
                # Convert distance to similarity score (ChromaDB uses L2 distance)
                # Lower distance = higher similarity
                similarity = max(0, 1 - (dist / 2))  # Normalize to 0-1 range
                
                context_chunks.append({
                    "content": doc,
                    "metadata": meta
                })
                
                source_chunks.append(SourceChunk(
                    document_id=meta.get("document_id", "unknown"),
                    document_name=meta.get("filename", "Unknown source"),
                    chunk_id=chunk_id,
                    content_preview=doc[:200] + "..." if len(doc) > 200 else doc,
                    relevance_score=round(similarity, 3)
                ))
        
        # Generate answer
        if context_chunks:
            answer = await llm_service.generate_answer(question, context_chunks)
        else:
            answer = (
                "I couldn't find any relevant information in the uploaded materials "
                "to answer your question. Please try rephrasing or upload additional documents."
            )
        
        processing_time = (time.time() - start_time) * 1000
        
        logger.info(f"Question answered in {processing_time:.2f}ms")
        
        return AnswerResponse(
            success=True,
            question=question,
            answer=answer,
            sources=source_chunks,
            processing_time_ms=round(processing_time, 2)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error answering question: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process question: {str(e)}"
        )


@router.get(
    "/health",
    response_model=HealthResponse
)
async def health_check():
    """
    Check system health and readiness.
    
    Returns:
        System status, version, and component readiness
    """
    try:
        settings = get_settings()
        vector_store = get_vector_store()
        llm_service = get_llm_service()
        
        stats = vector_store.get_stats()
        
        return HealthResponse(
            status="healthy" if llm_service.is_configured() else "degraded",
            version=settings.app_version,
            documents_loaded=stats["total_documents"],
            vector_store_ready=True
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthResponse(
            status="unhealthy",
            version=get_settings().app_version,
            documents_loaded=0,
            vector_store_ready=False
        )


@router.get(
    "/stats",
    response_model=SystemStats
)
async def get_system_stats():
    """
    Get detailed system statistics.
    
    Returns:
        Document counts, model information, and system metrics
    """
    try:
        settings = get_settings()
        vector_store = get_vector_store()
        stats = vector_store.get_stats()
        
        return SystemStats(
            total_documents=stats["total_documents"],
            total_chunks=stats["total_chunks"],
            embedding_model=settings.embedding_model,
            llm_model=settings.llm_model
        )
        
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get system stats: {str(e)}"
        )
