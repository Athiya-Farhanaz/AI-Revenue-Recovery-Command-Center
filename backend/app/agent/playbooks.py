import random
import os
import json
import urllib.request

# Global cache for failure reasons
FAILURE_REASONS_MAP = {
    "incorrect_pin": "Incorrect UPI/ATM PIN entered",
    "otp_expired": "OTP verification timed out",
    "otp_incorrect": "Incorrect OTP entered",
    "payment_cancelled": "Payment cancelled by customer",
    "expired_card": "Credit/Debit card is past expiry date",
    "mandate_auth_failed": "Recurring mandate auth rejected by bank",
    "insufficient_funds": "Insufficient account balance",
    "payment_overdue": "B2B Net terms payment window elapsed"
}

def call_gemini_api(prompt: str) -> str:
    """
    Makes a direct, zero-dependency POST request to the Google Gemini API.
    Returns the generated text or an empty string if it fails or if the key is missing.
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
        print(f"[LLM ERROR] Failed to call Gemini API: {e}")
        return ""

def generate_hinglish_whatsapp_nudge(
    customer_name: str,
    amount: float,
    product: str,
    failure_reason: str,
    failure_code: str,
    use_llm: bool = True
) -> str:
    """
    Uses Gemini LLM to construct a highly personalized, context-aware payment recovery nudge in Hinglish.
    """
    if use_llm:
        prompt = (
            f"You are an AI Billing & Recovery Agent at Razorpay. Write a personalized, highly converting WhatsApp message "
            f"to recover a failed transaction. Use a natural blend of Hindi and English (Hinglish). "
            f"Make it friendly, helpful, and slightly urgent, but polite.\n\n"
            f"Context details:\n"
            f"- Customer Name: {customer_name}\n"
            f"- Failed Amount: INR {amount:,}\n"
            f"- Product/Service: {product}\n"
            f"- Failure Reason: {failure_reason} (Code: {failure_code})\n\n"
            f"Instructions:\n"
            f"1. Greet the customer warmly by name.\n"
            f"2. Explain the transaction failure in Hinglish (e.g., 'Aapka ₹{amount} ka payment OTP timeout ki wajah se complete nahi ho paya').\n"
            f"3. Include a clear call to action to complete the payment in 1 click using this link: https://rzp.io/l/recov_xyz.\n"
            f"4. Keep it very brief (maximum 2-3 lines of text). Use popular Indian emojis naturally.\n"
            f"5. Output ONLY the WhatsApp message copy. Do not add quotes, metadata, or introductions."
        )

        llm_text = call_gemini_api(prompt)
        if llm_text:
            if not llm_text.startswith("WhatsApp:"):
                return f"WhatsApp: {llm_text}"
            return llm_text

    # Dynamic local LLM generator fallback
    reasons_desc = failure_reason.lower()
    fallbacks = [
        f"WhatsApp: Hey {customer_name}! 👋 Aapka payment of ₹{amount:,} for {product} complete nahi ho paya due to: {reasons_desc}. No worries, aap is 1-click link se securely complete kar sakte hain: https://rzp.io/l/recov_xyz. Sab set ho jayega! Team Razorpay.",
        f"WhatsApp: Namaste {customer_name}! 🙏 Aapka {product} transaction (₹{amount:,}) fail ho gaya hai. Bank check shows: {reasons_desc}. Please click here to complete payment instantly in 1 click: https://rzp.io/l/recov_xyz. Chinta ki koi baat nahi, links strictly secured hain.",
        f"WhatsApp: Hello {customer_name}! Humne dekha aapka ₹{amount:,} payment attempt decline hua due to: {reasons_desc}. Let's get your {product} active! Just click and pay: https://rzp.io/l/recov_xyz. Quick & Easy! 👍"
    ]
    return random.choice(fallbacks)

def get_playbook_intervention(
    playbook: str,
    level: int,
    customer_name: str,
    amount: float,
    failure_code: str
) -> dict:
    """
    Returns the message template/technical configuration for a recovery step
    based on the assigned playbook and escalation level.
    """
    product = "Premium Membership Plan" if "sub" in playbook else "Shopping Cart Items"
    if playbook == "b2b_receivables_chaser":
        product = f"B2B Invoice #INV-2026-{random.randint(1000, 9999)}"

    # WhatsApp Hinglish Recovery Playbook
    if playbook == "whatsapp_hinglish_recovery":
        channels = ["whatsapp", "sms"]
        channel = channels[0] if level == 0 else channels[1]

        if level == 0:
            failure_reason = FAILURE_REASONS_MAP.get(failure_code, "Temporary bank authorization error")
            details = generate_hinglish_whatsapp_nudge(customer_name, amount, product, failure_reason, failure_code)
            cost = 0.50  # 50 paise for WhatsApp business
        else:
            details = (
                f"SMS: Hello {customer_name}, your billing session is pending. "
                f"Resolve it here in 1 click: https://rzp.io/l/recov_xyz. Team Razorpay."
            )
            cost = 0.15  # 15 paise for SMS

        return {"type": channel, "details": details, "cost": cost}

    # Mandate Retry Sequencer Playbook
    elif playbook == "mandate_retry_sequencer":
        if level == 0:
            details = "Retry Sequencer: Attempting auto-retry 1/3 via Secondary Gateway (HDFC NetBanking Routing Node)."
        elif level == 1:
            details = "Retry Sequencer: Attempting auto-retry 2/3 via Tertiary Backup Gateway (SBI API Gateway) with smart timeout buffer."
        else:
            details = "Retry Sequencer: Final auto-retry 3/3 scheduled after 24-hour cooling period to capture salary payouts."
        
        return {"type": "retry", "details": details, "cost": 0.0}

    # Checkout Recovery Playbook (Dynamic discount based on cart value)
    elif playbook == "checkout_recovery":
        if amount >= 15000:
            discount = 1500
        elif amount >= 5000:
            discount = 500
        else:
            discount = 150  # 10% approx
        
        if level == 0:
            details = (
                f"WhatsApp: Hey {customer_name}! You left some items in your cart. 🛒 "
                f"Humne aapke liye ek flat ₹{discount} coupon code [SAVE{discount}] apply kar diya hai! "
                f"Pay here in 1-click: https://rzp.io/l/checkout_save. Valid only for 30 minutes!"
            )
            cost = 0.50
            return {"type": "discount", "details": details, "cost": cost, "discount": float(discount)}
        else:
            details = (
                f"Email: Hello {customer_name}, we are still holding your cart! "
                f"Get ₹{discount} off. Complete your purchase now: https://rzp.io/l/checkout_save"
            )
            cost = 0.05
            return {"type": "email", "details": details, "cost": cost, "discount": float(discount)}

    # B2B Receivables Chaser (Tone escalation)
    elif playbook == "b2b_receivables_chaser":
        if level == 0:
            details = (
                f"Email (Polite Reminder): Dear Accounts Team at {customer_name},\n\n"
                f"This is a gentle reminder that outstanding invoice {product} for ₹{amount:,} "
                f"is past its due date. Please process this at your earliest convenience.\n"
                f"Payment Link: https://rzp.io/i/invoice_pay\n\n"
                f"Warm regards,\nFinance Team"
            )
            cost = 0.05
        elif level == 1:
            details = (
                f"Email (Firm Follow-up): Dear Accounts Team,\n\n"
                f"Our records indicate that the invoice {product} for ₹{amount:,} remains outstanding. "
                f"We request you to please provide a remittance slip or settle the invoice immediately to prevent any subscription lag.\n"
                f"Payment Link: https://rzp.io/i/invoice_pay\n\n"
                f"Best regards,\nAccounts Receivable Department"
            )
            cost = 0.05
        else:
            details = (
                f"Email (Escalation Warning): URGENT NOTICE.\n\n"
                f"Your account under {customer_name} has an overdue invoice ({product}) of ₹{amount:,} which is now critical. "
                f"If payment is not received within 48 hours, your API credentials and portal access will be temporarily suspended "
                f"in accordance with our terms of service.\n"
                f"Pay instantly: https://rzp.io/i/invoice_pay\n\n"
                f"Regards,\nFinance Escalations Team"
            )
            cost = 0.05

        return {"type": "email", "details": details, "cost": cost}

    # Hard Decline Halt
    elif playbook == "hard_decline_halt":
        details = "Halted: Security block or hard invalid credentials. Manual client review is required."
        return {"type": "manual_review", "details": details, "cost": 0.0}

    # Fallback
    return {
        "type": "email",
        "details": f"Email: Dear {customer_name}, your payment of ₹{amount} failed. Please try again: https://rzp.io/l/fallback",
        "cost": 0.05
    }
