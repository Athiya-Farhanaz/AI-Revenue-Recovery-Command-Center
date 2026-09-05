import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, ShieldAlert, CheckCircle, Clock, AlertCircle, 
  RefreshCcw, User, Mail, Phone, Smartphone, Volume2, 
  Play, Square, Radio, Send, CheckCircle2, ChevronRight
} from 'lucide-react';
import { Case, CaseDetail } from '../types';

interface CaseListProps {
  cases: Case[];
  selectedCaseId: string | null;
  onSelectCase: (id: string) => void;
  caseDetail: CaseDetail | null;
  onApplyOverride: (action: string, promiseDate?: string, customMsg?: string) => void;
  externalTypeFilter?: string;
}

export const CaseList: React.FC<CaseListProps> = ({
  cases,
  selectedCaseId,
  onSelectCase,
  caseDetail,
  onApplyOverride,
  externalTypeFilter
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Preview Mode: WhatsApp vs Voice Call
  const [previewMode, setPreviewMode] = useState<'whatsapp' | 'voice'>('whatsapp');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Override form states
  const [promiseDateStr, setPromiseDateStr] = useState<string>('');
  const [customMsgStr, setCustomMsgStr] = useState<string>('');
  const [showPromiseForm, setShowPromiseForm] = useState<boolean>(false);
  const [showMsgForm, setShowMsgForm] = useState<boolean>(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'recovered':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50 flex items-center gap-1"><CheckCircle size={10} /> Recovered</span>;
      case 'failed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800/50 flex items-center gap-1"><ShieldAlert size={10} /> Failed</span>;
      case 'escalated':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50 flex items-center gap-1"><AlertCircle size={10} /> Escalated</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/50 flex items-center gap-1"><Clock size={10} /> In Dunning</span>;
    }
  };

  // Filter cases
  const filteredCases = cases.filter(c => {
    const statusMatch = statusFilter === 'all' || c.status === statusFilter;
    const typeMatch = typeFilter === 'all' || c.type === typeFilter;
    const searchMatch = !searchTerm || 
      c.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.failure_code.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && typeMatch && searchMatch;
  });

  // Reset override forms & audio when selected case changes
  useEffect(() => {
    setShowPromiseForm(false);
    setShowMsgForm(false);
    setPromiseDateStr('');
    setCustomMsgStr('');
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  }, [selectedCaseId]);

  // Sync external filter when triggered by Playbook Mapper
  useEffect(() => {
    if (externalTypeFilter !== undefined) {
      setTypeFilter(externalTypeFilter);
    }
  }, [externalTypeFilter]);

  // Handle Speech Synthesis for Hinglish Voice Recovery
  const handleToggleVoicePlayback = () => {
    if (!('speechSynthesis' in window)) {
      alert("Web Speech API is not supported in this browser. Please use Chrome/Edge.");
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    if (!caseDetail) return;

    const voiceScript = `Namaste ${caseDetail.customer_name}! Main Razorpay smart payment assistant bol raha hoon. Aapka ${formatCurrency(caseDetail.amount)} ka transaction kisi takneeki issue ki wajah se complete nahi ho paya tha. Humne aapke WhatsApp par instant 1-click payment link bhej diya hai. Kripya use check karke payment complete kar lijiye. Dhanyavaad!`;

    const utterance = new SpeechSynthesisUtterance(voiceScript);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Try to find a Hindi or Indian English voice
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang.includes('hi') || v.name.toLowerCase().includes('india') || v.lang.includes('IN'));
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }

    utterance.onend = () => {
      setIsPlayingAudio(false);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
    };

    synthRef.current = utterance;
    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[520px]">
      
      {/* LEFT COLUMN: Cases feed */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-4 lg:col-span-5 flex flex-col space-y-3.5 shadow-lg h-[680px] overflow-hidden">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-bold text-white">Live Revenue Ingestion Stream</h4>
            <span className="text-[10px] bg-slate-900 border border-brand-border text-gray-400 px-2 py-0.5 rounded font-mono">
              {filteredCases.length} Cases
            </span>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-gray-500" size={14} />
            <input
              type="text"
              placeholder="Search by customer, case ID, failure..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-brand-dark border border-brand-border rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-2.5 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-brand-dark border border-brand-border text-gray-300 text-[10px] font-bold rounded p-1.5 focus:outline-none"
            >
              <option value="all">Status: All</option>
              <option value="pending">Pending</option>
              <option value="recovered">Recovered</option>
              <option value="failed">Failed</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-brand-dark border border-brand-border text-gray-300 text-[10px] font-bold rounded p-1.5 focus:outline-none"
            >
              <option value="all">Type: All</option>
              <option value="payment">Payment</option>
              <option value="subscription">Subscription</option>
              <option value="checkout">Checkout</option>
              <option value="invoice">B2B Invoice</option>
            </select>
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-grow overflow-y-auto space-y-2 pr-1 scrollbar-thin">
          {filteredCases.map(c => {
            const isSelected = c.id === selectedCaseId;
            return (
              <div
                key={c.id}
                onClick={() => onSelectCase(c.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer text-xs relative ${
                  isSelected 
                    ? 'bg-blue-50/80 border-[#0066FF] shadow-sm dark:bg-[#0066FF]/15 dark:border-[#0066FF]' 
                    : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200/80 dark:bg-[#0F172A] dark:hover:bg-[#152238] dark:border-[#1E293B]'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white text-xs">{c.customer_name}</h5>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block mt-0.5">
                      {c.id} • <span className="uppercase text-[#0066FF] dark:text-blue-400 font-semibold">{c.type}</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-white text-xs font-mono">{formatCurrency(c.amount)}</span>
                    <span className="text-[10px] text-slate-400 block">Code: {c.failure_code}</span>
                  </div>
                </div>

                <div className="mt-3 flex justify-between items-center border-t border-brand-border/60 pt-2">
                  <div>{getStatusBadge(c.status)}</div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    Active Step: {c.current_escalation_level}/3
                  </span>
                </div>
              </div>
            );
          })}

          {filteredCases.length === 0 && (
            <div className="text-slate-400 text-xs italic text-center py-10">
              No transactions match your search criteria.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Case Detail & Audits */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-5 lg:col-span-7 flex flex-col shadow-sm h-[680px] overflow-hidden">
        {caseDetail ? (
          <div className="flex flex-col h-full space-y-4">
            
            {/* Header detail */}
            <div className="flex flex-wrap justify-between items-start border-b border-brand-border/60 pb-3 gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{caseDetail.customer_name}</h3>
                  {getStatusBadge(caseDetail.status)}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                  <span><User size={12} className="inline mr-1 text-slate-400" />{caseDetail.id}</span>
                  <span><Mail size={12} className="inline mr-1 text-slate-400" />{caseDetail.customer_email}</span>
                  <span><Phone size={12} className="inline mr-1 text-slate-400" />{caseDetail.customer_phone}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase block">Value At Risk</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">{formatCurrency(caseDetail.amount)}</span>
                {caseDetail.discount_offered > 0 && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-semibold">
                    Net: {formatCurrency(caseDetail.amount - caseDetail.discount_offered)} (Discount Applied)
                  </span>
                )}
              </div>
            </div>

            {/* Split row: Audit trail (left) and Intervention simulator (right) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-grow overflow-hidden">
              
              {/* Audit trail */}
              <div className="md:col-span-7 flex flex-col h-full overflow-hidden pr-2">
                <div className="mb-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">AI Risk Assessment</span>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                    <div 
                      className={`h-1.5 rounded-full ${
                        caseDetail.risk_score > 0.7 
                          ? 'bg-red-500' 
                          : caseDetail.risk_score > 0.4 
                            ? 'bg-amber-500' 
                            : 'bg-emerald-500'
                      }`}
                      style={{ width: `${caseDetail.risk_score * 100}%` }}
                    />
                  </div>
                </div>

                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 block">
                  Audit & Dunning Trail ({caseDetail.audit_logs.length} events)
                </span>

                <div className="flex-grow overflow-y-auto space-y-2.5 pr-1 text-xs scrollbar-thin">
                  {caseDetail.audit_logs.map((log) => {
                    const isSuccess = log.action === 'RECOVERED';
                    const isFailure = log.action === 'FAILED';
                    const isIntervention = log.action === 'INTERVENTION_SENT';

                    return (
                      <div 
                        key={log.id} 
                        className={`p-2.5 rounded-lg border text-[11px] relative pl-3.5 transition-all ${
                          isSuccess 
                            ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' 
                            : isFailure 
                              ? 'bg-red-950/20 border-red-900/40 text-red-300' 
                              : 'bg-brand-dark/70 border-brand-border/60 text-slate-300'
                        }`}
                      >
                        <span className={`absolute left-1.5 top-3 w-1.5 h-1.5 rounded-full ${
                          isSuccess 
                            ? 'bg-emerald-400' 
                            : isFailure 
                              ? 'bg-red-500' 
                              : isIntervention 
                                ? 'bg-blue-500' 
                                : 'bg-slate-500'
                        }`} />

                        <div className="flex justify-between text-[10px] text-gray-400 font-semibold mb-0.5">
                          <span className="uppercase font-bold">{log.action}</span>
                          <span>{new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                        <p className="leading-relaxed font-medium">{log.message}</p>
                        {log.agent_reasoning && (
                          <div className="mt-1 bg-brand-dark/60 border-l-2 border-brand-primary p-1.5 rounded text-[10px] text-gray-400 leading-snug">
                            {log.agent_reasoning}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Intervention Simulator (WhatsApp & AI Hinglish Voice Call) */}
              <div className="md:col-span-5 flex flex-col h-full justify-between border-t md:border-t-0 md:border-l border-brand-border/60 pt-3 md:pt-0 md:pl-3">
                
                {/* Visualizer header tabs */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex bg-slate-900 rounded-lg p-0.5 border border-brand-border text-[10px] font-bold">
                    <button
                      onClick={() => setPreviewMode('whatsapp')}
                      className={`px-2 py-1 rounded flex items-center gap-1 transition-all ${
                        previewMode === 'whatsapp' ? 'bg-brand-primary text-white shadow' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Smartphone size={11} />
                      WhatsApp
                    </button>
                    <button
                      onClick={() => setPreviewMode('voice')}
                      className={`px-2 py-1 rounded flex items-center gap-1 transition-all ${
                        previewMode === 'voice' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Volume2 size={11} />
                      AI Voice
                    </button>
                  </div>
                  <span className="text-[9px] text-emerald-400 font-bold uppercase">Dynamic Copy</span>
                </div>

                {/* Main Simulator View */}
                {previewMode === 'whatsapp' ? (
                  /* WhatsApp Phone UI */
                  <div className="flex-grow bg-[#0b141a] rounded-2xl border border-slate-800 p-2 overflow-hidden flex flex-col max-h-[350px] shadow-inner relative">
                    <div className="bg-[#1f2c34] rounded-t-xl px-2 py-1.5 flex items-center justify-between text-white text-[10px] font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center font-sans font-bold text-[9px]">R</span>
                        <div>
                          <span className="block leading-none text-slate-100 font-extrabold text-[9px]">Razorpay Pay</span>
                          <span className="text-[7px] text-emerald-400 leading-none">Online</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-grow p-2 space-y-2 overflow-y-auto flex flex-col justify-end text-[10px] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] scrollbar-thin">
                      {caseDetail.interventions.filter(i => ["whatsapp", "sms", "email", "discount"].includes(i.type)).map((interv, idx) => {
                        const isEmail = interv.type === "email";

                        if (isEmail) {
                          return (
                            <div key={idx} className="bg-slate-900 border border-brand-border rounded-lg p-2 max-w-[90%] self-start text-white shadow-md">
                              <span className="text-[7px] text-gray-500 font-mono border-b border-brand-border pb-1 block mb-1 uppercase font-bold">EMAIL OUTREACH</span>
                              <p className="whitespace-pre-line text-[9px] font-sans font-medium text-slate-200">{interv.details}</p>
                            </div>
                          );
                        }

                        return (
                          <div key={idx} className="bg-[#1f2c34] rounded-lg p-2 max-w-[90%] self-end text-slate-200 shadow relative">
                            <span className="text-[6px] text-emerald-400 font-bold block uppercase tracking-wider mb-0.5">{interv.type} nudge</span>
                            <p className="font-sans leading-relaxed text-[10px]">{interv.details}</p>
                            <span className="text-[7px] text-gray-500 block text-right mt-1">
                              {new Date(interv.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} ✓✓
                            </span>
                          </div>
                        );
                      })}

                      {caseDetail.interventions.filter(i => ["whatsapp", "sms", "email", "discount"].includes(i.type)).length === 0 && (
                        <div className="h-full flex items-center justify-center text-center text-gray-600 font-medium px-4">
                          No messages dispatched yet. Next step scheduled in virtual clock.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Interactive AI Hinglish Voice Recovery Screen */
                  <div className="flex-grow bg-slate-950 rounded-2xl border border-emerald-500/30 p-3 overflow-hidden flex flex-col justify-between max-h-[350px] shadow-inner relative">
                    <div className="text-center pt-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center mb-2 animate-pulse">
                        <Volume2 size={24} />
                      </div>
                      <h5 className="font-bold text-white text-xs">Razorpay AI Assistant</h5>
                      <p className="text-[10px] text-emerald-400 font-mono mt-0.5">Calling {caseDetail.customer_phone}...</p>
                    </div>

                    {/* Animated Audio Waveform */}
                    <div className="flex items-center justify-center gap-1 my-3 h-8">
                      {[40, 75, 30, 90, 60, 100, 45, 80, 50, 70, 95, 35].map((h, i) => (
                        <span 
                          key={i} 
                          className={`w-1 bg-emerald-400 rounded-full transition-all duration-300 ${
                            isPlayingAudio ? 'animate-pulse' : 'opacity-40'
                          }`}
                          style={{ height: isPlayingAudio ? `${h}%` : '20%' }}
                        />
                      ))}
                    </div>

                    {/* Hinglish Audio Transcript */}
                    <div className="bg-slate-900/90 border border-emerald-900/40 rounded-xl p-2.5 text-[10px] text-slate-200 leading-relaxed font-sans max-h-24 overflow-y-auto scrollbar-thin">
                      <strong className="text-emerald-400 block mb-0.5 font-mono text-[9px] uppercase">Spoken Script (Hinglish):</strong>
                      "Namaste {caseDetail.customer_name}! Main Razorpay smart assistant bol raha hoon. Aapka {formatCurrency(caseDetail.amount)} ka payment fail ho gaya tha. Humne aapke registered WhatsApp par 1-click retry link bheja hai. Please check karke complete karein. Dhanyavaad!"
                    </div>

                    {/* Audio Play Button */}
                    <div className="pt-2 flex justify-center">
                      <button
                        onClick={handleToggleVoicePlayback}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all ${
                          isPlayingAudio 
                            ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse' 
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {isPlayingAudio ? (
                          <>
                            <Square size={13} className="fill-current" />
                            Stop Audio
                          </>
                        ) : (
                          <>
                            <Play size={13} className="fill-current" />
                            Play Voice Call (Speech AI)
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions override pane */}
                <div className="mt-3 pt-3 border-t border-brand-border/60">
                  {caseDetail.status === "pending" ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => onApplyOverride("recover")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all"
                        >
                          <CheckCircle size={12} /> Force Paid (MDR Logged)
                        </button>

                        <button
                          onClick={() => onApplyOverride("retry")}
                          className="bg-brand-border hover:bg-slate-700 text-slate-200 text-[10px] font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 border border-slate-700 transition-all"
                        >
                          <RefreshCcw size={12} /> Force Immediate Retry
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => { setShowPromiseForm(!showPromiseForm); setShowMsgForm(false); }}
                          className={`flex-1 text-[10px] py-1 px-2 rounded font-bold border transition-all ${
                            showPromiseForm 
                              ? 'bg-amber-600/20 text-brand-warning border-brand-warning' 
                              : 'bg-brand-dark text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          Promise-to-Pay
                        </button>
                        
                        <button
                          onClick={() => { setShowMsgForm(!showMsgForm); setShowPromiseForm(false); }}
                          className={`flex-1 text-[10px] py-1 px-2 rounded font-bold border transition-all ${
                            showMsgForm 
                              ? 'bg-blue-600/20 text-brand-primary border-brand-primary' 
                              : 'bg-brand-dark text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          Custom Message
                        </button>
                      </div>

                      {/* Promise Form */}
                      {showPromiseForm && (
                        <div className="bg-brand-dark p-2 rounded-lg border border-brand-border flex flex-col gap-1.5 mt-1.5 animate-fadeIn">
                          <span className="text-[9px] text-gray-400">Promise-to-pay Date:</span>
                          <div className="flex gap-1.5">
                            <input
                              type="datetime-local"
                              value={promiseDateStr}
                              onChange={(e) => setPromiseDateStr(e.target.value)}
                              className="bg-slate-900 border border-brand-border rounded text-[10px] p-1 text-white flex-grow focus:outline-none"
                            />
                            <button
                              onClick={() => {
                                if (promiseDateStr) {
                                  onApplyOverride("promise_to_pay", promiseDateStr);
                                  setShowPromiseForm(false);
                                }
                              }}
                              className="bg-brand-primary hover:bg-blue-600 text-white text-[10px] font-bold px-2 rounded"
                            >
                              Set
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Custom Msg Form */}
                      {showMsgForm && (
                        <div className="bg-brand-dark p-2 rounded-lg border border-brand-border flex flex-col gap-1.5 mt-1.5">
                          <span className="text-[9px] text-gray-400">Type Custom Nudge (Hinglish/English):</span>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={customMsgStr}
                              placeholder="e.g., WhatsApp: Hi Rajesh, update card now..."
                              onChange={(e) => setCustomMsgStr(e.target.value)}
                              className="bg-slate-900 border border-brand-border rounded text-[10px] p-1 text-white flex-grow focus:outline-none"
                            />
                            <button
                              onClick={() => {
                                if (customMsgStr) {
                                  onApplyOverride("custom_message", undefined, customMsgStr);
                                  setShowMsgForm(false);
                                }
                              }}
                              className="bg-brand-primary hover:bg-blue-600 text-white text-[10px] font-bold p-1 px-2 rounded flex items-center justify-center"
                            >
                              <Send size={10} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-900/60 p-2 rounded-lg border border-brand-border text-center text-xs text-gray-400 font-semibold">
                      This recovery workflow is closed ({caseDetail.status.toUpperCase()}).
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs text-center px-6">
            <Radio className="animate-pulse mb-3 text-brand-primary/60" size={32} />
            <h4 className="text-sm font-bold text-white mb-1">No Case Selected</h4>
            <p className="max-w-xs text-gray-500 leading-relaxed">
              Select an active or recovered transaction from the stream on the left to inspect the AI agent decision-making path, audit trails, and client interventions.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
