"""
test_phase9_rag.py
-------------------
Phase 9 integration test for Grounded RAG Chat Engine with Citations.
Run while backend is running on port 8001:
    .\\venv\\Scripts\\python test_phase9_rag.py
"""

import json
import urllib.request

BASE_URL = "http://127.0.0.1:8001/api"


def make_request(url, method="GET", data=None):
    headers = {"Content-Type": "application/json"}
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))


def test_phase9():
    print("Testing Phase 9 Grounded RAG Chat Engine...")

    # 1. Get contracts
    contracts = make_request(f"{BASE_URL}/contracts")
    assert len(contracts) > 0, "No contracts found!"
    contract_id = contracts[0]["id"]
    print(f"[OK] Found contract for RAG test: {contract_id}")

    # 2. Ask question via POST /api/contracts/{id}/chat
    question_payload = {"content": "What are the payment terms and due dates?"}
    response = make_request(f"{BASE_URL}/contracts/{contract_id}/chat", method="POST", data=question_payload)

    assert response["role"] == "ASSISTANT", f"Expected ASSISTANT role, got {response['role']}"
    assert len(response["content"]) > 0, "Empty response content"
    assert "citations" in response, "Response missing citations field"

    citations = response["citations"]
    print(f"[OK] Received RAG Answer from backend:")
    print(f"     Content snippet: '{response['content'][:120]}...'")
    print(f"[OK] Attached Citations Count: {len(citations)}")

    if citations:
        c0 = citations[0]
        print(f"     Citation 0: Page {c0['source_page']} | Section '{c0['source_section']}'")
        print(f"     Snippet: '{c0['snippet'][:80]}...'")

        # 3. Test GET /api/contracts/{contract_id}/chunks/{chunk_id}
        chunk_id = c0["chunk_id"]
        chunk_detail = make_request(f"{BASE_URL}/contracts/{contract_id}/chunks/{chunk_id}")
        assert chunk_detail["id"] == chunk_id, "Chunk ID mismatch"
        print(f"[OK] GET /api/contracts/{{id}}/chunks/{{chunk_id}} verified: Chunk Page {chunk_detail['source_page']}")

    # 4. Check chat history GET /api/contracts/{contract_id}/chat
    history = make_request(f"{BASE_URL}/contracts/{contract_id}/chat")
    assert len(history) >= 2, "Expected at least 2 chat messages (USER + ASSISTANT)"
    print(f"[OK] GET /api/contracts/{{id}}/chat — History length: {len(history)} messages")

    print("\n--- ALL PHASE 9 RAG CHAT TESTS PASSED! ---")


if __name__ == "__main__":
    test_phase9()
