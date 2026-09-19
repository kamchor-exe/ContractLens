import uuid
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.models import Deadline
from app.schemas.schemas import DeadlineResponse

router = APIRouter(prefix="", tags=["Deadlines & Timeline"])

@router.get("/contracts/{contract_id}/deadlines", response_model=List[DeadlineResponse])
async def list_contract_deadlines(
    contract_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Deadline)
        .where(Deadline.contract_id == contract_id)
        .order_by(Deadline.deadline_date.asc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/contracts/{contract_id}/timeline", response_model=List[DeadlineResponse])
async def get_contract_timeline(
    contract_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Deadline)
        .where(Deadline.contract_id == contract_id)
        .order_by(Deadline.deadline_date.asc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()
