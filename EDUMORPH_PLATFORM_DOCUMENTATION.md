# EduMorph Platform Documentation

## 1. Business Requirement Document (BRD)

### 1.1 Executive Summary
EduMorph is an advanced AI-powered educational platform designed to transform how students interact with study materials. By leveraging Retrieval-Augmented Generation (RAG), the platform allows users to create **topic workspaces** for specific subjects, upload relevant study documents, and engage in various learning modes: dashboard overview, topics & documents, **flashcard notes** (AI-generated with real-life examples), quizzes, and an **AI Tutor** chat—all with clear separation between navigation sections and no redundant views.

### 1.2 Business Goals
- **Personalized Learning:** Empower students to create subject-specific **topic workspaces** (e.g. Physics, History) with isolated documents and learning tools.
- **Efficiency:** Reduce study time with AI-generated **flashcard notes** (definitions, examples, real-life situations, exam tips) and downloadable markdown.
- **Engagement:** Gamify learning through interactive Quizzes and a clear, consistent UI (Dashboard, Topics, Flashcards, Quizzes, Progress, AI Tutor).
- **Accessibility:** Provide a free-tier compatible solution (rendering on low-resource environments) to make high-quality AI education accessible.
- **Trust & Verifiability:** Eliminate AI hallucinations by grounding all answers in user-provided documents, with source citations for exam prep.

### 1.3 Competitive Advantage
1. **Grounded Truth (RAG):** EduMorph answers *strictly* from the user's uploaded materials.
2. **Context Isolation:** Each **topic workspace** isolates its documents; no cross-contamination between subjects.
3. **Structured Learning:** Dashboard (overview), Topics (documents), Flashcards (rich notes + real-life examples), Quizzes, Progress (analytics), and AI Tutor—each with a distinct purpose.
4. **Flashcard Notebook:** Backend-generated study notes with definitions, key terms, examples, **real-life examples**, exam tips, and more—in a uniform grid with download/share.

### 1.4 Target Audience
- **Students (High School/University):** Primary users needing to digest large volumes of text.
- **Self-Learners:** Individuals upskilling in specific domains.
- **Educators:** Can use the platform to generate quizzes and flashcard notes for students.

### 1.5 Key Success Indicators (KPIs)
- **User Retention:** Daily Active Users engaging with their topic workspaces.
- **Learning Outcomes:** Improvement in quiz scores over time (tracked in Progress).
- **Trust Metric:** Use of source citations and flashcard downloads.
- **System Performance:** Response time for RAG and flashcard generation (< 2–5 seconds).

---

## 2. Product Requirement Document (PRD)

### 2.1 Product Vision
To become the ultimate personal tutor that "morphs" into the expert the user needs for any given subject, providing tailored educational support based on user-provided materials. EduMorph is a "know-your-material" AI.

### 2.2 Core Personas
- **The Crammer:** Uses Quick Revision, Last-Minute Notes, and **Flashcard notes** (downloadable) before exams.
- **The Deep Learner:** Uses Deep Dive mode and AI Tutor for detailed understanding.
- **The Tester:** Uses Quiz Mode and **Progress** for score tracking and analytics.

### 2.3 Key Features

#### 2.3.1 Topic Workspaces
- Users create **topic workspaces** (e.g. "Physics", "History") via **Create new topic workspace**.
- Each workspace has its own document set (assigned in **Topics & documents**).
- Sidebar lists all workspaces; selecting one scopes Dashboard, Topics, Flashcards, Quizzes, and AI Tutor to that workspace.

#### 2.3.2 Navigation (Distinct Sections)
- **Dashboard:** With a workspace selected → workspace overview (doc count, quick links to Topics, Flashcards, Quizzes, AI Tutor, Progress). With no workspace → welcome / create workspace.
- **Topics:** Document list and upload for the current workspace (**Topics & documents**). Distinct from Dashboard.
- **Flashcards:** AI-generated study notes in a **uniform grid** (no empty spaces). Rich sections: definition, deep explanation, key terms, examples, **real-life examples**, exam tips, applications, study resources, etc. **Download page** as markdown to share or print.
- **Quizzes:** Generate and take quizzes from workspace documents.
- **Progress:** Quiz history, scores, strong/weak areas, and charts. Dedicated analytics view (not the same as Dashboard).
- **AI Tutor:** Chat Q&A scoped to the current workspace’s documents.

#### 2.3.3 Document Management
- Support for PDF, TXT, and Markdown uploads.
- Automatic chunking and vectorization. Documents can be linked to a workspace (frontend stores workspace–document mapping in `localStorage`).
- Backend supports **workspace-scoped** flashcard generation via optional `document_ids` in `POST /flashcards/generate`.

#### 2.3.4 Learning Modes (AI Tutor)
- **Chat / Quick Revision / Last-Minute Notes / Deep Dive:** Selected in chat; mode influences response style.

#### 2.3.5 Assessment & Analytics
- **Quiz:** Generate and evaluate quizzes; scores stored in `localStorage`.
- **Progress:** Dedicated page showing quiz history, average score, strong/weak areas, and performance chart.

### 2.4 Technical Constraints
- Response latency optimized for RAG and flashcard generation.
- ChromaDB for vector persistence; optional filtering by `document_id` for workspace-scoped retrieval.
- Modern browsers (Chrome, Firefox, Edge).

---

## 3. Functional Requirement Specification (FRS)

### 3.1 User Interface (Frontend)
- **Framework:** React (Vite).
- **Styling:** Tailwind CSS; clean, consistent layout with distinct views for Dashboard, Topics, Flashcards, Quizzes, Progress, AI Tutor.
- **State:** React state + `localStorage` for workspaces and workspace–document mapping (`edumorph_coaches`, `edumorph_coach_documents`).

### 3.2 System Components

#### 3.2.1 Topic Workspace Management
- **Create:** "Create new topic workspace" → modal with workspace name → new workspace created and document upload (Topics) shown.
- **Delete:** Remove workspace and its document links.
- **Select:** Set active workspace; Dashboard shows workspace overview; Topics / Flashcards / Quizzes / AI Tutor use that workspace’s documents.

#### 3.2.2 RAG Engine (Backend)
- **Upload:** `POST /documents/upload` — file parsed, chunked, embedded, stored in ChromaDB.
- **Query:** `POST /ask` — body `{ "question": "..." }`. Retrieves top K chunks, generates answer with sources.
- **Documents:** `GET /documents`, `DELETE /documents/{id}`. Optional: workspace passes `document_ids` to flashcards so only those docs are used.

#### 3.2.3 Flashcards (Backend)
- **Generate:** `POST /flashcards/generate` — body `{ "document_ids": ["id1", "id2"] }` (optional; if omitted, all documents are used).
- **Response:** `{ "success", "flashcards": [ { "concept", "definition", "deep_explanation", "key_terms", "examples", "real_life_examples", "exam_tips", ... } ], "full_page_markdown", "document_count" }`.
- **Content:** Rich educational fields (definition, deep explanation, key terms, formulas, examples, **real_life_examples**, common mistakes, exam tips, prerequisites, past/future scope, applications, how to relate, study resources, summary, related concepts, practice suggestions, visual note, mnemonics, comparison). LLM fills as many as apply; frontend displays all returned sections in a **uniform grid** with collapsible sections and **Download page** (markdown).

#### 3.2.4 Quiz System
- **Generate:** `POST /quiz/generate` — topic, num_questions, difficulty.
- **Evaluate:** `POST /quiz/evaluate` — quiz_id, questions, answers.
- **UI:** Card-based quiz; results reflected in **Progress**.

### 3.3 Data Flow
1. **Upload PDF** → Frontend multipart → Backend → ChromaDB. Frontend links document ID to active workspace in `localStorage`.
2. **Generate Flashcards** → Frontend sends `document_ids` of workspace → Backend gets chunks for those IDs → LLM generates rich JSON flashcards + full_page_markdown → UI shows uniform grid; user can download markdown.
3. **Ask (AI Tutor)** → Frontend `POST /ask` → Backend retrieves chunks → LLM answer with sources.
4. **Quiz** → Generate → User answers → Evaluate → Score stored; **Progress** shows history and analytics.

---

## 4. User Acceptance Story Criteria (UAC)

### 4.1 Feature: Create Topic Workspace
- **Given** I am on the Welcome screen or Dashboard.
- **When** I click **Create new topic workspace** and enter a name (e.g. "Physics").
- **Then** a new workspace appears in the **Topic Workspaces** section of the sidebar.
- **And** I am taken to **Topics & documents** for that workspace to upload materials.

### 4.2 Feature: Upload Study Material (Topics)
- **Given** I have selected a topic workspace.
- **When** I go to **Topics** and drag-and-drop a PDF (or select file).
- **Then** the file uploads and the document list updates.
- **And** I can start a learning session (Dashboard) or generate **Flashcards**.

### 4.3 Feature: Flashcard Notes
- **Given** I have documents in a workspace.
- **When** I open **Flashcards** and click **Generate flashcard notes**.
- **Then** the backend generates rich notes (definition, examples, **real-life examples**, exam tips, etc.).
- **And** they appear in a **uniform grid** with no empty spaces; I can expand/collapse sections.
- **And** I can **Download page** to get a markdown file to share or print.

### 4.4 Feature: Dashboard vs Topics vs Progress
- **Given** I have a workspace selected.
- **When** I click **Dashboard** → I see workspace overview (doc count, links to Topics, Flashcards, Quizzes, AI Tutor, Progress).
- **When** I click **Topics** → I see only the document list and upload for that workspace (no duplicate of Dashboard).
- **When** I click **Progress** → I see only quiz history, scores, and analytics (distinct from Dashboard).

### 4.5 Feature: AI Tutor and Quiz
- **Given** I have a workspace with documents.
- **When** I use **AI Tutor** → I get answers grounded in that workspace’s documents.
- **When** I take a **Quiz** and finish → My score appears under **Progress**.

### 4.6 Feature: Progress Analytics
- **Given** I have taken at least one quiz.
- **When** I navigate to **Progress**.
- **Then** I see a chart of recent performance, total quizzes, average score, strong/weak areas, and recent quiz list.

---

## 5. API Reference (Summary)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/documents/upload` | Upload a document (PDF, TXT, MD). |
| GET | `/documents` | List all documents. |
| DELETE | `/documents/{document_id}` | Delete a document. |
| POST | `/ask` | Ask a question; returns answer + sources. |
| POST | `/quiz/generate` | Generate quiz (topic, num_questions, difficulty). |
| POST | `/quiz/evaluate` | Evaluate quiz answers; returns scores and feedback. |
| POST | `/flashcards/generate` | Generate flashcard notes. Body: `{ "document_ids": ["id1", ...] }` (optional). Returns `flashcards` array and `full_page_markdown`. |
| GET | `/health` | Health check. |
| GET | `/stats` | System stats (documents, chunks, models). |

Frontend typically prefixes these with `/api` when using a dev proxy.

---

*Last updated to reflect Topic Workspaces, distinct Dashboard/Topics/Progress, backend Flashcards with uniform grid and real-life examples, and download.*
