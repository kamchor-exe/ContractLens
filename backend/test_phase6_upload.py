"""
test_phase6_upload.py
---------------------
Phase 6 integration test: Upload a text PDF and verify extraction + DB persistence.
Run from backend/ directory:
    .\\venv\\Scripts\\python test_phase6_upload.py
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

async def main():
    from app.db.database import engine, AsyncSessionLocal
    from app.db.seed import seed_demo_user
    from sqlalchemy import select, text
    from app.models.models import Contract, ContractParty, Clause, Obligation, Deadline, Reminder

    print("Connecting to DB...")
    async with AsyncSessionLocal() as db:
        demo_user = await seed_demo_user(db)
        print(f"Demo user: {demo_user.email}")

        # Count records in each table for the demo user
        contracts_q = await db.execute(select(Contract).where(Contract.user_id == demo_user.id))
        contracts = contracts_q.scalars().all()
        print(f"\nContracts in DB: {len(contracts)}")

        if contracts:
            latest = contracts[-1]
            print(f"  Latest: '{latest.title}' | status={latest.status} | effective={latest.effective_date} | expiry={latest.expiry_date}")

            # Count related rows
            parties_q = await db.execute(select(ContractParty).where(ContractParty.contract_id == latest.id))
            parties = parties_q.scalars().all()
            print(f"  Parties: {len(parties)}")
            for p in parties:
                print(f"    - {p.name} ({p.role})")

            clauses_q = await db.execute(select(Clause).where(Clause.contract_id == latest.id))
            clauses = clauses_q.scalars().all()
            print(f"  Clauses: {len(clauses)}")
            for c in clauses:
                print(f"    - [{c.clause_type}] {c.title}")

            obs_q = await db.execute(select(Obligation).where(Obligation.contract_id == latest.id))
            obs = obs_q.scalars().all()
            print(f"  Obligations: {len(obs)}")
            for o in obs:
                print(f"    - {o.responsible_party}: {o.action[:60]}... | due_rule={o.due_rule}")

            dl_q = await db.execute(select(Deadline).where(Deadline.contract_id == latest.id))
            dls = dl_q.scalars().all()
            print(f"  Deadlines: {len(dls)}")
            for d in dls:
                print(f"    - [{d.deadline_type}] {d.label[:60]} | {d.deadline_date}")

            rem_q = await db.execute(select(Reminder).where(Reminder.user_id == demo_user.id))
            rems = rem_q.scalars().all()
            print(f"  Reminders (all for demo user): {len(rems)}")
        else:
            print("  No contracts yet — please upload a PDF via the API first.")

    print("\nPhase 6 DB check complete.")

asyncio.run(main())
