# ContractLens

**Privacy-conscious AI contract intelligence system**

> Convert a business contract into structured metadata, actionable obligations, deadlines, renewals, and grounded Q&A with source references.

---

## Quick Start

### Prerequisites

- Node.js 20+ (frontend)
- Python 3.11+ (backend)
- Docker Desktop (for PostgreSQL)

### 1. Start the database

```bash
docker-compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your API keys

python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

---

## Project Structure

```
contractlens/
├── frontend/          # Next.js 14 + Tailwind CSS
├── backend/           # FastAPI + SQLAlchemy + pgvector
│   ├── app/
│   │   ├── api/       # Route handlers
│   │   ├── services/  # Business logic
│   │   ├── models/    # SQLAlchemy ORM models
│   │   └── schemas/   # Pydantic schemas
│   └── storage/       # Uploaded PDFs (local)
└── docker-compose.yml # PostgreSQL 16 + pgvector
```

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key for extraction + Q&A |
| `LLM_PROVIDER` | `claude` (default) or `local` (stubbed) |
| `OPENAI_API_KEY` | OpenAI key for text-embedding-3-small |
| `EMBEDDING_PROVIDER` | `openai` (default) or `local` (stubbed) |
| `DATABASE_URL` | PostgreSQL asyncpg connection string |
| `STORAGE_PATH` | Local path for uploaded PDFs |
| `CORS_ORIGINS` | Frontend URL for CORS |
| `DEMO_USER_EMAIL` | Demo user email (seeded at startup) |

---

## Features

- **PDF contract upload** with page-preserving text extraction
- **Structured AI extraction**: parties, dates, renewal, payment, termination
- **Clause classification**: PAYMENT, RENEWAL, TERMINATION, CONFIDENTIALITY, etc.
- **Obligation tracking**: WHO | ACTION | WHEN | STATUS | SOURCE
- **Deadline calculation**: pure backend date arithmetic (no LLM math)
- **Timeline visualisation**: contract lifecycle + upcoming events
- **RAG-based Q&A**: grounded answers with source citations
- **Source Viewer**: jump from any answer/obligation to the exact contract section
- **In-app reminders**: 30-day and 7-day alerts on the dashboard

---

## Scope

This is an **MVP** focused on extracting value from existing contracts. It does **not**:

- Give legal advice
- Draft or negotiate contracts
- Support OCR for scanned/image-only PDFs (these are flagged as unsupported)
- Support multi-user login (uses a single seeded demo user)

---

## Development Phases

| Phase | Status | Description |
|---|---|---|
| 1 | ✅ | Architecture + implementation plan |
| 2 | ✅ | UI with mock data |
| 3 | ⬜ | FastAPI backend + PostgreSQL schema |
| 4 | ⬜ | PDF upload + text extraction |
| 5 | ⬜ | Structured AI extraction |
| 6 | ⬜ | Store extracted data |
| 7 | ⬜ | Dashboard + obligations + timeline |
| 8 | ⬜ | Embeddings + pgvector |
| 9 | ⬜ | Grounded Q&A + citations |
| 10 | ⬜ | In-app reminders |
| 11 | ⬜ | Multi-contract testing |
| 12 | ⬜ | Model evaluation prep |
