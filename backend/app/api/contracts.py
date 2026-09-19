import uuid
import os
import shutil
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.database import get_db
from app.db.seed import seed_demo_user
from app.models.models import Contract, ContractStatus
from app.schemas.schemas import ContractResponse, ContractDetailResponse
from app.services.pdf_service import pdf_service

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
    extraction = pdf_service.extract_text_from_pdf(file_path)

    # Clean title from filename
    title = file.filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()

    if not extraction.is_valid_text_pdf:
        contract = Contract(
            id=contract_id,
            user_id=demo_user.id,
            filename=file.filename,
            storage_path=file_path,
            title=title,
            status=ContractStatus.UNSUPPORTED,
            page_count=extraction.page_count,
            raw_text=extraction.error_message or "Unsupported PDF — no text layer found"
        )
        db.add(contract)
        await db.commit()
    else:
        # Store text and page count
        contract = Contract(
            id=contract_id,
            user_id=demo_user.id,
            filename=file.filename,
            storage_path=file_path,
            title=title,
            status=ContractStatus.READY,
            page_count=extraction.page_count,
            raw_text=extraction.full_text,
            processed_at=datetime.utcnow()
        )
        db.add(contract)
        await db.commit()

    # Re-query with selectinload(Contract.parties) so Pydantic serializes cleanly without lazy load
    stmt = select(Contract).where(Contract.id == contract_id).options(selectinload(Contract.parties))
    result = await db.execute(stmt)
    return result.scalar_one()
