// Core domain types for ContractLens frontend

export type ContractStatus =
  | "PENDING"
  | "PROCESSING"
  | "READY"
  | "FAILED"
  | "UNSUPPORTED";

export type ClauseType =
  | "PAYMENT"
  | "RENEWAL"
  | "TERMINATION"
  | "CONFIDENTIALITY"
  | "INDEMNITY"
  | "FORCE_MAJEURE"
  | "DATA_PROTECTION"
  | "LIABILITY"
  | "INTELLECTUAL_PROPERTY"
  | "OTHER";

export type ObligationStatus = "PENDING" | "COMPLETED" | "OVERDUE";

export type DeadlineType =
  | "EXPIRY"
  | "RENEWAL_NOTICE"
  | "PAYMENT"
  | "OBLIGATION"
  | "OTHER";

export type MessageRole = "USER" | "ASSISTANT";

export interface Party {
  id: string;
  role: string;
  name: string;
  source_page: number;
  source_section: string;
}

export interface Contract {
  id: string;
  filename: string;
  title: string;
  status: ContractStatus;
  effective_date: string;
  expiry_date: string;
  renewal_terms: string;
  payment_terms: string;
  termination_conditions: string;
  page_count: number;
  created_at: string;
  processed_at: string;
  parties: Party[];
}

export interface Clause {
  id: string;
  contract_id: string;
  clause_type: ClauseType;
  title: string;
  content: string;
  source_page: number;
  source_section: string;
  confidence: number;
}

export interface Obligation {
  id: string;
  contract_id: string;
  responsible_party: string;
  action: string;
  due_rule: string;
  due_date: string | null;
  status: ObligationStatus;
  source_page: number;
  source_section: string;
  source_text: string;
  confidence: number;
}

export interface Deadline {
  id: string;
  contract_id: string;
  obligation_id: string | null;
  label: string;
  deadline_date: string;
  deadline_type: DeadlineType;
}

export interface Reminder {
  id: string;
  deadline_id: string;
  contract_id: string;
  contract_title: string;
  remind_at: string;
  acknowledged: boolean;
  message: string;
  deadline_type: DeadlineType;
  days_until: number;
}

export interface Citation {
  chunk_id: string;
  source_page: number;
  source_section: string;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  citations?: Citation[];
  created_at: string;
}
