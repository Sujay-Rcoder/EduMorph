"""
EduMorph RAG - Document Processor
Extracts text from various document formats.
"""

import logging
from pathlib import Path

import fitz  # PyMuPDF

logger = logging.getLogger(__name__)


class DocumentProcessor:
    """Processes documents and extracts text content."""
    
    def __init__(self):
        self.extractors = {
            ".pdf": self._extract_pdf,
            ".txt": self._extract_text,
            ".md": self._extract_text,
            ".markdown": self._extract_text,
        }
    
    def extract_text(self, content: bytes, file_extension: str, filename: str = "") -> str:
        """
        Extract text from document content.
        
        Args:
            content: Raw file content as bytes
            file_extension: File extension (e.g., '.pdf')
            filename: Original filename for logging
            
        Returns:
            Extracted text content
            
        Raises:
            ValueError: If extraction fails or content is empty
        """
        file_extension = file_extension.lower()
        
        if file_extension not in self.extractors:
            raise ValueError(f"Unsupported file type: {file_extension}")
        
        try:
            text = self.extractors[file_extension](content)
            
            # Clean and validate extracted text
            text = self._clean_text(text)
            
            if not text or len(text.strip()) < 10:
                raise ValueError(f"Could not extract meaningful text from {filename}")
            
            logger.info(f"Extracted {len(text)} characters from {filename}")
            return text
            
        except Exception as e:
            logger.error(f"Error extracting text from {filename}: {e}")
            raise ValueError(f"Failed to extract text from document: {str(e)}")
    
    def _extract_pdf(self, content: bytes) -> str:
        """Extract text from PDF content."""
        text_parts = []
        
        try:
            # Open PDF from bytes
            doc = fitz.open(stream=content, filetype="pdf")
            
            for page_num, page in enumerate(doc):
                page_text = page.get_text("text")
                if page_text.strip():
                    text_parts.append(f"[Page {page_num + 1}]\n{page_text}")
            
            doc.close()
            
        except Exception as e:
            raise ValueError(f"PDF extraction error: {str(e)}")
        
        return "\n\n".join(text_parts)
    
    def _extract_text(self, content: bytes) -> str:
        """Extract text from plain text or markdown files."""
        # Try different encodings
        for encoding in ['utf-8', 'utf-16', 'latin-1', 'cp1252']:
            try:
                return content.decode(encoding)
            except UnicodeDecodeError:
                continue
        
        # Fallback with error handling
        return content.decode('utf-8', errors='replace')
    
    def _clean_text(self, text: str) -> str:
        """Clean extracted text."""
        # Remove excessive whitespace
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            # Remove lines that are just whitespace or special characters
            stripped = line.strip()
            if stripped and not all(c in '-_=*#' for c in stripped):
                cleaned_lines.append(stripped)
        
        # Join with single newlines, collapse multiple blank lines
        text = '\n'.join(cleaned_lines)
        
        # Remove excessive newlines
        while '\n\n\n' in text:
            text = text.replace('\n\n\n', '\n\n')
        
        return text.strip()


# Singleton instance
_processor: DocumentProcessor | None = None


def get_document_processor() -> DocumentProcessor:
    """Get document processor singleton."""
    global _processor
    if _processor is None:
        _processor = DocumentProcessor()
    return _processor
