"""
test_e2e_full_pipeline.py
-------------------------
Phase 11 End-to-End Integration Test Suite.
Tests the full system lifecycle:
  PDF creation -> Upload -> AI extraction & persistence -> Vector chunking & embedding ->
  REST endpoints -> RAG Q&A with citations -> Status updates -> Cleanup.

Run while backend server is running on port 8001:
    .\\venv\\Scripts\\python test_e2e_full_pipeline.py
"""

import sys
import json
import uuid
import urllib.request

BASE_URL = "http://127.0.0.1:8001"


def make_request(url, method="GET", data=None):
    headers = {"Content-Type": "application/json"}
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        if resp.status == 204:
            return None
        return json.loads(resp.read().decode("utf-8"))


def test_e2e():
    print("==========================================================")
    print("   ContractLens Phase 11 — End-to-End Full Pipeline Test")
    print("==========================================================\n")

    # 1. Health Check
    health = make_request(f"{BASE_URL}/health")
    assert health["status"] == "healthy", "Backend health check failed"
    print("[PASS] Step 1: Health check passed -> 200 OK")

    # 2. Upload Contract PDF via multipart binary
    pdf_path = "test_files/rich_contract.pdf"
    with open(pdf_path, "rb") as f:
        file_bytes = f.read()

    boundary = f"----FormBoundary{uuid.uuid4().hex[:12]}"
    header = f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"e2e_contract.pdf\"\r\nContent-Type: application/pdf\r\n\r\n"
    footer = f"\r\n--{boundary}--\r\n"

    body_bytes = header.encode("utf-8") + file_bytes + footer.encode("utf-8")

    req = urllib.request.Request(
        f"{BASE_URL}/api/contracts/upload",
        data=body_bytes,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST"
    )

    with urllib.request.urlopen(req) as resp:
        contract_res = json.loads(resp.read().decode("utf-8"))

    contract_id = contract_res["id"]
    assert contract_res["status"] == "READY", f"Expected status READY, got {contract_res['status']}"
    print(f"[PASS] Step 2: PDF Upload & AI extraction -> Contract ID: {contract_id} (Status: READY)")

    # 3. Fetch Contract Detail
    detail = make_request(f"{BASE_URL}/api/contracts/{contract_id}")
    assert detail["id"] == contract_id
    assert len(detail["clauses"]) > 0, "No clauses in contract detail"
    assert len(detail["obligations"]) > 0, "No obligations in contract detail"
    assert len(detail["deadlines"]) > 0, "No deadlines in contract detail"
    print(f"[PASS] Step 3: Contract Detail retrieved ({len(detail['clauses'])} clauses, {len(detail['obligations'])} obligations, {len(detail['deadlines'])} deadlines)")

    # 4. Clauses API
    clauses = make_request(f"{BASE_URL}/api/contracts/{contract_id}/clauses")
    assert len(clauses) > 0, "No clauses retrieved"
    print(f"[PASS] Step 4: Clauses API -> Retrieved {len(clauses)} clauses")

    # 5. Obligations API & Status Patch
    obligations = make_request(f"{BASE_URL}/api/contracts/{contract_id}/obligations")
    assert len(obligations) > 0, "No obligations retrieved"
    ob_id = obligations[0]["id"]
    patched_ob = make_request(f"{BASE_URL}/api/obligations/{ob_id}", method="PATCH", data={"status": "COMPLETED"})
    assert patched_ob["status"] == "COMPLETED"
    print(f"[PASS] Step 5: Obligations API & Status Patch -> Updated status to COMPLETED")

    # 6. Deadlines & Timeline API
    deadlines = make_request(f"{BASE_URL}/api/contracts/{contract_id}/deadlines")
    global_deadlines = make_request(f"{BASE_URL}/api/deadlines?days_ahead=600")
    assert len(deadlines) > 0, "No contract deadlines"
    print(f"[PASS] Step 6: Deadlines & Global Timeline API -> {len(deadlines)} contract deadlines, {len(global_deadlines)} global deadlines")

    # 7. Reminders API & Acknowledge
    reminders = make_request(f"{BASE_URL}/api/reminders")
    if reminders:
        rem_id = reminders[0]["id"]
        make_request(f"{BASE_URL}/api/reminders/{rem_id}/acknowledge", method="PATCH")
        print(f"[PASS] Step 7: Reminders API & Acknowledge -> Acknowledged reminder {rem_id[:8]}")
    else:
        print("[PASS] Step 7: Reminders API -> No unacknowledged reminders")

    # 8. Grounded RAG Chat Engine
    chat_payload = {"content": "What is the monthly license fee and penalty?"}
    chat_res = make_request(f"{BASE_URL}/api/contracts/{contract_id}/chat", method="POST", data=chat_payload)
    assert chat_res["role"] == "ASSISTANT", "Expected ASSISTANT role"
    assert "citations" in chat_res, "Citations missing from RAG response"
    print(f"[PASS] Step 8: Grounded RAG Chat Engine -> Answer generated with {len(chat_res['citations'])} evidence citations")

    # 9. Clean up test contract
    make_request(f"{BASE_URL}/api/contracts/{contract_id}", method="DELETE")
    print(f"[PASS] Step 9: Contract Deletion -> Successfully deleted test contract {contract_id[:8]}")

    print("\n==========================================================")
    print("   [SUCCESS] FULL E2E INTEGRATION PIPELINE PASSED 100%!")
    print("==========================================================\n")


if __name__ == "__main__":
    test_e2e()
