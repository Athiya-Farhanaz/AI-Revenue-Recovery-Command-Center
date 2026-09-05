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
          <div className={`relative flex items-center justify-center w-8 h-8 rounded-lg border ${
            isStreaming 
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400' 
              : 'bg-amber-950/40 border-amber-500/50 text-amber-400'
          }`}>
            <Activity size={16} className={isStreaming ? 'animate-pulse' : ''} />
            {isStreaming && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black tracking-wider uppercase flex items-center gap-1.5 ${
                isStreaming ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                {isStreaming ? 'Live Autonomous Stream Active' : 'Autonomous Stream Paused'}
              </span>
              <span className="bg-slate-800 text-[10px] text-gray-400 border border-slate-700 px-1.5 py-0.5 rounded font-mono">
                {streamSpeed}x Speed
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Autonomous AI agent ingesting live gateway webhooks & executing dunning workflows
            </p>
          </div>
        </div>

        {/* Center: Live Digital Simulation Clock */}
        <div className="flex items-center gap-2 bg-brand-dark px-3 py-1.5 rounded-lg border border-brand-border">
          <Clock size={14} className="text-blue-400" />
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">Simulated Virtual Time</span>
            <span className="text-xs text-slate-100 font-mono font-bold tracking-tight">{formattedTime()}</span>
          </div>
          {isSalaryWindow() ? (
            <span className="ml-2 bg-emerald-950/60 text-emerald-400 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
              💼 Salary Window: 65% Mandate Recovery
            </span>
          ) : (
            <span className="ml-2 bg-slate-800 text-gray-400 border border-slate-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
              Standard Cycle
            </span>
          )}
        </div>

        {/* Right: Stream Playback & Speed Actions */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Pause / Resume Live Streaming */}
          <button
            onClick={onToggleStreaming}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-all ${
              isStreaming 
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
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
          <div className="flex bg-brand-dark p-0.5 rounded-lg border border-brand-border text-[11px] font-semibold">
            {[1, 2, 5].map((speed) => (
              <button
                key={speed}
                onClick={() => onChangeSpeed(speed)}
                className={`px-2 py-1 rounded transition-colors ${
                  streamSpeed === speed 
                    ? 'bg-brand-primary text-white font-bold' 
                    : 'text-gray-400 hover:text-white'
                }`}
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
              className="bg-brand-dark border border-brand-border text-slate-300 text-xs rounded-l-lg py-1.5 px-2 focus:outline-none h-[31px]"
            >
              <option value={5}>+5s</option>
              <option value={15}>+15s</option>
              <option value={60}>+1m</option>
              <option value={300}>+5m</option>
            </select>
            <button
              onClick={() => onTick(tickSeconds)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-y border-r border-brand-border px-2.5 py-1.5 rounded-r-lg text-xs font-semibold flex items-center h-[31px]"
              title="Step forward manually"
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
            className="p-1.5 bg-red-950/30 text-red-400 hover:bg-red-600 hover:text-white rounded-lg border border-red-900/40 transition-colors"
            title="Reset Simulation & Data"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Quick Webhook Event Injector Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-gray-400 font-semibold text-[11px]">
          <Zap size={14} className="text-amber-400" />
          <span>Quick Ingest Webhook:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => onInject('payment', 1)}
            className="px-2.5 py-1 bg-brand-dark hover:bg-blue-950/40 text-blue-300 border border-blue-900/40 hover:border-blue-500/50 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all"
            title="Inject UPI / ATM PIN Failure"
          >
            <CreditCard size={12} className="text-blue-400" />
            + UPI PIN Fail
          </button>

          <button
            onClick={() => onInject('checkout', 1)}
            className="px-2.5 py-1 bg-brand-dark hover:bg-emerald-950/40 text-emerald-300 border border-emerald-900/40 hover:border-emerald-500/50 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all"
            title="Inject Abandoned Cart Checkout Drop"
          >
            <ShoppingBag size={12} className="text-emerald-400" />
            + Cart Drop
          </button>

          <button
            onClick={() => onInject('subscription', 1)}
            className="px-2.5 py-1 bg-brand-dark hover:bg-violet-950/40 text-violet-300 border border-violet-900/40 hover:border-violet-500/50 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all"
            title="Inject Subscription Mandate Soft Decline"
          >
            <Layers size={12} className="text-violet-400" />
            + Mandate Decline
          </button>

          <button
            onClick={() => onInject('invoice', 1)}
            className="px-2.5 py-1 bg-brand-dark hover:bg-amber-950/40 text-amber-300 border border-amber-900/40 hover:border-amber-500/50 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all"
            title="Inject B2B Net-30 Invoice Past Due"
          >
            <FileText size={12} className="text-amber-400" />
            + B2B Invoice Overdue
          </button>

          <button
            onClick={() => onInject('payment', 5)}
            className="px-2.5 py-1 bg-brand-dark hover:bg-red-950/40 text-red-300 border border-red-900/40 hover:border-red-500/50 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all"
            title="Inject Mixed Failure Cluster"
          >
            <ShieldAlert size={12} className="text-red-400" />
            + 5 Mixed Webhooks
          </button>

          <button
            onClick={() => onInject('mixed', 10)}
            className="px-2.5 py-1 bg-brand-primary/20 hover:bg-brand-primary/40 text-blue-200 border border-brand-primary/40 hover:border-brand-primary rounded-md text-[11px] font-bold flex items-center gap-1 transition-all"
            title="Inject 10 Mixed Batch"
          >
            <Zap size={12} className="text-brand-primary" />
            + Batch (10)
          </button>
        </div>
      </div>

    </div>
  );
};
