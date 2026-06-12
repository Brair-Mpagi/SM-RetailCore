import React, { useState, useEffect } from 'react';
import { FileText, Download, TrendingUp, DollarSign, ShoppingBag, BarChart2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { reportsAPI } from '../../services/api';

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs shadow-xl">
      <p className="text-muted mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {typeof p.value === 'number' && p.value > 1000 ? formatCurrency(p.value) : p.value}</p>)}
    </div>
  );
};

const REPORT_TYPES = ['Daily', 'Weekly', 'Monthly'];

export default function Reports() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 13);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenue: 0,
    transactions: 0,
    avgBasket: 0,
    margin: 0
  });

  useEffect(() => {
    fetchReports();
  }, []); // Initial load

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.daily({ start_date: startDate, end_date: endDate });
      const data = response.data.data || [];
      const summary = response.data.summary || {};
      
      setDailyData(data);
      setStats({
        revenue: summary.total_sales || 0,
        transactions: summary.total_transactions || 0,
        avgBasket: summary.average_basket || 0,
        margin: 27.4 // This would come from backend calculation
      });
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = "Date,Revenue (UGX),Transactions\n";
    const rows = dailyData.map(d => `${d.date},${d.revenue},${d.transactions}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Revenue_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in print-wrapper">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-primary flex items-center gap-2">
            <FileText size={22} className="text-sky-600 dark:text-sky-400" /> Business & Financial Reports
          </h1>
          <p className="text-muted text-sm mt-0.5">Revenue, sales performance, and financial analytics for management</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="btn-secondary text-xs py-1.5"><Printer size={13} /> Print</button>
          <button onClick={exportCSV} className="btn-primary text-xs py-1.5"><Download size={13} /> CSV</button>
        </div>
      </div>

      {/* Report Filters */}
      <div className="flex gap-3 flex-wrap items-end glass-card p-3">
        <div>
          <label className="text-xs font-bold text-muted block mb-1">Start Date</label>
          <input type="date" className="input-field py-1.5 text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-bold text-muted block mb-1">End Date</label>
          <input type="date" className="input-field py-1.5 text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <button onClick={fetchReports} className="btn-primary py-1.5 text-sm h-[38px]">
          Apply Filter
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: 'Revenue', value: formatCurrency(stats.revenue), color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-500/10 dark:bg-brand-900/60' },
          { icon: ShoppingBag, label: 'Transactions', value: stats.transactions, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10 dark:bg-purple-900/60' },
          { icon: TrendingUp, label: 'Avg Basket', value: formatCurrency(stats.avgBasket), color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10 dark:bg-indigo-900/60' },
          { icon: BarChart2, label: 'Gross Margin', value: `${stats.margin}%`, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-900/60' },
        ].map((k, i) => (
          <div key={i} className="kpi-card">
            <div className={`w-10 h-10 ${k.bg} rounded-xl flex items-center justify-center mb-3`}>
              <k.icon size={18} className={k.color} />
            </div>
            <p className="text-xl font-black text-primary">{k.value}</p>
            <p className="text-sm text-muted">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Cashier Performance Table */}
      <div className="glass-card p-5">
        <h2 className="section-title mb-4">Cashier Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-theme">
                <th className="p-3 font-bold text-muted text-left">Cashier</th>
                <th className="p-3 font-bold text-muted text-right">Transactions</th>
                <th className="p-3 font-bold text-muted text-right">Total Sales</th>
              </tr>
            </thead>
            <tbody>
              {stats.cashier_performance?.map((cashier, idx) => (
                <tr key={idx} className="border-b border-theme/50 hover:bg-surface-2/30">
                  <td className="p-3 font-semibold text-primary">{cashier.name}</td>
                  <td className="p-3 text-right text-muted">{cashier.transactions}</td>
                  <td className="p-3 text-right font-bold text-brand-500">{formatCurrency(cashier.total_sales)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="glass-card p-5">
        <h2 className="section-title mb-4"><TrendingUp size={16} className="text-brand-500 dark:text-brand-400" /> Revenue — Last 14 Days</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={dailyData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="repGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={v => `${(v/1000000).toFixed(1)}M`} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#14b8a6" strokeWidth={2} fill="url(#repGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Signatures & Notes Section - Visible mostly on Print */}
      <div className="mt-12 pt-8 border-t border-theme">
        <div className="mb-8 print:block">
          <h3 className="font-bold text-sm mb-2 text-primary">Notes / Comments:</h3>
          <textarea 
            className="w-full bg-transparent border border-theme rounded-lg p-3 text-sm min-h-[100px] resize-y print:hidden" 
            placeholder="Type any notes here before printing..."
          ></textarea>
          <div className="hidden print:block">
            <div className="border-b border-theme/50 h-8"></div>
            <div className="border-b border-theme/50 h-8"></div>
            <div className="border-b border-theme/50 h-8"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-10 mt-12 print:mt-16">
          <div>
            <p className="text-xs text-muted font-bold uppercase tracking-wider mb-8">Prepared By (Manager)</p>
            <div className="flex gap-2 items-end mb-4">
              <span className="text-sm font-semibold">Name:</span>
              <div className="border-b border-theme/70 flex-1 border-dashed"></div>
            </div>
            <div className="flex gap-2 items-end">
              <span className="text-sm font-semibold">Signature:</span>
              <div className="border-b border-theme/70 flex-1 border-dashed"></div>
              <span className="text-sm font-semibold ml-4">Date:</span>
              <div className="border-b border-theme/70 w-24 border-dashed"></div>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted font-bold uppercase tracking-wider mb-8">Approved By (Director/Owner)</p>
            <div className="flex gap-2 items-end mb-4">
              <span className="text-sm font-semibold">Name:</span>
              <div className="border-b border-theme/70 flex-1 border-dashed"></div>
            </div>
            <div className="flex gap-2 items-end">
              <span className="text-sm font-semibold">Signature:</span>
              <div className="border-b border-theme/70 flex-1 border-dashed"></div>
              <span className="text-sm font-semibold ml-4">Date:</span>
              <div className="border-b border-theme/70 w-24 border-dashed"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
