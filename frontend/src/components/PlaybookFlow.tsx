import React from 'react';
import { 
  GitCommit, ArrowRight, Smartphone, RefreshCw, 
  Tag, ShieldAlert, CheckCircle2, ChevronRight, Zap
} from 'lucide-react';
import { Case } from '../types';

interface PlaybookFlowProps {
  selectedCase: Case | null;
}

export const PlaybookFlow: React.FC<PlaybookFlowProps> = ({ selectedCase }) => {
  const activePlaybook = selectedCase ? selectedCase.type : null;

  const isPlaybookActive = (type: string) => {
    if (!selectedCase) return false;
    if (type === 'payment' && selectedCase.type === 'payment') return true;
    if (type === 'subscription' && selectedCase.type === 'subscription') return true;
    if (type === 'checkout' && selectedCase.type === 'checkout') return true;
    if (type === 'invoice' && selectedCase.type === 'invoice') return true;
    return false;
  };

  const getBorderColor = (type: string, activeColor: string) => {
    return isPlaybookActive(type) ? `${activeColor} border-2 shadow-lg scale-[1.02]` : 'border-brand-border opacity-40';
  };

  const getLineColor = (type: string, activeBg: string) => {
    return isPlaybookActive(type) ? activeBg : 'bg-slate-800 opacity-20';
  };

  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-5 shadow-lg space-y-6">
      <div>
        <h4 className="text-base font-bold text-white flex items-center">
          <Zap size={16} className="text-brand-primary mr-2" />
          Agentic Recovery Playbook Mapper
        </h4>
        <p className="text-xs text-gray-400 mt-0.5">
          {selectedCase 
            ? `Active routing for ${selectedCase.customer_name} (${selectedCase.type.toUpperCase()}) highlighted below.`
            : 'Select a case to trace the AI execution path through our playbooks.'
          }
        </p>
      </div>

      {/* Main Flow Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-center relative">
        
        {/* Ingestion node */}
        <div className="xl:col-span-2 flex flex-col items-center justify-center p-3 bg-brand-dark rounded-xl border border-brand-border text-center shadow">
          <GitCommit className="text-brand-primary animate-pulse mb-1" size={24} />
          <span className="text-xs font-bold text-white">Event Ingested</span>
          <span className="text-[9px] text-gray-500">Failure Detected</span>
        </div>

        {/* Arrow */}
        <div className="hidden xl:flex xl:col-span-1 justify-center">
          <ArrowRight className="text-brand-border" size={16} />
        </div>

        {/* AI Router Node */}
        <div className="xl:col-span-2 flex flex-col items-center justify-center p-3 bg-slate-900 border border-brand-primary rounded-xl text-center shadow-md relative">
          <div className="absolute -top-2.5 bg-brand-primary text-[8px] font-bold px-1.5 py-0.5 rounded text-white uppercase tracking-wider">AI DIAGNOSER</div>
          <span className="text-xs font-bold text-brand-primary mt-1">Classify & Route</span>
          <span className="text-[9px] text-gray-400">Assigns Risk & Playbook</span>
        </div>

        {/* Arrow to playbooks */}
        <div className="hidden xl:flex xl:col-span-1 justify-center">
          <ArrowRight className="text-brand-border" size={16} />
        </div>

        {/* Playbook Branches */}
        <div className="xl:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Card/UPI - Retry Sequencer */}
          <div className={`p-3 bg-brand-dark rounded-xl border transition-all duration-300 ${getBorderColor('payment', 'border-blue-500 shadow-blue-500/10')}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <RefreshCw size={14} className={isPlaybookActive('payment') ? 'text-blue-400 animate-spin-slow' : 'text-gray-500'} />
              <span className="text-xs font-bold text-white">Mandate Retry Sequencer</span>
            </div>
            <p className="text-[9px] text-gray-400 leading-snug">
              Auto-retries routed across gateways (HDFC &rarr; SBI &rarr; Salary cycle wait). Zero client outreach.
            </p>
            <div className="flex items-center gap-1.5 mt-3 text-[9px] font-semibold text-gray-500">
              <span className={isPlaybookActive('payment') ? 'text-blue-400' : ''}>HDFC Router</span>
              <ChevronRight size={10} />
              <span className={isPlaybookActive('payment') ? 'text-blue-400' : ''}>SBI Router</span>
              <ChevronRight size={10} />
              <span className={isPlaybookActive('payment') ? 'text-blue-400' : ''}>Salary Run</span>
            </div>
          </div>

          {/* User Error - WhatsApp Hinglish */}
          <div className={`p-3 bg-brand-dark rounded-xl border transition-all duration-300 ${getBorderColor('subscription', 'border-violet-500 shadow-violet-500/10')}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <Smartphone size={14} className={isPlaybookActive('subscription') ? 'text-violet-400' : 'text-gray-500'} />
              <span className="text-xs font-bold text-white">WhatsApp Hinglish Recovery</span>
            </div>
            <p className="text-[9px] text-gray-400 leading-snug">
              Dispatches dual-language SMS/WhatsApp nudges for authorization or card renewals.
            </p>
            <div className="flex items-center gap-1.5 mt-3 text-[9px] font-semibold text-gray-500">
              <span className={isPlaybookActive('subscription') ? 'text-violet-400' : ''}>Hinglish WA Nudge</span>
              <ChevronRight size={10} />
              <span className={isPlaybookActive('subscription') ? 'text-violet-400' : ''}>SMS Backup</span>
            </div>
          </div>

          {/* Checkout Drop-off */}
          <div className={`p-3 bg-brand-dark rounded-xl border transition-all duration-300 ${getBorderColor('checkout', 'border-emerald-500 shadow-emerald-500/10')}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <Tag size={14} className={isPlaybookActive('checkout') ? 'text-emerald-400' : 'text-gray-500'} />
              <span className="text-xs font-bold text-white">Checkout Discounting</span>
            </div>
            <p className="text-[9px] text-gray-400 leading-snug">
              Computes cart margins to offer 1-click dynamic discounts (SAVE150 &rarr; SAVE500 &rarr; SAVE1500).
            </p>
            <div className="flex items-center gap-1.5 mt-3 text-[9px] font-semibold text-gray-500">
              <span className={isPlaybookActive('checkout') ? 'text-emerald-400' : ''}>5-10% Coupon WA</span>
              <ChevronRight size={10} />
              <span className={isPlaybookActive('checkout') ? 'text-emerald-400' : ''}>Email Follow</span>
            </div>
          </div>

          {/* B2B Receivables Chaser */}
          <div className={`p-3 bg-brand-dark rounded-xl border transition-all duration-300 ${getBorderColor('invoice', 'border-amber-500 shadow-amber-500/10')}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldAlert size={14} className={isPlaybookActive('invoice') ? 'text-amber-400' : 'text-gray-500'} />
              <span className="text-xs font-bold text-white">B2B Receivables Chaser</span>
            </div>
            <p className="text-[9px] text-gray-400 leading-snug">
              Polite net-terms check-in escalating to service-interruption notice + Promise-to-pay tracking.
            </p>
            <div className="flex items-center gap-1.5 mt-3 text-[9px] font-semibold text-gray-500">
              <span className={isPlaybookActive('invoice') ? 'text-amber-400' : ''}>Polite Rem</span>
              <ChevronRight size={10} />
              <span className={isPlaybookActive('invoice') ? 'text-amber-400' : ''}>Firm Dunning</span>
              <ChevronRight size={10} />
              <span className={isPlaybookActive('invoice') ? 'text-amber-400' : ''}>Susp Warning</span>
            </div>
          </div>

        </div>

      </div>

      {/* Outcome nodes footer */}
      <div className="pt-2 border-t border-brand-border/40 flex justify-between items-center text-[10px] text-gray-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block"></span>
            <span>Recovered (Stop Rule)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block"></span>
            <span>Failed (Exhaustion Rule)</span>
          </div>
        </div>
        
        {selectedCase && (
          <div className="flex items-center gap-1 font-semibold text-slate-300">
            <span>Status:</span>
            <span className={selectedCase.status === 'recovered' ? 'text-brand-accent' : selectedCase.status === 'failed' ? 'text-brand-danger' : 'text-brand-warning'}>
              {selectedCase.status.toUpperCase()}
            </span>
          </div>
        )}
      </div>

    </div>
  );
};
