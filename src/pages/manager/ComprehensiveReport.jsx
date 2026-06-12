import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Printer, TrendingUp, DollarSign, 
  ShoppingBag, BarChart2, Package, AlertTriangle 
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { reportsAPI, productsAPI, lossesAPI, managerAPI } from '../../services/api';

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs shadow-xl">
      <p className="text-muted mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {typeof p.value === 'number' && p.value > 1000 ? formatCurrency(p.value) : p.value}</p>)}
    </div>
  );
};

export default function ComprehensiveReport() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 13); return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [dailyData, setDailyData] = useState([]);
  const [stats, setStats] = useState({ revenue: 0, transactions: 0, avgBasket: 0, margin: 27.4 });
  const [cashierPerf, setCashierPerf] = useState([]);
  const [products, setProducts] = useState([]);
  const [losses, setLosses] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rep, prd, lss, csh] = await Promise.allSettled([
        reportsAPI.daily({ start_date: startDate, end_date: endDate }),
        productsAPI.getAll(),
        lossesAPI.getAll({ start_date: startDate, end_date: endDate }),
        managerAPI.cashierPerf({ start_date: startDate, end_date: endDate })
      ]);
      
      if (rep.status === 'fulfilled') {
        setDailyData(rep.value.data.data || []);
        const summary = rep.value.data.summary || {};
        setStats(s => ({
          ...s,
          revenue: summary.total_sales || 0,
          transactions: summary.total_transactions || 0,
          avgBasket: summary.average_basket || 0,
        }));
      }
      
      setProducts(prd.status === 'fulfilled' ? prd.value.data.data || [] : []);
      setLosses(lss.status === 'fulfilled' ? lss.value.data.data || [] : []);
      setCashierPerf(csh.status === 'fulfilled' ? csh.value.data.data || [] : []);
      
    } catch (error) {
      console.error('Failed to fetch comprehensive data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted">Loading comprehensive report...</p>
      </div>
    );
  }

  // Derived metrics
  const totalStockValue = products.reduce((sum, p) => sum + (p.stock * p.unit_price), 0);
  const lowStockItems = products.filter(p => p.stock <= p.reorder_point);
  const totalLoss = losses.reduce((sum, l) => sum + (l.estimated_loss || 0), 0);

  return (
    <div className="space-y-5 animate-fade-in print-wrapper">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-primary flex items-center gap-2">
            <FileText size={22} className="text-sky-600 dark:text-sky-400" /> Comprehensive System Report
          </h1>
          <p className="text-muted text-sm mt-0.5">Unified financial and inventory analysis</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="btn-secondary text-xs py-1.5"><Printer size={13} /> Print Report</button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="flex gap-3 flex-wrap items-end glass-card p-3 print:hidden">
        <div>
          <label className="text-xs font-bold text-muted block mb-1">Start Date</label>
          <input type="date" className="input-field py-1.5 text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-bold text-muted block mb-1">End Date</label>
          <input type="date" className="input-field py-1.5 text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <button onClick={fetchData} className="btn-primary py-1.5 text-sm h-[38px]">
          Apply Filter
        </button>
      </div>
      
      {/* Print Date Label */}
      <div className="hidden print:block mb-4 text-sm font-bold text-muted border-b border-theme pb-2">
        Report Period: {startDate} to {endDate}
      </div>

      {/* Section 1: Financial KPIs */}
      <h2 className="text-lg font-black mt-8 mb-3 text-primary border-b border-theme pb-1">1. Financial Overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center mb-3">
            <DollarSign size={18} className="text-brand-600" />
          </div>
          <p className="text-xl font-black text-primary">{formatCurrency(stats.revenue)}</p>
          <p className="text-sm text-muted">Total Revenue</p>
        </div>
        <div className="kpi-card">
          <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center mb-3">
            <ShoppingBag size={18} className="text-purple-600" />
          </div>
          <p className="text-xl font-black text-primary">{stats.transactions}</p>
          <p className="text-sm text-muted">Transactions</p>
        </div>
        <div className="kpi-card">
          <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-3">
            <TrendingUp size={18} className="text-indigo-600" />
          </div>
          <p className="text-xl font-black text-primary">{formatCurrency(stats.avgBasket)}</p>
          <p className="text-sm text-muted">Avg Basket</p>
        </div>
        <div className="kpi-card">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-3">
            <BarChart2 size={18} className="text-emerald-600" />
          </div>
          <p className="text-xl font-black text-primary">{stats.margin}%</p>
          <p className="text-sm text-muted">Gross Margin</p>
        </div>
      </div>

      {/* Section 2: Inventory KPIs */}
      <h2 className="text-lg font-black mt-8 mb-3 text-primary border-b border-theme pb-1">2. Inventory Overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="kpi-card border-amber-500/20">
          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center mb-3">
            <Package size={18} className="text-amber-600" />
          </div>
          <p className="text-xl font-black text-primary">{formatCurrency(totalStockValue)}</p>
          <p className="text-sm text-muted">Total Stock Value</p>
        </div>
        <div className="kpi-card border-red-500/20">
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center mb-3">
            <AlertTriangle size={18} className="text-red-600" />
          </div>
          <p className="text-xl font-black text-red-600">{lowStockItems.length}</p>
          <p className="text-sm text-muted">Low Stock Items</p>
        </div>
        <div className="kpi-card border-rose-500/20">
          <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center mb-3">
            <AlertTriangle size={18} className="text-rose-600" />
          </div>
          <p className="text-xl font-black text-rose-600">{formatCurrency(totalLoss)}</p>
          <p className="text-sm text-muted">Recorded Losses</p>
        </div>
      </div>

      {/* Section 3: Revenue Chart */}
      <div className="glass-card p-5 break-inside-avoid">
        <h2 className="section-title mb-4">Revenue Trend</h2>
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
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000000).toFixed(1)}M`} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#14b8a6" strokeWidth={2} fill="url(#repGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Tables Row */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Cashier Performance */}
        <div className="glass-card p-5 break-inside-avoid">
          <h2 className="section-title mb-4">Cashier Performance</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-theme">
                <th className="p-2 font-bold text-muted text-left">Cashier</th>
                <th className="p-2 font-bold text-muted text-right">Txns</th>
                <th className="p-2 font-bold text-muted text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {cashierPerf.length === 0 ? (
                <tr><td colSpan="3" className="p-4 text-center text-muted">No cashier activity</td></tr>
              ) : cashierPerf.slice(0, 5).map((c, i) => (
                <tr key={i} className="border-b border-theme/50">
                  <td className="p-2 font-semibold">{c.cashier_name}</td>
                  <td className="p-2 text-right text-muted">{c.total_transactions}</td>
                  <td className="p-2 text-right font-bold text-brand-500">{formatCurrency(c.total_revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Low Stock Alerts */}
        <div className="glass-card p-5 break-inside-avoid">
          <h2 className="section-title mb-4">Critical Low Stock</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-theme">
                <th className="p-2 font-bold text-muted text-left">Product</th>
                <th className="p-2 font-bold text-muted text-right">Stock</th>
                <th className="p-2 font-bold text-muted text-right">Shortage</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.length === 0 ? (
                <tr><td colSpan="3" className="p-4 text-center text-muted">No low stock items</td></tr>
              ) : lowStockItems.slice(0, 5).map(p => (
                <tr key={p.id} className="border-b border-theme/50">
                  <td className="p-2 font-semibold">{p.name}</td>
                  <td className="p-2 text-right font-bold text-red-500">{p.stock}</td>
                  <td className="p-2 text-right font-bold text-amber-500">{p.reorder_point - p.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Signature Block */}
      <div className="mt-12 pt-8 border-t border-theme break-inside-avoid">
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
            <p className="text-xs text-muted font-bold uppercase tracking-wider mb-8">Approved By (Director)</p>
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
