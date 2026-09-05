import React, { useState } from 'react';
import { 
  Play, Pause, FastForward, Trash2, Zap, 
  CreditCard, Layers, ShoppingBag, FileText, ShieldAlert,
  Clock, Activity, Gauge
} from 'lucide-react';

interface SimControlsProps {
  onInject: (batchType: string, count: number) => void;
  onTick: (seconds: number) => void;
  onReset: () => void;
  simulatedTime: string;
  isStreaming: boolean;
  onToggleStreaming: () => void;
  streamSpeed: number;
  onChangeSpeed: (speed: number) => void;
}

export const SimControls: React.FC<SimControlsProps> = ({
  onInject,
  onTick,
  onReset,
  simulatedTime,
  isStreaming,
  onToggleStreaming,
  streamSpeed,
  onChangeSpeed
}) => {
  const [tickSeconds, setTickSeconds] = useState<number>(5);

  const formattedTime = () => {
    try {
      const date = new Date(simulatedTime);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) + ' • ' + date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return simulatedTime;
    }
  };

  const isSalaryWindow = () => {
    try {
      const date = new Date(simulatedTime);
      const day = date.getDate();
      return [1, 2, 3, 30, 31].includes(day);
    } catch {
      return false;
    }
  };

  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-4 shadow-xl space-y-3.5 transition-all">
      
      {/* Top Stream Status & Controls Row */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3 border-b border-brand-border/60">
        
        {/* Live Status Indicator */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-8 h-8 rounded-lg border ${
            isStreaming 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/40 dark:border-emerald-800/50 dark:text-emerald-400' 
              : 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/40 dark:border-amber-800/50 dark:text-amber-400'
          }`}>
            <Activity size={16} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold tracking-wide uppercase flex items-center gap-1.5 ${
                isStreaming ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                {isStreaming ? 'Autonomous Recovery Engine Active' : 'Autonomous Engine Standby'}
              </span>
              <span className="bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded font-mono font-medium">
                {streamSpeed}x Speed
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time webhook listener & automated dunning pipeline execution
            </p>
          </div>
        </div>

        {/* Center: Live Digital Simulation Clock */}
        <div className="flex items-center gap-2 bg-brand-dark px-3 py-1.5 rounded-lg border border-brand-border">
          <Clock size={14} className="text-slate-400 dark:text-slate-400" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Simulated Virtual Time</span>
            <span className="text-xs text-slate-800 dark:text-slate-100 font-mono font-semibold tracking-tight">{formattedTime()}</span>
          </div>
          {isSalaryWindow() ? (
            <span className="ml-2 bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
              💼 Salary Window: 65% Mandate Recovery
            </span>
          ) : (
            <span className="ml-2 bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
              Standard Cycle
            </span>
          )}
        </div>

        {/* Right: Stream Playback & Speed Actions */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Pause / Resume Live Streaming */}
          <button
            onClick={onToggleStreaming}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
              isStreaming 
                ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                : 'bg-[#0066FF] hover:bg-[#0052CC] text-white border border-blue-500/30'
            }`}
          >
            {isStreaming ? (
              <>
                <Pause size={13} className="stroke-[2.5]" />
                Pause Stream
              </>
            ) : (
              <>
                <Play size={13} className="fill-current stroke-[2.5]" />
                Resume Stream
              </>
            )}
          </button>

          {/* Speed Selector */}
          <div className="flex bg-brand-dark p-0.5 rounded-lg border border-brand-border text-xs font-medium" title="Simulation Speed: controls how fast virtual time advances in auto-stream">
            {[1, 2, 5].map((speed) => (
              <button
                key={speed}
                onClick={() => onChangeSpeed(speed)}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${
                  streamSpeed === speed 
                    ? 'bg-[#0066FF] text-white font-semibold shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
                title={`${speed}x Simulation Pace (${speed * 5}s virtual time advanced per tick)`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Manual Step Forward */}
          <div className="flex items-center">
            <select
              value={tickSeconds}
              onChange={(e) => setTickSeconds(Number(e.target.value))}
              className="bg-brand-dark border border-brand-border text-slate-700 dark:text-slate-300 text-xs rounded-l-lg py-1.5 px-2 focus:outline-none h-[31px] cursor-pointer"
              title="Select virtual time duration to advance"
            >
              <option value={5}>+5s</option>
              <option value={15}>+15s</option>
              <option value={60}>+1m</option>
              <option value={300}>+5m</option>
            </select>
            <button
              onClick={() => onTick(tickSeconds)}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-y border-r border-brand-border px-2.5 py-1.5 rounded-r-lg text-xs font-medium flex items-center h-[31px] cursor-pointer transition-all"
              title="Advance virtual clock forward by selected seconds to trigger due dunning actions"
            >
              <FastForward size={13} className="mr-1" />
              Step
            </button>
          </div>

          {/* Reset Database */}
          <button
            onClick={() => {
              if (window.confirm("Reset simulation? This resets virtual time and seeds the 3 representative demo cases.")) {
                onReset();
              }
            }}
            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg border border-red-200 dark:border-red-900/40 transition-all cursor-pointer"
            title="Reset Simulation Clock & Re-seed Demo Cases"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Quick Webhook Event Injector Strip: Clean Enterprise Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold text-xs">
          <Zap size={14} className="text-[#0066FF]" />
          <span>Quick Ingest Webhook:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => onInject('payment', 1)}
            className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Ingest UPI PIN failure -> Dispatches WhatsApp Hinglish Recovery"
          >
            <CreditCard size={13} className="text-blue-500" />
            + UPI PIN Fail
          </button>

          <button
            onClick={() => onInject('checkout', 1)}
            className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Ingest checkout abandonment -> Dispatches Margin-Aware Discount Voucher"
          >
            <ShoppingBag size={13} className="text-emerald-500" />
            + Cart Drop
          </button>

          <button
            onClick={() => onInject('subscription', 1)}
            className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Ingest recurring mandate decline -> Dispatches Mandate Retry Sequencer"
          >
            <Layers size={13} className="text-indigo-500" />
            + Mandate Decline
          </button>

          <button
            onClick={() => onInject('invoice', 1)}
            className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Ingest overdue B2B invoice -> Dispatches 3-Tier Tone Escalation"
          >
            <FileText size={13} className="text-amber-500" />
            + B2B Invoice Overdue
          </button>

          <button
            onClick={() => onInject('payment', 5)}
            className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Simulate sudden traffic spike: Ingest 5 mixed failure webhooks"
          >
            <ShieldAlert size={13} className="text-red-500" />
            + 5 Mixed Webhooks
          </button>

          <button
            onClick={() => onInject('mixed', 10)}
            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#0066FF] border border-blue-200 dark:bg-blue-950/40 dark:hover:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Inject batch of 10 mixed failure events"
          >
            <Zap size={13} className="text-[#0066FF] dark:text-blue-400" />
            + Batch (10)
          </button>
        </div>
      </div>

    </div>
  );
};
