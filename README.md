# ContractLens

**Privacy-conscious AI contract intelligence platform**

> Convert business contracts into structured metadata, actionable obligations, timelines, and grounded Q&A with source citations.

---

## 🛠️ Quick Start

```powershell
# 1. Backend (FastAPI on port 8001)
cd backend
.\venv\Scripts\python -m uvicorn app.main:app --port 8001 --host 127.0.0.1

# 2. Frontend (Next.js on port 3000)
cd frontend
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
npm run dev

# Open http://localhost:3000 in your browser
```

---

## 🌟 Key Features

- 📄 **PDF Contract Upload**: Page-preserving text extraction with automatic text-layer detection.
- 🏷️ **AI Structured Extraction**: Title, effective/expiry dates, renewal terms, payment terms, and contract parties.
- 🗓️ **Dark Vertical Timeline**: Monospace dates with vertical `↓` step flow matching custom design specs.
- 🟡 **Source Viewer Highlights**: High-contrast yellow badges for dates/deadlines and blue headers for clauses.
- 💬 **Multi-Provider Grounded RAG Chat**: Context-grounded Q&A supporting Claude, OpenAI, or Local Smart Synthesizer fallback.
- 🗑️ **Contract Deletion**: Full file & PostgreSQL database row cleanup via `DELETE /api/contracts/{id}`.
