from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class AuditLogBase(BaseModel):
    id: int
    case_id: str
    action: str
    message: str
    agent_reasoning: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class InterventionBase(BaseModel):
    id: int
    case_id: str
    type: str
    status: str
    details: Optional[str] = None
    cost: float
    created_at: datetime

    class Config:
        from_attributes = True

class CaseBase(BaseModel):
    id: str
    customer_name: str
    customer_email: str
    customer_phone: str
    type: str
    amount: float
    currency: str
    status: str
    failure_code: str
    failure_reason: Optional[str] = None
    risk_score: float
    current_escalation_level: int
    next_action_due: Optional[datetime] = None
    promise_pay_date: Optional[datetime] = None
    discount_offered: float
    recovery_channel: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    recovered_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CaseDetailResponse(CaseBase):
    interventions: List[InterventionBase] = []
    audit_logs: List[AuditLogBase] = []

class SimulationInjectRequest(BaseModel):
    batch_type: str  # payment, subscription, checkout, invoice, or mixed
    count: int = 10

class CaseOverrideRequest(BaseModel):
    action: str  # recover, fail, retry, promise_to_pay, custom_message
    promise_date: Optional[datetime] = None
    custom_message: Optional[str] = None

class DashboardMetrics(BaseModel):
    total_revenue_at_risk: float
    total_revenue_recovered: float
    recovery_rate: float
    total_cost: float
    net_roi: float
    active_cases: int
    recovered_cases: int
    failed_cases: int
    by_type: dict  # nested dict of counts/amounts by type
