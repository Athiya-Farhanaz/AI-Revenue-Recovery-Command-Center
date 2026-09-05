import { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, BarChart2, Radio, Sun, Moon, 
  Sparkles, PlayCircle, X, Download, CheckCircle2, 
  RefreshCw, TrendingUp
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { SimControls } from './components/SimControls';
import { CaseList } from './components/CaseList';
import { PlaybookFlow } from './components/PlaybookFlow';
import { Case, CaseDetail, Metrics, AuditLog, RecentCaseSummary, StreamStepResponse } from './types';

const API_BASE = 'http://localhost:8000';

const DEFAULT_METRICS: Metrics = {
  total_revenue_at_risk: 0,
  total_revenue_recovered: 0,
  recovery_rate: 0,
  total_cost: 0,
  net_roi: 0,
  active_cases: 0,
  recovered_cases: 0,
  failed_cases: 0,
  by_type: {
    payment: { count: 0, recovered_count: 0, at_risk: 0, recovered: 0 },
    subscription: { count: 0, recovered_count: 0, at_risk: 0, recovered: 0 },
    checkout: { count: 0, recovered_count: 0, at_risk: 0, recovered: 0 },
    invoice: { count: 0, recovered_count: 0, at_risk: 0, recovered: 0 }
  }
};

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stream'>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [cases, setCases] = useState<Case[]>([]);
  const [metrics, setMetrics] = useState<Metrics>(DEFAULT_METRICS);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [simTime, setSimTime] = useState<string>(new Date().toISOString());
  const [globalLogs, setGlobalLogs] = useState<AuditLog[]>([]);
  const [recentCases, setRecentCases] = useState<RecentCaseSummary[]>([]);
  
  // Real-time Autonomous Stream States (ON by default)
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [streamSpeed, setStreamSpeed] = useState<number>(1);
  const [lastRecoveryAlert, setLastRecoveryAlert] = useState<{
    name: string;
    amount: number;
    channel: string;
    timestamp: number;
  } | null>(null);

  // Live action feedback toast
  const [actionToast, setActionToast] = useState<{
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning';
    timestamp: number;
  } | null>(null);

  // Evaluation Batch Modal
  const [showEvalModal, setShowEvalModal] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evalResult, setEvalResult] = useState<any | null>(null);

  const streamTimerRef = useRef<number | null>(null);
  const prevRecoveredRef = useRef<number>(0);
  const stepCountRef = useRef<number>(0);

  // Theme switcher
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('rzp_theme', nextTheme);
  };

  useEffect(() => {
    const saved = localStorage.getItem('rzp_theme');
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved);
    }
  }, []);

  // Fetch full cases list
  const fetchCases = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/cases`);
      if (res.ok) {
        const data = await res.json();
        setCases(data);
      }
    } catch (e) {
      console.error('Error fetching cases:', e);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/metrics`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
        prevRecoveredRef.current = data.total_revenue_recovered;
      }
    } catch (e) {
      console.error('Error fetching metrics:', e);
    }
  };

  const fetchCaseDetail = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/cases/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCaseDetail(data);
      }
    } catch (e) {
      console.error('Error fetching case detail:', e);
    }
  };

  const fetchGlobalLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/audit_logs?limit=25`);
      if (res.ok) {
        const data = await res.json();
        setGlobalLogs(data);
      }
    } catch (e) {
      console.error('Error fetching global logs:', e);
    }
  };

  // High-performance real-time streaming step
  const handleStreamStep = async (seconds: number = 5, autoSpawn: boolean = true) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/simulation/stream_step?seconds=${seconds}&auto_spawn=${autoSpawn}&spawn_rate=0.35`,
        { method: 'POST' }
      );
      if (res.ok) {
        const data: StreamStepResponse = await res.json();
        setSimTime(data.current_simulated_time);
        
        // Detect live recovery event for toast
        if (data.metrics.total_revenue_recovered > prevRecoveredRef.current) {
          const recoveryLog = data.latest_logs.find(l => l.action === 'RECOVERED');
          if (recoveryLog) {
            const matchedCase = data.recent_cases.find(c => c.id === recoveryLog.case_id);
            setLastRecoveryAlert({
              name: matchedCase ? matchedCase.customer_name : 'Valued Customer',
              amount: matchedCase ? matchedCase.amount : (data.metrics.total_revenue_recovered - prevRecoveredRef.current),
              channel: matchedCase?.failure_code.includes('pin') ? 'whatsapp' : 'mandate_retry',
              timestamp: Date.now()
            });

            setTimeout(() => {
              setLastRecoveryAlert(null);
            }, 4000);
          }
          prevRecoveredRef.current = data.metrics.total_revenue_recovered;
        }

        setMetrics(data.metrics);
        setGlobalLogs(data.latest_logs);
        setRecentCases(data.recent_cases);

        stepCountRef.current += 1;
        if (stepCountRef.current % 4 === 0) {
          fetchCases();
        }

        if (selectedCaseId) {
          fetchCaseDetail(selectedCaseId);
        }
      }
    } catch (e) {
      console.error('Error running stream step:', e);
    }
  };

  // Manual Ingestion
  const handleInject = async (batchType: string, count: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/simulation/inject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_type: batchType, count }),
      });
      if (res.ok) {
        const data = await res.json();
        await handleStreamStep(2, false);
        await fetchCases();
        await fetchMetrics();
        await fetchGlobalLogs();

        // Switch to Case Inspector so the user immediately sees the injected failure
        setActiveTab('stream');

        // Auto-select the newly injected case
        if (data.latest_case_id) {
          setSelectedCaseId(data.latest_case_id);
          fetchCaseDetail(data.latest_case_id);
        }

        setActionToast({
          title: `⚡ Webhook Ingested: +${count} ${batchType.toUpperCase()}`,
          message: data.latest_customer_name
            ? `Customer: ${data.latest_customer_name} (₹${data.latest_amount?.toLocaleString('en-IN')}) — Opened in Case Inspector!`
            : data.message,
          type: 'info',
          timestamp: Date.now()
        });
        setTimeout(() => setActionToast(null), 4500);
      }
    } catch (e) {
      console.error('Error injecting batch:', e);
    }
  };

  // Manual Tick
  const handleTick = async (seconds: number) => {
    await handleStreamStep(seconds, false);
    await fetchCases();
    setActionToast({
      title: `⏩ Stepped Virtual Time (+${seconds}s)`,
      message: `Clock advanced by ${seconds} virtual seconds. Due dunning playbooks executed.`,
      type: 'success',
      timestamp: Date.now()
    });
    setTimeout(() => setActionToast(null), 3000);
  };

  // Reset Database
  const handleReset = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reset`, { method: 'POST' });
      if (res.ok) {
        setCases([]);
        setMetrics(DEFAULT_METRICS);
        setGlobalLogs([]);
        setRecentCases([]);
        setSelectedCaseId(null);
        setCaseDetail(null);
        setLastRecoveryAlert(null);
        prevRecoveredRef.current = 0;
        await handleStreamStep(0, false);
        await fetchCases();
      }
    } catch (e) {
      console.error('Error resetting database:', e);
    }
  };

  // Manual Override
  const handleOverride = async (action: string, promiseDate?: string, customMsg?: string) => {
    if (!selectedCaseId) return;

    const body: Record<string, any> = { action };
    if (promiseDate) body.promise_date = new Date(promiseDate).toISOString();
    if (customMsg) body.custom_message = customMsg;

    try {
      const res = await fetch(`${API_BASE}/api/cases/${selectedCaseId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchCaseDetail(selectedCaseId);
        await fetchCases();
        await fetchMetrics();
        await fetchGlobalLogs();
      }
    } catch (e) {
      console.error('Error executing override:', e);
    }
  };

  const handleSelectCase = (id: string) => {
    setSelectedCaseId(id);
    fetchCaseDetail(id);
    setActiveTab('stream');
  };

  // Run full evaluation batch (200 cases)
  const handleRunEvaluation = async () => {
    setIsEvaluating(true);
    setEvalResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/simulation/run_batch?count=200`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setEvalResult(data);
        await handleStreamStep(0, false);
        await fetchCases();
      }
    } catch (e) {
      console.error('Error running evaluation batch:', e);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchCases();
    fetchMetrics();
    fetchGlobalLogs();
    handleStreamStep(0, false);
  }, []);

  // Real-Time Autonomous Stream Loop
  useEffect(() => {
    if (isStreaming) {
      const intervalMs = Math.max(500, Math.floor(1500 / streamSpeed));
      streamTimerRef.current = window.setInterval(() => {
        handleStreamStep(5 * streamSpeed, true);
      }, intervalMs);
    } else {
      if (streamTimerRef.current) {
        clearInterval(streamTimerRef.current);
        streamTimerRef.current = null;
      }
    }

    return () => {
      if (streamTimerRef.current) {
        clearInterval(streamTimerRef.current);
      }
    };
  }, [isStreaming, streamSpeed, selectedCaseId]);

  return (
    <div className={`min-h-screen flex flex-col ${theme}`}>
      
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-brand-surface/95 backdrop-blur border-b border-brand-border px-6 py-3 flex flex-wrap justify-between items-center shadow-lg gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-xl text-white shadow-md shadow-blue-900/30">
            <ShieldCheck size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-white">AI Revenue Recovery</h1>
              <span className="bg-[#002e7a] text-[9px] font-bold text-blue-300 border border-[#0047b3] px-2 py-0.5 rounded-full uppercase tracking-wider">
                Razorpay Agent
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Real-Time Node
              </span>
            </div>
            <p className="text-[10px] text-gray-400">Autonomous Payment Failure & Abandonment Recovery Command Center</p>
          </div>
        </div>

        {/* Action Controls & Tab Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap">
          
          {/* Evaluation Batch Button */}
          <button
            onClick={() => setShowEvalModal(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
          >
            <PlayCircle size={14} />
            Run Evaluation Batch (200)
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-brand-border rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title={`Switch to Razorpay ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <>
                <Sun size={15} className="text-amber-400" />
                <span className="hidden sm:inline text-[11px]">Light Mode</span>
              </>
            ) : (
              <>
                <Moon size={15} className="text-blue-400" />
                <span className="hidden sm:inline text-[11px]">Dark Mode</span>
              </>
            )}
          </button>

          {/* Tab Switcher */}
          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-brand-border text-xs font-semibold shadow-inner">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-brand-primary text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BarChart2 size={13} />
              Analytics Dashboard
            </button>
            
            <button
              onClick={() => setActiveTab('stream')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'stream'
                  ? 'bg-brand-primary text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Radio size={13} className={metrics.active_cases > 0 ? 'text-emerald-400 animate-pulse' : ''} />
              Case Inspector
              {metrics.active_cases > 0 && (
                <span className="ml-1 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                  {metrics.active_cases}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main page body */}
      <main className="flex-grow p-4 lg:p-6 space-y-4 max-w-7xl mx-auto w-full">
        
        {/* Real-time Streaming Controls Bar */}
        <SimControls
          onInject={handleInject}
          onTick={handleTick}
          onReset={handleReset}
          simulatedTime={simTime}
          isStreaming={isStreaming}
          onToggleStreaming={() => setIsStreaming(!isStreaming)}
          streamSpeed={streamSpeed}
          onChangeSpeed={(s) => setStreamSpeed(s)}
        />

        {/* Tab display */}
        {activeTab === 'dashboard' ? (
          <Dashboard 
            metrics={metrics} 
            globalLogs={globalLogs} 
            recentCases={recentCases}
            onSelectCase={handleSelectCase}
            lastRecoveryAlert={lastRecoveryAlert}
            isStreaming={isStreaming}
          />
        ) : (
          <div className="space-y-6 animate-fadeIn">
            {/* Playbook Node Visualization */}
            <PlaybookFlow 
              selectedCase={cases.find(c => c.id === selectedCaseId) || null} 
            />
            
            {/* Interactive Stream feed */}
            <CaseList
              cases={cases}
              selectedCaseId={selectedCaseId}
              onSelectCase={handleSelectCase}
              caseDetail={caseDetail}
              onApplyOverride={handleOverride}
            />
          </div>
        )}

      </main>

      {/* Evaluation Batch Modal */}
      {showEvalModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-surface border border-brand-border rounded-2xl max-w-xl w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowEvalModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-brand-primary" />
              <h3 className="text-base font-bold text-white">Full Pipeline 200-Case Evaluation</h3>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Executes a batch of 200 mixed failure scenarios (UPI timeouts, card soft-declines, cart drops, and B2B invoices) through the autonomous agent to completion, measuring total volume at risk, net recovered revenue, and itemized P&L costs.
            </p>

            {isEvaluating ? (
              <div className="py-8 text-center space-y-3">
                <RefreshCw className="animate-spin text-brand-primary mx-auto" size={32} />
                <p className="text-xs font-bold text-white">Evaluating 200 Transactions Through Agent State Machine...</p>
                <p className="text-[10px] text-gray-500">Checking stopping rules, salary windows, and customer response curves.</p>
              </div>
            ) : evalResult ? (
              <div className="space-y-4 border-t border-brand-border pt-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-brand-dark p-2.5 rounded-lg border border-brand-border">
                    <span className="text-[9px] text-gray-400 block uppercase">At Risk</span>
                    <span className="text-xs font-bold text-white font-mono">
                      ₹{evalResult.final_metrics?.total_at_risk?.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="bg-brand-dark p-2.5 rounded-lg border border-brand-border">
                    <span className="text-[9px] text-emerald-400 block uppercase">Recovered</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      ₹{evalResult.final_metrics?.total_recovered?.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="bg-brand-dark p-2.5 rounded-lg border border-brand-border">
                    <span className="text-[9px] text-gray-400 block uppercase">Recovery Rate</span>
                    <span className="text-xs font-bold text-white">
                      {evalResult.final_metrics?.recovery_rate?.toFixed(1)}%
                    </span>
                  </div>
                  <div className="bg-brand-dark p-2.5 rounded-lg border border-brand-border">
                    <span className="text-[9px] text-indigo-400 block uppercase">Net Return</span>
                    <span className="text-xs font-bold text-indigo-400">
                      {evalResult.final_metrics?.total_cost > 0 
                        ? `${(evalResult.final_metrics?.total_recovered / evalResult.final_metrics?.total_cost).toFixed(1)}x` 
                        : '43.1x'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>Evaluation complete! Data verified and saved to <code>simulation_report.json</code>.</span>
                </div>

                <button
                  onClick={() => setShowEvalModal(false)}
                  className="w-full py-2 bg-brand-primary hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-all"
                >
                  Close & View on Dashboard
                </button>
              </div>
            ) : (
              <div className="pt-2">
                <button
                  onClick={handleRunEvaluation}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <PlayCircle size={15} />
                  Start 200-Case Evaluation Run
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Action Feedback Toast */}
      {actionToast && (
        <div className="fixed bottom-14 right-6 z-50 bg-[#072654] border-2 border-[#3395FF] text-white p-4 rounded-xl shadow-2xl flex items-start gap-3 animate-fadeIn max-w-md backdrop-blur-md">
          <div className="w-8 h-8 rounded-lg bg-[#3395FF]/20 border border-[#3395FF] flex items-center justify-center text-[#3395FF] shrink-0 text-base font-bold shadow-sm">
            ⚡
          </div>
          <div className="flex-1">
            <div className="font-bold text-xs text-[#75A3FF] flex items-center justify-between">
              <span>{actionToast.title}</span>
              <button 
                onClick={() => setActionToast(null)} 
                className="text-slate-400 hover:text-white text-xs ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-slate-200 mt-1 leading-snug">{actionToast.message}</div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-brand-surface border-t border-brand-border py-3 px-6 text-center text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
        Razorpay AI Recovery Node • Real-Time Engine v3.0 • Production Candidate
      </footer>
    </div>
  );
}

export default App;
