import uuid
from typing import List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.seed import seed_demo_user
from app.models.models import Reminder, Deadline, Contract
from app.schemas.schemas import ReminderResponse

router = APIRouter(prefix="/reminders", tags=["Reminders"])

@router.get("", response_model=List[ReminderResponse])
async def list_reminders(
    unacknowledged_only: bool = True,
    db: AsyncSession = Depends(get_db)
):
    demo_user = await seed_demo_user(db)
    stmt = (
        select(Reminder)
        .where(Reminder.user_id == demo_user.id)
        .options(
            selectinload(Reminder.deadline).selectinload(Deadline.contract)
        )
    )
    if unacknowledged_only:
        stmt = stmt.where(Reminder.acknowledged == False)

    result = await db.execute(stmt)
    reminders = result.scalars().all()

    response = []
    today = date.today()
    for r in reminders:
        days_until = (r.deadline.deadline_date - today).days
        response.append({
            "id": r.id,
            "deadline_id": r.deadline_id,
            "contract_id": r.deadline.contract_id,
            "contract_title": r.deadline.contract.title,
            "remind_at": r.remind_at,
            "acknowledged": r.acknowledged,
            "message": r.message,
            "deadline_type": r.deadline.deadline_type,
            "days_until": days_until,
        })
    return response

@router.patch("/{reminder_id}/acknowledge")
async def acknowledge_reminder(
    reminder_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Reminder).where(Reminder.id == reminder_id)
    result = await db.execute(stmt)
    reminder = result.scalar_one_or_none()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    reminder.acknowledged = True
    await db.commit()
    return {"message": "Reminder acknowledged"}
