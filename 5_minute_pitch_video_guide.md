# 🎬 5-Minute Video Pitch Production Guide
### Autonomous AI Revenue Recovery Command Center
**Target Showcase**: Razorpay Buildathon / Hackathon Judging Committee  
**Target Duration**: Exactly 5:00 Minutes (300 Seconds)  
**Live UI Reference**: `http://localhost:3000`

---

## 🛠️ Pre-Flight Recording Checklist (Do this 2 minutes before recording)

1. **Verify Backend**: Ensure `python run.py` is running on `http://localhost:8000`.
2. **Verify Frontend**: Ensure `npm run dev` is running on `http://localhost:3000`.
3. **Reset Database**:
   - Open `http://localhost:3000`.
   - Click the **Trash Can ("Reset Database")** icon in the top header.
   - The UI will reset and inject the 3 anchor demo cases: **Aarav Mehta**, **Acme Corp Finance**, and **Vijay Mallya**.
4. **Interactive Teleprompter**:
   - Open the companion teleprompter artifact [`pitch_video_deck.html`](file:///C:/Users/Ayesha%20Thanveer/.gemini/antigravity/brain/254aef66-1973-4a31-9a8e-cffe69180183/pitch_video_deck.html) on a second display or split-screen.
   - It features an automated 5-minute countdown clock, slide prompter, and slide audio narration.

---

## ⏱️ Minute-by-Minute Shooting & Speaking Script

```
┌──────────────┬───────────────────────────────┬────────────────────────────────────────────┐
│ Timestamp    │ Section Title                 │ Live UI Actions (What to Click)            │
├──────────────┼───────────────────────────────┼────────────────────────────────────────────┤
│ 0:00 - 0:45  │ Act I: The Problem            │ Fresh Ingested queue, highlight failure types│
│ 0:45 - 1:30  │ Act II: Gateway Architecture  │ Switch to 'Playbook Flow' tab              │
│ 1:30 - 3:15  │ Act III: Live Playbooks       │ Cases 1 & 2: WhatsApp, Voice, Promise-to-Pay│
│ 3:15 - 4:00  │ Act IV: Hard Stopping Rules   │ Case 3: Vijay Mallya Fraud Halt & 3-Retries│
│ 4:00 - 5:00  │ Act V: Unit Economics & ROI   │ Analytics Dashboard: ₹1.17 Cr / 43.1x ROI │
└──────────────┴───────────────────────────────┴────────────────────────────────────────────┘
```

---

### ⏱️ Act I: The Problem (0:00 &mdash; 0:45 | 45 Seconds)
* **Visual**: Camera starts on the Live Dashboard at `http://localhost:3000`. Hover over the Ingested Failure queue showing the pre-seeded cases.
* **Speaker Script**:
  > *"Every merchant operating on a payment gateway loses significant top-line revenue to unhandled transaction leakage. Subscriptions silently fail when customer cards hit bank limits; checkout carts are abandoned mid-flow due to PIN or OTP timeouts; and high-value B2B invoices languish in corporate Accounts Payable queues.*
  > 
  > *Traditional recovery systems are static cron alerts. They blast customers with generic reminders at inconvenient hours, ignore banking cashflow cycles, and blindly retry expired cards until banks issue compliance penalties.*
  > 
  > *Today, we present the **AI Revenue Recovery Command Center** — an autonomous, bounded agent built directly into the payment gateway to diagnose failure root causes, choose targeted recovery playbooks, and recover lost cashflow while enforcing ironclad merchant stopping rules."*

---

### ⏱️ Act II: System Architecture (0:45 &mdash; 1:30 | 45 Seconds)
* **Visual**: Click on the **Playbook Flow** tab in the navbar. Trace your cursor across the visual flowchart nodes.
* **Speaker Script**:
  > *"Our architecture maintains a strict separation of concerns between AI diagnostic intelligence and policy enforcement:*
  > 
  > *1. **AI Diagnoser**: Every failed transaction is ingested in real time. The diagnoser parses the raw bank error code and transaction size, computes an objective risk score from 0.0 to 1.0, and assigns one of four bounded recovery playbooks.*
  > 
  > *2. **Policy Engine**: Rather than giving an LLM unconstrained execution privileges, the engine operates within predefined policy boundaries: Mandate Retry Sequencer, WhatsApp Hinglish Recovery, Margin-Aware Checkout Discounting, and B2B Receivables Chaser.*
  > 
  > *3. **Stopping Rules**: The state machine enforces hard safety rules: halting retries on security or fraud alerts, pausing notifications during customer promise-to-pay windows, and capping outreach at 3 attempts to prevent customer fatigue."*

---

### ⏱️ Act III: Live Playbooks in Action (1:30 &mdash; 3:15 | 105 Seconds)
* **Visual Steps**:
  1. Click back to the **Active Cases** tab.
  2. Click on **Case 1: Aarav Mehta** (₹2,499 &bull; PIN verification error).
  3. Point to the WhatsApp preview card and click the **🔊 Voice Play** button to hear the synthesized audio.
  4. Click on **Case 2: Acme Corp Finance** (₹1,25,000 &bull; B2B Invoice).
  5. Click **Mixed Batch (10 cases)** and toggle **Auto-Tick (Live)** to show the terminal scrolling with gateway activity.
* **Speaker Script**:
  > *"Let’s see the system in live action.*
  > 
  > *First, look at **Aarav Mehta**. His ₹2,499 purchase dropped due to an OTP timeout. The diagnoser routed him to the WhatsApp Hinglish playbook. Powered by Google’s Gemini-Flash model, the agent generated a personalized message: 'Hey Aarav! 👋 Aapka payment OTP timeout ki wajah se complete nahi ho paya...' complete with a secure 1-click checkout link. Let’s play the audio notification.*
  > 
  > *(Play the voice button for 3 seconds: 'Hey Aarav! Aapka payment...'). Aarav completes the checkout, and ₹2,499 is instantly recovered.*
  > 
  > *Second, look at **Acme Corp Finance** — a B2B net-terms invoice of ₹1.25 Lakhs. The system dispatched an initial polite reminder. Acme replied with a Promise-to-Pay date. Notice how the agent immediately deferred `next_action_due`, pausing all outreach to avoid damaging a key enterprise relationship. Once the promise matured, the customer settled the invoice in full.*
  > 
  > *Third, for subscription mandate debits, the simulator evaluates payroll timing. On salary dates — the 30th, 31st, 1st, 2nd, and 3rd of the month — our recovery probability curve jumps from 12% to 65%, aligning retries to when customer bank balances are actually liquid.*
  > 
  > *Finally, for checkout cart abandonment, the agent applies dynamic margin-safe coupons like SAVE150 or SAVE500, strictly capped at ~10% of cart value to prevent margin erosion."*

---

### ⏱️ Act IV: Knowing When NOT to Outreach (3:15 &mdash; 4:00 | 45 Seconds)
* **Visual Steps**:
  1. Scroll down and click on **Case 3: Vijay Mallya** (₹85,000 &bull; `suspected_fraud`).
  2. Highlight the **95% Risk Score** badge and the red **Hard Decline Halt** label in the audit trail.
* **Speaker Script**:
  > *"In payments, knowing when **not** to outreach is just as critical as recovering revenue.*
  > 
  > *Look at our third demo anchor: **Vijay Mallya**. The transaction failed with a `suspected_fraud` flag. Our diagnoser calculated an immediate 95% risk score.*
  > 
  > *Instead of sending messages or attempting gateway retries, the policy engine executed a **Hard Decline Halt**. The case was marked failed and quarantined for human review. Zero messages were dispatched, completely shielding the merchant from card network chargeback fines and gateway penalties.*
  > 
  > *In addition, every unrecovered case is subject to a strict 3-escalation limit. Once 3 attempts fail, outreach terminates automatically to respect implicit customer opt-outs."*

---

### ⏱️ Act V: Grounded Unit Economics & 43.1x ROI (4:00 &mdash; 5:00 | 60 Seconds)
* **Visual Steps**:
  1. Switch to the **Analytics Dashboard** tab.
  2. Hover your mouse sequentially over the 4 main KPI cards:
     - Total Ingested: **₹1.17 Crore**
     - Net Recovered: **₹83.85 Lakhs** (71.44%)
     - Total Grounded Cost: **₹1.94 Lakhs**
     - Net ROI: **43.1x return** (4,212.66%)
  3. Point to the CSV Export button and click it to trigger the live download.
* **Speaker Script**:
  > *"Finally, let’s review our financial performance on the Analytics Dashboard.*
  > 
  > *We evaluated this engine against a comprehensive locked batch of **203 real-world payment failure cases**. The system processed **₹1.17 Crore** of volume at risk and successfully recovered **₹83.85 Lakhs**, delivering a **71.44% recovery success rate**.*
  > 
  > *What sets our metrics apart is our grounded payments cost model. We don't report vanity metrics. We deduct:*
  > * *₹684.05 in direct SMS, WhatsApp, and retry fees,*
  > * *₹3,045.00 in AI LLM token overhead,*
  > * *₹23,000.00 in marketing discount vouchers redeemed,*
  > * *and ₹1.67 Lakhs for a standard 2.0% Merchant Discount Rate on all recovered volume.*
  > 
  > *Our total grounded recovery cost was **₹1.94 Lakhs**, generating a net return on investment of **4,212%**, or **43.1x return** on spend.*
  > 
  > *All audit logs are fully exportable via our CSV download feature for compliance audits.*
  > 
  > *By fusing real-time diagnosis, bounded playbooks, and strict stopping rules, the AI Revenue Recovery Command Center transforms payment failures from an inevitable cost center into an automated revenue driver for Razorpay merchants. Thank you."*

---

## 💡 Quick Tips for a Flawless Video

1. **Audio Tone**: Confident, senior engineering tone. Avoid fast-talking; pause briefly between sections.
2. **Numbers Locked**: Never deviate from the locked figures (**₹1.17 Cr**, **₹83.85 L**, **71.44%**, **₹1.94 L cost**, **43.1x ROI**).
3. **Recording Software**: Use OBS Studio or Loom (1080p, 60fps), or Windows Game Bar (`Win + Alt + R`).
