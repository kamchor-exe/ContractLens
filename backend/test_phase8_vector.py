"""
test_phase8_vector.py
---------------------
Phase 8 integration test for vector_service (chunking, embedding, similarity search).
Run from backend/ directory:
    .\\venv\\Scripts\\python test_phase8_vector.py
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))


async def test_phase8():
    from app.db.database import AsyncSessionLocal
    from app.services.vector_service import vector_service
    from app.models.models import Contract, ContractChunk
    from sqlalchemy import select

    print("Testing Phase 8 Vector Service & Search...")

    async with AsyncSessionLocal() as db:
        # 1. Fetch latest contract from DB
        stmt = select(Contract).where(Contract.status == "READY").order_by(Contract.created_at.desc())
        res = await db.execute(stmt)
        contract = res.scalars().first()
        assert contract is not None, "No READY contract found in DB"
        print(f"[OK] Testing with contract: '{contract.title}' ({str(contract.id)[:8]})")

        # 2. Chunk & Store
        num_chunks = await vector_service.chunk_and_store(contract.id, contract.raw_text, db)
        assert num_chunks > 0, "Chunking produced 0 chunks"
        print(f"[OK] Chunked and stored {num_chunks} chunks in DB")

        # 3. Query DB for ContractChunk rows
        stmt_c = select(ContractChunk).where(ContractChunk.contract_id == contract.id)
        res_c = await db.execute(stmt_c)
        chunks = res_c.scalars().all()
        assert len(chunks) == num_chunks, f"Expected {num_chunks} chunks, found {len(chunks)}"
        print(f"[OK] Verified {len(chunks)} ContractChunk rows in PostgreSQL")

        # Check embedding dimensions
        sample_emb = chunks[0].embedding
        assert sample_emb is not None, "Chunk embedding is None"
        assert len(sample_emb) == 1536, f"Expected 1536 embedding dimensions, got {len(sample_emb)}"
        print(f"[OK] Verified embedding dimension = {len(sample_emb)} (JSONB list)")

        # 4. Perform vector similarity search
        query = "What is the monthly payment fee?"
        search_results = await vector_service.search_chunks(contract.id, query, top_k=2, db=db)
        assert len(search_results) > 0, "Vector search returned no results"
        top_result = search_results[0]
        print(f"[OK] Vector search for query: '{query}'")
        print(f"     Top match score: {top_result['score']:.4f} | Page {top_result['source_page']}")
        print(f"     Snippet: '{top_result['content'][:80]}...'")

    print("\n--- ALL PHASE 8 VECTOR TESTS PASSED! ---")


if __name__ == "__main__":
    asyncio.run(test_phase8())
