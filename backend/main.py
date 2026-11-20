"""
EduMorph RAG - Main Application
FastAPI application entry point with lifespan management.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import get_settings
from backend.routers import documents, qa, quiz, flashcards

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup
    settings = get_settings()
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    
    # Ensure directories exist
    settings.ensure_directories()
    
    # Pre-initialize vector store to load persisted data
    from backend.services.vector_store import get_vector_store
    vector_store = get_vector_store()
    stats = vector_store.get_stats()
    logger.info(f"Loaded {stats['total_documents']} documents with {stats['total_chunks']} chunks")
    
    # Check LLM configuration
    from backend.services.llm_service import get_llm_service
    llm_service = get_llm_service()
    if not llm_service.is_configured():
        logger.warning("GROQ_API_KEY not configured. Question answering will not work.")
    else:
        logger.info("LLM service configured successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down EduMorph RAG...")


# Create FastAPI app
settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="""
## EduMorph RAG - Educational Document Q&A System

An intelligent question-answering system for educational content.

### Features

- **Document Upload**: Upload PDF, TXT, or Markdown files
- **Smart Retrieval**: Semantic search through your documents
- **Educational Answers**: Get structured, student-friendly responses
- **Source Citations**: Every answer includes its sources

### Quick Start

1. Upload documents using `POST /documents/upload`
2. Ask questions using `POST /ask`
3. Get educational, context-aware answers!

### API Sections

- **Documents**: Upload and manage educational materials
- **Question-Answering**: Ask questions and get answers with sources
    """,
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(documents.router)
app.include_router(qa.router)
app.include_router(quiz.router)
app.include_router(flashcards.router)


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "description": "Educational Document Q&A System",
        "docs": "/docs",
        "health": "/health"
    }


# For running with uvicorn directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
