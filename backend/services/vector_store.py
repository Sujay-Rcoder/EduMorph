"""
EduMorph RAG - Vector Store Service
ChromaDB operations with persistence and similarity search.
"""

import gc
import logging
from datetime import datetime
from typing import Any
from pathlib import Path

import chromadb
from chromadb.config import Settings as ChromaSettings

from backend.config import get_settings
from backend.services.embedder import get_embedding_service

logger = logging.getLogger(__name__)


class VectorStoreService:
    """
    Manages vector storage using ChromaDB with persistence.
    """
    
    COLLECTION_NAME = "edumorph_documents"
    
    def __init__(self):
        settings = get_settings()
        persist_dir = Path(settings.chroma_persist_dir).absolute()
        
        logger.info(f"Initializing ChromaDB with persistence at: {persist_dir}")
        
        # Initialize ChromaDB with persistence
        self._client = chromadb.PersistentClient(
            path=str(persist_dir),
            settings=ChromaSettings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # Get or create the collection
        self._collection = self._client.get_or_create_collection(
            name=self.COLLECTION_NAME,
            metadata={"description": "EduMorph educational documents"}
        )
        
        self._embedder = get_embedding_service()
        
        logger.info(f"Vector store initialized with {self._collection.count()} existing chunks")
    
    def add_document(
        self,
        document_id: str,
        chunks: list[str],
        filename: str,
        content_hash: str,
        file_type: str,
        file_size: int
    ) -> int:
        """
        Add document chunks to the vector store.
        
        Args:
            document_id: Unique document identifier
            chunks: List of text chunks
            filename: Original filename
            content_hash: Hash of file content
            file_type: File extension
            file_size: File size in bytes
            
        Returns:
            Number of chunks added
        """
        if not chunks:
            logger.warning(f"No chunks to add for document {document_id}")
            return 0
        
        logger.info(f"Adding {len(chunks)} chunks for document {document_id}")
        
        # Generate embeddings
        embeddings = self._embedder.embed_texts(chunks)
        
        # Prepare metadata for each chunk
        timestamp = datetime.utcnow().isoformat()
        ids = []
        metadatas = []
        
        for i, chunk in enumerate(chunks):
            chunk_id = f"{document_id}_chunk_{i}"
            ids.append(chunk_id)
            metadatas.append({
                "document_id": document_id,
                "filename": filename,
                "content_hash": content_hash,
                "file_type": file_type,
                "file_size": file_size,
                "chunk_index": i,
                "total_chunks": len(chunks),
                "uploaded_at": timestamp
            })
        
        # Add to collection
        self._collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=chunks,
            metadatas=metadatas
        )
        
        logger.info(f"Successfully added {len(chunks)} chunks for document {document_id}")
        
        # Memory cleanup
        gc.collect()
        
        return len(chunks)
    
    def query(
        self,
        query_text: str,
        n_results: int = 5
    ) -> dict[str, Any]:
        """
        Query the vector store for relevant chunks.
        
        Args:
            query_text: The query string
            n_results: Number of results to return
            
        Returns:
            Query results with documents, metadatas, and distances
        """
        if self._collection.count() == 0:
            return {"documents": [[]], "metadatas": [[]], "distances": [[]], "ids": [[]]}
        
        # Generate query embedding
        query_embedding = self._embedder.embed_query(query_text)
        
        # Query the collection
        results = self._collection.query(
            query_embeddings=[query_embedding],
            n_results=min(n_results, self._collection.count())
        )
        
        return results
    
    def check_duplicate(self, content_hash: str) -> bool:
        """
        Check if a document with given hash already exists.
        
        Args:
            content_hash: SHA-256 hash of document content
            
        Returns:
            True if duplicate exists
        """
        if self._collection.count() == 0:
            return False
        
        # Query by metadata
        results = self._collection.get(
            where={"content_hash": content_hash},
            limit=1
        )
        
        return len(results.get("ids", [])) > 0
    
    def get_document_by_hash(self, content_hash: str) -> dict | None:
        """Get document metadata by content hash."""
        if self._collection.count() == 0:
            return None
        
        results = self._collection.get(
            where={"content_hash": content_hash},
            limit=1
        )
        
        if results.get("metadatas"):
            return results["metadatas"][0]
        return None
    
    def get_all_documents(self) -> list[dict]:
        """Get metadata for all unique documents."""
        if self._collection.count() == 0:
            return []
        
        # Get all unique documents by document_id
        all_results = self._collection.get(include=["metadatas"])
        
        seen_docs = {}
        for metadata in all_results.get("metadatas", []):
            doc_id = metadata.get("document_id")
            if doc_id and doc_id not in seen_docs:
                seen_docs[doc_id] = {
                    "id": doc_id,
                    "filename": metadata.get("filename"),
                    "file_type": metadata.get("file_type"),
                    "file_size_bytes": metadata.get("file_size"),
                    "chunk_count": metadata.get("total_chunks"),
                    "uploaded_at": metadata.get("uploaded_at")
                }
        
        return list(seen_docs.values())
    
    def delete_document(self, document_id: str) -> bool:
        """
        Delete all chunks for a document.
        
        Args:
            document_id: Document ID to delete
            
        Returns:
            True if deleted successfully
        """
        try:
            # Find all chunk IDs for this document
            results = self._collection.get(
                where={"document_id": document_id},
                include=[]
            )
            
            chunk_ids = results.get("ids", [])
            
            if not chunk_ids:
                return False
            
            # Delete the chunks
            self._collection.delete(ids=chunk_ids)
            
            logger.info(f"Deleted {len(chunk_ids)} chunks for document {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting document {document_id}: {e}")
            return False
    
    def get_stats(self) -> dict:
        """Get vector store statistics."""
        documents = self.get_all_documents()
        return {
            "total_documents": len(documents),
            "total_chunks": self._collection.count(),
            "collection_name": self.COLLECTION_NAME
        }
    
    def has_documents(self) -> bool:
        """Check if there are any documents in the store."""
        return self._collection.count() > 0

    def get_chunks_by_document_ids(
        self,
        document_ids: list[str],
        max_chunks: int = 100
    ) -> list[dict[str, Any]]:
        """
        Get all chunks belonging to the given document IDs.
        Used for workspace-scoped flashcard generation.

        Args:
            document_ids: List of document IDs to include
            max_chunks: Maximum total chunks to return (to avoid token overflow)

        Returns:
            List of {"content": str, "metadata": dict} sorted by document_id, chunk_index
        """
        if not document_ids:
            return []

        if self._collection.count() == 0:
            return []

        # ChromaDB where: $in for list
        results = self._collection.get(
            where={"document_id": {"$in": document_ids}},
            include=["documents", "metadatas"],
            limit=max_chunks
        )

        ids = results.get("ids", [])
        documents = results.get("documents", [])
        metadatas = results.get("metadatas", [])

        chunks = []
        for i, chunk_id in enumerate(ids):
            doc = documents[i] if i < len(documents) else ""
            meta = metadatas[i] if i < len(metadatas) else {}
            chunks.append({
                "content": doc,
                "metadata": meta
            })

        # Sort by document_id then chunk_index for coherent context
        chunks.sort(
            key=lambda c: (
                c["metadata"].get("document_id", ""),
                c["metadata"].get("chunk_index", 0)
            )
        )
        return chunks


# Singleton instance
_vector_store: VectorStoreService | None = None


def get_vector_store() -> VectorStoreService:
    """Get vector store singleton."""
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStoreService()
    return _vector_store
