"""
EduMorph RAG - Flashcards Router
Generate rich, notebook-style flashcards from uploaded documents.
"""

import logging
from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.services.vector_store import get_vector_store
from backend.services.llm_service import get_llm_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/flashcards", tags=["Flashcards"])

# Human-readable labels for markdown/download (key -> heading)
FLASHCARD_KEY_LABELS = {
    "concept": "Concept",
    "definition": "Definition",
    "deep_explanation": "Deep explanation",
    "key_terms": "Key terms",
    "formulas_or_rules": "Formulas & rules",
    "examples": "Examples",
    "real_life_examples": "Real-life examples",
    "common_mistakes": "Common mistakes",
    "exam_tips": "Exam tips",
    "prerequisites": "Prerequisites",
    "past_scope": "Prior / background",
    "future_scope": "Future scope",
    "applications": "Applications",
    "how_to_relate": "How to relate",
    "study_resources": "Study resources",
    "summary": "Summary",
    "related_concepts": "Related concepts",
    "practice_suggestions": "Practice suggestions",
    "visual_note": "Visual note",
    "mnemonics": "Mnemonics",
    "comparison": "Comparison",
}


class FlashcardGenerateRequest(BaseModel):
    """Request to generate flashcards from documents."""
    document_ids: Optional[list[str]] = Field(
        default=None,
        description="Document IDs to use. If empty or null, use all documents."
    )


class FlashcardGenerateResponse(BaseModel):
    """Response with generated flashcards and full-page markdown for download."""
    success: bool = True
    flashcards: list[dict[str, Any]]  # flexible: any keys from LLM
    full_page_markdown: str
    document_count: int
    workspace_name: Optional[str] = None


def _flashcards_to_markdown(flashcards: list[dict], workspace_name: Optional[str] = None) -> str:
    """Build a single long markdown page for download/share; includes all keys."""
    title = "# Flashcards"
    if workspace_name:
        title += f" — {workspace_name}"
    title += "\n\n---\n\n"

    sections = []
    for i, card in enumerate(flashcards, 1):
        concept = card.get("concept", f"Concept {i}")
        block = f"## {i}. {concept}\n\n"
        for key, value in card.items():
            if key == "concept" or not value or not isinstance(value, str):
                continue
            label = FLASHCARD_KEY_LABELS.get(key, key.replace("_", " ").title())
            block += f"### {label}\n\n{value.strip()}\n\n"
        block += "---\n\n"
        sections.append(block)

    return title + "\n".join(sections)


@router.post("/generate", response_model=FlashcardGenerateResponse)
async def generate_flashcards(request: FlashcardGenerateRequest):
    """
    Generate a full set of rich flashcards from the given (or all) documents.

    Each flashcard includes:
    - Concept title
    - Deep explanation
    - Future scope (applications, next topics)
    - Past scope (prerequisites)
    - How to relate (to student's life)
    - Study resources (online, books)

    Returns flashcards list and full_page_markdown for download/share.
    """
    try:
        vector_store = get_vector_store()
        llm_service = get_llm_service()

        if not vector_store.has_documents():
            raise HTTPException(
                status_code=400,
                detail="No documents available. Upload study materials first."
            )

        if not llm_service.is_configured():
            raise HTTPException(
                status_code=503,
                detail="LLM service not configured. Set GROQ_API_KEY."
            )

        # Resolve document IDs: use provided list or all documents
        if request.document_ids:
            document_ids = request.document_ids
        else:
            all_docs = vector_store.get_all_documents()
            document_ids = [d.get("id") for d in all_docs if d.get("id")]

        if not document_ids:
            raise HTTPException(
                status_code=400,
                detail="No documents to use for flashcards."
            )

        chunks = vector_store.get_chunks_by_document_ids(
            document_ids,
            max_chunks=80
        )

        if not chunks:
            raise HTTPException(
                status_code=400,
                detail="No content found for the selected documents."
            )

        logger.info(f"Generating flashcards from {len(document_ids)} document(s), {len(chunks)} chunks")

        raw_flashcards = await llm_service.generate_flashcards(chunks)

        if not raw_flashcards:
            raise HTTPException(
                status_code=500,
                detail="Flashcard generation returned no valid cards. Try again."
            )

        full_md = _flashcards_to_markdown(raw_flashcards)

        return FlashcardGenerateResponse(
            success=True,
            flashcards=raw_flashcards,
            full_page_markdown=full_md,
            document_count=len(document_ids),
            workspace_name=None,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Flashcard generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
