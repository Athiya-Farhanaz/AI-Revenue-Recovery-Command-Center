from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Case(Base):
    __tablename__ = "cases"

    id = Column(String, primary_key=True, index=True)
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    customer_phone = Column(String, nullable=False)
    type = Column(String, nullable=False)  # payment, subscription, checkout, invoice
    amount = Column(Float, nullable=False)
    currency = Column(String, default="INR")
    status = Column(String, default="pending")  # pending, recovered, failed, escalated
    failure_code = Column(String, nullable=False)  # e.g., insufficient_funds, card_expired, cart_abandoned
    failure_reason = Column(String, nullable=True)
    risk_score = Column(Float, default=0.0)
    current_escalation_level = Column(Integer, default=0)
    next_action_due = Column(DateTime, nullable=True)
    promise_pay_date = Column(DateTime, nullable=True)
    discount_offered = Column(Float, default=0.0)  # absolute discount
    recovery_channel = Column(String, nullable=True)  # retry, whatsapp, email, manual
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    recovered_at = Column(DateTime, nullable=True)

    # Relationships
    interventions = relationship("Intervention", back_populates="case", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="case", cascade="all, delete-orphan")

class Intervention(Base):
    __tablename__ = "interventions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(String, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)  # retry, whatsapp, email, sms, discount
    status = Column(String, default="scheduled")  # scheduled, sent, success, failed
    details = Column(Text, nullable=True)  # drafted message or transaction receipt details
    cost = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="interventions")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(String, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    action = Column(String, nullable=False)  # e.g., INGESTED, DIAGNOSED, INTERVENTION_SENT, OUTCOME
    message = Column(Text, nullable=False)
    agent_reasoning = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="audit_logs")
