"""
EduMorph RAG - Embedding Service
Generates embeddings using sentence-transformers with lazy loading.
"""

import gc
import logging
from typing import Any

from backend.config import get_settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """
    Generates embeddings using sentence-transformers.
    Uses lazy loading to minimize memory until needed.
    """
    
    def __init__(self):
        self._model: Any = None
        self._model_name = get_settings().embedding_model
    
    @property
    def model(self):
        """Lazy load the embedding model."""
        if self._model is None:
            logger.info(f"Loading embedding model: {self._model_name}")
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(self._model_name)
            logger.info("Embedding model loaded successfully")
        return self._model
    
    def embed_texts(self, texts: list[str], batch_size: int = 32) -> list[list[float]]:
        """
        Generate embeddings for a list of texts.
        
        Args:
            texts: List of text strings to embed
            batch_size: Batch size for processing (memory optimization)
            
        Returns:
            List of embedding vectors
        """
        if not texts:
            return []
        
        logger.info(f"Generating embeddings for {len(texts)} texts")
        
        all_embeddings = []
        
        # Process in batches to manage memory
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            embeddings = self.model.encode(
                batch,
                convert_to_numpy=True,
                show_progress_bar=False,
                normalize_embeddings=True  # For cosine similarity
            )
            all_embeddings.extend(embeddings.tolist())
            
            # Explicit garbage collection for memory management
            if i > 0 and i % (batch_size * 4) == 0:
                gc.collect()
        
        logger.info(f"Generated {len(all_embeddings)} embeddings")
        return all_embeddings
    
    def embed_query(self, query: str) -> list[float]:
        """
        Generate embedding for a single query.
        
        Args:
            query: Query string to embed
            
        Returns:
            Embedding vector
        """
        embeddings = self.model.encode(
            [query],
            convert_to_numpy=True,
            show_progress_bar=False,
            normalize_embeddings=True
        )
        return embeddings[0].tolist()
    
    def unload_model(self) -> None:
        """Unload model to free memory."""
        if self._model is not None:
            del self._model
            self._model = None
            gc.collect()
            logger.info("Embedding model unloaded")


# Singleton instance
_embedding_service: EmbeddingService | None = None


def get_embedding_service() -> EmbeddingService:
    """Get embedding service singleton."""
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service
