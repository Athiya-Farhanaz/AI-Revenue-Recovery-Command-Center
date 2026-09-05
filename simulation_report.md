# AI Revenue Recovery Simulation Report
Generated at: 2026-09-05T18:06:09.798811

## Executive Summary
This report highlights the financial and operational conversion metrics achieved by running a batch of **200 mixed failures** through the autonomous recovery pipeline.

| Metric | Value | Description |
| :--- | :--- | :--- |
| **Total Ingested Volume** | ₹11,737,243.00 | Total cash volume at risk of leakage |
| **Total Net Recovered** | ₹8,385,424.00 | Realized cash recovered (net of margin discounts) |
| **Recovery Success Rate** | **71.44%** | Percentage of revenue saved |
| **Total Grounded Recovery Cost** | ₹194,437.53 | Itemized P&L cost across all interventions |
| **- Direct Messaging & Retries** | ₹684.05 | WhatsApp (₹2), SMS (₹0.25), Email (₹0.10), Retry (₹5) |
| **- AI Token Infrastructure** | ₹3,045.00 | Flat ₹15/case LLM inference fee |
| **- Marketing Discount Coupons** | ₹23,000.00 | Margin-safe discount vouchers redeemed |
| **- Gateway MDR Settlement (2%)**| ₹167,708.48 | Standard 2.0% gateway settlement fee on recovered cash |
| **Net ROI** | **4212.66% (43.1x return)** | Financial return on dunning spend |

---

## Unrecovered Leakage Breakdown
Total Unrecovered Cases: **66**

The engine halts outreach under strict policy stopping rules to preserve merchant gateway status and customer standing.

1. **Security & Fraud Halts**: **1 cases** (0% recovery rate by design). Transactions with hard decline codes (e.g. `suspected_fraud`) are blocked immediately to avoid chargeback fees.
2. **Escalation Limit Exhausted**: **58 cases**. Outreach is automatically suspended after 3 failed interventions to respect customer opt-outs and prevent spam.
3. **Promise-to-Pay Defaults**: **7 cases**. Customers committed to a pay date but failed to clear the balance after the 24-hour grace window.
4. **Outreach Ignored / Expired**: **0 cases**. Low-response actions that timed out without user interactions.
