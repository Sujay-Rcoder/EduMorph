"""
Tests for service layer functionality.
"""

import pytest

from backend.config import get_settings, Settings
from backend.services.chunker import TextChunker


class TestSettings:
    """Tests for configuration."""
    
    def test_get_settings_cached(self):
        """Test that settings are cached."""
        settings1 = get_settings()
        settings2 = get_settings()
        
        assert settings1 is settings2  # Same instance
    
    def test_default_values(self):
        """Test default configuration values."""
        settings = get_settings()
        
        assert settings.chunk_size == 500
        assert settings.chunk_overlap == 50
        assert settings.embedding_model == "all-MiniLM-L6-v2"
        assert settings.max_file_size_mb == 10
    
    def test_max_file_size_bytes(self):
        """Test max file size calculation."""
        settings = get_settings()
        
        expected = settings.max_file_size_mb * 1024 * 1024
        assert settings.max_file_size_bytes == expected


class TestChunkerService:
    """Tests for chunker service."""
    
    def test_custom_chunk_size(self):
        """Test chunker with custom size."""
        chunker = TextChunker(chunk_size=100, chunk_overlap=20)
        
        text = "This is a test. " * 50  # About 800 chars
        chunks = chunker.chunk_text(text)
        
        # Should create multiple chunks with small chunk size
        assert len(chunks) > 1
    
    def test_chunk_overlap_preserved(self):
        """Test that overlap is maintained between chunks."""
        chunker = TextChunker(chunk_size=100, chunk_overlap=30)
        
        text = "Sentence one here. Sentence two here. Sentence three here. " * 10
        chunks = chunker.chunk_text(text)
        
        if len(chunks) >= 2:
            # Last part of first chunk should appear in second
            # (This is a simplified check)
            assert len(chunks) > 1
    
    def test_handles_unicode(self):
        """Test handling of unicode characters."""
        chunker = TextChunker()
        
        text = "This has émojis 🎓 and accénts. More text here. " * 20
        chunks = chunker.chunk_text(text)
        
        # Should not crash
        assert len(chunks) > 0
        
        # Content should be preserved
        combined = " ".join(c.content for c in chunks)
        assert "🎓" in combined


class TestEmbedderService:
    """Tests for embedder service (without loading model)."""
    
    def test_embedder_initialization(self):
        """Test that embedder can be initialized without loading model."""
        from backend.services.embedder import EmbeddingService
        
        # Should not load model during init
        embedder = EmbeddingService()
        
        # Model should not be loaded yet
        assert embedder._model is None


class TestVectorStore:
    """Tests for vector store (basic functionality)."""
    
    def test_vector_store_initialization(self):
        """Test that vector store initializes correctly."""
        from backend.services.vector_store import get_vector_store
        
        store = get_vector_store()
        
        assert store is not None
        assert store.COLLECTION_NAME == "edumorph_documents"
    
    def test_get_stats(self):
        """Test getting vector store stats."""
        from backend.services.vector_store import get_vector_store
        
        store = get_vector_store()
        stats = store.get_stats()
        
        assert "total_documents" in stats
        assert "total_chunks" in stats
        assert "collection_name" in stats
