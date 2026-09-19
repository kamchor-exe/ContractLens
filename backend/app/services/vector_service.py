"""
vector_service.py
-----------------
Page-aware text chunking, embedding generation (OpenAI text-embedding-3-small or fallback),
and vector similarity search over PostgreSQL JSONB embedding vectors.
"""

import re
import math
import uuid
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.models import ContractChunk

logger = logging.getLogger(__name__)


def _cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Calculate cosine similarity between two float vectors."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


class VectorService:
    """Handles contract text chunking, embeddings, and vector similarity search."""

    @classmethod
    def chunk_text(cls, full_text: str, chunk_size: int = 600, overlap: int = 100) -> List[Dict[str, Any]]:
        """
        Split contract text into page-aware overlapping chunks.
        Tracks current page based on '--- PAGE X ---' markers.
        """
        chunks = []
        current_page = 1
        lines = full_text.splitlines()

        current_buffer = []
        current_char_count = 0
        chunk_index = 0

        for line in lines:
            # Check page marker
            page_match = re.match(r"^---\s*PAGE\s+(\d+)\s*---", line, re.IGNORECASE)
            if page_match:
                current_page = int(page_match.group(1))
                continue

            current_buffer.append(line)
            current_char_count += len(line) + 1

            if current_char_count >= chunk_size:
                text_block = "\n".join(current_buffer).strip()
                if text_block:
                    # Extract header/section heuristic
                    section_match = re.search(r"^(?:Section\s+\d+|[\d\.]+\s+[A-Z\s]{3,})", text_block, re.MULTILINE)
                    section_name = section_match.group(0).strip() if section_match else f"Page {current_page}"

                    chunks.append({
                        "chunk_index": chunk_index,
                        "content": text_block,
                        "source_page": current_page,
                        "source_section": section_name,
                    })
                    chunk_index += 1

                # Keep overlap from buffer
                overlap_chars = 0
                new_buffer = []
                for b_line in reversed(current_buffer):
                    new_buffer.insert(0, b_line)
                    overlap_chars += len(b_line) + 1
                    if overlap_chars >= overlap:
                        break
                current_buffer = new_buffer
                current_char_count = sum(len(l) + 1 for l in current_buffer)

        # Flush trailing buffer
        if current_buffer:
            text_block = "\n".join(current_buffer).strip()
            if text_block:
                chunks.append({
                    "chunk_index": chunk_index,
                    "content": text_block,
                    "source_page": current_page,
                    "source_section": f"Page {current_page}",
                })

        return chunks

    @classmethod
    async def get_embedding(cls, text: str) -> List[float]:
        """
        Generate embedding vector (1536 dim) for input text.
        Uses OpenAI text-embedding-3-small if OPENAI_API_KEY is set.
        Otherwise falls back to a deterministic 1536-dim feature vector.
        """
        openai_key = settings.OPENAI_API_KEY or getattr(settings, "openai_api_key", None)
        if openai_key and openai_key.startswith("sk-"):
            try:
                import openai
                client = openai.AsyncOpenAI(api_key=openai_key)
                response = await client.embeddings.create(
                    model="text-embedding-3-small",
                    input=text[:8000]
                )
                return response.data[0].embedding
            except Exception as e:
                logger.warning(f"OpenAI embedding call failed ({e}). Using deterministic vector fallback.")

        # Fallback: Deterministic normalized bag-of-words hash vector (1536 dim)
        vector = [0.0] * 1536
        words = re.findall(r"\w+", text.lower())
        if not words:
            return vector

        for word in words:
            # Hash word into 1536 buckets
            h = hash(word) % 1536
            vector[h] += 1.0

        # L2 Normalize
        norm = math.sqrt(sum(v * v for v in vector))
        if norm > 0:
            vector = [v / norm for v in vector]
        return vector

    @classmethod
    async def chunk_and_store(cls, contract_id: uuid.UUID, full_text: str, db: AsyncSession) -> int:
        """Chunk contract text, generate embeddings, and save ContractChunk rows in DB."""
        # 1. Delete old chunks for this contract
        await db.execute(delete(ContractChunk).where(ContractChunk.contract_id == contract_id))

        # 2. Generate chunks
        raw_chunks = cls.chunk_text(full_text)
        if not raw_chunks:
            return 0

        # 3. Create ContractChunk instances with embeddings
        for c in raw_chunks:
            emb = await cls.get_embedding(c["content"])
            chunk_row = ContractChunk(
                contract_id=contract_id,
                chunk_index=c["chunk_index"],
                content=c["content"],
                source_page=c["source_page"],
                source_section=c["source_section"],
                embedding=emb
            )
            db.add(chunk_row)

        await db.commit()
        logger.info(f"Chunked & stored {len(raw_chunks)} chunks for contract {str(contract_id)[:8]}")
        return len(raw_chunks)

    @classmethod
    async def search_chunks(
        cls,
        contract_id: uuid.UUID,
        query: str,
        top_k: int = 4,
        db: AsyncSession = None
    ) -> List[Dict[str, Any]]:
        """
        Perform vector similarity search over contract chunks stored in DB.
        Returns top_k chunks sorted by cosine similarity score.
        """
        if not db:
            return []

        # Get query vector
        query_vec = await cls.get_embedding(query)

        # Query all chunks for contract
        stmt = select(ContractChunk).where(ContractChunk.contract_id == contract_id)
        result = await db.execute(stmt)
        chunks = result.scalars().all()

        scored_chunks = []
        for chunk in chunks:
            chunk_vec = chunk.embedding or []
            score = _cosine_similarity(query_vec, chunk_vec)
            scored_chunks.append({
                "chunk_id": str(chunk.id),
                "chunk_index": chunk.chunk_index,
                "content": chunk.content,
                "source_page": chunk.source_page,
                "source_section": chunk.source_section or f"Page {chunk.source_page}",
                "score": score,
            })

        # Sort descending by similarity score
        scored_chunks.sort(key=lambda x: x["score"], reverse=True)
        return scored_chunks[:top_k]


vector_service = VectorService()
