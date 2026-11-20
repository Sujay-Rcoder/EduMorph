"""
Tests for question-answering functionality.
"""

import pytest
from fastapi.testclient import TestClient

from backend.main import app


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)


class TestHealthEndpoint:
    """Tests for health check endpoint."""
    
    def test_health_check(self, client):
        """Test health check returns expected structure."""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "version" in data
        assert "documents_loaded" in data
        assert "vector_store_ready" in data
    
    def test_stats_endpoint(self, client):
        """Test stats endpoint."""
        response = client.get("/stats")
        
        assert response.status_code == 200
        data = response.json()
        assert "total_documents" in data
        assert "total_chunks" in data
        assert "embedding_model" in data
        assert "llm_model" in data


class TestAskEndpoint:
    """Tests for the /ask endpoint."""
    
    def test_ask_empty_question(self, client):
        """Test asking with empty question."""
        response = client.post("/ask", json={"question": ""})
        
        # Should fail validation
        assert response.status_code == 422  # Validation error
    
    def test_ask_short_question(self, client):
        """Test asking with too-short question."""
        response = client.post("/ask", json={"question": "hi"})
        
        # Should fail validation (min 3 chars)
        assert response.status_code == 422
    
    def test_ask_valid_question_no_documents(self, client):
        """Test asking question when no documents are uploaded."""
        response = client.post(
            "/ask", 
            json={"question": "What is the main topic of this document?"}
        )
        
        # Either returns 200 (with no docs message) or 503 (if no API key)
        assert response.status_code in [200, 503]
        
        if response.status_code == 200:
            data = response.json()
            assert data["success"] is True
            # Should mention uploading documents
            assert "upload" in data["answer"].lower() or "document" in data["answer"].lower()
            assert data["sources"] == []
    
    def test_ask_response_structure(self, client):
        """Test that ask response has correct structure."""
        response = client.post(
            "/ask",
            json={"question": "Tell me about the contents of the documents."}
        )
        
        # Either returns 200 or 503 (if no API key configured)
        assert response.status_code in [200, 503]
        
        if response.status_code == 200:
            data = response.json()
            
            # Verify response structure
            assert "success" in data
            assert "question" in data
            assert "answer" in data
            assert "sources" in data
            assert "processing_time_ms" in data
            
            # Verify types
            assert isinstance(data["success"], bool)
            assert isinstance(data["question"], str)
            assert isinstance(data["answer"], str)
            assert isinstance(data["sources"], list)
            assert isinstance(data["processing_time_ms"], (int, float))


class TestRootEndpoint:
    """Tests for root endpoint."""
    
    def test_root(self, client):
        """Test root endpoint returns API info."""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "version" in data
        assert "docs" in data
