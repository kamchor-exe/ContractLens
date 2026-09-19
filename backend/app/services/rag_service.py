"""
rag_service.py
--------------
Grounded Retrieval-Augmented Generation (RAG) chat engine.
Retrieves vector-matched contract chunks, builds strict grounded system prompt,
invokes LLM, attaches page/section citations, and records chat history in DB.
"""

import uuid
import logging
from typing import List, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import ChatMessage, MessageRole, Contract
from app.schemas.schemas import CitationSchema
from app.services.vector_service import vector_service
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)


class RAGService:
    """Grounded Contract Q&A Chat Engine with Evidence Citations."""

    SYSTEM_PROMPT_TEMPLATE = """You are ContractLens AI, an expert legal assistant.
Your task is to answer the user's question about the contract strictly using ONLY the provided excerpts.

CRITICAL INSTRUCTIONS:
1. Do NOT assume, extrapolate, or use outside knowledge.
2. If the question cannot be answered directly from the excerpts below, state clearly:
   "Based on the provided contract text, this information is not specified."
3. Refer directly to section numbers and page numbers in your answer when referencing terms.

CONTRACT EXCERPTS:
{context}
"""

    @classmethod
    async def ask_question(
        cls,
        contract_id: uuid.UUID,
        question: str,
        user_id: uuid.UUID,
        db: AsyncSession
    ) -> ChatMessage:
        """Process user question through grounded RAG pipeline."""

        # 1. Retrieve top matching chunks using vector similarity search
        chunks = await vector_service.search_chunks(
            contract_id=contract_id,
            query=question,
            top_k=4,
            db=db
        )

        # 2. Format context block and citation objects
        context_parts = []
        citations = []
        for c in chunks:
            context_parts.append(
                f"[Excerpt (Page {c['source_page']}, {c['source_section']})]:\n{c['content']}"
            )
            citations.append({
                "chunk_id": c["chunk_id"],
                "source_page": c["source_page"],
                "source_section": c["source_section"],
                "snippet": c["content"][:200]
            })

        context = "\n\n---\n\n".join(context_parts) if context_parts else "No contract text found."
        system_prompt = cls.SYSTEM_PROMPT_TEMPLATE.format(context=context)

        # 3. Save User Message to DB
        user_msg = ChatMessage(
            contract_id=contract_id,
            user_id=user_id,
            role=MessageRole.USER,
            content=question,
            citations=[]
        )
        db.add(user_msg)
        await db.flush()

        # 4. Generate LLM Response (Claude / Fallback)
        try:
            llm_response = await llm_service.complete(
                system_prompt=system_prompt,
                user_message=f"Question: {question}"
            )
        except Exception as e:
            logger.warning(f"LLM call failed ({e}). Falling back to grounded context response.")
            if chunks:
                llm_response = (
                    f"Based on Page {chunks[0]['source_page']} ({chunks[0]['source_section']}):\n"
                    f"\"{chunks[0]['content'][:300]}...\""
                )
            else:
                llm_response = "Based on the provided contract text, this information is not specified."

        # 5. Save Assistant Message with Citations to DB
        assistant_msg = ChatMessage(
            contract_id=contract_id,
            user_id=user_id,
            role=MessageRole.ASSISTANT,
            content=llm_response,
            citations=citations
        )
        db.add(assistant_msg)
        await db.commit()
        await db.refresh(assistant_msg)

        return assistant_msg


rag_service = RAGService()
