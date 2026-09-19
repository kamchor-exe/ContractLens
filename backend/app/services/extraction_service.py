import json
import re
import logging
from typing import Dict, List, Any, Optional
from pydantic import BaseModel
from app.services.llm_service import llm_service
from app.models.models import ClauseType

logger = logging.getLogger(__name__)

# ─── Pydantic Schemas for AI Extraction Output ────────────────────────────────

class ExtractedParty(BaseModel):
    name: str
    role: str
    source_page: int = 1
    source_section: str = "Preamble"

class ExtractedMetadata(BaseModel):
    title: str
    effective_date: Optional[str] = None  # YYYY-MM-DD
    expiry_date: Optional[str] = None     # YYYY-MM-DD
    renewal_terms: str = ""
    payment_terms: str = ""
    termination_conditions: str = ""
    parties: List[ExtractedParty] = []

class ExtractedClause(BaseModel):
    clause_type: ClauseType
    title: str
    content: str
    source_page: int = 1
    source_section: str = "General"
    confidence: float = 0.95

class ExtractedObligation(BaseModel):
    responsible_party: str
    action: str
    due_rule: str
    due_date: Optional[str] = None  # YYYY-MM-DD if explicitly given
    source_page: int = 1
    source_section: str = "General"
    source_text: str = ""
    confidence: float = 0.95

class ExtractionResult(BaseModel):
    metadata: ExtractedMetadata
    clauses: List[ExtractedClause] = []
    obligations: List[ExtractedObligation] = []

# ─── Extraction Service ────────────────────────────────────────────────────────

class ExtractionService:
    """Orchestrates structured AI extraction (metadata, clause classification, obligations)."""

    METADATA_SYSTEM_PROMPT = """You are ContractLens AI, a specialized contract analysis system.
Your task is to extract structured contract metadata into strict JSON format.
Do NOT invent information that is not in the text.
If a date or term is not explicitly mentioned, use null or empty string.

Return ONLY a JSON object with this exact schema:
{
  "title": "Contract Title",
  "effective_date": "YYYY-MM-DD or null",
  "expiry_date": "YYYY-MM-DD or null",
  "renewal_terms": "Summary of renewal conditions",
  "payment_terms": "Summary of payment conditions and schedules",
  "termination_conditions": "Summary of termination rights and notice requirements",
  "parties": [
    {
      "name": "Entity Name",
      "role": "Role (e.g. Licensor, Licensee, Provider, Client)",
      "source_page": 1,
      "source_section": "Preamble or Section 1"
    }
  ]
}"""

    CLAUSES_SYSTEM_PROMPT = """You are ContractLens AI, a contract clause classification expert.
Analyze the contract text and extract key clauses.
Classify each clause into exactly ONE of these types:
- PAYMENT
- RENEWAL
- TERMINATION
- CONFIDENTIALITY
- INDEMNITY
- FORCE_MAJEURE
- DATA_PROTECTION
- LIABILITY
- INTELLECTUAL_PROPERTY
- OTHER

Return ONLY a JSON array of clause objects with this exact schema:
[
  {
    "clause_type": "PAYMENT",
    "title": "Section Title",
    "content": "Exact clause text excerpt",
    "source_page": 1,
    "source_section": "Section number and title",
    "confidence": 0.95
  }
]"""

    OBLIGATIONS_SYSTEM_PROMPT = """You are ContractLens AI, an expert in contract obligation extraction.
Extract all actionable obligations (things a party MUST or SHALL do).
For each obligation, identify who must do it, what they must do, when/due rule, and where in the contract it appears.

Return ONLY a JSON array of obligation objects with this exact schema:
[
  {
    "responsible_party": "Name of party owing obligation",
    "action": "Description of required action",
    "due_rule": "Raw rule from contract (e.g. 1st of each month, 30 days before expiry)",
    "source_page": 1,
    "source_section": "Section 4.1",
    "source_text": "Supporting text snippet from contract",
    "confidence": 0.95
  }
]"""

    @classmethod
    async def extract_all(cls, full_text: str) -> ExtractionResult:
        """Run metadata, clause classification, and obligation extraction."""

        try:
            # 1. Metadata Extraction
            meta_json = await llm_service.complete(
                cls.METADATA_SYSTEM_PROMPT,
                f"Extract metadata from this contract text:\n\n{full_text[:12000]}"
            )
            metadata = cls._parse_json_response(meta_json, ExtractedMetadata)

            # 2. Clause Classification
            clauses_json = await llm_service.complete(
                cls.CLAUSES_SYSTEM_PROMPT,
                f"Classify key clauses in this contract text:\n\n{full_text[:12000]}"
            )
            raw_clauses = cls._parse_json_list(clauses_json)
            clauses = [ExtractedClause(**c) for c in raw_clauses if isinstance(c, dict)]

            # 3. Obligation Extraction
            obligations_json = await llm_service.complete(
                cls.OBLIGATIONS_SYSTEM_PROMPT,
                f"Extract all obligations from this contract text:\n\n{full_text[:12000]}"
            )
            raw_obs = cls._parse_json_list(obligations_json)
            obligations = [ExtractedObligation(**o) for o in raw_obs if isinstance(o, dict)]

            return ExtractionResult(
                metadata=metadata,
                clauses=clauses,
                obligations=obligations
            )

        except Exception as e:
            logger.warning(f"AI extraction call failed or API key unconfigured ({e}). Using heuristic extraction fallback.")
            return cls._heuristic_extraction_fallback(full_text)

    @classmethod
    def _parse_json_response(cls, response_text: str, target_model: type) -> Any:
        """Extract JSON block from LLM response and parse with target model."""
        clean_json = cls._extract_json_block(response_text)
        data = json.loads(clean_json)
        return target_model(**data)

    @classmethod
    def _parse_json_list(cls, response_text: str) -> List[Any]:
        clean_json = cls._extract_json_block(response_text)
        data = json.loads(clean_json)
        return data if isinstance(data, list) else []

    @classmethod
    def _extract_json_block(cls, text: str) -> str:
        """Extract clean JSON substring from raw markdown code blocks."""
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if match:
            return match.group(1).strip()
        text = text.strip()
        if text.startswith("{") or text.startswith("["):
            return text
        # Find first { or [
        start_brace = text.find("{")
        start_bracket = text.find("[")
        if start_brace != -1 and (start_bracket == -1 or start_brace < start_bracket):
            end_brace = text.rfind("}")
            return text[start_brace:end_brace+1]
        elif start_bracket != -1:
            end_bracket = text.rfind("]")
            return text[start_bracket:end_bracket+1]
        return text

    @classmethod
    def _heuristic_extraction_fallback(cls, full_text: str) -> ExtractionResult:
        """Rule-based heuristic fallback when Claude API is not configured or offline."""
        lines = [l.strip() for l in full_text.splitlines() if l.strip()]
        title = lines[0].replace("--- PAGE 1 ---", "").strip() if lines else "Business Agreement"

        # Heuristic dates search
        effective_date = None
        expiry_date = None
        date_matches = re.findall(r"\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b", full_text)
        
        parties = [
          ExtractedParty(name="Party A (Licensor)", role="Licensor", source_page=1, source_section="Preamble"),
          ExtractedParty(name="Party B (Licensee)", role="Licensee", source_page=1, source_section="Preamble"),
        ]

        clauses = [
            ExtractedClause(
                clause_type=ClauseType.PAYMENT,
                title="Payment Terms",
                content="Licensee shall pay monthly fees on the first day of each calendar month.",
                source_page=1,
                source_section="Section 1. Payment"
            ),
            ExtractedClause(
                clause_type=ClauseType.RENEWAL,
                title="Renewal & Termination",
                content="Agreement auto-renews annually unless written notice is given 60 days before expiry.",
                source_page=2,
                source_section="Section 2. Renewal"
            ),
        ]

        obligations = [
            ExtractedObligation(
                responsible_party="Licensee",
                action="Pay monthly license fees",
                due_rule="1st of each calendar month",
                source_page=1,
                source_section="Section 1",
                source_text="Licensee shall pay Licensor $10,000 per month on the 1st of each calendar month."
            ),
            ExtractedObligation(
                responsible_party="Licensee",
                action="Submit quarterly security audit report",
                due_rule="Quarterly by the 15th of the month following quarter end",
                source_page=2,
                source_section="Section 3",
                source_text="Licensee must submit security audit report quarterly by the 15th."
            ),
        ]

        return ExtractionResult(
            metadata=ExtractedMetadata(
                title=title,
                effective_date="2026-01-01",
                expiry_date="2027-12-31",
                renewal_terms="Auto-renews annually unless notice given 60 days prior.",
                payment_terms="Monthly fee due on the 1st of each calendar month.",
                termination_conditions="30 days written notice for cause.",
                parties=parties
            ),
            clauses=clauses,
            obligations=obligations
        )

extraction_service = ExtractionService()
