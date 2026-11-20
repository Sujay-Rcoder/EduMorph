# EduMorph RAG 📚

**Educational Document Q&A System powered by RAG (Retrieval-Augmented Generation)**

A production-ready, free-tier compatible platform for **topic workspaces**: upload materials, ask the AI Tutor, generate **flashcard notes** (with real-life examples), take quizzes, and track progress—all scoped per subject.

![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green.svg)
![React](https://img.shields.io/badge/React-Vite-blue.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

---

## ✨ Features

- **📁 Topic Workspaces**: Create workspaces per subject (e.g. Physics, History); each has its own documents, flashcards, quizzes, and AI Tutor
- **📄 Document Upload**: PDF, TXT, and Markdown in **Topics & documents** per workspace
- **🔍 Smart Retrieval**: Semantic search (vector embeddings) for Q&A and flashcard generation
- **🎓 AI Tutor**: Chat with modes (Quick Revision, Deep Dive, etc.); answers grounded in your documents with source citations
- **📇 Flashcard Notes**: Backend-generated study notes in a **uniform grid**—definitions, key terms, examples, **real-life examples**, exam tips, and more; **download as markdown** to share or print
- **📝 Quizzes**: Generate and take quizzes; **Progress** page shows history, scores, and analytics
- **💾 Persistence**: ChromaDB and optional workspace–document mapping (frontend)
- **🆓 Free-Tier Ready**: Designed for Render.com free tier (512MB RAM)

---

## 🏗️ Architecture

**Frontend (React + Vite):** Dashboard, Topics & documents, Flashcards (uniform grid + download), Quizzes, Progress, AI Tutor. Workspace–document mapping in `localStorage`; API base `/api`. **Backend (FastAPI):** Documents, Q&A, Quiz, **Flashcards** (`POST /flashcards/generate` with optional `document_ids`), Health, Stats. Vector store supports `get_chunks_by_document_ids` for workspace-scoped flashcard generation.

```
┌─────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐   │
│  │  Documents  │   │     Q&A     │   │     Health      │   │
│  │   Router    │   │   Router    │   │    Endpoints    │   │
│  └──────┬──────┘   └──────┬──────┘   └────────────────-┘   │
│         │                 │                                  │
│  ┌──────▼──────┐   ┌──────▼──────┐                          │
│  │  Document   │   │   Vector    │                          │
│  │  Processor  │   │   Search    │                          │
│  └──────┬──────┘   └──────┬──────┘                          │
│         │                 │                                  │
│  ┌──────▼──────┐   ┌──────▼──────┐   ┌─────────────────┐   │
│  │   Chunker   │   │  Embedder   │   │   LLM Service   │   │
│  │             │   │ (MiniLM-L6) │   │   (Groq API)    │   │
│  └──────┬──────┘   └──────┬──────┘   └────────────────-┘   │
│         │                 │                                  │
│         └────────┬────────┘                                  │
│           ┌──────▼──────┐                                    │
│           │  ChromaDB   │                                    │
│           │ (Persistent)│                                    │
│           └─────────────┘                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- A free Groq API key ([Get one here](https://console.groq.com))

### Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/edumorph-rag.git
   cd edumorph-rag
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   # Copy the example env file
   copy .env.example .env   # Windows
   cp .env.example .env     # Linux/Mac
   
   # Edit .env and set GROQ_API_KEY=your_actual_key (never commit .env or paste keys in the repo)
   ```

5. **Run the backend**
   ```bash
   python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
   ```

6. **Run the frontend** (optional; from project root)
   ```bash
   cd frontend && npm install && npm run dev
   ```
   Configure the frontend to proxy `/api` to `http://localhost:8000` (see `frontend/vite.config.js` or env).

7. **Open the app**
   - API docs: http://localhost:8000/docs
   - Frontend: http://localhost:5173 (or the port Vite reports)

---

## 📖 API Usage

### Upload a Document

```bash
curl -X POST "http://localhost:8000/documents/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@your_document.pdf"
```

**Response:**
```json
{
  "success": true,
  "message": "Document uploaded successfully. Extracted 15 chunks for retrieval.",
  "document": {
    "id": "abc123",
    "filename": "your_document.pdf",
    "file_type": ".pdf",
    "chunk_count": 15,
    "uploaded_at": "2024-01-15T10:30:00Z",
    "file_size_bytes": 125000
  }
}
```

### Ask a Question

```bash
curl -X POST "http://localhost:8000/ask" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the main topic of chapter 1?"}'
```

**Response:**
```json
{
  "success": true,
  "question": "What is the main topic of chapter 1?",
  "answer": "Based on the uploaded materials...",
  "sources": [
    {
      "document_id": "abc123",
      "document_name": "textbook.pdf",
      "chunk_id": "abc123_chunk_0",
      "content_preview": "Chapter 1 introduces...",
      "relevance_score": 0.89
    }
  ],
  "processing_time_ms": 523.4
}
```

### List Documents

```bash
curl "http://localhost:8000/documents"
```

### Delete a Document

```bash
curl -X DELETE "http://localhost:8000/documents/{document_id}"
```

### Generate Flashcards (workspace-scoped)

```bash
curl -X POST "http://localhost:8000/flashcards/generate" \
  -H "Content-Type: application/json" \
  -d '{"document_ids": ["doc-uuid-1", "doc-uuid-2"]}'
```

Omit `document_ids` or pass `[]` to use all documents. Response includes `flashcards` (array of rich note objects) and `full_page_markdown` for download.

### Quiz Generate & Evaluate

```bash
# Generate
curl -X POST "http://localhost:8000/quiz/generate" \
  -H "Content-Type: application/json" \
  -d '{"topic": "Forces", "num_questions": 5, "difficulty": "mixed"}'

# Evaluate (use quiz_id and questions from generate response)
curl -X POST "http://localhost:8000/quiz/evaluate" \
  -H "Content-Type: application/json" \
  -d '{"quiz_id": "...", "questions": [...], "answers": [...]}'
```

### Health Check

```bash
curl "http://localhost:8000/health"
```

---

## 🌐 Deployment to Render (Free Tier)

### Step-by-Step Guide

1. **Create a Render Account**
   - Go to [render.com](https://render.com)
   - Sign up for a free account

2. **Get Your Groq API Key**
   - Go to [console.groq.com](https://console.groq.com)
   - Sign up and create an API key
   - Copy the key for later

3. **Push Code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/edumorph-rag.git
   git push -u origin main
   ```

4. **Deploy on Render**
   - In Render dashboard, click **New +** → **Web Service**
   - Connect your GitHub repository
   - Render will auto-detect the `render.yaml` configuration
   - **Important**: Add your `GROQ_API_KEY` in the Environment section

5. **Wait for Deployment**
   - First deployment takes 5-10 minutes (downloads embedding model)
   - Subsequent deployments are faster

6. **Access Your API**
   - Your API will be at: `https://edumorph-rag.onrender.com`
   - Swagger docs: `https://edumorph-rag.onrender.com/docs`

### Environment Variables (Render)

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ Yes | Your Groq API key |
| `CHROMA_PERSIST_DIR` | No | Default: `/data/chroma` |
| `LOG_LEVEL` | No | Default: `INFO` |

---

## ⚙️ Configuration

All configuration is via environment variables. See `.env.example` for all options:

| Variable | Default | Description |
|----------|---------|-------------|
| `GROQ_API_KEY` | (required) | Groq API key for LLM |
| `CHROMA_PERSIST_DIR` | `./data/chroma` | ChromaDB storage path |
| `UPLOAD_DIR` | `./uploads` | Temporary upload directory |
| `MAX_FILE_SIZE_MB` | `10` | Maximum upload size |
| `CHUNK_SIZE` | `500` | Text chunk size (chars) |
| `CHUNK_OVERLAP` | `50` | Overlap between chunks |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | Sentence-transformers model |
| `LLM_MODEL` | `llama-3.1-8b-instant` | Groq LLM model |
| `MAX_CONTEXT_CHUNKS` | `5` | Chunks for context |
| `TEMPERATURE` | `0.3` | LLM temperature |
| `MAX_TOKENS` | `1024` | Max response tokens |

---

## 🔧 Troubleshooting

### Common Issues

#### "GROQ_API_KEY not configured"
- Make sure you've set the `GROQ_API_KEY` in your `.env` file
- For Render: Add it in the Environment section of your service

#### "Could not extract text from document"
- Ensure the PDF isn't password-protected
- Try a different PDF or text file
- Check the file isn't empty or corrupted

#### "No relevant information found"
- Upload more relevant documents
- Try rephrasing your question
- Check that documents uploaded successfully

#### Memory issues on Render
- The app is optimized for 512MB RAM
- If issues persist, reduce `MAX_CONTEXT_CHUNKS` to 3
- First request may be slow (cold start)

#### Slow first request
- The embedding model loads on first use (~30 seconds)
- Subsequent requests are much faster
- On Render free tier, cold starts take longer

### Logs

**Local:**
```bash
python -m uvicorn backend.main:app --reload --port 8000
```

**Render:**
- Go to your service → Logs tab
- Filter by time to find relevant entries

---

## 🧪 Testing

### Run Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run all tests
pytest tests/ -v

# Run with coverage
pip install pytest-cov
pytest tests/ --cov=backend --cov-report=html
```

### Manual Testing

1. Start the backend: `python -m uvicorn backend.main:app --reload --port 8000`
2. Open http://localhost:8000/docs
3. Test in order: `GET /health` → `POST /documents/upload` → `GET /documents` → `POST /ask` → `POST /flashcards/generate` (optional body `{"document_ids":[]}`) → `POST /quiz/generate` → `DELETE /documents/{id}` if needed

---

## 📁 Project Structure

```
EduMorph-RAG/
├── backend/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration
│   ├── models.py            # Pydantic models
│   ├── routers/
│   │   ├── documents.py     # Upload, list, delete documents
│   │   ├── qa.py            # POST /ask, health, stats
│   │   ├── quiz.py          # Quiz generate & evaluate
│   │   └── flashcards.py   # POST /flashcards/generate
│   ├── services/
│   │   ├── document_processor.py
│   │   ├── chunker.py
│   │   ├── embedder.py
│   │   ├── vector_store.py  # ChromaDB + get_chunks_by_document_ids
│   │   ├── llm_service.py   # Answers + generate_flashcards
│   │   └── quiz_service.py
│   └── utils/
│       └── validators.py
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Workspaces, views: dashboard/topics/flashcards/quiz/progress/chat
│   │   ├── api/ragApi.js    # Documents, ask, quiz, generateFlashcards
│   │   └── components/
│   │       ├── Sidebar.jsx          # Topic Workspaces, menu
│   │       ├── WorkspaceOverview.jsx
│   │       ├── FlashcardNotebook.jsx # Uniform grid + download
│   │       ├── DocumentUpload.jsx   # Topics & documents
│   │       ├── ChatInterface.jsx    # AI Tutor
│   │       ├── QuizMode.jsx
│   │       ├── Dashboard.jsx        # Progress analytics
│   │       └── ...
│   └── package.json
├── data/chroma/             # Vector storage (gitignored)
├── tests/
├── EDUMORPH_PLATFORM_DOCUMENTATION.md  # BRD, PRD, FRS, UAC, API summary
├── .env.example
├── requirements.txt
├── render.yaml
└── README.md
```

---

## 📚 Documentation

- **EDUMORPH_PLATFORM_DOCUMENTATION.md** — BRD, PRD, FRS, UAC, and API summary (topic workspaces, Dashboard/Topics/Progress, flashcards with real-life examples, download).
- **README.md** (this file) — Setup, API usage, project structure, deployment.

## 🔮 Future Roadmap

- [ ] Multi-user support and backend persistence for workspaces
- [ ] Authentication & API keys
- [ ] More file formats (DOCX, EPUB)
- [ ] Conversation history for AI Tutor

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📬 Support

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones
