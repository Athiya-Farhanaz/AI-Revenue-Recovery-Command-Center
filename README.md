# AI Revenue Recovery Command Center

### 📊 Baseline Simulation Batch Metrics (203 Cases)
* **Total Volume At Risk**: **₹1,17,37,243.00** (₹1.17 Cr)
* **Total Net Recovered**: **₹83,85,424.00** (₹83.85 L)
* **Recovery Success Rate**: **71.44%** (145/203 cases recovered)
* **Total Grounded Recovery Cost**: **₹1,94,437.53** (Includes MDR, coupons, retries, and AI tokens)
* **Net Return on Investment (ROI)**: **43.1x return** (4,212.66% Net ROI)

---

## 💡 The Problem Statement
Every merchant on **Razorpay** loses significant margin to transaction leakage:
1. **Subscriptions fail** when customer credit cards expire or mandates hit soft bank errors.
2. **Carts are abandoned** at checkout due to payment auth friction (PIN/OTP timeout) or price sensitivity.
3. **B2B net-terms invoices go unpaid** because corporate finance pipelines require sequential manual checks.

Standard dunning systems are static cron alerts that spam users at awkward hours and ignore payment cycles. This system presents a smart, autonomous, context-aware recovery agent. It runs a root-cause diagnoser, drafts dynamic notifications in mixed English-Hindi (Hinglish), times card retries to match salary windows, and executes rigorous stopping rules to protect merchant standing.

---

## 🧾 Grounded Payment Economics Cost Model
Rather than reporting unrealistic dunning costs, our cost model accounts for the real-world expenses of payment recovery operations:
1. **Merchant Discount Rate (MDR) Fees**: A 2.0% gateway transaction MDR is charged on all successfully recovered volume (₹1,67,708.48 on our ₹83.85L recovery).
2. **Redeemed Promo Coupon Costs**: The exact value of coupons redeemed by checkout recovery customers (e.g. SAVE150, SAVE500) hits the recovery costs.
3. **Retry Gateway Nodes**: A fee of ₹5.00 is charged on every gateway mandate retry attempt (both successful and failed).
4. **Outreach SMS & API Costs**: WhatsApp is charged at ₹2.00/send, SMS at ₹0.25/send, and Email at ₹0.10/send (successful and failed outreach).
5. **AI Agent Overhead**: An LLM token inference cost of ₹15.00 is charged per failure case ingested to estimate API token overhead.

This realistic model results in a highly credible, production-grade ROI of **43.1x return** (4,212.66% Net ROI), proving the viability of automated agentic dunning workflows.

---

## 🗺️ System Architecture

```
[ Ingested Failure ]
         │
         ▼
  [ SIMULATOR ] ──(Generates Failures, Salary Date Toggles & Customer Curves)
         │
         ▼
  [ DIAGNOSER ] ──(Assesses Risk Score & Playbook Strategy)
         │
         ▼
[ POLICY / PLAYBOOK DISPATCHER ]
   ├── Mandate Retry Sequencer (Silently schedules backup gateway routing)
   ├── WhatsApp Hinglish Recovery (Gemini LLM drafts personalized nudges)
   ├── Checkout Discounting (Applies margin-aware SAVE coupon codes)
   └── B2B Receivables Chaser (Tone-escalating email dunning sequence)
         │
         ▼
  [ EXECUTION ] ──(Checks Stopping Rules: Max 3 Retries, Promise-to-Pay, Fraud Halts)
         │
         ▼
  [ AUDIT LOG ] ──(Saves timestamped step-by-step agent decisions)
         │
         ▼
  [ METRICS ] ────(Aggregates Net Recovered, Grounded Costs, and ROI Ratios)
```

---

## 📂 Project Structure
```text
razorpay/
├── backend/
│   ├── app/
│   │   ├── agent/
│   │   │   ├── diagnoser.py     # AI Diagnosis & Judgment Stories (LLM / Fallback rules)
│   │   │   ├── playbooks.py     # Dunning templates (Gemini API Hinglish WhatsApp generator)
│   │   │   ├── engine.py        # Dunning State Machine & Stopping Rules
│   │   │   └── simulator.py     # Time machine clock & custom customer curves
│   │   ├── database.py          # SQLite engine connections
│   │   ├── models.py            # SQLAlchemy Case, Intervention, Audit tables
│   │   ├── schemas.py           # Pydantic schemas
│   │   └── main.py              # FastAPI app routers (Run batch simulation, seed demo cases)
│   ├── tests/
│   │   └── test_agent.py        # pytest unit checks
│   ├── requirements.txt         # backend package listing
│   └── run.py                   # backend startup runner
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.tsx    # Conversion statistics & Recharts charts
│   │   │   ├── CaseList.tsx     # Timelines, mock phone wrappers, override actions
│   │   │   ├── PlaybookFlow.tsx # Visual node-link active-playbook highlight map
│   │   │   └── SimControls.tsx  # Step-ticks, manual injections, play/pause toggles
│   │   ├── types.ts             # TypeScript definitions
│   │   ├── App.tsx              # Central state engine
│   │   ├── main.tsx             # React mount entry point
│   │   └── index.css            # Tailwind directive styles (Tailwind v4)
│   ├── package.json             # frontend packages
│   ├── vite.config.ts           # Vite + Tailwind v4 + React configuration
│   └── tsconfig.json            # TypeScript React-JSX settings
├── .env.example                 # Env parameters template
└── README.md
```

---

## 🏃 Run Steps

### 1. Setup and Run Backend
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install Python packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the unit test suites:
   ```bash
   python -m pytest -v
   ```
4. Start the FastAPI backend server:
   ```bash
   python run.py
   ```
   *The API will start on `http://localhost:8000`.*

### 2. Setup and Run Frontend
1. Open a secondary terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Start the development compiler server:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:3000` in your browser.*

---

## 🤖 LLM Deployment & Fallback Mode
* The system is fully wired to Google Gemini API. Rename [.env.example](file:///d:/Athiya/razorpay/.env.example) to `.env` and configure `GEMINI_API_KEY` to run active LLM copy generation.
* The application runs out of the box in fallback mode with zero configuration. If no key is set, the system automatically uses its high-fidelity local generator to output context-rich Hinglish WhatsApp nudges and audit explanations, making the project portable and fully testable.
* The recorded demo and simulation reports were generated in the default local fallback mode for offline reproducibility.

---

## 📝 Demo Walkthrough Script
1. Reset the simulation by clicking the **Reset Database** trash icon.
2. The UI will initialize with **3 pre-seeded cases** designed for demo pitches:
   * **Aarav Mehta**: Shows instant recovery via a dynamic WhatsApp Hinglish message.
   * **Acme Corp Finance**: Shows B2B dunning, a registered Promise-to-Pay pausing email outreach, and final invoice recovery.
   * **Vijay Mallya**: Shows a **suspected fraud halt**. The system calculates a 95% risk score and kills automated retries immediately to protect gateway ratings.
3. Click **Mixed Batch (10 cases)** to inject fresh failures.
4. Click **Auto-Tick (Live)** and watch transactions cycle through the AI playbooks, settle, or gracefully terminate. Check the **Analytics Dashboard** tab to watch net recovered revenue and ROI accumulate.
