"""
deadline_service.py
-------------------
Pure-Python deadline and reminder generation — NO LLM date math.
Parses obligation due_rules and contract dates to produce Deadline + Reminder DB rows.
"""

import re
import logging
from datetime import date, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Contract, Obligation, Deadline, Reminder, DeadlineType
from app.services.extraction_service import ExtractionResult, ExtractedObligation

logger = logging.getLogger(__name__)

# Days-before-deadline at which reminders fire
REMINDER_WINDOWS = [30, 7]


def _parse_date_str(date_str: Optional[str]) -> Optional[date]:
    """Parse YYYY-MM-DD string to date; return None on any failure."""
    if not date_str:
        return None
    try:
        return date.fromisoformat(date_str[:10])
    except (ValueError, TypeError):
        return None


def _make_reminders(deadline: Deadline, user_id, today: date) -> list[Reminder]:
    """Create reminder records for each REMINDER_WINDOWS day offset."""
    reminders = []
    for days_before in REMINDER_WINDOWS:
        remind_at = deadline.deadline_date - timedelta(days=days_before)
        if remind_at < today:
            # Skip reminders already in the past
            continue
        reminders.append(Reminder(
            deadline_id=deadline.id,
            user_id=user_id,
            remind_at=remind_at,
            acknowledged=False,
            message=(
                f"{days_before}-day reminder: '{deadline.label}' is due on "
                f"{deadline.deadline_date.isoformat()}."
            )
        ))
    return reminders


async def generate_for_contract(
    contract: Contract,
    extraction: ExtractionResult,
    user_id,
    db: AsyncSession
) -> None:
    """
    Generate Deadline + Reminder rows for a newly processed contract.

    Strategy (pure Python — NO LLM):
    1.  Contract EXPIRY deadline  → from extraction_result.metadata.expiry_date
    2.  RENEWAL_NOTICE deadline   → 60 days before expiry
    3.  Per-obligation OBLIGATION deadlines → from obligation.due_date (YYYY-MM-DD)
    4.  Reminders at 30 and 7 days before each deadline (skipping past dates)
    """
    today = date.today()

    # ── 1. Expiry deadline ──────────────────────────────────────────────────
    expiry_date = _parse_date_str(extraction.metadata.expiry_date)
    if expiry_date:
        expiry_deadline = Deadline(
            contract_id=contract.id,
            label=f"Contract Expiry — {contract.title}",
            deadline_date=expiry_date,
            deadline_type=DeadlineType.EXPIRY,
        )
        db.add(expiry_deadline)
        await db.flush()  # get expiry_deadline.id

        for r in _make_reminders(expiry_deadline, user_id, today):
            db.add(r)

        # ── 2. Renewal notice (60 days before expiry) ──────────────────────
        renewal_notice_date = expiry_date - timedelta(days=60)
        if renewal_notice_date > today:
            renewal_deadline = Deadline(
                contract_id=contract.id,
                label=f"Renewal Notice Deadline — {contract.title}",
                deadline_date=renewal_notice_date,
                deadline_type=DeadlineType.RENEWAL_NOTICE,
            )
            db.add(renewal_deadline)
            await db.flush()
            for r in _make_reminders(renewal_deadline, user_id, today):
                db.add(r)

    # ── 3. Per-obligation deadlines ─────────────────────────────────────────
    # Obligations are already saved to DB; fetch them from the session via the
    # contract relationship that was just flush-committed above.
    # We re-use the extracted obligation data directly to get due_date strings.
    for extracted_ob in extraction.obligations:
        ob_due = _parse_date_str(extracted_ob.due_date)
        if not ob_due or ob_due < today:
            # No explicit date, or already past — skip generating a deadline
            continue

        # Find the matching DB Obligation row (by action text match)
        # This avoids an extra async query; we rely on flush ordering.
        ob_deadline = Deadline(
            contract_id=contract.id,
            label=f"Obligation: {extracted_ob.action[:120]}",
            deadline_date=ob_due,
            deadline_type=DeadlineType.OBLIGATION,
        )
        db.add(ob_deadline)
        await db.flush()
        for r in _make_reminders(ob_deadline, user_id, today):
            db.add(r)

    logger.info(
        "Deadlines and reminders generated for contract %s", str(contract.id)[:8]
    )
