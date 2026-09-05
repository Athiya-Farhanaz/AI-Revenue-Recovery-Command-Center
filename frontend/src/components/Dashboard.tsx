import React, { useState } from 'react';
import { 
  Percent, ShieldCheck, 
  AlertTriangle, Layers, CreditCard, ShoppingBag, 
  FileText, Coins, Sparkles, Radio,
  CheckCircle2, XCircle, Clock, Filter, Download, 
  Trash2, Lightbulb, TrendingUp, ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { Metrics, AuditLog, RecentCaseSummary } from '../types';

interface DashboardProps {
  metrics: Metrics;
  globalLogs: AuditLog[];
  recentCases?: RecentCaseSummary[];
  onSelectCase?: (id: string) => void;
  lastRecoveryAlert?: { name: string; amount: number; channel: string; timestamp: number } | null;
  isStreaming?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  metrics, 
  globalLogs, 
  recentCases = [],
  onSelectCase,
  lastRecoveryAlert,
  isStreaming = true
}) => {
  const [logFilter, setLogFilter] = useState<'all' | 'nudge' | 'recovery' | 'halted'>('all');
  const [isLogsCleared, setIsLogsCleared] = useState<boolean>(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Prepare data for the Bar Chart: At Risk vs Recovered by type
  const barChartData = Object.entries(metrics.by_type).map(([key, data]) => ({
    name: key.toUpperCase(),
    'At Risk': data.at_risk,
    'Recovered': data.recovered,
  }));

  // Prepare data for Pie Chart: Cases status split
  const statusPieData = [
    { name: 'Active In Dunning', value: metrics.active_cases, color: '#f59e0b' },
    { name: 'Recovered', value: metrics.recovered_cases, color: '#10b981' },
    { name: 'Unrecoverable / Halted', value: metrics.failed_cases, color: '#ef4444' },
  ].filter(item => item.value > 0);

  // Filter logs for terminal
  const filteredLogs = isLogsCleared ? [] : globalLogs.filter(log => {
    if (logFilter === 'nudge') return log.action === 'INTERVENTION_SENT';
    if (logFilter === 'recovery') return log.action === 'RECOVERED';
    if (logFilter === 'halted') return log.action === 'FAILED';
    return true;
  });

  // Export audit trail to CSV
  const handleExportCSV = () => {
    if (!globalLogs || globalLogs.length === 0) {
      alert("No audit logs available to export.");
      return;
    }
    const headers = "Timestamp,Action,Case ID,Message,Agent Reasoning\n";
    const rows = globalLogs.map(l => 
      `"${l.created_at}","${l.action}","${l.case_id}","${l.message.replace(/"/g, '""')}","${(l.agent_reasoning || '').replace(/"/g, '""')}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `razorpay_revenue_recovery_audit_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      
      {/* Real-time Telemetry & Live Recovery Alert Banner */}
      <div className="space-y-2">
        {/* Live Recovery Toast / Alert if recent */}
        {lastRecoveryAlert && (
          <div className="bg-gradient-to-r from-emerald-950/90 via-emerald-900/70 to-slate-900 border border-emerald-500/60 p-3 rounded-xl shadow-xl flex items-center justify-between text-xs animate-bounce">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 bg-emerald-500 text-slate-950 rounded-lg font-black">
                <Sparkles size={16} />
              </span>
              <div>
                <span className="text-emerald-300 font-extrabold text-sm mr-2">
                  Live Revenue Win: {formatCurrency(lastRecoveryAlert.amount)}
                </span>
                <span className="text-slate-200">
                  Recovered from <strong className="text-white">{lastRecoveryAlert.name}</strong> via <span className="uppercase text-emerald-400 font-mono font-bold">{lastRecoveryAlert.channel}</span> playbook
                </span>
              </div>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
              JUST NOW
            </span>
          </div>
        )}

        {/* Live Telemetry Strip */}
        <div className="bg-slate-950/80 border border-brand-border rounded-xl px-4 py-2 flex flex-wrap items-center justify-between text-[11px] gap-2 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <Radio size={13} className="text-emerald-400" />
              <span>Gateway Stream: {isStreaming ? 'Online (Real-Time)' : 'Standby'}</span>
            </div>
            <span className="text-gray-600">•</span>
            <span className="text-gray-400 font-mono">TPS: <strong className="text-slate-200">1.4 req/s</strong></span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-400 font-mono">Agent Latency: <strong className="text-slate-200">18ms</strong></span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-400 font-mono">Active Ingestion: <strong className="text-blue-400">Webhook Sink #01</strong></span>
          </div>

          <div className="flex items-center gap-2 text-gray-400 font-mono text-[10px]">
            <span>Model: <strong className="text-indigo-400">gemini-flash-latest</strong></span>
            <span>•</span>
            <span>MDR Rate: <strong className="text-emerald-400">2.0%</strong></span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* At Risk */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 relative overflow-hidden shadow-lg hover:border-red-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Revenue At Risk</p>
              <h3 className="text-2xl font-black mt-1 text-white tracking-tight">{formatCurrency(metrics.total_revenue_at_risk)}</h3>
            </div>
            <div className="p-2.5 bg-red-950/40 text-brand-danger rounded-lg border border-red-900/35">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-gray-400">
            <span className="font-bold text-amber-400 mr-1.5">{metrics.active_cases + metrics.recovered_cases + metrics.failed_cases}</span> total failures ingested
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-brand-danger/30" />
        </div>

        {/* Recovered */}
        <div className={`bg-brand-surface border rounded-xl p-5 relative overflow-hidden shadow-lg transition-all ${
          lastRecoveryAlert ? 'border-emerald-500 shadow-emerald-950/50 scale-[1.01]' : 'border-brand-border'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Revenue Recovered</p>
              <h3 className="text-2xl font-black mt-1 text-emerald-400 tracking-tight">{formatCurrency(metrics.total_revenue_recovered)}</h3>
            </div>
            <div className="p-2.5 bg-emerald-950/40 text-emerald-400 rounded-lg border border-emerald-900/35">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-gray-400">
            <span className="font-bold text-emerald-400 mr-1.5">{metrics.recovered_cases}</span> successful recoveries
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-emerald-500" />
        </div>

        {/* Success Rate */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 relative overflow-hidden shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Recovery Success Rate</p>
              <h3 className="text-2xl font-black mt-1 text-white tracking-tight">{metrics.recovery_rate}%</h3>
            </div>
            <div className="p-2.5 bg-blue-950/40 text-blue-400 rounded-lg border border-blue-900/35">
              <Percent size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-700 ease-out" 
                style={{ width: `${metrics.recovery_rate}%` }}
              />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-500/40" />
        </div>

        {/* Net ROI */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 relative overflow-hidden shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Intervention Net ROI</p>
              <h3 className="text-2xl font-black mt-1 text-indigo-300 tracking-tight">
                {metrics.total_cost > 0 ? `${(metrics.total_revenue_recovered / metrics.total_cost).toFixed(1)}x return` : '0x'}
              </h3>
            </div>
            <div className="p-2.5 bg-indigo-950/40 text-indigo-400 rounded-lg border border-indigo-900/35">
              <Coins size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-gray-400">
            Cost: <span className="font-semibold text-slate-300 mx-1">{formatCurrency(metrics.total_cost)}</span>
            <span className="text-[10px] text-gray-500">(MDR + tokens)</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-500/40" />
        </div>

      </div>

      {/* AI Copilot Strategic Insights */}
      <div className="bg-gradient-to-r from-blue-950/40 via-brand-surface to-slate-900 border border-blue-900/40 rounded-xl p-4 shadow-md">
        <div className="flex items-center gap-2 mb-2.5">
          <Lightbulb size={16} className="text-amber-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Autonomous Recovery Optimization Copilot
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-2.5 bg-brand-dark/80 rounded-lg border border-brand-border/60">
            <span className="text-emerald-400 font-bold text-[11px] block mb-1">
              💼 Mandate Salary Optimizer
            </span>
            <p className="text-gray-400 text-[10px] leading-relaxed">
              Silent card mandate retries are automatically timed to the 30th-3rd of the month, increasing bank approval probability from 12% to 65%.
            </p>
          </div>

          <div className="p-2.5 bg-brand-dark/80 rounded-lg border border-brand-border/60">
            <span className="text-blue-400 font-bold text-[11px] block mb-1">
              🛡️ Margin-Safe Cart Discounts
            </span>
            <p className="text-gray-400 text-[10px] leading-relaxed">
              Cart abandonment coupons (<code className="text-white">SAVE150</code>, <code className="text-white">SAVE500</code>) are margin-bounded, delivering an average 82% margin-positive recovery.
            </p>
          </div>

          <div className="p-2.5 bg-brand-dark/80 rounded-lg border border-brand-border/60">
            <span className="text-indigo-400 font-bold text-[11px] block mb-1">
              💬 Hinglish Conversational Lift
            </span>
            <p className="text-gray-400 text-[10px] leading-relaxed">
              Gemini-generated context-aware Hinglish WhatsApp nudges for PIN and OTP timeouts yield a 78.4% 1-click recovery conversion.
            </p>
          </div>
        </div>
      </div>

      {/* Main Visuals & Live Activity Split Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Recovery Performance by Category */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-sm font-bold text-white">Performance by Failure Stream</h4>
              <p className="text-[11px] text-gray-400">Volume at risk vs recovered (INR)</p>
            </div>
            <div className="flex items-center space-x-2 text-[10px] bg-slate-900 rounded-lg p-1 border border-brand-border">
              <span className="w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
              <span className="text-gray-300 pr-1">At Risk</span>
              <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block"></span>
              <span className="text-gray-300">Recovered</span>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false}
                  tickFormatter={(v) => v >= 100000 ? `₹${(v/100000).toFixed(0)}L` : `₹${(v/1000).toFixed(0)}k`}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(30, 41, 59, 0.4)' }}
                  contentStyle={{ backgroundColor: '#111b2d', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  formatter={(value) => [formatCurrency(Number(value)), '']}
                />
                <Bar dataKey="At Risk" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="Recovered" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* State Distribution Donut */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 shadow-lg flex flex-col">
          <h4 className="text-sm font-bold text-white mb-0.5">Workflow State Distribution</h4>
          <p className="text-[11px] text-gray-400 mb-2">Real-time status of recovery queue</p>
          
          <div className="h-36 flex-grow flex justify-center items-center relative">
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={62}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111b2d', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-500 text-xs flex flex-col items-center">
                <Radio className="animate-pulse mb-1 text-brand-primary" size={20} />
                Streaming active...
              </div>
            )}
            {statusPieData.length > 0 && (
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold text-white">
                  {metrics.active_cases + metrics.recovered_cases + metrics.failed_cases}
                </span>
                <span className="text-[8px] text-gray-400 uppercase font-bold">Total</span>
              </div>
            )}
          </div>

          <div className="mt-2 space-y-1.5">
            {statusPieData.map((entry, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs border-b border-brand-border/40 pb-1 last:border-0 last:pb-0">
                <div className="flex items-center">
                  <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }} />
                  <span className="text-gray-300 text-[11px]">{entry.name}</span>
                </div>
                <span className="text-white font-bold text-[11px]">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Active Ingestion Pipeline Stream */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 shadow-lg flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Live Transaction Feed
              </h4>
              <p className="text-[11px] text-gray-400">Click any card to inspect agent path</p>
            </div>
            <span className="text-[10px] bg-slate-800 text-gray-400 border border-slate-700 px-1.5 py-0.5 rounded font-mono">
              Auto-sync
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[250px] pr-1 scrollbar-thin">
            {recentCases && recentCases.length > 0 ? (
              recentCases.map((c) => {
                let statusBadge = (
                  <span className="bg-amber-950/40 text-amber-400 border border-amber-800/40 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Clock size={10} />
                    Pending (Lvl {c.current_escalation_level}/3)
                  </span>
                );

                if (c.status === 'recovered') {
                  statusBadge = (
                    <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 size={10} />
                      Recovered
                    </span>
                  );
                } else if (c.status === 'failed') {
                  statusBadge = (
                    <span className="bg-red-950/40 text-red-400 border border-red-800/40 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                      <XCircle size={10} />
                      Halted
                    </span>
                  );
                }

                return (
                  <div
                    key={c.id}
                    onClick={() => onSelectCase && onSelectCase(c.id)}
                    className="p-2 bg-brand-dark/80 hover:bg-slate-900 border border-brand-border/60 hover:border-blue-500/50 rounded-lg cursor-pointer transition-all flex items-center justify-between gap-2 text-xs group"
                  >
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white truncate max-w-[110px] group-hover:text-blue-400 transition-colors">{c.customer_name}</span>
                        <span className="text-[9px] text-gray-500 font-mono">#{c.id.slice(-4)}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 truncate max-w-[140px]">
                        {c.failure_code.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="font-mono font-bold text-slate-200 text-[11px]">
                        {formatCurrency(c.amount)}
                      </span>
                      {statusBadge}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-gray-500 text-xs italic py-8 text-center">
                Waiting for incoming webhooks...
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Category breakdown table */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-5 shadow-lg">
        <h4 className="text-sm font-bold text-white mb-3">Intervention Playbook Conversion Stats</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-brand-border text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="pb-2.5 pl-2">Playbook Channel</th>
                <th className="pb-2.5">Total Ingested</th>
                <th className="pb-2.5">Recovered Count</th>
                <th className="pb-2.5">Conversion Rate</th>
                <th className="pb-2.5">At-Risk Value</th>
                <th className="pb-2.5 pr-2 text-right">Net Recovered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/40">
              {Object.entries(metrics.by_type).map(([key, data]) => {
                const rate = data.count > 0 ? ((data.recovered_count / data.count) * 100).toFixed(1) : '0.0';
                
                const typeIcons: Record<string, React.ReactNode> = {
                  payment: <CreditCard className="inline-block mr-1.5 text-blue-400" size={13} />,
                  subscription: <Layers className="inline-block mr-1.5 text-violet-400" size={13} />,
                  checkout: <ShoppingBag className="inline-block mr-1.5 text-emerald-400" size={13} />,
                  invoice: <FileText className="inline-block mr-1.5 text-amber-400" size={13} />
                };

                return (
                  <tr key={key} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2.5 pl-2 font-medium text-white flex items-center text-[11px]">
                      {typeIcons[key]}
                      {key.toUpperCase()}
                    </td>
                    <td className="py-2.5 text-slate-300 font-mono text-[11px]">{data.count}</td>
                    <td className="py-2.5 text-emerald-400 font-semibold font-mono text-[11px]">{data.recovered_count}</td>
                    <td className="py-2.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-200 font-bold text-[11px]">{rate}%</span>
                        <div className="w-14 bg-slate-800 rounded-full h-1">
                          <div 
                            className="bg-emerald-500 h-1 rounded-full"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 text-slate-300 font-mono text-[11px]">{formatCurrency(data.at_risk)}</td>
                    <td className="py-2.5 pr-2 text-right text-emerald-400 font-extrabold font-mono text-[11px]">{formatCurrency(data.recovered)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live System Operations Terminal */}
      <div className="bg-slate-950 border border-emerald-500/25 rounded-xl p-4 shadow-2xl font-mono">
        <div className="flex flex-wrap justify-between items-center mb-2.5 border-b border-slate-900 pb-2.5 gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block animate-pulse"></span>
            <span className="text-emerald-400 font-bold text-xs uppercase ml-1 flex items-center gap-1.5 tracking-wide">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Live Gateway Ingestion Terminal • AI Operations Sink
            </span>
          </div>

          {/* Interactive Tools: Filters + CSV Export + Clear */}
          <div className="flex items-center space-x-2 text-[10px]">
            <div className="flex items-center space-x-1">
              <Filter size={11} className="text-gray-500 mr-0.5" />
              {(['all', 'nudge', 'recovery', 'halted'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => { setLogFilter(f); setIsLogsCleared(false); }}
                  className={`px-2 py-0.5 rounded uppercase font-bold tracking-wider transition-colors ${
                    logFilter === f && !isLogsCleared
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <span className="text-gray-700">|</span>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded flex items-center gap-1 transition-colors"
              title="Export all audit logs to CSV"
            >
              <Download size={10} className="text-blue-400" />
              Export CSV
            </button>

            {/* Clear terminal view */}
            <button
              onClick={() => setIsLogsCleared(!isLogsCleared)}
              className="p-1 hover:bg-slate-900 text-gray-500 hover:text-red-400 rounded transition-colors"
              title="Clear terminal view"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        <div className="h-44 overflow-y-auto space-y-1 pr-2 text-[10px] leading-relaxed text-slate-300 font-mono scrollbar-thin">
          {filteredLogs && filteredLogs.length > 0 ? (
            filteredLogs.map((log) => {
              const timeStr = new Date(log.created_at).toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });

              let badgeColor = "text-blue-400";
              let badgeText = "INGEST";

              if (log.action === "INTERVENTION_SENT") {
                badgeColor = "text-cyan-400";
                badgeText = "NUDGE";
              } else if (log.action === "RECOVERED") {
                badgeColor = "text-emerald-400 font-bold";
                badgeText = "RECOVERY";
              } else if (log.action === "FAILED") {
                badgeColor = "text-red-500 font-bold";
                badgeText = "FAILED";
              } else if (log.action === "PROMISE_RECEIVED") {
                badgeColor = "text-amber-400";
                badgeText = "PROMISE";
              } else if (log.action === "CHECK_STOPPING_RULES") {
                badgeColor = "text-indigo-400";
                badgeText = "COMPLIANCE";
              }

              return (
                <div key={log.id} className="flex items-start space-x-2 border-b border-slate-900/40 pb-1 last:border-0 hover:bg-slate-900/50 px-1 py-0.5 rounded transition-colors font-mono">
                  <span className="text-emerald-600 select-none font-semibold">[{timeStr}]</span>
                  <span className={`${badgeColor} uppercase font-black tracking-wide pr-1 select-none`}>[{badgeText}]</span>
                  <span className="text-gray-500 select-none">ID: <span className="text-slate-300 font-semibold">{log.case_id}</span> •</span>
                  <span className="flex-1 font-medium text-slate-300">{log.message}</span>
                </div>
              );
            })
          ) : (
            <div className="text-slate-600 italic py-8 text-center uppercase tracking-wider font-semibold">
              {isLogsCleared ? 'Terminal output cleared. Waiting for next stream step...' : `No ${logFilter !== 'all' ? logFilter : ''} logs recorded in current window.`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
