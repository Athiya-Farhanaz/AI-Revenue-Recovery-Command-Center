from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import json
import os

from .database import engine, Base, get_db
from .models import Case, Intervention, AuditLog
from .schemas import (
    CaseBase, CaseDetailResponse, SimulationInjectRequest,
    CaseOverrideRequest, DashboardMetrics, AuditLogBase
)
from .agent.simulator import generate_random_cases, run_simulation_tick, sim_clock
from .agent.engine import record_recovery, record_promise_to_pay

# Load .env file manually if it exists
for env_path in [".env", os.path.join("..", ".env")]:
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if "=" in line and not line.startswith("#"):
                        k, v = line.split("=", 1)
                        os.environ[k.strip()] = v.strip()
        except Exception as e:
            print(f"Error loading .env file: {e}")

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Revenue Recovery System API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def seed_demo_cases(db: Session):
    """
    Seeds three representative cases to demonstrate key scenarios:
    1. Aarav Mehta: Full WhatsApp Hinglish recovery.
    2. Acme Corp Finance: B2B dunning, promise-to-pay registration, and recovery.
    3. Vijay Mallya: Suspected fraud, immediate halt (graceful hard failure).
    """
    # Check if demo cases are already present
    exists = db.query(Case).filter(Case.id.in_(["case_demo_whatsapp", "case_demo_b2b", "case_demo_fraud"])).first()
    if exists:
        return

    now = sim_clock.get_time()

    # 1. Aarav Mehta (WhatsApp recovery)
    case_a = Case(
        id="case_demo_whatsapp",
        customer_name="Aarav Mehta",
        customer_email="aarav.mehta@example.com",
        customer_phone="+919876543210",
        type="payment",
        amount=2499.00,
        status="recovered",
        failure_code="incorrect_pin",
        failure_reason="Auth failed: Customer entered incorrect UPI/ATM PIN.",
        risk_score=0.25,
        current_escalation_level=1,
        recovery_channel="whatsapp",
        created_at=now - timedelta(minutes=10),
        updated_at=now - timedelta(minutes=9, seconds=50),
        recovered_at=now - timedelta(minutes=9, seconds=50)
    )
    db.add(case_a)

    interv_a = Intervention(
        case_id="case_demo_whatsapp",
        type="whatsapp",
        status="sent",
        details="WhatsApp: Hey Aarav! 👋 Aapka payment of ₹2,499 fail ho gaya incorrect PIN ki wajah se. Don't worry, aap is 1-click link se secure pay kar sakte hain: https://rzp.io/l/recov_xyz. Let's get it resolved!",
        cost=0.50,
        created_at=now - timedelta(minutes=9, seconds=58)
    )
    db.add(interv_a)

    audit_a1 = AuditLog(
        case_id="case_demo_whatsapp",
        action="INGESTED",
        message="Case ingested. AI diagnosed root cause: 'Auth failed: Customer entered incorrect UPI/ATM PIN.'. Assigned playbook: 'whatsapp_hinglish_recovery'.",
        agent_reasoning="AI Reasoning: Risk score 0.25 based on failure code 'incorrect_pin'. Selected recovery playbook 'whatsapp_hinglish_recovery' with initial delay of 2s.",
        created_at=now - timedelta(minutes=10)
    )
    audit_a2 = AuditLog(
        case_id="case_demo_whatsapp",
        action="INTERVENTION_SENT",
        message="Sent intervention 1/3: WHATSAPP notification.",
        agent_reasoning="AI Reasoning: Playbook 'whatsapp_hinglish_recovery' Level 0. Sending intervention of type 'whatsapp' at cost ₹0.50. Escalation progress: 1/3.",
        created_at=now - timedelta(minutes=9, seconds=58)
    )
    audit_a3 = AuditLog(
        case_id="case_demo_whatsapp",
        action="RECOVERED",
        message="Revenue recovered! Channel: WHATSAPP. Completed payment via link.",
        agent_reasoning="AI Reasoning: Payment successfully confirmed. Recovery workflow marked as success. Clean up scheduled actions.",
        created_at=now - timedelta(minutes=9, seconds=50)
    )
    db.add(audit_a1)
    db.add(audit_a2)
    db.add(audit_a3)

    # 2. Acme Corp Finance (B2B Escalation & Recovery)
    case_b = Case(
        id="case_demo_b2b",
        customer_name="Acme Corp Finance",
        customer_email="billing@acmecorp.com",
        customer_phone="+919988776655",
        type="invoice",
        amount=125000.00,
        status="recovered",
        failure_code="payment_overdue",
        failure_reason="B2B Net terms invoice has passed the scheduled payment date.",
        risk_score=0.70,
        current_escalation_level=2,
        recovery_channel="email",
        created_at=now - timedelta(days=4),
        updated_at=now - timedelta(hours=2),
        recovered_at=now - timedelta(hours=2),
        promise_pay_date=now - timedelta(days=1)
    )
    db.add(case_b)

    interv_b1 = Intervention(
        case_id="case_demo_b2b",
        type="email",
        status="sent",
        details="Email (Polite Reminder): Dear Accounts Team at Acme Corp Finance,\n\nThis is a gentle reminder that outstanding invoice for ₹125,000 is past its due date. Please process this at your earliest convenience.\n\nWarm regards,\nFinance Team",
        cost=0.05,
        created_at=now - timedelta(days=3, hours=23)
    )
    interv_b2 = Intervention(
        case_id="case_demo_b2b",
        type="email",
        status="sent",
        details="Email (Firm Follow-up): Dear Accounts Team,\n\nOur records indicate that the invoice for ₹125,000 remains outstanding. We request you to please settle the invoice immediately to prevent any subscription lag.\n\nBest regards,\nAccounts Receivable Department",
        cost=0.05,
        created_at=now - timedelta(hours=3)
    )
    db.add(interv_b1)
    db.add(interv_b2)

    audit_b1 = AuditLog(
        case_id="case_demo_b2b",
        action="INGESTED",
        message="Case ingested. AI diagnosed root cause: 'B2B Net terms invoice has passed the scheduled payment date.'. Assigned playbook: 'b2b_receivables_chaser'.",
        agent_reasoning="AI Reasoning: Risk score 0.70 based on failure code 'payment_overdue'. Selected recovery playbook 'b2b_receivables_chaser' with initial delay of 1s.",
        created_at=now - timedelta(days=4)
    )
    audit_b2 = AuditLog(
        case_id="case_demo_b2b",
        action="INTERVENTION_SENT",
        message="Sent intervention 1/3: EMAIL notification.",
        agent_reasoning="AI Reasoning: Playbook 'b2b_receivables_chaser' Level 0. Sending intervention of type 'email' at cost ₹0.05. Escalation progress: 1/3.",
        created_at=now - timedelta(days=3, hours=23)
    )
    audit_b3 = AuditLog(
        case_id="case_demo_b2b",
        action="PROMISE_RECEIVED",
        message=f"Customer registered a Promise-to-Pay for {(now - timedelta(days=1)).strftime('%Y-%m-%d %H:%M')}.",
        agent_reasoning="AI Reasoning: Customer responded with intent to pay later. Paused email/SMS chaser until promise date expires to maintain customer trust.",
        created_at=now - timedelta(days=3)
    )
    audit_b4 = AuditLog(
        case_id="case_demo_b2b",
        action="CHECK_STOPPING_RULES",
        message="Intervention deferred. Active Promise-to-Pay set.",
        agent_reasoning="AI Reasoning: Customer has active promise to pay. Escalation paused until promise date passes.",
        created_at=now - timedelta(days=2)
    )
    audit_b5 = AuditLog(
        case_id="case_demo_b2b",
        action="INTERVENTION_SENT",
        message="Sent intervention 2/3: EMAIL notification.",
        agent_reasoning="AI Reasoning: Playbook 'b2b_receivables_chaser' Level 1. Sending intervention of type 'email' at cost ₹0.05. Escalation progress: 2/3.",
        created_at=now - timedelta(hours=3)
    )
    audit_b6 = AuditLog(
        case_id="case_demo_b2b",
        action="RECOVERED",
        message="Revenue recovered! Channel: EMAIL. Completed payment via invoice portal link.",
        agent_reasoning="AI Reasoning: Payment successfully confirmed. Recovery workflow marked as success. Clean up scheduled actions.",
        created_at=now - timedelta(hours=2)
    )
    db.add(audit_b1)
    db.add(audit_b2)
    db.add(audit_b3)
    db.add(audit_b4)
    db.add(audit_b5)
    db.add(audit_b6)

    # 3. Vijay Mallya (Suspected Fraud hard halt)
    case_c = Case(
        id="case_demo_fraud",
        customer_name="Vijay Mallya",
        customer_email="mallya@kingfisher.com",
        customer_phone="+919777777777",
        type="payment",
        amount=450000.00,
        status="failed",
        failure_code="suspected_fraud",
        failure_reason="Gateway risk alert: High probability of unauthorized card usage.",
        risk_score=0.95,
        current_escalation_level=0,
        created_at=now - timedelta(minutes=5),
        updated_at=now - timedelta(minutes=5)
    )
    db.add(case_c)

    audit_c1 = AuditLog(
        case_id="case_demo_fraud",
        action="INGESTED",
        message="Case ingested. AI diagnosed root cause: 'Gateway risk alert: High probability of unauthorized card usage.'. Assigned playbook: 'hard_decline_halt'. Halted execution immediately due to compliance & fraud risk.",
        agent_reasoning="AI Reasoning: Risk score 0.95 based on failure code 'suspected_fraud'. Selected recovery playbook 'hard_decline_halt' with initial delay of 0s. Reason: High-risk code cannot be retried automatically.",
        created_at=now - timedelta(minutes=5)
    )
    audit_c2 = AuditLog(
        case_id="case_demo_fraud",
        action="FAILED",
        message="Recovery playbook halted due to compliance and security rules. Outreach cancelled.",
        agent_reasoning="AI Reasoning: Suspected fraudulent transaction details flag. Halted automated communication to avoid chargebacks and merchant penalties.",
        created_at=now - timedelta(minutes=5)
    )
    db.add(audit_c1)
    db.add(audit_c2)

    db.commit()

@app.on_event("startup")
def startup_event():
    db = next(get_db())
    seed_demo_cases(db)

def calculate_financial_metrics(cases: list, interventions: list):
    total_at_risk = sum(c.amount for c in cases)
    
    # 1. Net revenue recovered (Recovered amount minus discount offered)
    total_recovered = 0.0
    for c in cases:
        if c.status == "recovered":
            total_recovered += (c.amount - c.discount_offered)

    # 2. Dynamic outreach costs: WhatsApp (₹2.00), SMS (₹0.25), Email (₹0.10), retry attempt (₹5.00)
    direct_messaging_cost = 0.0
    for i in interventions:
        if i.type == "whatsapp" or i.type == "discount":
            direct_messaging_cost += 2.00
        elif i.type == "sms":
            direct_messaging_cost += 0.25
        elif i.type == "email":
            direct_messaging_cost += 0.10
        elif i.type == "retry":
            direct_messaging_cost += 5.00
        else:
            direct_messaging_cost += i.cost

    # 3. AI Platform processing token fee (₹15 per failure case ingested)
    ai_processing_fee = len(cases) * 15.00

    # 4. Coupon/discount marketing cost (sum of discount offered on successfully recovered cases)
    discount_coupons_cost = sum(c.discount_offered for c in cases if c.status == "recovered")

    # 5. Gateway MDR (Merchant Discount Rate) transaction fee (2.0% of recovered amount)
    gateway_mdr_fee = total_recovered * 0.02

    # Grounded Total Cost of Recovery
    total_cost = direct_messaging_cost + ai_processing_fee + discount_coupons_cost + gateway_mdr_fee

    # Net ROI Ratio = (Net Recovered - Total Cost) / Total Cost
    net_roi = ((total_recovered - total_cost) / total_cost) if total_cost > 0 else 0.0

    return {
        "total_at_risk": total_at_risk,
        "total_recovered": total_recovered,
        "total_cost": total_cost,
        "net_roi": net_roi,
        "recovery_rate": (total_recovered / total_at_risk * 100) if total_at_risk > 0 else 0.0,
        "cost_breakdown": {
            "direct_messaging_cost": round(direct_messaging_cost, 2),
            "ai_processing_fee": round(ai_processing_fee, 2),
            "discount_coupons_cost": round(discount_coupons_cost, 2),
            "gateway_mdr_fee": round(gateway_mdr_fee, 2),
            "total_cost": round(total_cost, 2)
        }
    }

@app.post("/api/simulation/inject")
def inject_batch(req: SimulationInjectRequest, db: Session = Depends(get_db)):
    if req.batch_type not in ["payment", "subscription", "checkout", "invoice", "mixed"]:
        raise HTTPException(status_code=400, detail="Invalid batch type")
    
    count_created = generate_random_cases(db, req.batch_type, req.count)
    return {
        "status": "success",
        "message": f"Successfully injected {count_created} {req.batch_type} cases.",
        "count": count_created
    }

@app.post("/api/simulation/tick")
def simulate_tick(seconds: int = Query(5, description="Seconds of simulated time to advance"), db: Session = Depends(get_db)):
    run_simulation_tick(db, seconds_to_advance=seconds)
    current_time = sim_clock.get_time()
    return {
        "status": "success",
        "current_simulated_time": current_time.isoformat(),
        "seconds_advanced": seconds
    }

@app.post("/api/simulation/stream_step")
def stream_step(
    seconds: int = Query(5, description="Seconds of simulated time to advance"),
    auto_spawn: bool = Query(True, description="Whether to occasionally spawn live webhook failures"),
    spawn_rate: float = Query(0.35, description="Probability of spawning a new failure event"),
    db: Session = Depends(get_db)
):
    import random
    new_case_summary = None
    
    # 1. Optionally spawn a realistic webhook failure
    if auto_spawn and random.random() < spawn_rate:
        pending_count = db.query(Case).filter(Case.status == "pending").count()
        if pending_count < 40:
            generate_random_cases(db, "mixed", 1)
            latest_case = db.query(Case).order_by(Case.created_at.desc()).first()
            if latest_case:
                new_case_summary = {
                    "id": latest_case.id,
                    "customer_name": latest_case.customer_name,
                    "amount": latest_case.amount,
                    "type": latest_case.type,
                    "failure_code": latest_case.failure_code,
                    "failure_reason": latest_case.failure_reason
                }

    # 2. Advance time and process interventions / probabilities
    run_simulation_tick(db, seconds_to_advance=seconds)
    current_time = sim_clock.get_time()

    # 3. Compute real-time metrics
    all_cases = db.query(Case).all()
    all_interventions = db.query(Intervention).all()
    metrics = calculate_financial_metrics(all_cases, all_interventions)
    
    active_cases = sum(1 for c in all_cases if c.status == "pending")
    recovered_cases = sum(1 for c in all_cases if c.status == "recovered")
    failed_cases = sum(1 for c in all_cases if c.status == "failed")

    types = ["payment", "subscription", "checkout", "invoice"]
    by_type = {}
    for t in types:
        type_cases = [c for c in all_cases if c.type == t]
        type_at_risk = sum(c.amount for c in type_cases)
        type_recovered = sum((c.amount - c.discount_offered) for c in type_cases if c.status == "recovered")
        by_type[t] = {
            "count": len(type_cases),
            "recovered_count": sum(1 for c in type_cases if c.status == "recovered"),
            "at_risk": type_at_risk,
            "recovered": type_recovered
        }

    dashboard_metrics = {
        "total_revenue_at_risk": metrics["total_at_risk"],
        "total_revenue_recovered": metrics["total_recovered"],
        "recovery_rate": round(metrics["recovery_rate"], 2),
        "total_cost": round(metrics["total_cost"], 2),
        "net_roi": round(metrics["net_roi"], 2),
        "active_cases": active_cases,
        "recovered_cases": recovered_cases,
        "failed_cases": failed_cases,
        "by_type": by_type
    }

    # 4. Fetch latest 15 global audit logs
    recent_logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(15).all()
    logs_data = [
        {
            "id": l.id,
            "case_id": l.case_id,
            "action": l.action,
            "message": l.message,
            "agent_reasoning": l.agent_reasoning,
            "created_at": l.created_at.isoformat()
        } for l in recent_logs
    ]

    # 5. Fetch recent 8 cases for the real-time activity stream
    recent_cases = db.query(Case).order_by(Case.updated_at.desc()).limit(8).all()
    cases_summary = [
        {
            "id": c.id,
            "customer_name": c.customer_name,
            "type": c.type,
            "amount": c.amount,
            "status": c.status,
            "failure_code": c.failure_code,
            "current_escalation_level": c.current_escalation_level,
            "discount_offered": c.discount_offered,
            "updated_at": c.updated_at.isoformat()
        } for c in recent_cases
    ]

    return {
        "status": "success",
        "current_simulated_time": current_time.isoformat(),
        "metrics": dashboard_metrics,
        "latest_logs": logs_data,
        "recent_cases": cases_summary,
        "new_case": new_case_summary
    }

@app.post("/api/simulation/run_batch")
def run_batch_simulation(count: int = Query(200, description="Number of mixed cases to run"), db: Session = Depends(get_db)):
    """
    Simulates a batch of X cases through the full pipeline to completion.
    Outputs metrics and reports to file storage.
    """
    # 1. Reset DB
    reset_database(db)

    # 2. Inject batch
    generate_random_cases(db, "mixed", count, use_llm=False)

    # 3. Step time by 1 virtual day per tick until all pending cases are resolved
    ticks_run = 0
    while True:
        pending_count = db.query(Case).filter(Case.status == "pending").count()
        if pending_count == 0:
            break
        
        # Advance by 1 day (86400 seconds) per tick
        run_simulation_tick(db, 86400, use_llm=False)
        ticks_run += 1
        
        # Cap to avoid infinite run
        if ticks_run > 30:
            break

    # 4. Seed the 3 representative demo cases so they are visible for audit timeline review
    seed_demo_cases(db)

    # 5. Extract results
    all_cases = db.query(Case).all()
    all_interventions = db.query(Intervention).all()

    metrics = calculate_financial_metrics(all_cases, all_interventions)
    total_at_risk = metrics["total_at_risk"]
    total_recovered = metrics["total_recovered"]
    recovery_rate = metrics["recovery_rate"]
    total_cost = metrics["total_cost"]
    net_roi = metrics["net_roi"]

    # Calculate unrecovered breakdown mutually exclusively
    failed_cases = db.query(Case).filter(Case.status == "failed").all()
    fraud_flagged = sum(1 for c in failed_cases if c.failure_code == "suspected_fraud")
    promise_broken = sum(1 for c in failed_cases if c.promise_pay_date is not None and c.failure_code != "suspected_fraud")
    max_retries = sum(1 for c in failed_cases if c.current_escalation_level >= 3 and c.promise_pay_date is None and c.failure_code != "suspected_fraud")
    others = len(failed_cases) - fraud_flagged - max_retries - promise_broken

    report = {
        "total_cases_in_batch": len(all_cases),
        "total_revenue_at_risk": round(total_at_risk, 2),
        "total_revenue_recovered": round(total_recovered, 2),
        "recovery_rate_pct": round(recovery_rate, 2),
        "total_intervention_cost": round(total_cost, 2),
        "cost_breakdown": metrics["cost_breakdown"],
        "net_roi_pct": round(net_roi * 100, 2),
        "net_roi_multiplier": round(total_recovered / total_cost, 2) if total_cost > 0 else 0.0,
        "unrecovered_cases_count": len(failed_cases),
        "unrecovered_breakdown": {
            "fraud_flagged_halted": fraud_flagged,
            "max_retries_exhausted": max_retries,
            "promise_to_pay_broken": promise_broken,
            "ignored_outreach_expires": others
        }
    }

    # Write report as JSON
    json_path = "d:/Athiya/razorpay/simulation_report.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    # Write report as Markdown
    md_path = "d:/Athiya/razorpay/simulation_report.md"
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(f"""# AI Revenue Recovery Simulation Report
Generated at: {datetime.utcnow().isoformat()}

## Executive Summary
This report highlights the financial and operational conversion metrics achieved by running a batch of **{count} mixed failures** through the autonomous recovery pipeline.

| Metric | Value | Description |
| :--- | :--- | :--- |
| **Total Ingested Volume** | ₹{total_at_risk:,.2f} | Total cash volume at risk of leakage |
| **Total Net Recovered** | ₹{total_recovered:,.2f} | Realized cash recovered (net of margin discounts) |
| **Recovery Success Rate** | **{recovery_rate:.2f}%** | Percentage of revenue saved |
| **Total Grounded Recovery Cost** | ₹{total_cost:,.2f} | Itemized P&L cost across all interventions |
| **- Direct Messaging & Retries** | ₹{metrics['cost_breakdown']['direct_messaging_cost']:,.2f} | WhatsApp (₹2), SMS (₹0.25), Email (₹0.10), Retry (₹5) |
| **- AI Token Infrastructure** | ₹{metrics['cost_breakdown']['ai_processing_fee']:,.2f} | Flat ₹15/case LLM inference fee |
| **- Marketing Discount Coupons** | ₹{metrics['cost_breakdown']['discount_coupons_cost']:,.2f} | Margin-safe discount vouchers redeemed |
| **- Gateway MDR Settlement (2%)**| ₹{metrics['cost_breakdown']['gateway_mdr_fee']:,.2f} | Standard 2.0% gateway settlement fee on recovered cash |
| **Net ROI** | **{net_roi * 100:.2f}% ({total_recovered / total_cost:.1f}x return)** | Financial return on dunning spend |

---

## Unrecovered Leakage Breakdown
Total Unrecovered Cases: **{len(failed_cases)}**

The engine halts outreach under strict policy stopping rules to preserve merchant gateway status and customer standing.

1. **Security & Fraud Halts**: **{fraud_flagged} cases** (0% recovery rate by design). Transactions with hard decline codes (e.g. `suspected_fraud`) are blocked immediately to avoid chargeback fees.
2. **Escalation Limit Exhausted**: **{max_retries} cases**. Outreach is automatically suspended after 3 failed interventions to respect customer opt-outs and prevent spam.
3. **Promise-to-Pay Defaults**: **{promise_broken} cases**. Customers committed to a pay date but failed to clear the balance after the 24-hour grace window.
4. **Outreach Ignored / Expired**: **{others} cases**. Low-response actions that timed out without user interactions.
""")

    # Sync back to gemini system directory
    artifact_report_path = "C:/Users/Ayesha Thanveer/.gemini/antigravity/brain/254aef66-1973-4a31-9a8e-cffe69180183/simulation_report.json"
    try:
        with open(artifact_report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
    except Exception:
        pass

    return report

@app.get("/api/cases", response_model=List[CaseBase])
def get_cases(
    status: Optional[str] = None,
    type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Case)
    
    if status:
        query = query.filter(Case.status == status)
    if type:
        query = query.filter(Case.type == type)
    if search:
        query = query.filter(
            (Case.customer_name.like(f"%{search}%")) |
            (Case.id.like(f"%{search}%")) |
            (Case.failure_code.like(f"%{search}%"))
        )
    
    return query.order_by(Case.updated_at.desc()).all()

@app.get("/api/cases/{case_id}", response_model=CaseDetailResponse)
def get_case_detail(case_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@app.post("/api/cases/{case_id}/override")
def override_case(case_id: str, req: CaseOverrideRequest, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    now = sim_clock.get_time()

    if req.action == "recover":
        record_recovery(db, case, channel="manual", current_time=now, reason="Manual agent override marked as Recovered")
    
    elif req.action == "fail":
        case.status = "failed"
        case.next_action_due = None
        db.commit()
        audit = AuditLog(
            case_id=case.id,
            action="FAILED",
            message="Case manually marked as Failed by manager.",
            agent_reasoning="Manual Overrule: Agent recovery halted manually.",
            created_at=now
        )
        db.add(audit)
        db.commit()

    elif req.action == "retry":
        case.status = "pending"
        case.current_escalation_level = 0
        case.next_action_due = now
        db.commit()
        audit = AuditLog(
            case_id=case.id,
            action="INTERVENTION_RESET",
            message="Playbook reset. Scheduling immediate retry attempt.",
            agent_reasoning="Manual Overrule: Manager forced retry execution.",
            created_at=now
        )
        db.add(audit)
        db.commit()

    elif req.action == "promise_to_pay":
        if not req.promise_date:
            raise HTTPException(status_code=400, detail="Promise date is required")
        record_promise_to_pay(db, case, req.promise_date, now)

    elif req.action == "custom_message":
        if not req.custom_message:
            raise HTTPException(status_code=400, detail="Custom message is required")
        
        interv = Intervention(
            case_id=case.id,
            type="whatsapp" if "whatsapp" in req.custom_message.lower() else "email",
            status="sent",
            details=f"Manual Message: {req.custom_message}",
            cost=0.50,
            created_at=now
        )
        db.add(interv)
        
        audit = AuditLog(
            case_id=case.id,
            action="INTERVENTION_SENT",
            message="Manual custom nudge dispatched.",
            agent_reasoning=f"Manual Action: Sent personalized message: '{req.custom_message}'",
            created_at=now
        )
        db.add(audit)
        db.commit()

    return {"status": "success", "message": f"Action '{req.action}' applied successfully."}

@app.get("/api/metrics", response_model=DashboardMetrics)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    cases = db.query(Case).all()
    interventions = db.query(Intervention).all()

    metrics = calculate_financial_metrics(cases, interventions)
    total_at_risk = metrics["total_at_risk"]
    total_recovered = metrics["total_recovered"]
    recovery_rate = metrics["recovery_rate"]
    total_cost = metrics["total_cost"]
    net_roi = metrics["net_roi"]

    active_cases = sum(1 for c in cases if c.status == "pending")
    recovered_cases = sum(1 for c in cases if c.status == "recovered")
    failed_cases = sum(1 for c in cases if c.status == "failed")

    types = ["payment", "subscription", "checkout", "invoice"]
    by_type = {}
    for t in types:
        type_cases = [c for c in cases if c.type == t]
        type_at_risk = sum(c.amount for c in type_cases)
        type_recovered = sum((c.amount - c.discount_offered) for c in type_cases if c.status == "recovered")
        by_type[t] = {
            "count": len(type_cases),
            "recovered_count": sum(1 for c in type_cases if c.status == "recovered"),
            "at_risk": type_at_risk,
            "recovered": type_recovered
        }

    return DashboardMetrics(
        total_revenue_at_risk=total_at_risk,
        total_revenue_recovered=total_recovered,
        recovery_rate=round(recovery_rate, 2),
        total_cost=round(total_cost, 2),
        net_roi=round(net_roi, 2),
        active_cases=active_cases,
        recovered_cases=recovered_cases,
        failed_cases=failed_cases,
        by_type=by_type
    )

@app.get("/api/audit_logs", response_model=List[AuditLogBase])
def get_global_audit_logs(limit: int = Query(25, description="Number of logs to return"), db: Session = Depends(get_db)):
    """
    Returns a global timeline of the latest audit log entries across all cases.
    """
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()

@app.post("/api/reset")
def reset_database(db: Session = Depends(get_db)):
    db.query(AuditLog).delete()
    db.query(Intervention).delete()
    db.query(Case).delete()
    db.commit()

    global sim_clock
    sim_clock = sim_clock.__class__()

    # Seed demo cases back
    seed_demo_cases(db)

    return {"status": "success", "message": "Database and simulation clock reset successfully."}
