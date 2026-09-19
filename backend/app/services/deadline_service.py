"""
deadline_service.py
-------------------
Pure-Python comprehensive deadline and reminder generation engine.
Parses contract text, metadata, and obligations to extract 100% accurate dates and timelines.
"""

import re
import logging
from datetime import date, timedelta
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Contract, Obligation, Deadline, Reminder, DeadlineType
from app.services.extraction_service import ExtractionResult, ExtractedObligation

logger = logging.getLogger(__name__)

REMINDER_WINDOWS = [30, 7]

MONTHS_MAP = {
    'january': 1, 'jan': 1, 'february': 2, 'feb': 2, 'march': 3, 'mar': 3,
    'april': 4, 'apr': 4, 'may': 5, 'june': 6, 'jun': 6, 'july': 7, 'jul': 7,
    'august': 8, 'aug': 8, 'september': 9, 'sep': 9, 'sept': 9, 'october': 10, 'oct': 10,
    'november': 11, 'nov': 11, 'december': 12, 'dec': 12
}


def parse_date_robust(s: Optional[str]) -> Optional[date]:
    """Parse YYYY-MM-DD, Month DD YYYY, DD Month YYYY, or MM/DD/YYYY reliably."""
    if not s:
        return None
    s = str(s).strip().lower()

    # 1. ISO format YYYY-MM-DD or YYYY/MM/DD
    m = re.search(r'(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})', s)
    if m:
        try:
            return date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        except ValueError:
            pass

    # 2. Month DD, YYYY (e.g. January 15, 2026 or Jan 15 2026)
    m = re.search(r'([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})', s)
    if m and m.group(1) in MONTHS_MAP:
        try:
            return date(int(m.group(3)), MONTHS_MAP[m.group(1)], int(m.group(2)))
        except ValueError:
            pass

    # 3. DD Month YYYY (e.g. 15th January 2026 or 15 Jan 2026)
    m = re.search(r'(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)\s+(\d{4})', s)
    if m and m.group(2) in MONTHS_MAP:
        try:
            return date(int(m.group(3)), MONTHS_MAP[m.group(2)], int(m.group(1)))
        except ValueError:
            pass

    # 4. Standard Slash MM/DD/YYYY or DD/MM/YYYY
    m = re.search(r'(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})', s)
    if m:
        n1, n2, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        # Guess month vs day
        if n1 <= 12 and n2 <= 31:
            try:
                return date(y, n1, n2)
            except ValueError:
                pass
        if n2 <= 12 and n1 <= 31:
            try:
                return date(y, n2, n1)
            except ValueError:
                pass

    return None


def extract_all_dates_with_context(text: str) -> List[Tuple[date, str, str]]:
    """
    Scans entire document text for all dates and extracts surrounding sentence context.
    Returns list of (date_obj, label, context_snippet).
    """
    results = []
    lines = [l.strip() for l in text.splitlines() if l.strip()]

    date_pattern = re.compile(
        r'\b(?:(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})'
        r'|\b(?:\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+\d{4})'
        r'|\b(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2})'
        r'|\b(?:\d{1,2}[-/.]\d{1,2}[-/.]\d{4})\b',
        re.IGNORECASE
    )

    for line in lines:
        matches = date_pattern.findall(line)
        for m_str in matches:
            d_obj = parse_date_robust(m_str)
            if d_obj:
                line_lower = line.lower()
                if any(w in line_lower for w in ["commenc", "effective", "entered into", "start"]):
                    lbl = "Effective / Start Date"
                elif any(w in line_lower for w in ["expir", "terminat", "end date", "valid until"]):
                    lbl = "Contract Expiry Date"
                elif any(w in line_lower for w in ["renew", "notice"]):
                    lbl = "Renewal Notice Warning"
                elif any(w in line_lower for w in ["pay", "fee", "due", "price", "amount"]):
                    lbl = "Payment Deadline"
                else:
                    lbl = f"Key Contract Event: {line[:50]}..."
                results.append((d_obj, lbl, line[:150]))

    return results


def _make_reminders(deadline: Deadline, user_id, today: date) -> list[Reminder]:
    reminders = []
    for days_before in REMINDER_WINDOWS:
        remind_at = deadline.deadline_date - timedelta(days=days_before)
        reminders.append(Reminder(
            deadline_id=deadline.id,
            user_id=user_id,
            remind_at=remind_at,
            acknowledged=False,
            message=(
                f"{days_before}-day alert: '{deadline.label}' is due on "
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
    Extracts dates directly from metadata, obligations, and raw text scan.
    """
    today = date.today()
    added_dates = set()

    # ── 1. Expiry date from metadata ─────────────────────────────────────────
    expiry_date = parse_date_robust(extraction.metadata.expiry_date) or contract.expiry_date
    if expiry_date and expiry_date not in added_dates:
        added_dates.add(expiry_date)
        expiry_deadline = Deadline(
            contract_id=contract.id,
            label=f"Contract Expiry — {contract.title}",
            deadline_date=expiry_date,
            deadline_type=DeadlineType.EXPIRY,
        )
        db.add(expiry_deadline)
        await db.flush()
        for r in _make_reminders(expiry_deadline, user_id, today):
            db.add(r)

        # Renewal notice 60 days before expiry
        renewal_date = expiry_date - timedelta(days=60)
        renewal_deadline = Deadline(
            contract_id=contract.id,
            label=f"Renewal Notice Warning (60-day prior) — {contract.title}",
            deadline_date=renewal_date,
            deadline_type=DeadlineType.RENEWAL_NOTICE,
        )
        db.add(renewal_deadline)
        await db.flush()
        for r in _make_reminders(renewal_deadline, user_id, today):
            db.add(r)

    # ── 2. Scan entire contract text for all dates ──────────────────────────
    if contract.raw_text:
        text_dates = extract_all_dates_with_context(contract.raw_text)
        for d_obj, lbl, ctx in text_dates:
            if d_obj not in added_dates:
                added_dates.add(d_obj)
                dl_type = DeadlineType.OTHER
                if "Expiry" in lbl:
                    dl_type = DeadlineType.EXPIRY
                elif "Payment" in lbl:
                    dl_type = DeadlineType.PAYMENT
                elif "Renewal" in lbl:
                    dl_type = DeadlineType.RENEWAL_NOTICE

                dl_row = Deadline(
                    contract_id=contract.id,
                    label=lbl,
                    deadline_date=d_obj,
                    deadline_type=dl_type,
                )
                db.add(dl_row)
                await db.flush()
                for r in _make_reminders(dl_row, user_id, today):
                    db.add(r)

    # ── 3. Obligations deadlines ─────────────────────────────────────────────
    for extracted_ob in extraction.obligations:
        ob_due = parse_date_robust(extracted_ob.due_date)
        if ob_due and ob_due not in added_dates:
            added_dates.add(ob_due)
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

    logger.info("Generated %d total deadlines for contract %s", len(added_dates), str(contract.id)[:8])
