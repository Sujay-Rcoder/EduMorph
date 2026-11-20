"""
EduMorph RAG - LLM Service
Groq API integration for educational answer generation.
"""

import json
import logging
import re
from typing import Any

from groq import Groq

from backend.config import get_settings

logger = logging.getLogger(__name__)


# Educational prompt template
EDUCATIONAL_SYSTEM_PROMPT = """You are an educational assistant for students using the EduMorph learning platform. Your role is to help students understand their study materials.

## Your Guidelines:

1. **Answer ONLY from the provided context** - Never make up information or use external knowledge
2. **Be educational** - Explain concepts clearly and in a student-friendly way
3. **Use structure** - Use bullet points, numbered steps, or headers when explaining complex topics
4. **Cite your sources** - Reference which part of the material your answer comes from
5. **Admit uncertainty** - If the context doesn't contain enough information to fully answer, clearly state what's missing
6. **Be concise but complete** - Don't pad answers, but don't leave out important details

## Response Format:

- Start with a direct answer to the question
- Follow with explanation or elaboration if needed
- Use step-by-step format for procedural questions
- End with a brief summary for complex topics

## Important:

If the provided context does NOT contain information relevant to the question, you MUST respond with:
"I don't have enough information in the uploaded materials to answer this question. Please upload relevant documents or rephrase your question."

Never guess or hallucinate information."""


FLASHCARD_SYSTEM_PROMPT = """You are an expert educational content designer for EduMorph. Create rich, comprehensive study-note flashcards from the given materials.

Output valid JSON only: a single array of flashcard objects. No markdown, no text before or after the array.

For each flashcard object, include ANY of the following keys that apply (all string values; use "" if not applicable). Do NOT restrict yourself to a few—fill as many as genuinely apply so the student has full, useful notes.

- "concept": Short title (e.g. "Newton's First Law")
- "definition": One-line or one-paragraph definition
- "deep_explanation": Detailed explanation with examples (2–4 paragraphs)
- "key_terms": Important terms and definitions (bullet or comma-separated)
- "formulas_or_rules": Key formulas, equations, or rules from the material
- "examples": Worked or illustrative examples from the material
- "real_life_examples": Concrete real-life situations that explain the topic (e.g. driving a car for inertia, cooking for chemistry). Use everyday scenarios so the student can relate.
- "common_mistakes": Typical errors students make and how to avoid them
- "exam_tips": What to remember for exams, high-yield points
- "prerequisites": Prior knowledge or topics needed before this
- "past_scope": Background or history of the concept from the document
- "future_scope": What this leads to; advanced topics or applications
- "applications": Real-world or practical applications
- "how_to_relate": How to relate to daily life, other subjects, or experience
- "study_resources": Online resources, books, videos (Khan Academy, etc.)
- "summary": Brief recap of the concept
- "related_concepts": Other concepts in the document that connect to this
- "practice_suggestions": How to practice (exercises, problem types)
- "visual_note": What a diagram or sketch would show (describe it)
- "mnemonics": Memory aids if applicable
- "comparison": Comparison with similar concepts if relevant

Create 5–12 flashcards covering the main concepts. Vary the mix: some cards can be definition-focused, some explanation-heavy, some application-focused. Base everything ONLY on the given document context. Use empty string "" for any key that does not apply."""


class LLMService:
    """
    LLM service using Groq API for educational responses.
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
                raise ValueError(
                    "GROQ_API_KEY not configured. Please set it in your .env file. "
                    "Get a free API key at https://console.groq.com"
                )
            self._client = Groq(api_key=api_key)
        return self._client
    
    async def generate_answer(
        self,
        question: str,
        context_chunks: list[dict[str, Any]]
    ) -> str:
        """
        Generate an educational answer based on retrieved context.
        
        Args:
            question: The user's question
            context_chunks: List of retrieved chunks with content and metadata
            
        Returns:
            Generated answer string
        """
        # Build context string from chunks
        context_parts = []
        for i, chunk in enumerate(context_chunks, 1):
            source = chunk.get("metadata", {}).get("filename", "Unknown source")
            content = chunk.get("content", "")
            context_parts.append(f"[Source {i}: {source}]\n{content}")
        
        context_string = "\n\n---\n\n".join(context_parts)
        
        # Build the user message
        user_message = f"""## Context from uploaded materials:

{context_string}

---

## Student's Question:
{question}

Please provide a helpful, educational answer based ONLY on the context above."""

        logger.info(f"Generating answer for question: {question[:100]}...")
        
        try:
            # Call Groq API
            response = self.client.chat.completions.create(
                model=self.settings.llm_model,
                messages=[
                    {"role": "system", "content": EDUCATIONAL_SYSTEM_PROMPT},
                    {"role": "user", "content": user_message}
                ],
                temperature=self.settings.temperature,
                max_tokens=self.settings.max_tokens,
            )
            
            answer = response.choices[0].message.content
            logger.info("Answer generated successfully")
            
            return answer.strip()
            
        except Exception as e:
            logger.error(f"Error generating answer: {e}")
            raise RuntimeError(f"Failed to generate answer: {str(e)}")
    
    async def generate_no_context_response(self, question: str) -> str:
        """
        Generate a response when no documents are available.
        
        Args:
            question: The user's question
            
        Returns:
            Helpful message about uploading documents
        """
        return (
            "I don't have any documents to search through yet. "
            "Please upload some educational materials first using the /documents/upload endpoint, "
            "and then I'll be able to answer your questions based on those materials."
        )
    
    def is_configured(self) -> bool:
        """Check if the LLM service is properly configured."""
        api_key = self.settings.groq_api_key
        return bool(api_key and api_key != "your_groq_api_key_here")

    async def generate_flashcards(
        self,
        context_chunks: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """
        Generate rich, structured flashcards from document context.
        Each flashcard has: concept, deep_explanation, future_scope, past_scope,
        how_to_relate, study_resources.
        """
        if not context_chunks:
            return []

        context_parts = []
        for i, chunk in enumerate(context_chunks, 1):
            source = chunk.get("metadata", {}).get("filename", "Source")
            content = chunk.get("content", "")
            context_parts.append(f"[{source}]\n{content}")

        context_string = "\n\n---\n\n".join(context_parts)

        user_message = f"""## Document context (use ONLY this):

{context_string}

---

Output a JSON array of flashcard objects. Each object can include any of: concept, definition, deep_explanation, key_terms, formulas_or_rules, examples, real_life_examples, common_mistakes, exam_tips, prerequisites, past_scope, future_scope, applications, how_to_relate, study_resources, summary, related_concepts, practice_suggestions, visual_note, mnemonics, comparison. Include real_life_examples where possible so topics are explained with everyday situations. Use "" for keys that don't apply. Output nothing else except the JSON array."""

        max_tokens_flashcards = 4096
        raw = ""

        try:
            response = self.client.chat.completions.create(
                model=self.settings.llm_model,
                messages=[
                    {"role": "system", "content": FLASHCARD_SYSTEM_PROMPT},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.2,
                max_tokens=max_tokens_flashcards,
            )
            raw = response.choices[0].message.content.strip()
            # Extract JSON array (handle optional markdown code block)
            json_match = re.search(r"\[[\s\S]*\]", raw)
            if json_match:
                raw = json_match.group(0)
            data = json.loads(raw)
            if not isinstance(data, list):
                return []
            # Normalize: keep concept required, pass through any other string keys
            out = []
            skip_keys = {"concept"}
            for i, item in enumerate(data):
                if not isinstance(item, dict):
                    continue
                card = {"concept": str(item.get("concept", "")).strip() or f"Concept {i + 1}"}
                for k, v in item.items():
                    if k in skip_keys or not isinstance(v, (str, int, float)):
                        continue
                    card[k] = str(v).strip()
                out.append(card)
            logger.info(f"Generated {len(out)} flashcards")
            return out
        except json.JSONDecodeError as e:
            logger.warning(f"Flashcard JSON parse error: {e}. Raw: {raw[:200]}...")
            return []
        except Exception as e:
            logger.error(f"Error generating flashcards: {e}")
            raise RuntimeError(f"Failed to generate flashcards: {str(e)}")


# Singleton instance
_llm_service: LLMService | None = None


def get_llm_service() -> LLMService:
    """Get LLM service singleton."""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
