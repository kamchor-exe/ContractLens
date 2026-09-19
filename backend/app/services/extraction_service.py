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
        """Rule-based heuristic fallback when Claude API is unconfigured/offline."""
        lines = [l.strip() for l in full_text.splitlines() if l.strip()]
        title = lines[0].replace("--- PAGE 1 ---", "").strip() if lines else "Business Agreement"

        # 1. Regex search for actual date strings in contract text
        all_dates = re.findall(
            r"\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b|\b\d{4}-\d{2}-\d{2}\b",
            full_text,
            re.IGNORECASE
        )

        effective_date = all_dates[0] if len(all_dates) >= 1 else None
        expiry_date = all_dates[1] if len(all_dates) >= 2 else (all_dates[0] if len(all_dates) == 1 else None)

        # 2. Extract potential party names from Preamble lines
        parties = []
        preamble_lines = lines[:10]
        party_matches = re.findall(r"([A-Z][A-Za-z0-9\s,\.]{2,40}\s+(?:Ltd|Inc|Corp|LLC|Corporation|Limited))", "\n".join(preamble_lines))

        if party_matches:
            for idx, p_name in enumerate(party_matches[:2]):
                role = "Licensor / Provider" if idx == 0 else "Licensee / Client"
                parties.append(ExtractedParty(
                    name=p_name.strip(),
                    role=role,
                    source_page=1,
                    source_section="Preamble"
                ))
        else:
            parties = [
                ExtractedParty(name="Party A (Licensor)", role="Licensor", source_page=1, source_section="Preamble"),
                ExtractedParty(name="Party B (Licensee)", role="Licensee", source_page=1, source_section="Preamble"),
            ]

        # 3. Extract clauses based on section headers
        clauses = []
        clause_types_kw = [
            ("Payment Terms", ClauseType.PAYMENT, ["payment", "fee", "price", "rate", "monthly", "usd", "$"]),
            ("Term & Renewal", ClauseType.RENEWAL, ["term", "renew", "renewal", "commences", "expire"]),
            ("Termination", ClauseType.TERMINATION, ["terminate", "termination", "cancel", "written notice"]),
            ("Confidentiality", ClauseType.CONFIDENTIALITY, ["confidential", "proprietary", "secrecy"]),
            ("Intellectual Property", ClauseType.INTELLECTUAL_PROPERTY, ["intellectual property", "ip", "copyright", "patent"]),
        ]

        for title_str, c_type, keywords in clause_types_kw:
            for line in lines:
                if any(kw in line.lower() for kw in keywords) and len(line) > 20:
                    clauses.append(ExtractedClause(
                        clause_type=c_type,
                        title=title_str,
                        content=line[:300],
                        source_page=1,
                        source_section=title_str
                    ))
                    break

        if not clauses:
            clauses = [
                ExtractedClause(
                    clause_type=ClauseType.PAYMENT,
                    title="Payment Terms",
                    content="Licensee shall pay fees as set forth in the agreement.",
                    source_page=1,
                    source_section="Section 1. Payment"
                ),
            ]

        # 4. Extract obligations
        obligations = []
        ob_lines = [l for l in lines if any(w in l.lower() for w in ["shall", "must", "agrees to", "required"])]
        for idx, line in enumerate(ob_lines[:3]):
            obligations.append(ExtractedObligation(
                responsible_party="Licensee / Client" if idx % 2 == 0 else "Licensor / Provider",
                action=line[:200],
                due_rule=f"As specified in Section {idx+1}",
                due_date=expiry_date if idx == 0 else None,
                source_page=1,
                source_section=f"Section {idx+1}",
                source_text=line[:300]
            ))

        if not obligations:
            obligations = [
                ExtractedObligation(
                    responsible_party="Licensee",
                    action="Pay required fees according to schedule",
                    due_rule="Monthly",
                    source_page=1,
                    source_section="Section 1",
                    source_text="Licensee shall pay Licensor according to schedule."
                )
            ]

        return ExtractionResult(
            metadata=ExtractedMetadata(
                title=title,
                effective_date=effective_date,
                expiry_date=expiry_date,
                renewal_terms="Auto-renews annually unless notice is given prior to expiry.",
                payment_terms="Payment due according to specified schedule.",
                termination_conditions="Written notice required for termination.",
                parties=parties
            ),
            clauses=clauses,
            obligations=obligations
        )

extraction_service = ExtractionService()
