import uuid
import os
import shutil
from typing import List
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.database import get_db
from app.db.seed import seed_demo_user
from app.models.models import Contract, ContractStatus, ContractParty, Clause, Obligation
from app.schemas.schemas import ContractResponse, ContractDetailResponse
from app.services.pdf_service import pdf_service
from app.services.extraction_service import extraction_service, ExtractionResult
from app.services import deadline_service as dl_svc

router = APIRouter(prefix="/contracts", tags=["Contracts"])

@router.get("", response_model=List[ContractResponse])
async def list_contracts(db: AsyncSession = Depends(get_db)):
    demo_user = await seed_demo_user(db)
    stmt = (
        select(Contract)
        .where(Contract.user_id == demo_user.id)
        .options(selectinload(Contract.parties))
        .order_by(Contract.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{contract_id}", response_model=ContractDetailResponse)
async def get_contract(contract_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Contract)
        .where(Contract.id == contract_id)
        .options(
            selectinload(Contract.parties),
            selectinload(Contract.clauses),
            selectinload(Contract.obligations),
            selectinload(Contract.deadlines)
        )
    )
    result = await db.execute(stmt)
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract

@router.delete("/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contract(contract_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(Contract).where(Contract.id == contract_id)
    result = await db.execute(stmt)
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Remove file from storage if present
    if os.path.exists(contract.storage_path):
        try:
            os.remove(contract.storage_path)
        except OSError:
            pass

    await db.delete(contract)
    await db.commit()

@router.post("/upload", response_model=ContractResponse, status_code=status.HTTP_201_CREATED)
async def upload_contract(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    demo_user = await seed_demo_user(db)

    # Generate unique storage filename
    contract_id = uuid.uuid4()
    storage_dir = settings.absolute_storage_path
    safe_filename = f"{contract_id}_{file.filename}"
    file_path = os.path.join(storage_dir, safe_filename)

    # Save uploaded PDF to storage directory
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract text and check text-layer validity
    pdf_result = pdf_service.extract_text_from_pdf(file_path)

    # Clean title from filename
    title = file.filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()

    if not pdf_result.is_valid_text_pdf:
        # ── Scanned / unsupported PDF ──────────────────────────────────────
        contract = Contract(
            id=contract_id,
            user_id=demo_user.id,
            filename=file.filename,
            storage_path=file_path,
            title=title,
            status=ContractStatus.UNSUPPORTED,
            page_count=pdf_result.page_count,
            raw_text=pdf_result.error_message or "Unsupported PDF — no text layer found"
        )
        db.add(contract)
        await db.commit()
    else:
        # ── Phase 6: AI extraction → DB persistence ────────────────────────
        # 1. Run structured AI extraction (falls back to heuristics if no API key)
        extraction: ExtractionResult = await extraction_service.extract_all(pdf_result.full_text)

        # 2. Parse dates from extraction metadata
        def _parse_date(ds):
            if not ds:
                return None
            try:
                return date.fromisoformat(ds[:10])
            except (ValueError, TypeError):
                return None

        eff_date = _parse_date(extraction.metadata.effective_date)
        exp_date = _parse_date(extraction.metadata.expiry_date)

        # 3. Save contract row with extracted metadata
        contract = Contract(
            id=contract_id,
            user_id=demo_user.id,
            filename=file.filename,
            storage_path=file_path,
            title=extraction.metadata.title or title,
            status=ContractStatus.READY,
            page_count=pdf_result.page_count,
            raw_text=pdf_result.full_text,
            effective_date=eff_date,
            expiry_date=exp_date,
            renewal_terms=extraction.metadata.renewal_terms or None,
            payment_terms=extraction.metadata.payment_terms or None,
            termination_conditions=extraction.metadata.termination_conditions or None,
            processed_at=datetime.utcnow(),
        )
        db.add(contract)
        await db.flush()  # get contract.id assigned

        # 4. Save contract parties
        for party in extraction.metadata.parties:
            db.add(ContractParty(
                contract_id=contract_id,
                name=party.name,
                role=party.role,
                source_page=party.source_page,
                source_section=party.source_section,
                confidence=1.0,
            ))

        # 5. Save clauses
        for clause in extraction.clauses:
            db.add(Clause(
                contract_id=contract_id,
                clause_type=clause.clause_type,
                title=clause.title,
                content=clause.content,
                source_page=clause.source_page,
                source_section=clause.source_section,
                confidence=clause.confidence,
            ))

        # 6. Save obligations
        obligation_ids = []
        for ob in extraction.obligations:
            ob_date = _parse_date(ob.due_date)
            ob_row = Obligation(
                contract_id=contract_id,
                responsible_party=ob.responsible_party,
                action=ob.action,
                due_rule=ob.due_rule,
                due_date=ob_date,
                source_page=ob.source_page,
                source_section=ob.source_section,
                source_text=ob.source_text,
                confidence=ob.confidence,
            )
            db.add(ob_row)
            obligation_ids.append(ob_row)

        await db.flush()

        # 7. Generate deadlines + reminders (pure Python — no LLM date math)
        await dl_svc.generate_for_contract(contract, extraction, demo_user.id, db)

        await db.commit()

    # Re-query with selectinload so Pydantic serializes cleanly (avoids lazy load greenlet error)
    stmt = select(Contract).where(Contract.id == contract_id).options(selectinload(Contract.parties))
    result = await db.execute(stmt)
    return result.scalar_one()

