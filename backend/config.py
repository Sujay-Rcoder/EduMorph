"""
EduMorph RAG - Configuration Management
Centralizes all configuration with environment variable support.
"""

import os
from pathlib import Path
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # API Keys
    groq_api_key: str = Field(default="", env="GROQ_API_KEY")
    
    # Paths
    chroma_persist_dir: str = Field(default="./data/chroma", env="CHROMA_PERSIST_DIR")
    upload_dir: str = Field(default="./uploads", env="UPLOAD_DIR")
    
    # Document Processing
    max_file_size_mb: int = Field(default=10, env="MAX_FILE_SIZE_MB")
    supported_extensions: list[str] = [".pdf", ".txt", ".md", ".markdown"]
    chunk_size: int = Field(default=500, env="CHUNK_SIZE")
    chunk_overlap: int = Field(default=50, env="CHUNK_OVERLAP")
    
    # Embeddings
    embedding_model: str = Field(default="all-MiniLM-L6-v2", env="EMBEDDING_MODEL")
    embedding_dimension: int = 384  # For all-MiniLM-L6-v2
    
    # LLM
    llm_model: str = Field(default="llama-3.1-8b-instant", env="LLM_MODEL")
    max_context_chunks: int = Field(default=5, env="MAX_CONTEXT_CHUNKS")
    max_tokens: int = Field(default=1024, env="MAX_TOKENS")
    temperature: float = Field(default=0.3, env="TEMPERATURE")
    
    # Logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    # Application
    app_name: str = "EduMorph RAG"
    app_version: str = "1.0.0"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"
    
    def ensure_directories(self) -> None:
        """Create necessary directories if they don't exist."""
        Path(self.chroma_persist_dir).mkdir(parents=True, exist_ok=True)
        Path(self.upload_dir).mkdir(parents=True, exist_ok=True)
    
    @property
    def max_file_size_bytes(self) -> int:
        """Get max file size in bytes."""
        return self.max_file_size_mb * 1024 * 1024


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    settings = Settings()
    settings.ensure_directories()
    return settings
