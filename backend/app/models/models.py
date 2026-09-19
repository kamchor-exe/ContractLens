import uuid
import enum
from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import (
    String, Text, Integer, Float, Boolean, Date, DateTime, Enum, ForeignKey, JSON
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.database import Base

def generate_uuid():
    return uuid.uuid4()

class ContractStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    READY = "READY"
    FAILED = "FAILED"
    UNSUPPORTED = "UNSUPPORTED"

class ClauseType(str, enum.Enum):
    PAYMENT = "PAYMENT"
    RENEWAL = "RENEWAL"
    TERMINATION = "TERMINATION"
    CONFIDENTIALITY = "CONFIDENTIALITY"
    INDEMNITY = "INDEMNITY"
    FORCE_MAJEURE = "FORCE_MAJEURE"
    DATA_PROTECTION = "DATA_PROTECTION"
    LIABILITY = "LIABILITY"
    INTELLECTUAL_PROPERTY = "INTELLECTUAL_PROPERTY"
    OTHER = "OTHER"

class ObligationStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    OVERDUE = "OVERDUE"

class DeadlineType(str, enum.Enum):
    EXPIRY = "EXPIRY"
    RENEWAL_NOTICE = "RENEWAL_NOTICE"
    PAYMENT = "PAYMENT"
    OBLIGATION = "OBLIGATION"
    OTHER = "OTHER"

class MessageRole(str, enum.Enum):
    USER = "USER"
    ASSISTANT = "ASSISTANT"

# ─── Models ────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    contracts: Mapped[List["Contract"]] = relationship("Contract", back_populates="user", cascade="all, delete-orphan")

class Contract(Base):
    __tablename__ = "contracts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(512), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[ContractStatus] = mapped_column(Enum(ContractStatus), default=ContractStatus.PENDING, nullable=False)
    effective_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    renewal_terms: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    payment_terms: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    termination_conditions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    raw_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    page_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="contracts")
    parties: Mapped[List["ContractParty"]] = relationship("ContractParty", back_populates="contract", cascade="all, delete-orphan")
    clauses: Mapped[List["Clause"]] = relationship("Clause", back_populates="contract", cascade="all, delete-orphan")
    obligations: Mapped[List["Obligation"]] = relationship("Obligation", back_populates="contract", cascade="all, delete-orphan")
    deadlines: Mapped[List["Deadline"]] = relationship("Deadline", back_populates="contract", cascade="all, delete-orphan")
    chunks: Mapped[List["ContractChunk"]] = relationship("ContractChunk", back_populates="contract", cascade="all, delete-orphan")
    chat_messages: Mapped[List["ChatMessage"]] = relationship("ChatMessage", back_populates="contract", cascade="all, delete-orphan")

class ContractParty(Base):
    __tablename__ = "contract_parties"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    contract_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("contracts.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    source_page: Mapped[int] = mapped_column(Integer, default=1)
    source_section: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    source_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    confidence: Mapped[float] = mapped_column(Float, default=1.0)

    contract: Mapped["Contract"] = relationship("Contract", back_populates="parties")

class Clause(Base):
    __tablename__ = "clauses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    contract_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("contracts.id"), nullable=False)
    clause_type: Mapped[ClauseType] = mapped_column(Enum(ClauseType), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    source_page: Mapped[int] = mapped_column(Integer, default=1)
    source_section: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    confidence: Mapped[float] = mapped_column(Float, default=1.0)

    contract: Mapped["Contract"] = relationship("Contract", back_populates="clauses")

class Obligation(Base):
    __tablename__ = "obligations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    contract_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("contracts.id"), nullable=False)
    responsible_party: Mapped[str] = mapped_column(String(255), nullable=False)
    action: Mapped[str] = mapped_column(Text, nullable=False)
    due_rule: Mapped[str] = mapped_column(Text, nullable=False)
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[ObligationStatus] = mapped_column(Enum(ObligationStatus), default=ObligationStatus.PENDING, nullable=False)
    source_page: Mapped[int] = mapped_column(Integer, default=1)
    source_section: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    source_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    confidence: Mapped[float] = mapped_column(Float, default=1.0)

    contract: Mapped["Contract"] = relationship("Contract", back_populates="obligations")
    deadlines: Mapped[List["Deadline"]] = relationship("Deadline", back_populates="obligation")

class Deadline(Base):
    __tablename__ = "deadlines"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    contract_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("contracts.id"), nullable=False)
    obligation_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("obligations.id"), nullable=True)
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    deadline_date: Mapped[date] = mapped_column(Date, nullable=False)
    deadline_type: Mapped[DeadlineType] = mapped_column(Enum(DeadlineType), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    contract: Mapped["Contract"] = relationship("Contract", back_populates="deadlines")
    obligation: Mapped[Optional["Obligation"]] = relationship("Obligation", back_populates="deadlines")
    reminders: Mapped[List["Reminder"]] = relationship("Reminder", back_populates="deadline", cascade="all, delete-orphan")

class Reminder(Base):
    __tablename__ = "reminders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    deadline_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("deadlines.id"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    remind_at: Mapped[date] = mapped_column(Date, nullable=False)
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    deadline: Mapped["Deadline"] = relationship("Deadline", back_populates="reminders")

class ContractChunk(Base):
    __tablename__ = "contract_chunks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    contract_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("contracts.id"), nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    source_page: Mapped[int] = mapped_column(Integer, default=1)
    source_section: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    embedding: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)

    contract: Mapped["Contract"] = relationship("Contract", back_populates="chunks")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    contract_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("contracts.id"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role: Mapped[MessageRole] = mapped_column(Enum(MessageRole), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    citations: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    contract: Mapped["Contract"] = relationship("Contract", back_populates="chat_messages")
