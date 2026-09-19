import asyncio
from app.services.extraction_service import extraction_service

SAMPLE_CONTRACT_TEXT = """
--- PAGE 1 ---
CLOUD SERVICES AGREEMENT

This Cloud Services Agreement ("Agreement") is entered into as of January 1, 2026 by and between 
Alpha Cloud Systems Inc. ("Provider") and Omega Retail Solutions LLC ("Customer").

Section 1. Payment Terms
Customer shall pay Provider $8,500 on the 1st of each calendar month. Late payments shall incur 1.5% interest per month.

Section 2. Confidentiality
Each party agrees to hold the other's Confidential Information in strict confidence and not to disclose it to any third party.

--- PAGE 2 ---
Section 3. Renewal and Termination
This Agreement auto-renews for 12-month terms unless either party gives written notice of non-renewal at least 45 days before expiry.

Section 4. Security & Audit Obligations
Customer shall submit an annual ISO 27001 compliance audit report to Provider within 30 days of each calendar year end.
"""

async def test_extraction():
    print("--- Testing Phase 5 Structured AI Extraction ---")
    result = await extraction_service.extract_all(SAMPLE_CONTRACT_TEXT)

    print(f"Title: {result.metadata.title}")
    print(f"Effective Date: {result.metadata.effective_date}")
    print(f"Expiry Date: {result.metadata.expiry_date}")
    print(f"Parties Extracted: {len(result.metadata.parties)}")
    for p in result.metadata.parties:
        print(f"  - {p.name} ({p.role}) [p.{p.source_page}]")

    print(f"\nClauses Classified: {len(result.clauses)}")
    for c in result.clauses:
        print(f"  - [{c.clause_type}] {c.title} (p.{c.source_page})")

    print(f"\nObligations Extracted: {len(result.obligations)}")
    for o in result.obligations:
        print(f"  - {o.responsible_party}: {o.action} [{o.due_rule}]")

    assert result.metadata.title is not None
    assert len(result.clauses) > 0
    assert len(result.obligations) > 0

    print("\nALL PHASE 5 STRUCTURED EXTRACTION TESTS PASSED!")

if __name__ == "__main__":
    asyncio.run(test_extraction())
