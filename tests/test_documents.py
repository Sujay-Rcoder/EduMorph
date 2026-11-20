"""
Tests for document processing and upload functionality.
"""

import pytest
from io import BytesIO
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.document_processor import DocumentProcessor, get_document_processor
from backend.services.chunker import TextChunker, get_chunker
from backend.utils.validators import compute_content_hash, sanitize_filename


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)


@pytest.fixture
def document_processor():
    """Get document processor instance."""
    return get_document_processor()


@pytest.fixture
def chunker():
    """Get chunker instance."""
    return get_chunker()


class TestDocumentProcessor:
    """Tests for DocumentProcessor."""
    
    def test_extract_text_from_text_file(self, document_processor):
        """Test text extraction from plain text."""
        content = b"This is a test document.\nIt has multiple lines.\nFor testing purposes."
        
        result = document_processor.extract_text(content, ".txt", "test.txt")
        
        assert "test document" in result
        assert "multiple lines" in result
    
    def test_extract_text_from_markdown(self, document_processor):
        """Test text extraction from markdown."""
        content = b"# Title\n\nThis is **bold** text.\n\n## Section\n\nMore content here."
        
        result = document_processor.extract_text(content, ".md", "test.md")
        
        assert "Title" in result
        assert "bold" in result
        assert "Section" in result
    
    def test_extract_text_empty_file(self, document_processor):
        """Test that empty files raise an error."""
        content = b""
        
        with pytest.raises(ValueError, match="Could not extract meaningful text"):
            document_processor.extract_text(content, ".txt", "empty.txt")
    
    def test_extract_text_unsupported_format(self, document_processor):
        """Test unsupported file format."""
        content = b"some content"
        
        with pytest.raises(ValueError, match="Unsupported file type"):
            document_processor.extract_text(content, ".xyz", "test.xyz")


class TestChunker:
    """Tests for TextChunker."""
    
    def test_chunk_text_basic(self, chunker):
        """Test basic text chunking."""
        text = "This is the first sentence. This is the second sentence. " * 20
        
        chunks = chunker.chunk_text(text)
        
        assert len(chunks) > 0
        for chunk in chunks:
            assert len(chunk.content) > 0
            assert chunk.chunk_index >= 0
    
    def test_chunk_text_empty(self, chunker):
        """Test chunking empty text."""
        chunks = chunker.chunk_text("")
        
        assert chunks == []
    
    def test_chunk_text_preserves_content(self, chunker):
        """Test that chunking preserves content."""
        text = "Important educational content about learning. More details here."
        
        chunks = chunker.chunk_text(text)
        
        # All original content should appear somewhere in chunks
        combined = " ".join(c.content for c in chunks)
        assert "Important" in combined
        assert "educational" in combined


class TestValidators:
    """Tests for validators."""
    
    def test_compute_content_hash(self):
        """Test hash computation."""
        content = b"test content"
        
        hash1 = compute_content_hash(content)
        hash2 = compute_content_hash(content)
        hash3 = compute_content_hash(b"different content")
        
        assert hash1 == hash2  # Same content = same hash
        assert hash1 != hash3  # Different content = different hash
    
    def test_sanitize_filename(self):
        """Test filename sanitization."""
        assert sanitize_filename("test.pdf") == "test.pdf"
        assert sanitize_filename("test<>file.pdf") == "test__file.pdf"
        assert sanitize_filename("path/to/file.pdf") == "file.pdf"


class TestDocumentEndpoints:
    """Tests for document API endpoints."""
    
    def test_list_documents_empty(self, client):
        """Test listing documents when none exist."""
        response = client.get("/documents")
        
        assert response.status_code == 200
        data = response.json()
        assert "documents" in data
        assert "total_documents" in data
    
    def test_upload_invalid_file_type(self, client):
        """Test uploading unsupported file type."""
        file_content = b"some content"
        
        response = client.post(
            "/documents/upload",
            files={"file": ("test.exe", BytesIO(file_content), "application/octet-stream")}
        )
        
        assert response.status_code == 400
        assert "Unsupported file type" in response.json()["detail"]
    
    def test_upload_empty_file(self, client):
        """Test uploading empty file."""
        response = client.post(
            "/documents/upload",
            files={"file": ("empty.txt", BytesIO(b""), "text/plain")}
        )
        
        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()
    
    def test_upload_valid_text_file(self, client):
        """Test uploading a valid text file."""
        import uuid
        # Use unique content to avoid duplicate detection from previous runs
        unique_id = str(uuid.uuid4())[:8]
        content = f"This is educational content for testing {unique_id}. " * 10
        
        response = client.post(
            "/documents/upload",
            files={"file": (f"test_{unique_id}.txt", BytesIO(content.encode()), "text/plain")}
        )
        
        # Should succeed with 200 (new doc) or 409 (if duplicate)
        assert response.status_code in [200, 409]
        
        if response.status_code == 200:
            data = response.json()
            assert data["success"] is True
            assert "document" in data
    
    def test_delete_nonexistent_document(self, client):
        """Test deleting a document that doesn't exist."""
        response = client.delete("/documents/nonexistent-id")
        
        assert response.status_code == 404
