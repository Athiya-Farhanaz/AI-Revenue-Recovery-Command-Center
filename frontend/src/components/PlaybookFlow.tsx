import React, { useState } from 'react';
import { 
  GitCommit, ArrowRight, Smartphone, RefreshCw, 
  Tag, ShieldAlert, CheckCircle2, ChevronRight, Zap,
  Info, Filter, Play, ExternalLink, X, Bot, Check, AlertTriangle
} from 'lucide-react';
import { Case } from '../types';

interface PlaybookFlowProps {
  selectedCase: Case | null;
  cases: Case[];
  onSelectCase: (id: string) => void;
  onFilterPlaybook?: (type: string) => void;
  onInjectWebhook?: (type: string, count: number) => void;
}

interface PlaybookMeta {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  badge: string;
  color: string;
  borderColor: string;
  activeBorder: string;
  glowColor: string;
  textColor: string;
  icon: any;
  channels: string[];
  triggerCodes: string[];
  description: string;
  stoppingRule: string;
  routingFlow: string[];
}

const PLAYBOOKS: Record<string, PlaybookMeta> = {
  mandate_retry: {
    id: 'mandate_retry',
    type: 'payment',
    title: 'Mandate Retry Sequencer',
    subtitle: 'Subscription Insufficient Funds & Soft Declines',
    badge: '12% -> 65% Lift',
    color: 'blue',
    borderColor: 'border-blue-900/50',
    activeBorder: 'border-blue-400',
    glowColor: 'shadow-blue-500/20',
    textColor: 'text-blue-400',
    icon: RefreshCw,
    channels: ['HDFC Gateway', 'SBI Router', 'NPCI Mandate Network'],
    triggerCodes: ['insufficient_funds', 'account_balance_low', 'network_timeout'],
    description: 'Auto-retries subscription debits through redundant banking switches. Evaluates the calendar day: retries on salary dates (30th, 31st, 1st, 2nd, 3rd) yield a 65% success rate when customer balances are liquid.',
    stoppingRule: 'Terminates after 3 consecutive failed retries to protect merchant gateway health.',
    routingFlow: ['HDFC Router', 'SBI Router', 'Salary-Date Run']
  },
  whatsapp_hinglish: {
    id: 'whatsapp_hinglish',
    type: 'payment',
    title: 'WhatsApp Hinglish Recovery',
    subtitle: 'Auth Friction: OTP Timeouts & PIN Failures',
    badge: 'Gemini LLM Copy',
    color: 'violet',
    borderColor: 'border-violet-900/50',
    activeBorder: 'border-violet-400',
    glowColor: 'shadow-violet-500/20',
    textColor: 'text-violet-400',
    icon: Smartphone,
    channels: ['WhatsApp Business API', 'SMS Gateway', 'Web Speech Voice'],
    triggerCodes: ['incorrect_pin', 'otp_expired', 'otp_incorrect', 'payment_cancelled'],
    description: 'Dispatches conversational, friendly Hinglish WhatsApp nudges with 1-click checkout links. Includes browser Web Speech audio playback. Powered by Google Gemini-Flash with local zero-crash fallback.',
    stoppingRule: 'Caps at 2 messages; stops immediately upon successful 1-click authorization.',
    routingFlow: ['Hinglish WA Nudge', 'Audio Callout', 'SMS Backup']
  },
  checkout_discount: {
    id: 'checkout_discount',
    type: 'checkout',
    title: 'Checkout Discounting',
    subtitle: 'Cart Abandonment & Price Sensitivity',
    badge: 'Margin-Aware',
    color: 'emerald',
    borderColor: 'border-emerald-900/50',
    activeBorder: 'border-emerald-400',
    glowColor: 'shadow-emerald-500/20',
    textColor: 'text-emerald-400',
    icon: Tag,
    channels: ['WhatsApp Abandonment Hook', 'Email Recovery Link'],
    triggerCodes: ['cart_abandoned', 'checkout_drop', 'payment_aborted'],
    description: 'Calculates cart order value and generates dynamic margin-safe coupons (SAVE150, SAVE500, SAVE1500). Discounts are strictly capped at ~10% cart margin with zero coupon stacking.',
    stoppingRule: 'Single-use voucher valid for 24 virtual hours; expires without re-discounting.',
    routingFlow: ['Cart Value Check', 'Margin Coupon Hook', 'Email Follow-up']
  },
  b2b_receivables: {
    id: 'b2b_receivables',
    type: 'invoice',
    title: 'B2B Receivables Chaser',
    subtitle: 'Net-30 / Net-60 Corporate Invoices',
    badge: '3-Tier Tone Escalation',
    color: 'amber',
    borderColor: 'border-amber-900/50',
    activeBorder: 'border-amber-400',
    glowColor: 'shadow-amber-500/20',
    textColor: 'text-amber-400',
    icon: ShieldAlert,
    channels: ['Corporate Email', 'Finance WhatsApp', 'Accounts Payable Portal'],
    triggerCodes: ['payment_overdue', 'invoice_past_due', 'approval_pending'],
    description: 'Executes a sequential 3-tier escalation: Polite Reminder -> Firm Second Notice -> Urgent Service Suspension. Automatically respects registered Promise-to-Pay dates by pausing outreach.',
    stoppingRule: 'Halts immediately when customer logs a Promise date until grace period matures.',
    routingFlow: ['Polite Reminder', 'Firm Dunning', 'Service Suspension Notice']
  }
};

export const PlaybookFlow: React.FC<PlaybookFlowProps> = ({ 
  selectedCase, 
  cases, 
  onSelectCase,
  onFilterPlaybook,
  onInjectWebhook
}) => {
  const [inspectedPlaybook, setInspectedPlaybook] = useState<string | null>(null);
  const [showDiagnoserInfo, setShowDiagnoserInfo] = useState<boolean>(false);
  const [showIngestionInfo, setShowIngestionInfo] = useState<boolean>(false);

  // Determine active playbook for the selected case
  const getActivePlaybookKey = (): string | null => {
    if (!selectedCase) return null;
    if (selectedCase.type === 'invoice') return 'b2b_receivables';
    if (selectedCase.type === 'checkout') return 'checkout_discount';
    if (['incorrect_pin', 'otp_expired', 'otp_incorrect', 'payment_cancelled'].includes(selectedCase.failure_code)) {
      return 'whatsapp_hinglish';
    }
    return 'mandate_retry';
  };

  const activePlaybookKey = getActivePlaybookKey();

  const handleCardClick = (key: string) => {
    if (inspectedPlaybook === key) {
      setInspectedPlaybook(null);
    } else {
      setInspectedPlaybook(key);
      setShowDiagnoserInfo(false);
      setShowIngestionInfo(false);
    }
  };

  const handleFilterCases = (type: string) => {
    if (onFilterPlaybook) {
      onFilterPlaybook(type);
    }
  };

  const handleQuickInject = (type: string) => {
    if (onInjectWebhook) {
      onInjectWebhook(type, 1);
    }
  };

  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-5 shadow-sm space-y-4 transition-all">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap size={16} className="text-[#0066FF]" />
            Agentic Recovery Playbook Mapper
            <span className="text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50 px-2.5 py-0.5 rounded">
              Interactive • Click any node to inspect & filter
            </span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {selectedCase 
              ? `Currently highlighting active autonomous routing for: ${selectedCase.customer_name} (${selectedCase.failure_code})`
              : 'Click any playbook card below to filter matching cases, inspect LLM prompts, or simulate a live failure event.'
            }
          </p>
        </div>

        {selectedCase && (
          <div className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-[#0F172A] px-3 py-1.5 rounded-lg border border-brand-border">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Selected Case:</span>
            <span className="text-slate-900 dark:text-white font-bold">{selectedCase.customer_name}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
              selectedCase.status === 'recovered' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' 
                : selectedCase.status === 'failed'
                ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
                : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
            }`}>
              {selectedCase.status.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Main Flow Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-center relative">
        
        {/* Node 1: Ingestion */}
        <button
          onClick={() => {
            setShowIngestionInfo(!showIngestionInfo);
            setInspectedPlaybook(null);
            setShowDiagnoserInfo(false);
          }}
          className={`xl:col-span-2 flex flex-col items-center justify-center p-3.5 bg-slate-50 dark:bg-[#0F172A] rounded-xl border transition-all text-center shadow-sm cursor-pointer hover:border-[#0066FF] group ${
            showIngestionInfo ? 'border-[#0066FF] ring-1 ring-[#0066FF]' : 'border-brand-border'
          }`}
          title="Click to inspect webhook ingestion"
        >
          <GitCommit className="text-[#0066FF] mb-1.5" size={22} />
          <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#0066FF] transition-colors">Event Ingested</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Live Gateway Webhook</span>
          <span className="mt-1.5 text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-medium">Click to Ingest</span>
        </button>

        {/* Arrow 1 */}
        <div className="hidden xl:flex xl:col-span-1 justify-center">
          <ArrowRight className="text-slate-400 dark:text-slate-600" size={16} />
        </div>

        {/* Node 2: AI Diagnoser */}
        <button
          onClick={() => {
            setShowDiagnoserInfo(!showDiagnoserInfo);
            setInspectedPlaybook(null);
            setShowIngestionInfo(false);
          }}
          className={`xl:col-span-2 flex flex-col items-center justify-center p-3.5 bg-slate-50 dark:bg-[#0F172A] border transition-all text-center shadow-sm relative cursor-pointer hover:border-[#0066FF] group rounded-xl ${
            showDiagnoserInfo ? 'border-[#0066FF] ring-1 ring-[#0066FF]' : 'border-brand-border'
          }`}
          title="Click to inspect Gemini AI diagnosis logic"
        >
          <div className="absolute -top-2.5 bg-[#0066FF] text-[10px] font-semibold px-2 py-0.5 rounded text-white uppercase tracking-wider shadow-sm">
            AI DIAGNOSER
          </div>
          <Bot className="text-[#0066FF] mb-1.5 mt-1" size={22} />
          <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#0066FF] transition-colors">Classify & Route</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Risk Scoring 0.0 - 1.0</span>
          <span className="mt-1.5 text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-medium">Inspect Rules</span>
        </button>

        {/* Arrow 2 */}
        <div className="hidden xl:flex xl:col-span-1 justify-center">
          <ArrowRight className="text-slate-400 dark:text-slate-600" size={16} />
        </div>

        {/* Node 3: 4 Playbook Cards */}
        <div className="xl:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {Object.entries(PLAYBOOKS).map(([key, p]) => {
            const Icon = p.icon;
            const isActive = activePlaybookKey === key;
            const isInspected = inspectedPlaybook === key;
            const matchingCount = cases.filter(c => {
              if (p.id === 'b2b_receivables') return c.type === 'invoice';
              if (p.id === 'checkout_discount') return c.type === 'checkout';
              if (p.id === 'whatsapp_hinglish') {
                return ['incorrect_pin', 'otp_expired', 'otp_incorrect', 'payment_cancelled'].includes(c.failure_code);
              }
              return c.type === 'payment' || c.type === 'subscription';
            }).length;

            return (
              <div
                key={key}
                onClick={() => handleCardClick(key)}
                className={`p-3.5 bg-slate-50/70 hover:bg-slate-100 dark:bg-[#0F172A] dark:hover:bg-[#152238] rounded-xl border transition-all cursor-pointer text-left relative ${
                  isActive 
                    ? 'border-[#0066FF] ring-1 ring-[#0066FF] shadow-sm' 
                    : isInspected
                    ? 'border-slate-800 dark:border-white shadow-sm'
                    : 'border-slate-200/80 dark:border-[#1E293B]'
                }`}
              >
                {/* Active Indicator Badge */}
                {isActive && (
                  <span className="absolute -top-2 -right-2 bg-emerald-600 text-white font-semibold text-[10px] px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                    <Check size={10} /> ACTIVE ROUTE
                  </span>
                )}

                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <Icon size={14} className={isActive ? 'text-[#0066FF]' : 'text-slate-500'} />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{p.title}</span>
                  </div>
                  <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono">
                    {matchingCount} cases
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                  {p.subtitle}
                </p>

                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">{p.badge}</span>
                  <span className="text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-0.5 text-[11px]">
                    Inspect & Filter &rarr;
                  </span>
                </div>
              </div>
            );
          })}

        </div>

      </div>

      {/* EXPANDABLE INSPECTOR PANEL */}
      
      {/* 1. PLAYBOOK INSPECTION DRAWER */}
      {inspectedPlaybook && PLAYBOOKS[inspectedPlaybook] && (
        <div className="p-4 bg-slate-50 dark:bg-brand-dark rounded-xl border-2 border-[#0066FF] animate-fadeIn shadow-lg space-y-3">
          {(() => {
            const p = PLAYBOOKS[inspectedPlaybook];
            const Icon = p.icon;
            const matchingCount = cases.filter(c => {
              if (p.id === 'b2b_receivables') return c.type === 'invoice';
              if (p.id === 'checkout_discount') return c.type === 'checkout';
              if (p.id === 'whatsapp_hinglish') {
                return ['incorrect_pin', 'otp_expired', 'otp_incorrect', 'payment_cancelled'].includes(c.failure_code);
              }
              return c.type === 'payment' || c.type === 'subscription';
            }).length;

            return (
              <>
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-brand-border pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-brand-surface border border-slate-200 dark:border-brand-border flex items-center justify-center shadow-xs">
                      <Icon size={20} className={p.textColor} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-bold text-slate-900 dark:text-white">{p.title}</h5>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#0066FF] border border-blue-200 dark:bg-brand-primary/20 dark:text-[#75A3FF] dark:border-brand-primary/30">
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{p.subtitle}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setInspectedPlaybook(null)}
                    className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg bg-slate-200 dark:bg-slate-800 cursor-pointer transition-colors"
                    title="Close"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-brand-surface rounded-lg border border-slate-200 dark:border-brand-border space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-gray-400 block">Strategy & Mechanism</span>
                    <p className="text-slate-700 dark:text-slate-200 text-[11px] leading-relaxed">{p.description}</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-brand-surface rounded-lg border border-slate-200 dark:border-brand-border space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-gray-400 block">Stopping Rule & Safety</span>
                    <p className="text-amber-600 dark:text-amber-300 text-[11px] leading-relaxed font-medium">{p.stoppingRule}</p>
                    <div className="pt-1.5 flex flex-wrap gap-1">
                      {p.triggerCodes.map(code => (
                        <span key={code} className="text-[9px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-gray-300 px-1.5 py-0.5 rounded font-mono">
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-white dark:bg-brand-surface rounded-lg border border-slate-200 dark:border-brand-border flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-gray-400 block">Outreach Channels</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.channels.map(ch => (
                          <span key={ch} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 px-2 py-0.5 rounded font-medium">
                            {ch}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-brand-border">
                      <button
                        onClick={() => handleFilterCases(p.type)}
                        className="flex-1 py-1.5 bg-[#0066FF] hover:bg-[#0052CC] active:scale-95 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all shadow-xs"
                      >
                        <Filter size={12} />
                        Filter Cases ({matchingCount})
                      </button>

                      <button
                        onClick={() => handleQuickInject(p.type)}
                        className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 font-semibold text-xs rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all border border-slate-200 dark:border-slate-700"
                        title="Inject test failure for this playbook"
                      >
                        <Play size={11} />
                        Simulate
                      </button>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* 2. DIAGNOSER INSPECTION DRAWER */}
      {showDiagnoserInfo && (
        <div className="p-4 bg-slate-50 dark:bg-brand-dark rounded-xl border-2 border-blue-400 animate-fadeIn shadow-lg space-y-3">
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-brand-border pb-2.5">
            <div className="flex items-center gap-2.5">
              <Bot size={20} className="text-[#0066FF]" />
              <div>
                <h5 className="text-sm font-bold text-slate-900 dark:text-white">AI Diagnoser & Risk Engine (Gemini-Flash-Latest)</h5>
                <p className="text-xs text-slate-500 dark:text-gray-400">Autonomous classification of raw banking response codes</p>
              </div>
            </div>
            <button onClick={() => setShowDiagnoserInfo(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg bg-slate-200 dark:bg-slate-800 cursor-pointer transition-colors">
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white dark:bg-brand-surface rounded-lg border border-red-200 dark:border-red-900/40">
              <span className="text-red-600 dark:text-red-400 font-bold block text-sm">0.95 Risk Score</span>
              <span className="text-[10px] text-slate-700 dark:text-gray-300 font-semibold">suspected_fraud / stolen_card</span>
              <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-1">Routes to <strong>Hard Decline Halt</strong>. Immediately kills retries and messaging.</p>
            </div>

            <div className="p-3 bg-white dark:bg-brand-surface rounded-lg border border-purple-200 dark:border-violet-900/40">
              <span className="text-purple-600 dark:text-violet-400 font-bold block text-sm">0.25 Risk Score</span>
              <span className="text-[10px] text-slate-700 dark:text-gray-300 font-semibold">incorrect_pin / otp_expired</span>
              <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-1">Routes to <strong>WhatsApp Hinglish</strong>. Low friction, 1-click checkout recovery.</p>
            </div>

            <div className="p-3 bg-white dark:bg-brand-surface rounded-lg border border-blue-200 dark:border-blue-900/40">
              <span className="text-[#0066FF] dark:text-blue-400 font-bold block text-sm">0.35 Risk Score</span>
              <span className="text-[10px] text-slate-700 dark:text-gray-300 font-semibold">insufficient_funds (NSF)</span>
              <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-1">Routes to <strong>Mandate Retry Sequencer</strong>. Aligns debits to salary dates.</p>
            </div>

            <div className="p-3 bg-white dark:bg-brand-surface rounded-lg border border-amber-200 dark:border-amber-900/40">
              <span className="text-amber-600 dark:text-amber-400 font-bold block text-sm">0.30 Risk Score</span>
              <span className="text-[10px] text-slate-700 dark:text-gray-300 font-semibold">payment_overdue (B2B)</span>
              <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-1">Routes to <strong>B2B Receivables Chaser</strong>. Sequential tone escalation.</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. EVENT INGESTION QUICK SIMULATOR */}
      {showIngestionInfo && (
        <div className="p-4 bg-slate-50 dark:bg-brand-dark rounded-xl border-2 border-emerald-400 animate-fadeIn shadow-lg space-y-3">
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-brand-border pb-2.5">
            <div className="flex items-center gap-2.5">
              <GitCommit size={20} className="text-emerald-600 dark:text-emerald-400" />
              <div>
                <h5 className="text-sm font-bold text-slate-900 dark:text-white">Live Gateway Webhook Ingestion</h5>
                <p className="text-xs text-slate-500 dark:text-gray-400">Simulate incoming payment failure events directly from your gateway</p>
              </div>
            </div>
            <button onClick={() => setShowIngestionInfo(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg bg-slate-200 dark:bg-slate-800 cursor-pointer transition-colors">
              <X size={14} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <button
              onClick={() => handleQuickInject('payment')}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:hover:bg-blue-900 dark:text-blue-300 dark:border-blue-800 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs"
            >
              + UPI PIN Failure (WhatsApp)
            </button>

            <button
              onClick={() => handleQuickInject('checkout')}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 dark:text-emerald-300 dark:border-emerald-800 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs"
            >
              + Cart Drop (Discount Voucher)
            </button>

            <button
              onClick={() => handleQuickInject('subscription')}
              className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 dark:bg-violet-950/60 dark:hover:bg-violet-900 dark:text-violet-300 dark:border-violet-800 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs"
            >
              + Mandate Decline (Salary Timing)
            </button>

            <button
              onClick={() => handleQuickInject('invoice')}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900 dark:text-amber-300 dark:border-amber-800 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs"
            >
              + B2B Invoice Overdue (Escalation)
            </button>
          </div>
        </div>
      )}

      {/* Outcome Rules Legend */}
      <div className="pt-2 border-t border-brand-border/40 flex flex-wrap justify-between items-center text-[10px] text-slate-600 dark:text-gray-400 gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block"></span>
            <span>Recovered (Stop Rule)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block"></span>
            <span>Hard Fraud Halt (0% Recovery)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block"></span>
            <span>Max 3 Retries Exhausted</span>
          </div>
        </div>

        <span className="text-[10px] text-slate-500 font-mono">
          Tip: Click any playbook box to filter the table below
        </span>
      </div>

    </div>
  );
};
