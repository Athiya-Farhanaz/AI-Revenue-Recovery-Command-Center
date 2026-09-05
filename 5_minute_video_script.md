# 5-Minute Video Pitch Script: AI Revenue Recovery Agent
**Target Audience**: Razorpay Hiring Committee / Engineering Leadership

---

## ⏱️ Section 1: The Problem (30 Seconds)
* **Visual**: Show the dashboard screen with zero data (fresh reset), and overlay the problem slide.
* **Speaker Script**:
  > *"Every merchant on Razorpay loses margin to revenue leakage: cards expiring mid-subscription, auth drop-offs due to OTP timeouts, cart abandonment, and overdue invoices. Rule-based cron jobs are blunt instruments — they spam users, ignore cashflow timing, and fail to diagnose the root cause.*
  > 
  > *This autonomous AI Revenue Recovery engine acts as a context-aware coordinator. It detects failures, uses LLMs to generate personalized WhatsApp Hinglish messages, schedules gateway retries around salary dates, and tracks compliance with strict stopping rules."*

---

## ⏱️ Section 2: Architecture Walkthrough (45 Seconds)
* **Visual**: Display the Architecture Flowchart (Mermaid/ASCII) on screen, pointing to key components.
* **Speaker Script**:
  > *"The architecture is split into a Python FastAPI backend and a React Tailwind frontend:*
  > 
  > *First, the **AI Diagnoser** analyzes bank codes and transaction sizes to assign risk and select a playbook: Retry Sequencer, WhatsApp Hinglish, Checkout Discount, or B2B Chaser.*
  > 
  > *Second, the **State Machine** controls compliance: halting on fraud flags, capping outreach at 3 attempts, and pausing for Promise-to-Pay dates. Cost-accounting is baked directly into the ledger, calculating a grounded Net ROI including carrier fees and gateway MDR."*

---

## ⏱️ Section 3: Live Demo — Run Batch (90 Seconds)
* **Visual**: Select a batch size of `10 cases` and click **Mixed Batch** button. Toggle **Auto-Tick (Live)**. Click into Aarav Mehta's case.
* **Speaker Script**:
  > *"Let's run a batch injection. I'll load 10 mixed failure events. As I enable **Auto-Tick**, the virtual clock advances, and playbooks launch. Scroll down to see the monospace Live Gateway Terminal updates as actions occur.*
  > 
  > *Let's look at **Aarav Mehta**, who encountered a PIN verification error. The diagnoser routed him to the WhatsApp Hinglish playbook. We can see the exact message generated: 'Hey Aarav! Aapka payment fail ho gaya...' containing a secure link. Aarav clicked it, and recovered ₹2,499.*
  > 
  > *For B2B invoice dunning, look at **Acme Corp**. On ingestion, the system dispatched a polite reminder. Acme responded with a Promise-to-Pay. The state machine paused outreach automatically. Once the grace period expired, it escalated to a firm warning, recovering ₹1.25 Lakhs. By loading pre-reached timelines, we can verify that the system securely tracks these multi-day dunning states."*

---

## ⏱️ Section 4: One Graceful Failure Case (30 Seconds)
* **Visual**: Click on Case 3: **Vijay Mallya** showing the Suspected Fraud status. Highlight the audit timeline.
* **Speaker Script**:
  > *"Knowing when **not** to outreach is critical. Let's look at **Vijay Mallya's** case. The transaction failed with a `suspected_fraud` alert.*
  > 
  > *The diagnoser computed a 95% risk score. The engine immediately executed the **Hard Decline Halt** stopping rule, marking the case as failed and flagging it for manual review. No messages were sent, preventing gateway compliance penalties."*

---

## ⏱️ Section 5: The Final Metrics Summary (45 Seconds)
* **Visual**: Switch to the **Analytics Dashboard** tab. Point to the graphs and KPI cards.
* **Speaker Script**:
  > *"Switching to the dashboard, we see the results of our full 203-case batch. We processed **₹1.17 Crore** at risk and successfully recovered **₹83.85 Lakhs**, achieving a **71.44% recovery success rate**.*
  > 
  > *Our grounded cost model tallies carrier fees, discount coupon margins, gateway retries, and a 2.0% Merchant Discount Rate, totaling **₹1.94 Lakhs** in recovery expenses. This yields a net return on investment of **43.1x return**.*
  > 
  > *This demonstrates the massive leverage of embedding AI-driven recovery workflows directly into the gateway. Thank you."*
