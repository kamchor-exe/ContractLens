# ContractLens — AI Agent Handover & Context Guide

> **Notice for Incoming AI Agent**: Read this document thoroughly before starting work. It contains the exact state, architecture, database credentials, project layout, completed phases, and step-by-step instructions to resume from **Phase 5: Structured AI Extraction**.

---

## 1. Project Location & Repository

- **Workspace Path**: `C:\Users\BOOK4 16 360\.gemini\antigravity\scratch\contractlens`
- **GitHub Repository**: [https://github.com/kamchor-exe/ContractLens](https://github.com/kamchor-exe/ContractLens)

---

## 2. Technical Stack & Environment Setup

| Component | Technology | Local URL / Port | Notes |
|---|---|---|---|
| **Frontend** | Next.js 14 App Router, Tailwind CSS, TypeScript | `http://localhost:3000` | Rewrites `/api/*` requests to port 8000 |
| **Backend** | FastAPI, Python 3.12, PyMuPDF (`pymupdf`), SQLAlchemy async | `http://localhost:8000` | Health check at `/health` |
| **Database** | PostgreSQL 18 | `localhost:2007` | DB `contractlens`, User/Pass `contractlens`:`contractlens` |
| **Migrations** | Alembic | N/A | `alembic upgrade head` from `backend/` |

---

## 3. Current Project Status (4 of 12 Phases Completed)

| Phase | Description | Status | Key Deliverables |
|---|---|---|---|
| **Phase 1** | Architecture & Planning | ✅ Completed | `implementation_plan.md`, `task.md`, DB schema design |
| **Phase 2** | UI with Realistic Mock Data | ✅ Completed | All 6 Next.js pages (Dashboard, Overview, Obligations, Timeline, Chat, Source Viewer), custom vector graphics in `Illustrations.tsx` |
| **Phase 3** | FastAPI Backend + PostgreSQL Schema | ✅ Completed | 9 SQLAlchemy ORM models, Alembic initial migration (`001_initial_schema`), demo user seeding (`demo@contractlens.ai`), REST API router stubs |
| **Phase 4** | PDF Upload & Text Extraction | ✅ Completed | `pdf_service.py` using PyMuPDF, page-preserving 1-indexed page mapping (`--- PAGE X ---`), text-layer detection (< 50 chars flagged as `UNSUPPORTED`), unit & integration test suite (`test_pdf_upload.py`) |
| **Phase 5** | Structured AI Extraction | ⏳ **NEXT** | `llm_service.py` abstraction (`ClaudeProvider` via Anthropic API + `LocalProvider` stub), structured JSON prompts (metadata, parties, clause classification, obligation extraction) |
| **Phase 6** | Store Extracted Data in DB | ⬜ Pending | Write extracted JSON metadata, clauses, obligations to PostgreSQL, calculate `deadlines` via pure Python date arithmetic (`deadline_service.py`) |
| **Phase 7** | Wire Real Backend to Frontend | ⬜ Pending | Replace frontend mock data hooks with real `/api/contracts`, `/api/obligations`, `/api/timeline` calls |
| **Phase 8** | Embeddings + pgvector | ⬜ Pending | `embedding_service.py`, section-boundary chunking, OpenAI `text-embedding-3-small` vectors stored in `contract_chunks` |
| **Phase 9** | Grounded Q&A + Citations | ⬜ Pending | `rag_service.py`, pgvector cosine similarity, grounded prompt ("answer ONLY from contract excerpts"), citation cards |
| **Phase 10** | In-App Reminders | ⬜ Pending | `deadline_service.py` auto-generating 30-day and 7-day reminders, dashboard notification widget & acknowledgement |
| **Phase 11** | Multi-Contract End-to-End Testing | ⬜ Pending | Testing with multiple real contracts, fix extraction/RAG failures |
| **Phase 12** | Model Evaluation & Fine-tuning Prep | ⬜ Pending | Evaluation harness script, fine-tuning dataset format documentation |

---

## 4. Key Files & Directory Layout

```
contractlens/
├── AGENT_HANDOVER.md          # THIS HANDOVER FILE
├── README.md                  # Project overview & startup instructions
├── docker-compose.yml         # Postgres 16 container setup
│
├── backend/                   # FastAPI Backend
│   ├── .env                   # DB URL (port 2007), storage path, API keys
│   ├── requirements.txt
│   ├── test_pdf_upload.py     # Verified PDF upload unit & integration test
│   ├── alembic/               # Database migrations
│   │   └── versions/001_initial_schema.py
│   ├── app/
│   │   ├── main.py            # FastAPI entry point & CORS configuration
│   │   ├── core/config.py     # Settings via pydantic-settings
│   │   ├── db/
│   │   │   ├── database.py    # Async engine & sessionmaker
│   │   │   └── seed.py        # Demo user startup seeding
│   │   ├── models/models.py   # SQLAlchemy ORM models for all 9 tables
│   │   ├── schemas/schemas.py # Pydantic v2 schemas
│   │   ├── services/
│   │   │   └── pdf_service.py # PyMuPDF page-preserving extraction
│   │   └── api/               # REST Route Handlers
│   │       ├── contracts.py   # GET /contracts, POST /contracts/upload
│   │       ├── obligations.py # GET /obligations, PATCH /obligations/{id}
│   │       ├── deadlines.py   # GET /deadlines, GET /timeline
│   │       ├── chat.py        # GET /chat, POST /chat, GET /chunks/{id}
│   │       └── reminders.py   # GET /reminders, PATCH /reminders/{id}/acknowledge
│   └── storage/               # Local directory for uploaded PDFs
│
└── frontend/                  # Next.js Frontend
    ├── package.json
    ├── next.config.ts         # Proxy rewrite /api/* -> http://localhost:8000/api/*
    └── src/
        ├── app/
        │   ├── page.tsx                  # Dashboard with hero banner & dropzone
        │   └── contracts/[id]/
        │       ├── page.tsx              # Contract Overview
        │       ├── obligations/page.tsx  # Obligations table with sorting & status filter
        │       ├── timeline/page.tsx     # Visual lifecycle & vertical timeline
        │       ├── chat/page.tsx         # AI Assistant with citation cards
        │       └── source/page.tsx       # Source Viewer chunk highlight & index
        ├── components/
        │   ├── Sidebar.tsx
        │   ├── PageHeader.tsx
        │   └── ui/
        │       ├── Badges.tsx            # Status/Type badges & StatCard
        │       └── Illustrations.tsx     # Royalty-free vector illustrations
        └── lib/
            ├── types.ts                  # Shared TypeScript interfaces
            └── mock-data.ts              # Demo contracts, clauses, obligations
```

---

## 5. Direct Instructions for Incoming AI Agent (How to Begin Phase 5)

When starting your turn as the new AI agent:

1. **Verify Services**:
   - Check if PostgreSQL is running (`Get-Service *postgres*` on port 2007).
   - Backend command: `cd backend; .\venv\Scripts\python -m uvicorn app.main:app --port 8000 --host 127.0.0.1`
   - Frontend command: `cd frontend; npm run dev`

2. **Begin Phase 5 (Structured AI Extraction)**:
   - Create `backend/app/services/llm_service.py`:
     - Implement `LLMProvider` abstract base class.
     - Implement `ClaudeProvider` using `anthropic.AsyncAnthropic` (reads `ANTHROPIC_API_KEY` from `settings`).
     - Implement `LocalProvider` stub (raises `NotImplementedError("Local model provider is stubbed for MVP")`).
   - Create `backend/app/services/extraction_service.py`:
     - **Prompt 1: Metadata Extraction**: Extract `parties`, `effective_date`, `expiry_date`, `renewal_terms`, `payment_terms`, `termination_conditions` in strict JSON with source page/section.
     - **Prompt 2: Clause Classification**: Classify clauses into `PAYMENT`, `RENEWAL`, `TERMINATION`, `CONFIDENTIALITY`, `INDEMNITY`, `FORCE_MAJEURE`, `DATA_PROTECTION`, `LIABILITY`, `INTELLECTUAL_PROPERTY`, `OTHER`.
     - **Prompt 3: Obligation Extraction**: Extract obligations into strict JSON (`responsible_party`, `action`, `due_rule`, `source_page`, `source_section`, `source_text`).
   - Parse LLM JSON responses into Pydantic models for strict validation.

3. **Follow Locked Architectural Principles**:
   - **LLM interprets. Backend validates, calculates, stores, and tracks.**
   - **Never let the LLM perform critical date arithmetic.**
   - Do NOT fine-tune or add unneeded microservices/auth flows.

4. **Update Handover & Checklist**:
   - Update `task.md` and `walkthrough.md` as you complete each phase.
