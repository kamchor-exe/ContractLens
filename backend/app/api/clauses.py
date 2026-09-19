"""
clauses.py — API router for contract clause retrieval
"""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.models import Clause, ClauseType
from app.schemas.schemas import ClauseResponse

router = APIRouter(prefix="", tags=["Clauses"])


@router.get("/contracts/{contract_id}/clauses", response_model=List[ClauseResponse])
async def list_contract_clauses(
    contract_id: uuid.UUID,
    clause_type: Optional[ClauseType] = None,
    db: AsyncSession = Depends(get_db),
):
    """Return all clauses for a given contract, optionally filtered by type."""
    stmt = select(Clause).where(Clause.contract_id == contract_id)
    if clause_type:
        stmt = stmt.where(Clause.clause_type == clause_type)
    stmt = stmt.order_by(Clause.source_page.asc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/contracts/{contract_id}/clauses/{clause_id}", response_model=ClauseResponse)
async def get_clause(
    contract_id: uuid.UUID,
    clause_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Return a single clause by ID."""
    stmt = select(Clause).where(
        Clause.id == clause_id, Clause.contract_id == contract_id
    )
    result = await db.execute(stmt)
    clause = result.scalar_one_or_none()
    if not clause:
        raise HTTPException(status_code=404, detail="Clause not found")
    return clause
