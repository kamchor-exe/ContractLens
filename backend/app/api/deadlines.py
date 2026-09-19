import uuid
from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.seed import seed_demo_user
from app.models.models import Deadline, Contract
from app.schemas.schemas import DeadlineResponse

router = APIRouter(prefix="", tags=["Deadlines & Timeline"])


@router.get("/contracts/{contract_id}/deadlines", response_model=List[DeadlineResponse])
async def list_contract_deadlines(
    contract_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """All deadlines for a specific contract, ordered by date."""
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
    db: AsyncSession = Depends(get_db),
):
    """Timeline view — same as deadlines but named distinctly for the UI route."""
    stmt = (
        select(Deadline)
        .where(Deadline.contract_id == contract_id)
        .order_by(Deadline.deadline_date.asc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/deadlines", response_model=List[DeadlineResponse])
async def list_all_upcoming_deadlines(
    days_ahead: int = Query(365, ge=1, le=1825, description="Deadlines within N days from today"),
    db: AsyncSession = Depends(get_db),
):
    """Dashboard endpoint: all deadlines across all contracts within N days."""
    demo_user = await seed_demo_user(db)
    cutoff = date.today()
    from datetime import timedelta
    far_date = cutoff + timedelta(days=days_ahead)

    # Join with contracts to filter by the demo user
    stmt = (
        select(Deadline)
        .join(Contract, Contract.id == Deadline.contract_id)
        .where(
            Contract.user_id == demo_user.id,
            Deadline.deadline_date >= cutoff,
            Deadline.deadline_date <= far_date,
        )
        .order_by(Deadline.deadline_date.asc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()

