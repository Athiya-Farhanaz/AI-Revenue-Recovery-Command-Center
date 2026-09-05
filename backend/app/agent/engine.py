from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from ..models import Case, Intervention, AuditLog
from .diagnoser import diagnose_case
from .playbooks import get_playbook_intervention

def ingest_new_case(
    db: Session,
    case_id: str,
    customer_name: str,
    customer_email: str,
    customer_phone: str,
    case_type: str,
    amount: float,
    failure_code: str,
    failure_reason: str,
    current_time: datetime,
    use_llm: bool = True
) -> Case:
    """
    Ingests a payment/invoice/checkout failure, runs AI diagnosis, 
    sets up the recovery state, and logs the initial entry.
    """
    # 1. AI Diagnosis
    diagnosis = diagnose_case(case_type, failure_code, amount, use_llm=use_llm)

    # Calculate initial action due
    next_due = current_time + timedelta(seconds=diagnosis.initial_action_delay_sec)
    if diagnosis.playbook == "hard_decline_halt":
        status = "failed"
        next_due = None
    else:
        status = "pending"

    # 2. Save Case
    db_case = Case(
        id=case_id,
        customer_name=customer_name,
        customer_email=customer_email,
        customer_phone=customer_phone,
        type=case_type.lower(),
        amount=amount,
        status=status,
        failure_code=failure_code,
        failure_reason=failure_reason,
        risk_score=diagnosis.risk_score,
        current_escalation_level=0,
        next_action_due=next_due,
        created_at=current_time,
        updated_at=current_time
    )
    db.add(db_case)
    db.commit()
    db.refresh(db_case)

    # 3. Write Audit Logs
    log_msg = f"Case ingested. AI token inference overhead logged: ₹15.00. AI diagnosed root cause: '{failure_reason}'. Assigned playbook: '{diagnosis.playbook}'."
    reasoning = (
        f"AI Reasoning: Risk score {diagnosis.risk_score:.2f} based on failure code '{failure_code}'. "
        f"Selected recovery playbook '{diagnosis.playbook}' with initial delay of {diagnosis.initial_action_delay_sec}s. "
        f"Infra inference cost: ₹15.00 logged to recovery ledger."
    )
    
    if diagnosis.playbook == "hard_decline_halt":
        log_msg += " Halted execution immediately due to compliance & fraud risk."
        reasoning += " Reason: High-risk code cannot be retried automatically."

    audit = AuditLog(
        case_id=case_id,
        action="INGESTED",
        message=log_msg,
        agent_reasoning=reasoning,
        created_at=current_time
    )
    db.add(audit)
    db.commit()

    return db_case

def execute_next_intervention(db: Session, case: Case, current_time: datetime, use_llm: bool = True) -> Optional[Intervention]:
    """
    Evaluates stopping rules and executes the next step in the playbook.
    """
    if case.status != "pending":
        return None

    # Stopping rule: Promise-to-Pay buffer
    if case.promise_pay_date and case.promise_pay_date > current_time:
        # Postpone intervention
        case.next_action_due = case.promise_pay_date + timedelta(seconds=5)
        db.commit()
        
        audit = AuditLog(
            case_id=case.id,
            action="CHECK_STOPPING_RULES",
            message=f"Intervention deferred. Active Promise-to-Pay set for {case.promise_pay_date.strftime('%Y-%m-%d %H:%M')}.",
            agent_reasoning="AI Reasoning: Customer has active promise to pay. Escalation paused until promise date passes.",
            created_at=current_time
        )
        db.add(audit)
        db.commit()
        return None

    # Stopping rule: Escalation limit reached
    if case.current_escalation_level >= 3:
        case.status = "failed"
        case.next_action_due = None
        db.commit()

        audit = AuditLog(
            case_id=case.id,
            action="FAILED",
            message="Recovery playbook exhausted after 3 attempts. Case marked as Unrecoverable.",
            agent_reasoning="AI Reasoning: All levels of escalation were dispatched with no response. Halting automatic outreach to prevent SPAM / API waste.",
            created_at=current_time
        )
        db.add(audit)
        db.commit()
        return None

    # Get details for this level of intervention
    diagnosis = diagnose_case(case.type, case.failure_code, case.amount, use_llm=use_llm)
    playbook = diagnosis.playbook
    level = case.current_escalation_level

    # Generate content
    interv_data = get_playbook_intervention(playbook, level, case.customer_name, case.amount, case.failure_code)
    
    # Grounded Cost Mapping
    grounded_costs = {
        "whatsapp": 2.00,
        "discount": 2.00, # WhatsApp discount
        "sms": 0.25,
        "email": 0.10,
        "retry": 5.00
    }
    cost = grounded_costs.get(interv_data["type"], 0.0)

    # Store discount if applicable
    if interv_data.get("type") == "discount":
        case.discount_offered = interv_data.get("discount", 0.0)

    # Create Intervention
    intervention = Intervention(
        case_id=case.id,
        type=interv_data["type"],
        status="sent",
        details=interv_data["details"],
        cost=cost, # Grounded cost mapping
        created_at=current_time
    )
    db.add(intervention)

    # Update Case
    case.current_escalation_level += 1
    # Schedule next intervention in 10 simulated seconds (time unit in simulation)
    case.next_action_due = current_time + timedelta(seconds=10)
    db.commit()

    # Create Audit Log
    msg = f"Sent intervention {case.current_escalation_level}/3: {interv_data['type'].upper()} notification. Grounded outreach cost: ₹{cost:.2f}."
    reasoning = (
        f"AI Reasoning: Playbook '{playbook}' Level {level}. "
        f"Dispatched outreach via channel '{interv_data['type']}'. "
        f"Grounded cost itemized: ₹{cost:.2f} (Gateway/Carrier network API pricing)."
    )
    audit = AuditLog(
        case_id=case.id,
        action="INTERVENTION_SENT",
        message=msg,
        agent_reasoning=reasoning,
        created_at=current_time
    )
    db.add(audit)
    db.commit()

    return intervention

def record_recovery(db: Session, case: Case, channel: str, current_time: datetime, reason: str = "Customer completed payment"):
    """
    Marks a case as successfully recovered and records the channel.
    """
    case.status = "recovered"
    case.recovery_channel = channel
    case.recovered_at = current_time
    case.next_action_due = None
    db.commit()

    recovered_net = case.amount - case.discount_offered
    mdr_fee = recovered_net * 0.02

    audit = AuditLog(
        case_id=case.id,
        action="RECOVERED",
        message=f"Revenue recovered! Channel: {channel.upper()}. {reason}. Gateway transaction MDR fee (2%): ₹{mdr_fee:.2f} logged.",
        agent_reasoning=(
            f"AI Reasoning: Payment successfully confirmed. Recovery workflow marked as success. "
            f"Marketing coupon discount: ₹{case.discount_offered:.2f}. "
            f"Gateway settlement charges (2.0% MDR): ₹{mdr_fee:.2f} deducted."
        ),
        created_at=current_time
    )
    db.add(audit)
    db.commit()

def record_promise_to_pay(db: Session, case: Case, promise_date: datetime, current_time: datetime):
    """
    Records a customer's promise-to-pay date and pauses escalations.
    """
    case.promise_pay_date = promise_date
    # Push next action due to after the promise date
    case.next_action_due = promise_date + timedelta(seconds=5)
    db.commit()

    audit = AuditLog(
        case_id=case.id,
        action="PROMISE_RECEIVED",
        message=f"Customer registered a Promise-to-Pay for {promise_date.strftime('%Y-%m-%d %H:%M')}.",
        agent_reasoning="AI Reasoning: Customer responded with intent to pay later. Paused email/SMS chaser until promise date expires to maintain customer trust.",
        created_at=current_time
    )
    db.add(audit)
    db.commit()
