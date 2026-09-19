"""initial schema with pgvector

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-19

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import pgvector

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Enable pgvector extension safely
    op.execute("""
        DO $$ 
        BEGIN 
            CREATE EXTENSION IF NOT EXISTS vector;
        EXCEPTION WHEN OTHERS THEN 
            RAISE NOTICE 'pgvector extension not installed in Postgres server';
        END $$;
    """)

    # 2. Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_users_email', 'users', ['email'])

    # 3. Create contracts table
    op.create_table(
        'contracts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('filename', sa.String(255), nullable=False),
        sa.Column('storage_path', sa.String(512), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'PROCESSING', 'READY', 'FAILED', 'UNSUPPORTED', name='contractstatus'), nullable=False),
        sa.Column('effective_date', sa.Date(), nullable=True),
        sa.Column('expiry_date', sa.Date(), nullable=True),
        sa.Column('renewal_terms', sa.Text(), nullable=True),
        sa.Column('payment_terms', sa.Text(), nullable=True),
        sa.Column('termination_conditions', sa.Text(), nullable=True),
        sa.Column('raw_text', sa.Text(), nullable=True),
        sa.Column('page_count', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
    )

    # 4. Create contract_parties table
    op.create_table(
        'contract_parties',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('contract_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('contracts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', sa.String(255), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('source_page', sa.Integer(), server_default='1'),
        sa.Column('source_section', sa.String(255), nullable=True),
        sa.Column('source_text', sa.Text(), nullable=True),
        sa.Column('confidence', sa.Float(), server_default='1.0'),
    )

    # 5. Create clauses table
    op.create_table(
        'clauses',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('contract_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('contracts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('clause_type', sa.Enum('PAYMENT', 'RENEWAL', 'TERMINATION', 'CONFIDENTIALITY', 'INDEMNITY', 'FORCE_MAJEURE', 'DATA_PROTECTION', 'LIABILITY', 'INTELLECTUAL_PROPERTY', 'OTHER', name='clausetype'), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('source_page', sa.Integer(), server_default='1'),
        sa.Column('source_section', sa.String(255), nullable=True),
        sa.Column('confidence', sa.Float(), server_default='1.0'),
    )

    # 6. Create obligations table
    op.create_table(
        'obligations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('contract_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('contracts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('responsible_party', sa.String(255), nullable=False),
        sa.Column('action', sa.Text(), nullable=False),
        sa.Column('due_rule', sa.Text(), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('status', sa.Enum('PENDING', 'COMPLETED', 'OVERDUE', name='obligationstatus'), nullable=False),
        sa.Column('source_page', sa.Integer(), server_default='1'),
        sa.Column('source_section', sa.String(255), nullable=True),
        sa.Column('source_text', sa.Text(), nullable=True),
        sa.Column('confidence', sa.Float(), server_default='1.0'),
    )

    # 7. Create deadlines table
    op.create_table(
        'deadlines',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('contract_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('contracts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('obligation_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('obligations.id', ondelete='SET NULL'), nullable=True),
        sa.Column('label', sa.String(255), nullable=False),
        sa.Column('deadline_date', sa.Date(), nullable=False),
        sa.Column('deadline_type', sa.Enum('EXPIRY', 'RENEWAL_NOTICE', 'PAYMENT', 'OBLIGATION', 'OTHER', name='deadlinetype'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    # 8. Create reminders table
    op.create_table(
        'reminders',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('deadline_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('deadlines.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('remind_at', sa.Date(), nullable=False),
        sa.Column('acknowledged', sa.Boolean(), server_default='false'),
        sa.Column('message', sa.Text(), nullable=False),
    )

    # 9. Create contract_chunks table (with pgvector embedding column or JSONB fallback)
    op.create_table(
        'contract_chunks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('contract_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('contracts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('chunk_index', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('source_page', sa.Integer(), server_default='1'),
        sa.Column('source_section', sa.String(255), nullable=True),
        sa.Column('embedding', postgresql.JSONB(), nullable=True),
    )

    # 10. Create chat_messages table
    op.create_table(
        'chat_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('contract_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('contracts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', sa.Enum('USER', 'ASSISTANT', name='messagerole'), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('citations', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

def downgrade() -> None:
    op.drop_table('chat_messages')
    op.drop_table('contract_chunks')
    op.drop_table('reminders')
    op.drop_table('deadlines')
    op.drop_table('obligations')
    op.drop_table('clauses')
    op.drop_table('contract_parties')
    op.drop_table('contracts')
    op.drop_table('users')
    op.execute("DROP TYPE IF EXISTS messagerole;")
    op.execute("DROP TYPE IF EXISTS deadlinetype;")
    op.execute("DROP TYPE IF EXISTS obligationstatus;")
    op.execute("DROP TYPE IF EXISTS clausetype;")
    op.execute("DROP TYPE IF EXISTS contractstatus;")
