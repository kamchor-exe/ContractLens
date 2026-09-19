import type {
  Contract,
  Obligation,
  Deadline,
  Reminder,
  Clause,
  ChatMessage,
} from "./types";

// ─── Demo Contracts ────────────────────────────────────────────────────────────

export const MOCK_CONTRACTS: Contract[] = [
  {
    id: "c-001",
    filename: "TechCorp_SaaS_Agreement_2026.pdf",
    title: "SaaS Platform License Agreement",
    status: "READY",
    effective_date: "2026-01-01",
    expiry_date: "2027-12-31",
    renewal_terms:
      "Auto-renews for successive 12-month terms unless either party provides written notice of non-renewal at least 30 days before expiry.",
    payment_terms:
      "Monthly payments of $5,000 due on the 1st of each month. Late payments accrue interest at 1.5% per month.",
    termination_conditions:
      "Either party may terminate with 30 days written notice. Immediate termination for material breach if uncured within 15 days of notice.",
    page_count: 24,
    created_at: "2026-09-01T09:00:00Z",
    processed_at: "2026-09-01T09:01:45Z",
    parties: [
      {
        id: "p-001",
        role: "Licensor",
        name: "TechCorp Solutions Ltd.",
        source_page: 1,
        source_section: "Preamble",
      },
      {
        id: "p-002",
        role: "Licensee",
        name: "Innovate Inc.",
        source_page: 1,
        source_section: "Preamble",
      },
    ],
  },
  {
    id: "c-002",
    filename: "DataProcessing_DPA_2026.pdf",
    title: "Data Processing Agreement",
    status: "READY",
    effective_date: "2026-03-15",
    expiry_date: "2027-03-14",
    renewal_terms: "Renews automatically for 1-year terms with 60 days notice.",
    payment_terms: "No direct payment; services governed by master SaaS agreement.",
    termination_conditions:
      "Terminates automatically upon expiry of the master SaaS Agreement.",
    page_count: 12,
    created_at: "2026-09-10T14:30:00Z",
    processed_at: "2026-09-10T14:31:22Z",
    parties: [
      {
        id: "p-003",
        role: "Data Controller",
        name: "Innovate Inc.",
        source_page: 1,
        source_section: "Parties",
      },
      {
        id: "p-004",
        role: "Data Processor",
        name: "TechCorp Solutions Ltd.",
        source_page: 1,
        source_section: "Parties",
      },
    ],
  },
  {
    id: "c-003",
    filename: "Office_Lease_Agreement.pdf",
    title: "Commercial Office Lease",
    status: "PROCESSING",
    effective_date: "2026-06-01",
    expiry_date: "2029-05-31",
    renewal_terms: "",
    payment_terms: "",
    termination_conditions: "",
    page_count: 38,
    created_at: "2026-09-19T15:00:00Z",
    processed_at: "",
    parties: [],
  },
];

// ─── Demo Obligations ──────────────────────────────────────────────────────────

export const MOCK_OBLIGATIONS: Obligation[] = [
  {
    id: "o-001",
    contract_id: "c-001",
    responsible_party: "Innovate Inc.",
    action: "Pay monthly SaaS fee of $5,000",
    due_rule: "1st of each calendar month",
    due_date: "2026-10-01",
    status: "PENDING",
    source_page: 8,
    source_section: "Section 4.1 — Payment",
    source_text:
      "Licensee shall pay the monthly license fee of five thousand dollars ($5,000) on the first day of each calendar month.",
    confidence: 0.97,
  },
  {
    id: "o-002",
    contract_id: "c-001",
    responsible_party: "Innovate Inc.",
    action: "Provide written non-renewal notice",
    due_rule: "At least 30 days before contract expiry (2027-12-31)",
    due_date: "2027-12-01",
    status: "PENDING",
    source_page: 15,
    source_section: "Section 8.2 — Renewal",
    source_text:
      "Licensee must provide written notice of non-renewal no later than thirty (30) days prior to the expiry of the then-current term.",
    confidence: 0.95,
  },
  {
    id: "o-003",
    contract_id: "c-001",
    responsible_party: "TechCorp Solutions Ltd.",
    action: "Provide 99.5% monthly uptime SLA",
    due_rule: "Ongoing — measured monthly",
    due_date: null,
    status: "PENDING",
    source_page: 11,
    source_section: "Section 5.3 — Service Levels",
    source_text:
      "Licensor warrants that the Platform shall maintain an uptime of at least ninety-nine point five percent (99.5%) in each calendar month.",
    confidence: 0.93,
  },
  {
    id: "o-004",
    contract_id: "c-001",
    responsible_party: "Innovate Inc.",
    action: "Submit quarterly security audit report",
    due_rule: "Within 10 days of each quarter end",
    due_date: "2026-10-10",
    status: "OVERDUE",
    source_page: 19,
    source_section: "Section 9.4 — Security",
    source_text:
      "Licensee shall submit a security audit report to Licensor within ten (10) business days following the end of each calendar quarter.",
    confidence: 0.88,
  },
  {
    id: "o-005",
    contract_id: "c-001",
    responsible_party: "TechCorp Solutions Ltd.",
    action: "Deliver updated API documentation",
    due_rule: "Within 5 days of each major release",
    due_date: null,
    status: "COMPLETED",
    source_page: 13,
    source_section: "Section 6.1 — Documentation",
    source_text:
      "Licensor shall provide updated API documentation within five (5) business days of each major platform release.",
    confidence: 0.91,
  },
  {
    id: "o-006",
    contract_id: "c-002",
    responsible_party: "TechCorp Solutions Ltd.",
    action: "Report personal data breaches within 72 hours",
    due_rule: "Within 72 hours of becoming aware of a breach",
    due_date: null,
    status: "PENDING",
    source_page: 5,
    source_section: "Section 7 — Security Incident Notification",
    source_text:
      "The Processor shall notify the Controller of any personal data breach without undue delay and where feasible, no later than 72 hours after becoming aware of it.",
    confidence: 0.99,
  },
];

// ─── Demo Deadlines ────────────────────────────────────────────────────────────

export const MOCK_DEADLINES: Deadline[] = [
  {
    id: "d-001",
    contract_id: "c-001",
    obligation_id: "o-002",
    label: "SaaS Agreement — Non-Renewal Notice Deadline",
    deadline_date: "2027-12-01",
    deadline_type: "RENEWAL_NOTICE",
  },
  {
    id: "d-002",
    contract_id: "c-001",
    obligation_id: null,
    label: "SaaS Agreement — Contract Expiry",
    deadline_date: "2027-12-31",
    deadline_type: "EXPIRY",
  },
  {
    id: "d-003",
    contract_id: "c-001",
    obligation_id: "o-001",
    label: "Monthly Payment — October",
    deadline_date: "2026-10-01",
    deadline_type: "PAYMENT",
  },
  {
    id: "d-004",
    contract_id: "c-001",
    obligation_id: "o-004",
    label: "Q3 Security Audit Report Due",
    deadline_date: "2026-10-10",
    deadline_type: "OBLIGATION",
  },
  {
    id: "d-005",
    contract_id: "c-002",
    obligation_id: null,
    label: "Data Processing Agreement — Contract Expiry",
    deadline_date: "2027-03-14",
    deadline_type: "EXPIRY",
  },
  {
    id: "d-006",
    contract_id: "c-002",
    obligation_id: null,
    label: "Data Processing Agreement — Non-Renewal Notice",
    deadline_date: "2027-01-13",
    deadline_type: "RENEWAL_NOTICE",
  },
];

// ─── Demo Reminders ────────────────────────────────────────────────────────────

export const MOCK_REMINDERS: Reminder[] = [
  {
    id: "r-001",
    deadline_id: "d-003",
    contract_id: "c-001",
    contract_title: "SaaS Platform License Agreement",
    remind_at: "2026-09-24",
    acknowledged: false,
    message: "Monthly payment of $5,000 is due in 7 days (Oct 1, 2026).",
    deadline_type: "PAYMENT",
    days_until: 7,
  },
  {
    id: "r-002",
    deadline_id: "d-004",
    contract_id: "c-001",
    contract_title: "SaaS Platform License Agreement",
    remind_at: "2026-09-24",
    acknowledged: false,
    message: "Q3 Security Audit Report overdue — was due Oct 10, 2026.",
    deadline_type: "OBLIGATION",
    days_until: -9,
  },
  {
    id: "r-003",
    deadline_id: "d-006",
    contract_id: "c-002",
    contract_title: "Data Processing Agreement",
    remind_at: "2026-09-24",
    acknowledged: false,
    message:
      "Non-renewal notice window opens in 30 days for Data Processing Agreement.",
    deadline_type: "RENEWAL_NOTICE",
    days_until: 30,
  },
];

// ─── Demo Clauses ──────────────────────────────────────────────────────────────

export const MOCK_CLAUSES: Clause[] = [
  {
    id: "cl-001",
    contract_id: "c-001",
    clause_type: "PAYMENT",
    title: "Payment Terms",
    content:
      "Licensee shall pay the monthly license fee of five thousand dollars ($5,000) on the first day of each calendar month. Payments not received within ten (10) days of the due date shall accrue interest at a rate of one and a half percent (1.5%) per month.",
    source_page: 8,
    source_section: "Section 4.1",
    confidence: 0.97,
  },
  {
    id: "cl-002",
    contract_id: "c-001",
    clause_type: "RENEWAL",
    title: "Automatic Renewal",
    content:
      "This Agreement shall automatically renew for successive twelve (12) month terms unless either party provides written notice of its intent not to renew no later than thirty (30) days prior to the end of the then-current term.",
    source_page: 15,
    source_section: "Section 8.2",
    confidence: 0.95,
  },
  {
    id: "cl-003",
    contract_id: "c-001",
    clause_type: "TERMINATION",
    title: "Termination for Convenience",
    content:
      "Either party may terminate this Agreement for any reason upon thirty (30) days written notice to the other party. In the event of termination by Licensee, no refund of prepaid fees shall be due.",
    source_page: 17,
    source_section: "Section 9.1",
    confidence: 0.94,
  },
  {
    id: "cl-004",
    contract_id: "c-001",
    clause_type: "CONFIDENTIALITY",
    title: "Confidentiality Obligations",
    content:
      'Each party agrees to hold the other\'s Confidential Information in strict confidence and not to disclose it to any third party without prior written consent. "Confidential Information" means any non-public information disclosed by one party to the other.',
    source_page: 20,
    source_section: "Section 10.1",
    confidence: 0.96,
  },
  {
    id: "cl-005",
    contract_id: "c-001",
    clause_type: "LIABILITY",
    title: "Limitation of Liability",
    content:
      "In no event shall either party be liable for indirect, incidental, consequential, or punitive damages. Each party's total aggregate liability shall not exceed the total fees paid in the twelve (12) months preceding the claim.",
    source_page: 21,
    source_section: "Section 11.2",
    confidence: 0.92,
  },
  {
    id: "cl-006",
    contract_id: "c-001",
    clause_type: "INTELLECTUAL_PROPERTY",
    title: "Intellectual Property Ownership",
    content:
      "Licensor retains all right, title and interest in the Platform, including all intellectual property rights. Licensee is granted a non-exclusive, non-transferable license to use the Platform during the Term.",
    source_page: 10,
    source_section: "Section 5.1",
    confidence: 0.98,
  },
];

// ─── Demo Chat Messages ────────────────────────────────────────────────────────

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "m-001",
    role: "USER",
    content: "What happens if we miss a payment?",
    created_at: "2026-09-19T10:00:00Z",
  },
  {
    id: "m-002",
    role: "ASSISTANT",
    content:
      "According to the contract, if a payment is not received within **10 days** of the due date, interest accrues at **1.5% per month** on the outstanding amount. The contract does not specify immediate termination for a single missed payment, but persistent non-payment could constitute a material breach triggering the termination clause.",
    citations: [
      {
        chunk_id: "ch-004",
        source_page: 8,
        source_section: "Section 4.1 — Payment Terms",
        snippet:
          "Payments not received within ten (10) days of the due date shall accrue interest at a rate of one and a half percent (1.5%) per month.",
      },
      {
        chunk_id: "ch-009",
        source_page: 17,
        source_section: "Section 9.2 — Termination for Breach",
        snippet:
          "Either party may terminate immediately upon written notice if the other party commits a material breach that remains uncured for fifteen (15) days after notice.",
      },
    ],
    created_at: "2026-09-19T10:00:05Z",
  },
  {
    id: "m-003",
    role: "USER",
    content: "When do we need to send the non-renewal notice by?",
    created_at: "2026-09-19T10:01:00Z",
  },
  {
    id: "m-004",
    role: "ASSISTANT",
    content:
      "The non-renewal notice must be sent no later than **December 1, 2027** — that is 30 days before the current term expires on December 31, 2027. Failure to send notice by that date will result in the agreement automatically renewing for another 12-month term.",
    citations: [
      {
        chunk_id: "ch-015",
        source_page: 15,
        source_section: "Section 8.2 — Automatic Renewal",
        snippet:
          "...unless either party provides written notice of its intent not to renew no later than thirty (30) days prior to the end of the then-current term.",
      },
    ],
    created_at: "2026-09-19T10:01:04Z",
  },
];
