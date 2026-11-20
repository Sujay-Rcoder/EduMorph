"""
EduMorph RAG - Text Chunker
Splits text into overlapping chunks for embedding.
"""

import re
import logging
from dataclasses import dataclass

from backend.config import get_settings

logger = logging.getLogger(__name__)


@dataclass
class TextChunk:
    """Represents a chunk of text with metadata."""
    content: str
    chunk_index: int
    start_char: int
    end_char: int


class TextChunker:
    """Splits text into semantically meaningful chunks."""
    
    def __init__(self, chunk_size: int | None = None, chunk_overlap: int | None = None):
        settings = get_settings()
        self.chunk_size = chunk_size or settings.chunk_size
        self.chunk_overlap = chunk_overlap or settings.chunk_overlap
        
        # Sentence-ending patterns
        self.sentence_endings = re.compile(r'(?<=[.!?])\s+')
        # Paragraph pattern
        self.paragraph_pattern = re.compile(r'\n\n+')
    
    def chunk_text(self, text: str) -> list[TextChunk]:
        """
        Split text into overlapping chunks.
        
        Uses a semantic approach:
        1. First split by paragraphs
        2. Then by sentences
        3. Maintain overlap for context
        
        Args:
            text: The text to chunk
            
        Returns:
            List of TextChunk objects
        """
        if not text or not text.strip():
            return []
        
        # Split into paragraphs first
        paragraphs = self.paragraph_pattern.split(text)
        paragraphs = [p.strip() for p in paragraphs if p.strip()]
        
        chunks = []
        current_chunk = []
        current_length = 0
        chunk_start = 0
        text_position = 0
        
        for paragraph in paragraphs:
            # Split paragraph into sentences
            sentences = self.sentence_endings.split(paragraph)
            sentences = [s.strip() for s in sentences if s.strip()]
            
            for sentence in sentences:
                sentence_length = len(sentence)
                
                # If adding this sentence exceeds chunk size
                if current_length + sentence_length > self.chunk_size and current_chunk:
                    # Save current chunk
                    chunk_content = ' '.join(current_chunk)
                    chunks.append(TextChunk(
                        content=chunk_content,
                        chunk_index=len(chunks),
                        start_char=chunk_start,
                        end_char=chunk_start + len(chunk_content)
                    ))
                    
                    # Start new chunk with overlap
                    overlap_sentences = self._get_overlap_sentences(current_chunk)
                    current_chunk = overlap_sentences + [sentence]
                    current_length = sum(len(s) for s in current_chunk)
                    chunk_start = text_position - sum(len(s) for s in overlap_sentences)
                else:
                    current_chunk.append(sentence)
                    current_length += sentence_length
                
                text_position += sentence_length + 1
            
            # Add paragraph break
            text_position += 1
        
        # Don't forget the last chunk
        if current_chunk:
            chunk_content = ' '.join(current_chunk)
            chunks.append(TextChunk(
                content=chunk_content,
                chunk_index=len(chunks),
                start_char=chunk_start,
                end_char=chunk_start + len(chunk_content)
            ))
        
        logger.info(f"Split text into {len(chunks)} chunks")
        return chunks
    
    def _get_overlap_sentences(self, sentences: list[str]) -> list[str]:
        """Get sentences for overlap from the end of current chunk."""
        if not sentences:
            return []
        
        overlap_content = []
        overlap_length = 0
        
        # Work backwards through sentences
        for sentence in reversed(sentences):
            if overlap_length + len(sentence) <= self.chunk_overlap:
                overlap_content.insert(0, sentence)
                overlap_length += len(sentence)
            else:
                break
        
        return overlap_content


# Singleton instance
_chunker: TextChunker | None = None


def get_chunker() -> TextChunker:
    """Get text chunker singleton."""
    global _chunker
    if _chunker is None:
        _chunker = TextChunker()
    return _chunker
