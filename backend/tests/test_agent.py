import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models import Case, Intervention, AuditLog
from app.agent.engine import ingest_new_case, execute_next_intervention, record_recovery, record_promise_to_pay
from app.agent.diagnoser import diagnose_case
from app.agent.simulator import run_simulation_tick, sim_clock

# Setup in-memory SQLite database for testing
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

def test_ai_diagnosis():
    # Test soft decline
    diag_soft = diagnose_case("payment", "insufficient_funds", 500)
    assert diag_soft.playbook == "mandate_retry_sequencer"
    assert diag_soft.risk_score == 0.35

    # Test hard decline
    diag_hard = diagnose_case("payment", "suspected_fraud", 15000)
    assert diag_hard.playbook == "hard_decline_halt"
    assert diag_hard.risk_score == 0.95

    # Test B2B invoice
    diag_invoice = diagnose_case("invoice", "payment_overdue", 100000)
    assert diag_invoice.playbook == "b2b_receivables_chaser"
    assert diag_invoice.risk_score == 0.7

def test_case_ingestion(db_session):
    now = datetime.utcnow()
    case = ingest_new_case(
        db=db_session,
        case_id="case_test_1",
        customer_name="Test User",
        customer_email="test@example.com",
        customer_phone="+919999999999",
        case_type="payment",
        amount=1000.0,
        failure_code="otp_expired",
        failure_reason="OTP expired",
        current_time=now
    )

    assert case.id == "case_test_1"
    assert case.status == "pending"
    assert case.type == "payment"
    assert case.current_escalation_level == 0
    assert case.next_action_due is not None
    assert len(case.audit_logs) == 1
    assert case.audit_logs[0].action == "INGESTED"

def test_execute_intervention_and_escalation(db_session):
    now = datetime.utcnow()
    case = ingest_new_case(
        db=db_session,
        case_id="case_test_2",
        customer_name="Test User",
        customer_email="test@example.com",
        customer_phone="+919999999999",
        case_type="payment",
        amount=1000.0,
        failure_code="otp_expired",
        failure_reason="OTP expired",
        current_time=now
    )

    # Trigger first intervention
    interv = execute_next_intervention(db_session, case, now + timedelta(seconds=5))
    assert interv is not None
    assert case.current_escalation_level == 1
    assert len(case.interventions) == 1
    assert case.interventions[0].type == "whatsapp"

    # Trigger second intervention (SMS)
    interv2 = execute_next_intervention(db_session, case, now + timedelta(seconds=20))
    assert interv2 is not None
    assert case.current_escalation_level == 2
    assert len(case.interventions) == 2
    assert case.interventions[1].type == "sms"

    # Trigger third intervention (SMS or fallback)
    interv3 = execute_next_intervention(db_session, case, now + timedelta(seconds=40))
    assert interv3 is not None
    assert case.current_escalation_level == 3

    # Triggering again should mark case as failed (escalation exhaust)
    execute_next_intervention(db_session, case, now + timedelta(seconds=60))
    assert case.status == "failed"
    assert case.next_action_due is None

def test_promise_to_pay_stopping_rule(db_session):
    now = datetime.utcnow()
    case = ingest_new_case(
        db=db_session,
        case_id="case_test_3",
        customer_name="B2B Client",
        customer_email="b2b@example.com",
        customer_phone="+919999999999",
        case_type="invoice",
        amount=50000.0,
        failure_code="payment_overdue",
        failure_reason="Invoice overdue",
        current_time=now
    )

    # Set promise date 1 hour in future
    promise_date = now + timedelta(hours=1)
    record_promise_to_pay(db_session, case, promise_date, now)

    assert case.promise_pay_date == promise_date
    
    # Try to execute intervention before promise date
    interv = execute_next_intervention(db_session, case, now + timedelta(minutes=30))
    # It should return None because it is deferred
    assert interv is None
    assert case.current_escalation_level == 0  # Still 0, didn't escalate

    # Execute after promise date + buffer
    interv = execute_next_intervention(db_session, case, now + timedelta(hours=2))
    assert interv is not None
    assert case.current_escalation_level == 1

def test_recovery(db_session):
    now = datetime.utcnow()
    case = ingest_new_case(
        db=db_session,
        case_id="case_test_4",
        customer_name="Test User",
        customer_email="test@example.com",
        customer_phone="+919999999999",
        case_type="payment",
        amount=1000.0,
        failure_code="insufficient_funds",
        failure_reason="Insufficient funds",
        current_time=now
    )

    record_recovery(db_session, case, "retry", now + timedelta(seconds=10))
    assert case.status == "recovered"
    assert case.recovery_channel == "retry"
    assert case.next_action_due is None
