import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.models import Obligation, ObligationStatus
from app.schemas.schemas import ObligationResponse, ObligationUpdate

router = APIRouter(prefix="", tags=["Obligations"])

@router.get("/contracts/{contract_id}/obligations", response_model=List[ObligationResponse])
async def list_contract_obligations(
    contract_id: uuid.UUID,
    status: Optional[ObligationStatus] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Obligation).where(Obligation.contract_id == contract_id)
    if status:
        stmt = stmt.where(Obligation.status == status)
    stmt = stmt.order_by(Obligation.due_date.asc().nulls_last())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.patch("/obligations/{obligation_id}", response_model=ObligationResponse)
async def update_obligation_status(
    obligation_id: uuid.UUID,
    payload: ObligationUpdate,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Obligation).where(Obligation.id == obligation_id)
    result = await db.execute(stmt)
    obligation = result.scalar_one_or_none()
    if not obligation:
        raise HTTPException(status_code=404, detail="Obligation not found")
    
    if payload.status:
        obligation.status = payload.status
    
    await db.commit()
    await db.refresh(obligation)
    return obligation
