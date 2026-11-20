"""
EduMorph RAG - Quiz Service
Handles quiz generation and answer evaluation with AI feedback.
"""

import logging
from typing import Any

from groq import Groq

from backend.config import get_settings

logger = logging.getLogger(__name__)


# Quiz generation prompt
QUIZ_SYSTEM_PROMPT = """You are a quiz generator for students. Your role is to create educational quizzes based on study materials.

## Guidelines:
1. Create questions that test understanding, not just memorization
2. Mix easy, medium, and hard questions
3. Make questions specific to the provided context
4. Include clear, educational answers

## Output Format (STRICT JSON):
Return ONLY valid JSON with this structure:
{
    "questions": [
        {
            "id": 1,
            "question": "Your question here?",
            "difficulty": "easy|medium|hard",
            "expected_answer": "The correct answer with explanation",
            "key_concepts": ["concept1", "concept2"]
        }
    ]
}

Do NOT include any text outside the JSON. Return ONLY the JSON object."""


# Answer evaluation prompt
EVALUATION_SYSTEM_PROMPT = """You are an educational evaluator. Assess student answers and provide constructive feedback.

## Evaluation Criteria:
- **Correctness**: Does the answer contain accurate information?
- **Completeness**: Are all key concepts covered?
- **Understanding**: Does the answer show deep understanding?
- **Clarity**: Is the answer well-explained?

## Feedback Types:
- "correct" - Answer is fully correct and well-explained
- "partial" - Some points correct, missing key elements
- "needs_improvement" - Major gaps or misconceptions
- "off_topic" - Answer doesn't address the question

## Output Format (STRICT JSON):
Return ONLY valid JSON with this structure:
{
    "evaluations": [
        {
            "question_id": 1,
            "feedback_type": "correct|partial|needs_improvement|off_topic",
            "score": 0-10,
            "feedback": "Specific feedback message",
            "missing_concepts": ["concept1"],
            "improvement_tips": "How to improve",
            "correct_answer_summary": "Brief correct answer"
        }
    ],
    "overall_score": 0-100,
    "overall_feedback": "General feedback and study recommendations",
    "strong_areas": ["topic1"],
    "weak_areas": ["topic2"]
}

Do NOT include any text outside the JSON. Return ONLY the JSON object."""


class QuizService:
    """
    Service for generating quizzes and evaluating student answers.
    """
    
    def __init__(self):
        self.settings = get_settings()
        self._client: Groq | None = None
    
    @property
    def client(self) -> Groq:
        """Lazy load the Groq client."""
        if self._client is None:
            api_key = self.settings.groq_api_key
            if not api_key or api_key == "your_groq_api_key_here":
                raise ValueError("GROQ_API_KEY not configured.")
            self._client = Groq(api_key=api_key)
        return self._client
    
    async def generate_quiz(
        self,
        context_chunks: list[dict[str, Any]],
        num_questions: int = 5,
        difficulty: str = "mixed"
    ) -> dict:
        """
        Generate a quiz based on document context.
        
        Args:
            context_chunks: Retrieved document chunks
            num_questions: Number of questions to generate
            difficulty: "easy", "medium", "hard", or "mixed"
            
        Returns:
            Quiz object with questions
        """
        # Build context from chunks
        context_parts = []
        for chunk in context_chunks:
            source = chunk.get("metadata", {}).get("filename", "Unknown")
            content = chunk.get("content", "")
            context_parts.append(f"[{source}]\n{content}")
        
        context_string = "\n\n---\n\n".join(context_parts)
        
        user_message = f"""Generate exactly {num_questions} quiz questions from this content.
Difficulty preference: {difficulty}

## Study Material:
{context_string}

Return ONLY valid JSON as specified."""

        logger.info(f"Generating {num_questions} quiz questions")
        
        try:
            response = self.client.chat.completions.create(
                model=self.settings.llm_model,
                messages=[
                    {"role": "system", "content": QUIZ_SYSTEM_PROMPT},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.7,
                max_tokens=2000,
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Parse JSON response
            import json
            # Handle potential markdown code blocks
            if result_text.startswith("```"):
                result_text = result_text.split("```")[1]
                if result_text.startswith("json"):
                    result_text = result_text[4:]
            
            quiz_data = json.loads(result_text)
            logger.info(f"Generated quiz with {len(quiz_data.get('questions', []))} questions")
            return quiz_data
            
        except Exception as e:
            logger.error(f"Error generating quiz: {e}")
            raise RuntimeError(f"Failed to generate quiz: {str(e)}")
    
    async def evaluate_answers(
        self,
        questions: list[dict],
        user_answers: list[dict]
    ) -> dict:
        """
        Evaluate user answers with AI feedback.
        
        Args:
            questions: Original quiz questions with expected answers
            user_answers: User's submitted answers
            
        Returns:
            Evaluation results with feedback
        """
        # Build evaluation context
        qa_pairs = []
        for q in questions:
            user_answer = next(
                (a["answer"] for a in user_answers if a["question_id"] == q["id"]),
                "(No answer provided)"
            )
            qa_pairs.append(f"""
Question {q['id']}: {q['question']}
Expected concepts: {', '.join(q.get('key_concepts', []))}
Expected answer: {q.get('expected_answer', 'N/A')}
Student's answer: {user_answer}
""")
        
        user_message = f"""Evaluate these student answers:

{'---'.join(qa_pairs)}

Provide detailed feedback for each answer. Return ONLY valid JSON as specified."""

        logger.info(f"Evaluating {len(user_answers)} answers")
        
        try:
            response = self.client.chat.completions.create(
                model=self.settings.llm_model,
                messages=[
                    {"role": "system", "content": EVALUATION_SYSTEM_PROMPT},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.3,
                max_tokens=3000,
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Parse JSON response
            import json
            if result_text.startswith("```"):
                result_text = result_text.split("```")[1]
                if result_text.startswith("json"):
                    result_text = result_text[4:]
            
            evaluation_data = json.loads(result_text)
            logger.info(f"Evaluation complete. Overall score: {evaluation_data.get('overall_score', 'N/A')}")
            return evaluation_data
            
        except Exception as e:
            logger.error(f"Error evaluating answers: {e}")
            raise RuntimeError(f"Failed to evaluate answers: {str(e)}")


# Singleton instance
_quiz_service: QuizService | None = None


def get_quiz_service() -> QuizService:
    """Get quiz service singleton."""
    global _quiz_service
    if _quiz_service is None:
        _quiz_service = QuizService()
    return _quiz_service
