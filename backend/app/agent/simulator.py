from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
from ..models import Case, Intervention, AuditLog
from .engine import ingest_new_case, execute_next_intervention, record_recovery, record_promise_to_pay

# In-memory simulation clock initialized to near salary dates (e.g. August 29th)
class SimulationClock:
    def __init__(self):
        # Initialize to 29th of the month at 9:00 AM
        self.current_time = datetime(2026, 8, 29, 9, 0, 0)

    def advance(self, seconds: int):
        self.current_time += timedelta(seconds=seconds)
        return self.current_time

    def get_time(self) -> datetime:
        return self.current_time

sim_clock = SimulationClock()

INDIAN_NAMES = [
    "Rajesh Kumar", "Priya Sharma", "Amit Patel", "Sneha Reddy", "Rohan Das",
    "Deepika Iyer", "Vikram Singh", "Anjali Mehta", "Sanjay Joshi", "Neha Gupta",
    "Arjun Nair", "Kriti Verma", "Aditya Rao", "Pooja Choudhury", "Harish Pillai",
    "Divya Saxena", "Manish Malhotra", "Karan Johar", "Shweta Tiwari", "Rahul Bajaj"
]

FAILURE_REASONS = {
    "insufficient_funds": "Transaction declined: Insufficient funds in customer account.",
    "incorrect_pin": "Auth failed: Customer entered incorrect UPI/ATM PIN.",
    "otp_expired": "Auth timeout: OTP expired before customer entered it.",
    "otp_incorrect": "Auth failed: Customer entered incorrect OTP code.",
    "payment_cancelled": "Customer aborted payment page during authorization.",
    "expired_card": "Card decline: The customer's credit/debit card is past expiry date.",
    "mandate_auth_failed": "Recurring mandate setup failed: Bank authentication rejected.",
    "cart_abandoned": "Customer left checkout page after adding high-value items.",
    "payment_overdue": "B2B Net terms invoice has passed the scheduled payment date.",
    "suspected_fraud": "Gateway risk alert: High probability of unauthorized card usage."
}

def generate_random_cases(db: Session, batch_type: str, count: int, use_llm: bool = True) -> int:
    """
    Generates a batch of failed transaction events and ingests them.
    """
    now = sim_clock.get_time()
    generated_count = 0

    for i in range(count):
        case_id = f"case_{random.randint(100000, 999999)}"
        name = random.choice(INDIAN_NAMES)
        email = f"{name.lower().replace(' ', '.')}@example.com"
        phone = f"+919{random.randint(10000000, 99999999)}"

        if batch_type == "mixed":
            c_type = random.choice(["payment", "subscription", "checkout", "invoice"])
        else:
            c_type = batch_type

        # Select failure code
        if c_type == "invoice":
            failure_code = "payment_overdue"
            amount = float(random.randint(25000, 350000))
        elif c_type == "checkout":
            failure_code = "cart_abandoned"
            amount = float(random.randint(1500, 25000))
        elif c_type == "subscription":
            failure_code = random.choice(["expired_card", "mandate_auth_failed"])
            amount = float(random.choice([999, 1499, 2999, 4999]))
        else:  # payment
            # Inject suspected_fraud at 5% rate for testing graceful declines
            if random.random() < 0.05:
                failure_code = "suspected_fraud"
                amount = float(random.randint(10000, 80000))
            else:
                failure_code = random.choice(["insufficient_funds", "incorrect_pin", "otp_expired", "otp_incorrect", "payment_cancelled"])
                amount = float(random.randint(200, 15000))

        reason = FAILURE_REASONS[failure_code]

        ingest_new_case(
            db=db,
            case_id=case_id,
            customer_name=name,
            customer_email=email,
            customer_phone=phone,
            case_type=c_type,
            amount=amount,
            failure_code=failure_code,
            failure_reason=reason,
            current_time=now,
            use_llm=use_llm
        )
        generated_count += 1

    return generated_count

def run_simulation_tick(db: Session, seconds_to_advance: int = 5, use_llm: bool = True):
    """
    Advances simulation time, dispatches due actions, and simulates customer response outcomes
    based on detailed probability curves.
    """
    now = sim_clock.advance(seconds_to_advance)

    # 1. Fetch pending cases
    pending_cases = db.query(Case).filter(Case.status == "pending").all()

    for case in pending_cases:
        # Check if intervention is due
        if case.next_action_due and case.next_action_due <= now:
            execute_next_intervention(db, case, now, use_llm=use_llm)

        # 2. Simulate customer reaction
        if case.status == "pending" and case.current_escalation_level > 0:
            last_intervention = db.query(Intervention).filter(
                Intervention.case_id == case.id
            ).order_by(Intervention.created_at.desc()).first()

            if last_intervention:
                rand = random.random()
                p_recover = 0.0
                p_promise = 0.0
                channel = last_intervention.type

                # A. Suspected Fraud has 0% recovery chance (always hard-decline)
                if case.failure_code == "suspected_fraud":
                    p_recover = 0.0
                    p_promise = 0.0
                
                # B. Insufficient Funds retries succeed better on salary dates (30th, 31st, 1st, 2nd, 3rd)
                elif case.failure_code in ["insufficient_funds", "account_balance_low"] and last_intervention.type == "retry":
                    sim_day = now.day
                    if sim_day in [1, 2, 3, 30, 31]:
                        p_recover = 0.65  # 65% success probability on salary dates!
                    else:
                        p_recover = 0.12  # low success on normal days

                # C. Incorrect PIN / OTP issues recover very well (~70% combined) via WhatsApp
                elif case.failure_code in ["incorrect_pin", "otp_expired", "otp_incorrect"]:
                    if last_intervention.type == "whatsapp":
                        p_recover = 0.50  # 50% pay in 1-click
                        p_promise = 0.10
                    elif last_intervention.type == "sms":
                        p_recover = 0.35  # secondary outreach catches another 35%
                
                # D. Cart abandonment recovers well with WhatsApp discounts
                elif case.failure_code == "cart_abandoned":
                    if last_intervention.type == "discount":
                        p_recover = 0.45  # high conversion due to price drop
                    elif last_intervention.type == "email":
                        p_recover = 0.15

                # E. B2B Receivables dunning
                elif case.type == "invoice":
                    if case.current_escalation_level == 1:  # Polite reminder sent
                        p_recover = 0.15
                        p_promise = 0.35  # corporate clients log promises easily
                    elif case.current_escalation_level == 2:  # Firm reminder sent
                        p_recover = 0.30
                        p_promise = 0.20
                    else:  # Susp warning sent
                        p_recover = 0.50
                        p_promise = 0.0

                # F. Default Fallbacks
                else:
                    if last_intervention.type == "whatsapp":
                        p_recover = 0.30
                    elif last_intervention.type == "sms":
                        p_recover = 0.15
                    elif last_intervention.type == "email":
                        p_recover = 0.10
                    elif last_intervention.type == "retry":
                        p_recover = 0.20

                # Execute probabilities
                if rand < p_recover:
                    reason_msg = "Completed payment via links"
                    if last_intervention.type == "retry":
                        reason_msg = "Auto-retry succeeded via gateway routing"
                        if case.failure_code == "insufficient_funds":
                            reason_msg += " (Salary cycle funds verified)"
                    elif last_intervention.type == "discount":
                        reason_msg = f"Completed payment utilizing ₹{case.discount_offered:.0f} discount coupon"

                    record_recovery(db, case, channel, now, reason_msg)
                elif rand < (p_recover + p_promise) and case.type in ["invoice", "subscription"] and not case.promise_pay_date:
                    # Promise-to-pay registered (valid for 3 virtual days)
                    promise_date = now + timedelta(days=3)
                    record_promise_to_pay(db, case, promise_date, now)
