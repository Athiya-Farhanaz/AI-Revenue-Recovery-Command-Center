from datetime import datetime, timedelta
import os
import json
import urllib.request
import random

class CaseDiagnosis:
    def __init__(self, risk_score: float, playbook: str, reasoning: str, initial_action_delay_sec: int):
        self.risk_score = risk_score
        self.playbook = playbook
        self.reasoning = reasoning
        self.initial_action_delay_sec = initial_action_delay_sec

def call_gemini_api(prompt: str) -> str:
    """
    Zero-dependency call to Gemini API for diagnostic audit stories.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return ""
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"
    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }]
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=8) as response:
            res_body = response.read().decode("utf-8")
            res_data = json.loads(res_body)
            text = res_data["candidates"][0]["content"]["parts"][0]["text"]
            return text.strip()
    except Exception as e:
        print(f"[LLM ERROR] Failed to call Gemini API in diagnoser: {e}")
        return ""

def diagnose_failure(case_type: str, failure_code: str, amount: float, use_llm: bool = True) -> CaseDiagnosis:
    """
    Simulates AI analysis of a failure event.
    Determines risk, routing playbook, and gives detailed reasoning.
    """
    case_type = case_type.lower()
    failure_code = failure_code.lower()

    playbook = "mandate_retry_sequencer"
    risk_score = 0.3
    initial_action_delay_sec = 3

    # 1. Standard Rule-based routing classification
    if case_type == "invoice":
        risk_score = 0.4 if amount < 50000 else 0.7
        playbook = "b2b_receivables_chaser"
        initial_action_delay_sec = 1
    elif case_type == "checkout":
        risk_score = 0.5
        playbook = "checkout_recovery"
        initial_action_delay_sec = 2
    elif case_type == "subscription":
        if failure_code == "expired_card":
            risk_score = 0.6
            playbook = "whatsapp_hinglish_recovery"
            initial_action_delay_sec = 1
        else:
            risk_score = 0.4
            playbook = "mandate_retry_sequencer"
            initial_action_delay_sec = 5
    else:
        # Standard payment failures
        if failure_code in ["suspected_fraud", "card_blocked", "stolen_card", "invalid_account"]:
            risk_score = 0.95
            playbook = "hard_decline_halt"
            initial_action_delay_sec = 0
        elif failure_code in ["insufficient_funds", "account_balance_low"]:
            risk_score = 0.35
            playbook = "mandate_retry_sequencer"
            initial_action_delay_sec = 12
        elif failure_code in ["incorrect_pin", "otp_expired", "otp_incorrect", "payment_cancelled"]:
            risk_score = 0.25
            playbook = "whatsapp_hinglish_recovery"
            initial_action_delay_sec = 2

    # 2. Dynamic Judgment Story (LLM-assisted or high-fidelity rule-based local backup)
    reasoning = ""
    if use_llm:
        prompt = (
            f"You are an expert AI risk auditor at Razorpay. Write a technical, analytical 'judgment story' "
            f"(2 sentences maximum) for a transaction failure review with these metrics:\n"
            f"- Type: {case_type}\n"
            f"- Failure Code: {failure_code}\n"
            f"- Amount: INR {amount:,}\n"
            f"- Assigned Playbook: {playbook}\n\n"
            f"Analyze the likely root cause (e.g. gateway error vs customer fatigue vs fraud risk) "
            f"and explain why this playbook is the most efficient choice. "
            f"Do not output markdown, prefixes, or HTML."
        )
        reasoning = call_gemini_api(prompt)
    
    # Fallback to rich dynamic rule-based judgment story if LLM key is absent
    if not reasoning:
        if playbook == "hard_decline_halt":
            reasoning = (
                f"AI Judgment Story: Critical security risk flag. Code '{failure_code}' indicates suspected fraud or blacklisted card credentials. "
                f"Halting all automated retries to prevent compliance charges and protect the merchant gateway standing."
            )
        elif playbook == "b2b_receivables_chaser":
            reasoning = (
                f"AI Judgment Story: Invoice value of INR {amount:,} has passed term limit. Corporate account payable cycles typically lag "
                f"due to internal approvals. Routing to B2B email chaser to apply sequential tone escalation and capture promise dates."
            )
        elif playbook == "checkout_recovery":
            reasoning = (
                f"AI Judgment Story: High-intent cart dropoff at payment screen suggests price sensitivity. "
                f"Dispatched WhatsApp discounting playbook to offer a dynamic margin-aware voucher, recovering up to 45% of abandonment."
            )
        elif playbook == "whatsapp_hinglish_recovery":
            reasoning = (
                f"AI Judgment Story: Customer failed authorization due to input error ({failure_code}). "
                f"High-friction codes respond best to direct, low-friction messaging. Dispatched WhatsApp Hinglish template with 1-click checkout."
            )
        elif playbook == "mandate_retry_sequencer" and failure_code in ["insufficient_funds", "account_balance_low"]:
            reasoning = (
                f"AI Judgment Story: Soft decline caused by insufficient funds in card/account. "
                f"Intervention deferred by {initial_action_delay_sec}s (virtually hours) to schedule retries surrounding standard salary payout cycles."
            )
        else:
            reasoning = (
                f"AI Judgment Story: Temporary network decline detected. Scheduling retry sequence with dynamic backup gateway routing "
                f"to bypass original terminal downtime silently."
            )

    return CaseDiagnosis(
        risk_score=risk_score,
        playbook=playbook,
        reasoning=reasoning,
        initial_action_delay_sec=initial_action_delay_sec
    )

diagnose_case = diagnose_failure

