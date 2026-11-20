"""
EduMorph RAG - Quiz Router
API endpoints for quiz generation and evaluation.
"""

import logging
import time
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.services.vector_store import get_vector_store
from backend.services.quiz_service import get_quiz_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/quiz", tags=["Quiz"])


# Request/Response Models
class QuizGenerateRequest(BaseModel):
    """Request to generate a quiz."""
    topic: Optional[str] = Field(None, description="Topic focus for questions")
    num_questions: int = Field(5, ge=1, le=10, description="Number of questions")
    difficulty: str = Field("mixed", description="easy, medium, hard, or mixed")


class QuizQuestion(BaseModel):
    """A single quiz question."""
    id: int
    question: str
    difficulty: str
    expected_answer: str
    key_concepts: list[str] = []


class QuizGenerateResponse(BaseModel):
    """Response with generated quiz."""
    quiz_id: str
    questions: list[QuizQuestion]
    topic: Optional[str]
    generated_at: str


class AnswerSubmission(BaseModel):
    """A single answer submission."""
    question_id: int
    answer: str


class QuizEvaluateRequest(BaseModel):
    """Request to evaluate quiz answers."""
    quiz_id: str
    questions: list[dict]
    answers: list[AnswerSubmission]


class AnswerEvaluation(BaseModel):
    """Evaluation for a single answer."""
    question_id: int
    feedback_type: str
    score: int
    feedback: str
    missing_concepts: list[str] = []
    improvement_tips: str = ""
    correct_answer_summary: str = ""


class QuizEvaluateResponse(BaseModel):
    """Response with quiz evaluation."""
    quiz_id: str
    evaluations: list[AnswerEvaluation]
    overall_score: int
    overall_feedback: str
    strong_areas: list[str] = []
    weak_areas: list[str] = []
    processing_time_ms: float


@router.post("/generate", response_model=QuizGenerateResponse)
async def generate_quiz(request: QuizGenerateRequest):
    """
    Generate a quiz based on uploaded documents.
    
    - Retrieves relevant content from vector store
    - Uses AI to create educational questions
    - Returns questions without answers for student
    """
    start_time = time.time()
    
    try:
        vector_store = get_vector_store()
        quiz_service = get_quiz_service()
        
        # Get relevant chunks (use topic as search query or generic)
        # Get relevant chunks (use topic as search query or generic)
        search_query = request.topic or "main concepts and key points"
        results = vector_store.query(search_query, n_results=6)
        
        # Process results into chunks format expected by quiz_service
        chunks = []
        if results and results.get("documents") and results["documents"][0]:
            documents = results["documents"][0]
            metadatas = results["metadatas"][0] if results.get("metadatas") else []
            
            for i, doc in enumerate(documents):
                chunks.append({
                    "content": doc,
                    "metadata": metadatas[i] if i < len(metadatas) else {}
                })
        
        if not chunks:
            # Check if there are any documents at all
            if not vector_store.has_documents():
                raise HTTPException(
                    status_code=400,
                    detail="No documents available. Please upload study materials first."
                )
            # If documents exist but no results found (unlikely), fallback to getting anything
            logger.warning("Search returned no results, trying generic query")
            results = vector_store.query("summary", n_results=6)
            if results and results.get("documents") and results["documents"][0]:
                documents = results["documents"][0]
                metadatas = results["metadatas"][0] if results.get("metadatas") else []
                for i, doc in enumerate(documents):
                    chunks.append({
                        "content": doc,
                        "metadata": metadatas[i] if i < len(metadatas) else {}
                    })
        
        logger.info(f"Generating quiz: {request.num_questions} questions, difficulty: {request.difficulty}")
        
        # Generate quiz
        quiz_data = await quiz_service.generate_quiz(
            context_chunks=chunks,
            num_questions=request.num_questions,
            difficulty=request.difficulty
        )
        
        # Create quiz ID
        import uuid
        quiz_id = str(uuid.uuid4())[:8]
        
        # Parse questions
        questions = []
        for q in quiz_data.get("questions", []):
            questions.append(QuizQuestion(
                id=q.get("id", len(questions) + 1),
                question=q.get("question", ""),
                difficulty=q.get("difficulty", "medium"),
                expected_answer=q.get("expected_answer", ""),
                key_concepts=q.get("key_concepts", [])
            ))
        
        from datetime import datetime
        
        return QuizGenerateResponse(
            quiz_id=quiz_id,
            questions=questions,
            topic=request.topic,
            generated_at=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating quiz: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/evaluate", response_model=QuizEvaluateResponse)
async def evaluate_quiz(request: QuizEvaluateRequest):
    """
    Evaluate student's quiz answers.
    
    - Compares answers against expected answers
    - Provides detailed feedback for each answer
    - Gives overall score and improvement suggestions
    """
    start_time = time.time()
    
    try:
        quiz_service = get_quiz_service()
        
        logger.info(f"Evaluating quiz {request.quiz_id}: {len(request.answers)} answers")
        
        # Convert answers to dict format
        answers_list = [
            {"question_id": a.question_id, "answer": a.answer}
            for a in request.answers
        ]
        
        # Evaluate with AI
        eval_data = await quiz_service.evaluate_answers(
            questions=request.questions,
            user_answers=answers_list
        )
        
        # Parse evaluations
        evaluations = []
        for e in eval_data.get("evaluations", []):
            evaluations.append(AnswerEvaluation(
                question_id=e.get("question_id", 0),
                feedback_type=e.get("feedback_type", "needs_improvement"),
                score=e.get("score", 0),
                feedback=e.get("feedback", ""),
                missing_concepts=e.get("missing_concepts", []),
                improvement_tips=e.get("improvement_tips", ""),
                correct_answer_summary=e.get("correct_answer_summary", "")
            ))
        
        processing_time = (time.time() - start_time) * 1000
        
        return QuizEvaluateResponse(
            quiz_id=request.quiz_id,
            evaluations=evaluations,
            overall_score=eval_data.get("overall_score", 0),
            overall_feedback=eval_data.get("overall_feedback", ""),
            strong_areas=eval_data.get("strong_areas", []),
            weak_areas=eval_data.get("weak_areas", []),
            processing_time_ms=processing_time
        )
        
    except Exception as e:
        logger.error(f"Error evaluating quiz: {e}")
        raise HTTPException(status_code=500, detail=str(e))
