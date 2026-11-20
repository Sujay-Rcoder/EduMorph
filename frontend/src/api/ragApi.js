/**
 * EduMorph RAG API Client
 * Handles all communication with the backend
 */

const API_BASE = '/api';

/**
 * Upload a document to the RAG system
 */
export async function uploadDocument(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to upload document');
    }

    return response.json();
}

/**
 * Get list of all uploaded documents
 */
export async function getDocuments() {
    const response = await fetch(`${API_BASE}/documents`);

    if (!response.ok) {
        throw new Error('Failed to fetch documents');
    }

    return response.json();
}

/**
 * Delete a document by ID
 */
export async function deleteDocument(documentId) {
    const response = await fetch(`${API_BASE}/documents/${documentId}`, {
        method: 'DELETE'
    });

    if (!response.ok) {
        throw new Error('Failed to delete document');
    }

    return response.json();
}

/**
 * Ask a question to the RAG system
 */
export async function askQuestion(question) {
    const response = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get answer');
    }

    return response.json();
}

/**
 * Check backend health
 */
export async function checkHealth() {
    const response = await fetch(`${API_BASE}/health`);

    if (!response.ok) {
        throw new Error('Backend not available');
    }

    return response.json();
}

/**
 * Get system stats
 */
export async function getStats() {
    const response = await fetch(`${API_BASE}/stats`);

    if (!response.ok) {
        throw new Error('Failed to get stats');
    }

    return response.json();
}

/**
 * Generate rich flashcards from documents (backend-generated, notebook style).
 * @param {string[]} [documentIds] - Optional list of document IDs (workspace). If empty, uses all.
 * @returns {Promise<{ flashcards: Array<{ concept, deep_explanation, future_scope, past_scope, how_to_relate, study_resources }>, full_page_markdown: string }>}
 */
export async function generateFlashcards(documentIds = null) {
    const response = await fetch(`${API_BASE}/flashcards/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_ids: documentIds || [] })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to generate flashcards');
    }

    return response.json();
}
