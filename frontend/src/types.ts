export interface Case {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  type: 'payment' | 'subscription' | 'checkout' | 'invoice';
  amount: number;
  currency: string;
  status: 'pending' | 'recovered' | 'failed' | 'escalated';
  failure_code: string;
  failure_reason: string;
  risk_score: number;
  current_escalation_level: number;
  next_action_due: string | null;
  promise_pay_date: string | null;
  discount_offered: number;
  recovery_channel: string | null;
  created_at: string;
  updated_at: string;
  recovered_at: string | null;
}

export interface Intervention {
  id: number;
  case_id: string;
  type: 'retry' | 'whatsapp' | 'email' | 'sms' | 'discount' | 'manual_review';
  status: string;
  details: string | null;
  cost: number;
  created_at: string;
}

export interface AuditLog {
  id: number;
  case_id: string;
  action: string;
  message: string;
  agent_reasoning: string | null;
  created_at: string;
}

export interface CaseDetail extends Case {
  interventions: Intervention[];
  audit_logs: AuditLog[];
}

export interface TypeMetric {
  count: number;
  recovered_count: number;
  at_risk: number;
  recovered: number;
}

export interface Metrics {
  total_revenue_at_risk: number;
  total_revenue_recovered: number;
  recovery_rate: number;
  total_cost: number;
  net_roi: number;
  active_cases: number;
  recovered_cases: number;
  failed_cases: number;
  by_type: Record<string, TypeMetric>;
}

export interface RecentCaseSummary {
  id: string;
  customer_name: string;
  type: 'payment' | 'subscription' | 'checkout' | 'invoice';
  amount: number;
  status: 'pending' | 'recovered' | 'failed' | 'escalated';
  failure_code: string;
  current_escalation_level: number;
  discount_offered: number;
  updated_at: string;
}

export interface StreamStepResponse {
  status: string;
  current_simulated_time: string;
  metrics: Metrics;
  latest_logs: AuditLog[];
  recent_cases: RecentCaseSummary[];
  new_case?: {
    id: string;
    customer_name: string;
    amount: number;
    type: string;
    failure_code: string;
    failure_reason: string;
  } | null;
}
