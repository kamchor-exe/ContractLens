import os
import pymupdf  # PyMuPDF
import httpx
from app.services.pdf_service import pdf_service

def create_sample_text_pdf(filename: str) -> str:
    """Create a sample PDF contract with extractable text."""
    doc = pymupdf.open()
    
    # Page 1
    page1 = doc.new_page()
    page1.insert_text(
        (50, 50),
        "MASTER SERVICES AGREEMENT\n\n"
        "This Master Services Agreement ('Agreement') is made effective as of January 1, 2026, "
        "by and between Acme Corp ('Licensor') and Beta LLC ('Licensee').\n\n"
        "Section 1. Payment Terms\n"
        "Licensee shall pay Licensor $10,000 per month on the 1st of each calendar month. "
        "Late payments shall incur a fee of 1.5% per month."
    )

    # Page 2
    page2 = doc.new_page()
    page2.insert_text(
        (50, 50),
        "Section 2. Renewal & Termination\n"
        "This Agreement auto-renews annually unless written notice is given at least 60 days before expiry.\n\n"
        "Section 3. Obligations\n"
        "Licensee must submit security audit report quarterly by the 15th of the month following quarter end."
    )

    doc.save(filename)
    doc.close()
    return filename

def create_scanned_image_pdf(filename: str) -> str:
    """Create a PDF with 0 text layer (blank/image page)."""
    doc = pymupdf.open()
    page = doc.new_page()
    # Draw a rectangle line instead of text
    page.draw_rect(pymupdf.Rect(50, 50, 200, 200), color=(0, 0, 0), fill=(0.9, 0.9, 0.9))
    doc.save(filename)
    doc.close()
    return filename

def test_pdf_extraction():
    os.makedirs("test_files", exist_ok=True)
    text_pdf = create_sample_text_pdf("test_files/sample_contract.pdf")
    scanned_pdf = create_scanned_image_pdf("test_files/scanned_contract.pdf")

    print("--- Testing Text PDF Extraction ---")
    res1 = pdf_service.extract_text_from_pdf(text_pdf)
    print(f"Is Valid: {res1.is_valid_text_pdf}")
    print(f"Page Count: {res1.page_count}")
    print(f"Total Chars: {res1.total_char_count}")
    assert res1.is_valid_text_pdf is True
    assert res1.page_count == 2
    assert "MASTER SERVICES AGREEMENT" in res1.full_text

    print("\n--- Testing Scanned Image-only PDF Extraction ---")
    res2 = pdf_service.extract_text_from_pdf(scanned_pdf)
    print(f"Is Valid: {res2.is_valid_text_pdf}")
    print(f"Page Count: {res2.page_count}")
    print(f"Total Chars: {res2.total_char_count}")
    print(f"Error Message: {res2.error_message}")
    assert res2.is_valid_text_pdf is False
    assert res2.error_message is not None

    print("\n--- Testing HTTP Upload Endpoint ---")
    url = "http://127.0.0.1:8000/api/contracts/upload"
    
    # 1. Upload valid text PDF
    with open(text_pdf, "rb") as f:
        resp1 = httpx.post(url, files={"file": ("sample_contract.pdf", f, "application/pdf")})
    print(f"Upload Text PDF Response Code: {resp1.status_code}")
    data1 = resp1.json()
    print(f"Upload Status: {data1.get('status')}")
    print(f"Page Count: {data1.get('page_count')}")
    assert resp1.status_code == 201
    assert data1["status"] == "READY"
    assert data1["page_count"] == 2

    # 2. Upload scanned PDF -> should be flagged as UNSUPPORTED
    with open(scanned_pdf, "rb") as f:
        resp2 = httpx.post(url, files={"file": ("scanned_contract.pdf", f, "application/pdf")})
    print(f"\nUpload Scanned PDF Response Code: {resp2.status_code}")
    data2 = resp2.json()
    print(f"Upload Status: {data2.get('status')}")
    assert resp2.status_code == 201
    assert data2["status"] == "UNSUPPORTED"

    print("\nALL PDF EXTRACTION AND API UPLOAD TESTS PASSED CLEANLY!")

if __name__ == "__main__":
    test_pdf_extraction()
