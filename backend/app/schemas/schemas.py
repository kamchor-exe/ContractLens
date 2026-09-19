import uuid
from datetime import datetime, date
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict, Field
from app.models.models import (
    ContractStatus, ClauseType, ObligationStatus, DeadlineType, MessageRole
)

# ─── User ──────────────────────────────────────────────────────────────────────

class UserBase(BaseModel):
    email: str
    name: str

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ─── Contract Party ────────────────────────────────────────────────────────────

class ContractPartyBase(BaseModel):
    role: str
    name: str
    source_page: int = 1
    source_section: Optional[str] = None
    source_text: Optional[str] = None
    confidence: float = 1.0

class ContractPartyResponse(ContractPartyBase):
    id: uuid.UUID
    contract_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# ─── Clause ────────────────────────────────────────────────────────────────────

class ClauseBase(BaseModel):
    clause_type: ClauseType
    title: str
    content: str
    source_page: int = 1
    source_section: Optional[str] = None
    confidence: float = 1.0

class ClauseResponse(ClauseBase):
    id: uuid.UUID
    contract_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# ─── Obligation ────────────────────────────────────────────────────────────────

class ObligationBase(BaseModel):
    responsible_party: str
    action: str
    due_rule: str
    due_date: Optional[date] = None
    status: ObligationStatus = ObligationStatus.PENDING
    source_page: int = 1
    source_section: Optional[str] = None
    source_text: Optional[str] = None
    confidence: float = 1.0

class ObligationUpdate(BaseModel):
    status: Optional[ObligationStatus] = None

class ObligationResponse(ObligationBase):
    id: uuid.UUID
    contract_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# ─── Deadline ──────────────────────────────────────────────────────────────────

class DeadlineBase(BaseModel):
    label: str
    deadline_date: date
    deadline_type: DeadlineType

class DeadlineResponse(DeadlineBase):
    id: uuid.UUID
    contract_id: uuid.UUID
    obligation_id: Optional[uuid.UUID] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ─── Reminder ──────────────────────────────────────────────────────────────────

class ReminderResponse(BaseModel):
    id: uuid.UUID
    deadline_id: uuid.UUID
    contract_id: uuid.UUID
    contract_title: str
    remind_at: date
    acknowledged: bool
    message: str
    deadline_type: DeadlineType
    days_until: int
    model_config = ConfigDict(from_attributes=True)

# ─── Contract ──────────────────────────────────────────────────────────────────

class ContractBase(BaseModel):
    title: str
    filename: str

class ContractResponse(ContractBase):
    id: uuid.UUID
    user_id: uuid.UUID
    storage_path: str
    status: ContractStatus
    effective_date: Optional[date] = None
    expiry_date: Optional[date] = None
    renewal_terms: Optional[str] = None
    payment_terms: Optional[str] = None
    termination_conditions: Optional[str] = None
    raw_text: Optional[str] = None
    page_count: int = 0
    created_at: datetime
    processed_at: Optional[datetime] = None
    parties: List[ContractPartyResponse] = []
    model_config = ConfigDict(from_attributes=True)

class ContractDetailResponse(ContractResponse):
    clauses: List[ClauseResponse] = []
    obligations: List[ObligationResponse] = []
    deadlines: List[DeadlineResponse] = []

# ─── Chat ──────────────────────────────────────────────────────────────────────

class CitationSchema(BaseModel):
    chunk_id: str
    source_page: int
    source_section: str
    snippet: str

class ChatMessageCreate(BaseModel):
    content: str

class ChatMessageResponse(BaseModel):
    id: uuid.UUID
    contract_id: uuid.UUID
    user_id: uuid.UUID
    role: MessageRole
    content: str
    citations: Optional[List[CitationSchema]] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
