import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.seed import seed_demo_user
from app.models.models import ChatMessage, MessageRole, ContractChunk
from app.schemas.schemas import ChatMessageCreate, ChatMessageResponse

router = APIRouter(prefix="/contracts/{contract_id}", tags=["Chat & RAG"])

@router.get("/chat", response_model=List[ChatMessageResponse])
async def get_chat_history(
    contract_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(ChatMessage)
        .where(ChatMessage.contract_id == contract_id)
        .order_by(ChatMessage.created_at.asc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/chat", response_model=ChatMessageResponse)
async def ask_question(
    contract_id: uuid.UUID,
    payload: ChatMessageCreate,
    db: AsyncSession = Depends(get_db)
):
    demo_user = await seed_demo_user(db)
    
    # Save user message
    user_msg = ChatMessage(
        contract_id=contract_id,
        user_id=demo_user.id,
        role=MessageRole.USER,
        content=payload.content
    )
    db.add(user_msg)
    await db.commit()

    # Stub response (real grounded RAG in Phase 9)
    assistant_msg = ChatMessage(
        contract_id=contract_id,
        user_id=demo_user.id,
        role=MessageRole.ASSISTANT,
        content="This is a stub response from the backend. Real RAG Q&A with grounded evidence and citations will be connected in Phase 9.",
        citations=[]
    )
    db.add(assistant_msg)
    await db.commit()
    await db.refresh(assistant_msg)
    return assistant_msg

@router.get("/chunks/{chunk_id}")
async def get_chunk_detail(
    contract_id: uuid.UUID,
    chunk_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(ContractChunk)
        .where(ContractChunk.id == chunk_id, ContractChunk.contract_id == contract_id)
    )
    result = await db.execute(stmt)
    chunk = result.scalar_one_or_none()
    if not chunk:
        raise HTTPException(status_code=404, detail="Chunk not found")
    return {
        "id": chunk.id,
        "contract_id": chunk.contract_id,
        "chunk_index": chunk.chunk_index,
        "content": chunk.content,
        "source_page": chunk.source_page,
        "source_section": chunk.source_section,
    }
