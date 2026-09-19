# ContractLens

**Privacy-conscious AI contract intelligence system**

> Convert business contracts into structured metadata, actionable obligations, deadlines, renewals, and grounded Q&A with direct page/section evidence citations.

---

## Architecture & Quick Start

### Architecture
- **Frontend**: Next.js 16 (React 19 + Tailwind CSS + Lucide Icons + SVG Graphics) — `http://localhost:3000`
- **Backend**: FastAPI (Python 3.12 + SQLAlchemy 2.0 Async + Alembic) — `http://127.0.0.1:8001`
- **Database**: PostgreSQL 18 — port `2007` (`contractlens` / `contractlens` / `contractlens`)
- **PDF Processor**: PyMuPDF (`pymupdf`) with page-preserving extraction and text-layer detection
- **AI Extraction & RAG**: Claude API (Anthropic) / Fallback Engine + OpenAI `text-embedding-3-small` (1536 dim) / Deterministic Vector Engine
- **GitHub Repository**: [kamchor-exe/ContractLens](https://github.com/kamchor-exe/ContractLens)

---

### Quick Start (Local Development)

#### 1. Backend Setup
```powershell
cd backend

# Create & activate Python virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start FastAPI backend server on port 8001
.\venv\Scripts\python -m uvicorn app.main:app --port 8001 --host 127.0.0.1
```

#### 2. Frontend Setup
```powershell
cd frontend

# Install Node dependencies
npm install

# Start Next.js dev server on port 3000
npm run dev
# Open http://localhost:3000 in your browser
```

#### 3. Automated Test Suites
```powershell
cd backend

# Phase 6 DB & extraction verification
.\venv\Scripts\python test_phase6_upload.py

# Phase 7 REST API verification
.\venv\Scripts\python test_phase7_api.py

# Phase 8 Vector Chunking & Similarity Search verification
.\venv\Scripts\python test_phase8_vector.py

# Phase 9 Grounded RAG Q&A with Citations verification
.\venv\Scripts\python test_phase9_rag.py

# Phase 11 Full End-to-End Pipeline Test (Upload -> Extraction -> RAG -> Delete)
.\venv\Scripts\python test_e2e_full_pipeline.py
```

---

## 🚀 All 12 Development Phases (100% Completed)

| Phase | Status | Description |
|---|:---:|---|
| **Phase 1** | ✅ | System Architecture, Tech Stack & Implementation Plan |
| **Phase 2** | ✅ | Next.js Frontend UI with Vector Illustrations & Theme Styling |
| **Phase 3** | ✅ | FastAPI Backend Setup, PostgreSQL Schema & Async SQLAlchemy ORM |
| **Phase 4** | ✅ | PDF Upload & PyMuPDF Page-Preserving Text Extraction |
| **Phase 5** | ✅ | Structured AI Extraction Service (Metadata, Clauses, Obligations) |
| **Phase 6** | ✅ | PostgreSQL AI Persistence & Pure-Python Deadline/Reminder Math |
| **Phase 7** | ✅ | REST API Endpoints (Contracts, Obligations, Deadlines, Clauses, Reminders) |
| **Phase 8** | ✅ | Page-Aware Text Chunking & 1536-Dim Vector Similarity Search Engine |
| **Phase 9** | ✅ | Grounded RAG Chat Engine with Anti-Hallucination Prompt & Citations |
| **Phase 10** | ✅ | Frontend Integration with Real Backend REST APIs (`lib/api.ts`) |
| **Phase 11** | ✅ | End-to-End Automated Integration Testing (`test_e2e_full_pipeline.py`) |
| **Phase 12** | ✅ | Project Finalization, Documentation & Clean Repository Handover |

---

## Features

- 📄 **PDF Contract Upload**: Page-preserving extraction (`--- PAGE X ---`) with automatic scanned PDF text-layer detection (`UNSUPPORTED` flag for scanned PDFs).
- 🏷️ **AI Structured Extraction**: Extracts title, effective/expiry dates, renewal terms, payment terms, termination conditions, and contract parties.
- 📜 **Clause Classification**: Classifies clauses into 10 standard types (`PAYMENT`, `RENEWAL`, `TERMINATION`, `CONFIDENTIALITY`, `INDEMNITY`, `FORCE_MAJEURE`, etc.).
- 🎯 **Obligation Tracking**: Extracts responsible party, action required, due rule, due date, source section, and supports status updates (`PENDING`, `COMPLETED`, `OVERDUE`).
- ⏰ **Deterministic Deadline Calculation**: Pure-Python date arithmetic for expiry dates, 60-day renewal notice warnings, obligation deadlines, and 30-day/7-day reminders.
- 💬 **Grounded RAG Q&A**: Context-grounded contract Q&A engine with strict anti-hallucination prompt and page/section citations.
- 🔗 **Source Viewer**: Direct navigation from chat citations and obligations to exact contract text sections.
- 🔔 **Dashboard Reminders**: In-app unacknowledged reminder alerts for upcoming contract deadlines.
