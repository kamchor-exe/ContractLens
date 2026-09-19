"""
test_phase7_api.py
-------------------
Integration test for Phase 7 REST API endpoints (clauses, obligations, deadlines, reminders).
Run while backend server is running on port 8001:
    .\\venv\\Scripts\\python test_phase7_api.py
"""

import sys
import json
import urllib.request

BASE_URL = "http://127.0.0.1:8001/api"


def make_request(url, method="GET", data=None):
    headers = {"Content-Type": "application/json"}
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))


def test_phase7():
    print("Testing Phase 7 REST API endpoints...")

    # 1. Get Contracts
    contracts = make_request(f"{BASE_URL}/contracts")
    assert len(contracts) > 0, "No contracts found!"
    contract_id = contracts[0]["id"]
    print(f"[OK] GET /api/contracts -- Found {len(contracts)} contracts. Testing with ID: {contract_id}")

    # 2. Get Clauses
    clauses = make_request(f"{BASE_URL}/contracts/{contract_id}/clauses")
    print(f"[OK] GET /api/contracts/{{id}}/clauses -- Found {len(clauses)} clauses")

    # 3. Get Obligations
    obligations = make_request(f"{BASE_URL}/contracts/{contract_id}/obligations")
    print(f"[OK] GET /api/contracts/{{id}}/obligations -- Found {len(obligations)} obligations")

    # 4. Patch Obligation Status
    if obligations:
        ob_id = obligations[0]["id"]
        updated_ob = make_request(f"{BASE_URL}/obligations/{ob_id}", method="PATCH", data={"status": "COMPLETED"})
        assert updated_ob["status"] == "COMPLETED", "Obligation status update failed"
        print(f"[OK] PATCH /api/obligations/{{id}} -- Status successfully updated to COMPLETED")

    # 5. Get Contract Deadlines & Timeline
    deadlines = make_request(f"{BASE_URL}/contracts/{contract_id}/deadlines")
    timeline = make_request(f"{BASE_URL}/contracts/{contract_id}/timeline")
    assert len(deadlines) == len(timeline), "Deadlines and timeline lengths mismatch"
    print(f"[OK] GET /api/contracts/{{id}}/deadlines & timeline -- Found {len(deadlines)} deadlines")

    # 6. Get Global Upcoming Deadlines
    global_deadlines = make_request(f"{BASE_URL}/deadlines?days_ahead=600")
    print(f"[OK] GET /api/deadlines?days_ahead=600 -- Found {len(global_deadlines)} upcoming deadlines")

    # 7. Get Reminders & Acknowledge
    reminders = make_request(f"{BASE_URL}/reminders")
    print(f"[OK] GET /api/reminders -- Found {len(reminders)} unacknowledged reminders")
    if reminders:
        rem_id = reminders[0]["id"]
        ack_res = make_request(f"{BASE_URL}/reminders/{rem_id}/acknowledge", method="PATCH")
        assert ack_res["message"] == "Reminder acknowledged"
        print(f"[OK] PATCH /api/reminders/{{id}}/acknowledge -- Successfully acknowledged reminder")

    print("\n--- ALL PHASE 7 REST API TESTS PASSED! ---")


if __name__ == "__main__":
    test_phase7()
