import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart2, TrendingUp, Users, Monitor, RefreshCw,
  AlertTriangle, DollarSign, ShoppingBag, Clock, XCircle,
  Activity, Plus, Sparkles, CheckCircle, Bell, ChevronRight,
  Package, TrendingDown, Zap, ShieldAlert, Info
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
  RadialBarChart, RadialBar, ComposedChart, Line, Legend
} from 'recharts';
import { formatCurrency, getDaysToExpiry } from '../../utils/formatters';
import { managerAPI, alertsAPI, productsAPI, reportsAPI, usersAPI, purchaseRequestsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import ProductAnalyticsModal from '../../components/inventory/ProductAnalyticsModal';

const TABS = ['Overview', 'POS Monitor', 'Cashier Performance', 'All Transactions', 'Purchase Requests'];
const PIE_COLORS = ['#14b8a6', '#8b5cf6', '#f59e0b'];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs shadow-xl">
      <p className="text-muted mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {typeof p.value === 'number' && p.value > 1000 ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

function KPI({ icon: Icon, label, value, sub, color, bg }) {
  return (
    <div className="kpi-card">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon size={18} className={color} />
      </div>
      <p className="text-xl font-black text-primary">{value}</p>
      <p className="text-sm text-muted">{label}</p>
      {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

/* ── Executive AI Insights (Rich Charts) ─────────────────────── */
function ExecutiveAIInsights({ overview, products, revenueData }) {
  const today = overview?.today || {};
  const lowStock = (products || []).filter(p => p.stock <= p.reorder_point);
  const expiringSoon = (products || []).filter(p => {
    const d = getDaysToExpiry(p.expiry_date);
    return d !== null && d <= 7;
  });

  // Sales Velocity: compute hourly-like buckets from revenueData
  // Show last 7 days mini sparkline + velocity score
  const last7 = (revenueData || []).slice(-7);
  const totalRevWeek = last7.reduce((s, d) => s + (d.revenue || 0), 0);
  const avgRevDay = last7.length > 0 ? totalRevWeek / last7.length : 0;
  const latestDay = last7[last7.length - 1];
  const prevDay = last7[last7.length - 2];
  const velocityChange = latestDay && prevDay && prevDay.revenue > 0
    ? ((latestDay.revenue - prevDay.revenue) / prevDay.revenue) * 100
    : 0;

  // Inventory Risk: compute ratio
  const totalProducts = products?.length || 1;
  const riskRatio = ((lowStock.length / totalProducts) * 100).toFixed(0);
  const stockData = [
    { name: 'Healthy', value: totalProducts - lowStock.length, fill: '#10b981' },
    { name: 'Low Stock', value: lowStock.length, fill: '#f59e0b' },
  ].filter(d => d.value > 0);

  // Financial Health: avg margin across products
  const productsWithMargin = (products || []).filter(p => p.unit_price > 0 && p.cost_price >= 0);
  const avgMargin = productsWithMargin.length > 0
    ? productsWithMargin.reduce((s, p) => s + ((p.unit_price - p.cost_price) / p.unit_price * 100), 0) / productsWithMargin.length
    : 0;
  const totalInventoryValue = (products || []).reduce((s, p) => s + (p.stock || 0) * (p.unit_price || 0), 0);
  const totalCostValue = (products || []).reduce((s, p) => s + (p.stock || 0) * (p.cost_price || 0), 0);
  const grossProfit = totalInventoryValue - totalCostValue;

  // Revenue trend for financial chart
  const revenueChartData = last7.map(d => ({
    date: d.date ? d.date.slice(5) : '',
    Revenue: d.revenue || 0,
    Transactions: d.transactions || 0,
  }));

  return (
    <div className="glass-card p-5 relative overflow-hidden">
      <div className="absolute -top-8 -right-8 text-brand-500/5 pointer-events-none">
        <Sparkles size={160} />
      </div>
      <h2 className="section-title mb-5 flex items-center gap-2 relative z-10">
        <Sparkles size={16} className="text-brand-500" /> Executive AI Insights
        <span className="ml-auto text-xs font-normal text-muted bg-brand-500/10 border border-brand-500/20 rounded-full px-2 py-0.5">
          Enterprise Analytics
        </span>
      </h2>

      <div className="grid md:grid-cols-3 gap-4 relative z-10">
        {/* ── Panel 1: Sales Velocity ── */}
        <div className="bg-gradient-to-br from-brand-500/10 to-brand-500/5 border border-brand-500/20 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
              Sales Velocity
            </p>
            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${velocityChange >= 0 ? 'text-emerald-600 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>
              {velocityChange >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {Math.abs(velocityChange).toFixed(1)}%
            </div>
          </div>

          <div>
            <p className="text-2xl font-black text-primary">{formatCurrency(avgRevDay)}</p>
            <p className="text-xs text-muted">avg daily revenue (7d)</p>
          </div>

          <ResponsiveContainer width="100%" height={70}>
            <AreaChart data={revenueChartData} margin={{ top: 2, right: 2, left: -40, bottom: 0 }}>
              <defs>
                <linearGradient id="sv1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="Revenue" stroke="#14b8a6" strokeWidth={2} fill="url(#sv1)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>

          <p className="text-xs text-secondary leading-relaxed">
            {today.total_transactions > 50
              ? '🔥 Peak traffic. Ensure all POS stations are staffed.'
              : velocityChange > 5
              ? '📈 Revenue trending up vs yesterday. Maintain momentum.'
              : velocityChange < -10
              ? '📉 Revenue dipped. Investigate slow-moving cashier stations.'
              : '✅ Steady sales pace. Good time for cycle counts.'}
          </p>
        </div>

        {/* ── Panel 2: Inventory Risk ── */}
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Inventory Risk
            </p>
            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
              Number(riskRatio) > 20 ? 'text-red-500 bg-red-500/10' :
              Number(riskRatio) > 10 ? 'text-amber-500 bg-amber-500/10' :
              'text-emerald-500 bg-emerald-500/10'
            }`}>
              {riskRatio}% at risk
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div style={{ width: 80, height: 80 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stockData} dataKey="value" innerRadius={22} outerRadius={38} paddingAngle={2} startAngle={90} endAngle={-270}>
                    {stockData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" />Low Stock</span>
                <span className="font-black text-amber-500">{lowStock.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" />Expiring ≤7d</span>
                <span className="font-black text-red-500">{expiringSoon.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" />Healthy</span>
                <span className="font-black text-emerald-500">{totalProducts - lowStock.length}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-secondary leading-relaxed">
            {lowStock.length > 10
              ? `🚨 ${lowStock.length} items critically low. Immediate restock required.`
              : lowStock.length > 0
              ? `⚠ ${lowStock.length} items below ROP. Review purchase orders.`
              : '✅ All stock levels are healthy. No immediate action needed.'}
          </p>
        </div>

        {/* ── Panel 3: Financial Health ── */}
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              Financial Health
            </p>
            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
              avgMargin > 30 ? 'text-emerald-500 bg-emerald-500/10' :
              avgMargin > 15 ? 'text-amber-500 bg-amber-500/10' :
              'text-red-500 bg-red-500/10'
            }`}>
              {avgMargin.toFixed(1)}% avg margin
            </span>
          </div>

          <div className="space-y-2">
            <div>
              <p className="text-2xl font-black text-primary">{formatCurrency(today.total_revenue || 0)}</p>
              <p className="text-xs text-muted">today's revenue</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 p-2 rounded-lg bg-surface-2 border border-theme">
                <p className="text-[10px] text-muted">Avg Basket</p>
                <p className="text-xs font-black text-primary">{formatCurrency(today.avg_basket || 0)}</p>
              </div>
              <div className="flex-1 p-2 rounded-lg bg-surface-2 border border-theme">
                <p className="text-[10px] text-muted">Gross Profit (stock)</p>
                <p className="text-xs font-black text-emerald-500">{formatCurrency(grossProfit)}</p>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={45}>
            <BarChart data={revenueChartData.slice(-5)} margin={{ top: 0, right: 0, left: -40, bottom: 0 }}>
              <Bar dataKey="Revenue" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <p className="text-xs text-secondary leading-relaxed">
            {(today.avg_basket || 0) < 15000
              ? '📊 Basket sizes are low. Encourage upselling and cross-promotion.'
              : avgMargin < 15
              ? '⚠ Margins compressed. Review pricing vs cost prices.'
              : '✅ Healthy basket sizes & margins. Maintain current strategy.'}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Overview Tab ─────────────────────────────────────────────── */
function OverviewTab({ overview, alerts, products, revenueData, onAlertRead }) {
  const today = overview?.today || {};
  const pmKeys = Object.keys(today.payment_breakdown || {});
  const pieData = pmKeys.map(k => ({ name: k.replace('_', ' '), value: today.payment_breakdown[k] }));
  const cashierToday = overview?.cashier_today || [];
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [expandedAlert, setExpandedAlert] = useState(null);

  const lowStock = (products || []).filter(p => p.stock <= p.reorder_point);
  const expiringSoon = (products || []).filter(p => {
    const d = getDaysToExpiry(p.expiry_date);
    return d !== null && d <= 7;
  });

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={DollarSign} label="Today's Revenue" value={formatCurrency(today.total_revenue || 0)} color="text-brand-500" bg="bg-brand-500/10" />
        <KPI icon={ShoppingBag} label="Transactions" value={today.total_transactions || 0} sub={`Avg ${formatCurrency(today.avg_basket || 0)}`} color="text-purple-500" bg="bg-purple-500/10" />
        <KPI icon={Monitor} label="Active Sessions" value={overview?.active_sessions || 0} color="text-emerald-500" bg="bg-emerald-500/10" />
        <KPI icon={AlertTriangle} label="Low Stock Items" value={lowStock.length} sub={`${expiringSoon.length} expiring soon`} color="text-amber-500" bg="bg-amber-500/10" />
      </div>

      {/* Executive AI Insights */}
      <ExecutiveAIInsights overview={overview} products={products} revenueData={revenueData} />

      {/* Revenue trend */}
      <div className="glass-card p-5">
        <h2 className="section-title mb-4"><TrendingUp size={16} className="text-brand-500" /> Revenue Trend (Period)</h2>
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="mgGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000000).toFixed(1)}M`} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#14b8a6" strokeWidth={2} fill="url(#mgGrad)" />
            <Area type="monotone" dataKey="transactions" name="Transactions" stroke="#8b5cf6" strokeWidth={1.5} fill="none" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Cashier today */}
        <div className="glass-card p-5 lg:col-span-2">
          <h2 className="section-title mb-4"><Users size={16} className="text-brand-500" /> Cashier Activity Today</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-theme">
                <th className="p-2 text-left text-muted font-bold">Cashier</th>
                <th className="p-2 text-right text-muted font-bold">Txns</th>
                <th className="p-2 text-right text-muted font-bold">Revenue</th>
              </tr></thead>
              <tbody>
                {cashierToday.length === 0 && <tr><td colSpan="3" className="p-4 text-center text-muted">No activity today</td></tr>}
                {cashierToday.map((c, i) => (
                  <tr key={i} className="border-b border-theme/50 hover:bg-surface-2/30">
                    <td className="p-2 font-semibold text-primary">{c.name}</td>
                    <td className="p-2 text-right text-muted">{c.count}</td>
                    <td className="p-2 text-right font-bold text-brand-500">{formatCurrency(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment split */}
        <div className="glass-card p-5">
          <h2 className="section-title mb-4">Payment Split</h2>
          {pieData.length === 0 ? <p className="text-muted text-sm">No transactions today</p> : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {pieData.map((d, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} /><span className="capitalize text-muted">{d.name}</span></span>
                    <span className="font-bold text-primary">{formatCurrency(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Low stock + expiring — CLICKABLE */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Low Stock */}
        <div className="glass-card p-5">
          <h2 className="section-title mb-1"><AlertTriangle size={15} className="text-amber-500" /> Low Stock ({lowStock.length})</h2>
          <p className="text-xs text-muted mb-3">Click a product to view detailed analytics</p>
          <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-0">
            {lowStock.length === 0 && <p className="text-muted text-sm">All stock levels healthy</p>}
            {lowStock.slice(0, 15).map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedProduct(p)}
                className="w-full flex justify-between items-center py-2.5 px-2 border-b border-theme last:border-0 hover:bg-brand-500/5 hover:border-brand-500/20 rounded-lg transition-all group text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-primary group-hover:text-brand-500 transition-colors">{p.name}</p>
                  <p className="text-xs text-muted">Reorder at {p.reorder_point}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-black ${p.stock === 0 ? 'text-red-500' : 'text-amber-500'}`}>{p.stock} left</p>
                  <ChevronRight size={12} className="text-muted group-hover:text-brand-500 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Expiry Tracker */}
        <div className="glass-card p-5">
          <h2 className="section-title mb-1"><Activity size={15} className="text-red-500" /> Expiry Tracker ({expiringSoon.length} at risk)</h2>
          <p className="text-xs text-muted mb-3">Click a product to view expiry analytics</p>
          <div className="max-h-52 overflow-y-auto custom-scrollbar">
            {products.filter(p => p.expiry_date).sort((a,b) => new Date(a.expiry_date)-new Date(b.expiry_date)).slice(0,10).map(p => {
              const days = getDaysToExpiry(p.expiry_date);
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className="w-full flex justify-between items-center py-2.5 px-2 border-b border-theme last:border-0 hover:bg-red-500/5 hover:border-red-500/20 rounded-lg transition-all group text-left"
                >
                  <div>
                    <p className="text-sm font-semibold text-primary group-hover:text-red-500 transition-colors">{p.name}</p>
                    <p className="text-xs text-muted">{p.expiry_date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`status-pill text-xs ${days <= 3 ? 'badge-critical' : days <= 7 ? 'badge-warning' : days <= 30 ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/30' : 'badge-success'}`}>
                      {days <= 0 ? 'EXPIRED' : `${days}d`}
                    </span>
                    <ChevronRight size={12} className="text-muted group-hover:text-red-500 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* System alerts — CLICKABLE & INTERACTIVE */}
      {alerts?.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="section-title mb-1">
            <Bell size={16} className="text-violet-500" /> System Alerts ({alerts.length})
          </h2>
          <p className="text-xs text-muted mb-4">Click an alert to expand details and take action</p>
          <div className="space-y-2">
            {alerts.slice(0, 8).map(a => {
              const isExpanded = expandedAlert === a.id;
              const severityConfig = {
                critical: { border: 'border-red-500/30', bg: 'bg-red-500/5 hover:bg-red-500/10', icon: ShieldAlert, iconColor: 'text-red-500', badge: 'badge-critical' },
                warning: { border: 'border-amber-500/30', bg: 'bg-amber-500/5 hover:bg-amber-500/10', icon: AlertTriangle, iconColor: 'text-amber-500', badge: 'badge-warning' },
              }[a.severity] || { border: 'border-theme', bg: 'bg-surface-2/50 hover:bg-surface-2', icon: Info, iconColor: 'text-blue-500', badge: 'badge-info' };
              const SevIcon = severityConfig.icon;
              const product = a.product_id ? (products || []).find(p => Number(p.id) === Number(a.product_id)) : null;

              return (
                <div
                  key={a.id}
                  className={`rounded-xl border ${severityConfig.border} ${severityConfig.bg} cursor-pointer transition-all duration-200`}
                  onClick={() => setExpandedAlert(isExpanded ? null : a.id)}
                >
                  <div className="flex items-center gap-3 p-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${a.severity === 'critical' ? 'bg-red-500/15' : a.severity === 'warning' ? 'bg-amber-500/15' : 'bg-blue-500/15'}`}>
                      <SevIcon size={14} className={severityConfig.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`status-pill text-[10px] ${severityConfig.badge}`}>{a.severity || 'info'}</span>
                        <span className="text-xs text-muted truncate">
                          {a.created_at ? new Date(a.created_at).toLocaleString() : ''}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-primary truncate">{a.message}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <ChevronRight
                        size={14}
                        className={`text-muted transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-3 border-t border-theme/30" onClick={e => e.stopPropagation()}>
                      <p className="text-xs text-secondary my-2 leading-relaxed">
                        {product ? (
                          <span>
                            System generated alert for{' '}
                            <button
                              onClick={() => setSelectedProduct(product)}
                              className="font-bold text-brand-500 hover:text-brand-400 hover:underline cursor-pointer bg-none border-none p-0 inline-flex items-center gap-0.5"
                            >
                              {product.name} <Activity size={10} className="inline" />
                            </button>
                            :{' '}
                            {a.message}
                          </span>
                        ) : (
                          a.message
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-2 justify-between">
                        <div>
                          {a.severity === 'critical' && (
                            <span className="text-xs text-red-500 font-semibold flex items-center gap-1">
                              <ShieldAlert size={11} /> Immediate action required
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {product && (
                            <button
                              className="btn-primary py-1 px-2.5 text-xs flex items-center gap-1 bg-brand-600 hover:bg-brand-500 text-white border-none shadow-none font-semibold rounded-lg"
                              onClick={() => setSelectedProduct(product)}
                            >
                              <TrendingUp size={11} /> View Statistics
                            </button>
                          )}
                          <button
                            className="btn-secondary py-1 px-2.5 text-xs flex items-center gap-1"
                            onClick={() => { onAlertRead && onAlertRead(a.id); setExpandedAlert(null); }}
                          >
                            <CheckCircle size={11} /> Mark Read
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Product Analytics Modal */}
      {selectedProduct && (
        <ProductAnalyticsModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}

/* ── Tab 2: POS Monitor ──────────────────────────────────────── */
function PosMonitorTab({ startDate, endDate }) {
  const [activeSessions, setActiveSessions] = useState([]);
  const [closedSessions, setClosedSessions] = useState([]);
  const [cashiers, setCashiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forceModal, setForceModal] = useState(null);
  const [reason, setReason] = useState('');
  const [closing, setClosing] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [assignCashierId, setAssignCashierId] = useState('');
  const [assignOpeningBalance, setAssignOpeningBalance] = useState('');
  const [assigning, setAssigning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [active, hist, usr] = await Promise.allSettled([
      managerAPI.allActiveSessions(),
      managerAPI.shiftBreakdowns({ start_date: startDate, end_date: endDate }),
      usersAPI.getAll({ is_active: 1 })
    ]);
    setActiveSessions(active.status === 'fulfilled' ? active.value.data.data || [] : []);
    setClosedSessions(hist.status === 'fulfilled' ? (hist.value.data.data || []).filter(s => s.status !== 'open') : []);
    const activeUsers = usr.status === 'fulfilled' ? (usr.value.data.data || []) : [];
    setCashiers(activeUsers.filter(u => ['cashier', 'manager'].includes(u.role)));
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  const forceClose = async () => {
    if (!forceModal) return;
    setClosing(true);
    try {
      await managerAPI.forceCloseSession(forceModal.id, { reason });
      setForceModal(null); setReason('');
      load();
    } catch (e) { alert('Failed to close session'); }
    setClosing(false);
  };

  const durationMins = (started) => {
    const diff = Date.now() - new Date(started).getTime();
    return Math.floor(diff / 60000);
  };

  const handleAssign = async () => {
    if (!assignCashierId || !assignOpeningBalance) return;
    setAssigning(true);
    try {
      await managerAPI.assignSession({ cashier_id: assignCashierId, opening_balance: Number(assignOpeningBalance) });
      setAssignModal(false);
      setAssignCashierId('');
      setAssignOpeningBalance('');
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to assign shift');
    }
    setAssigning(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="section-title"><Monitor size={16} className="text-emerald-500" /> Live POS Sessions ({activeSessions.length})</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setAssignModal(true)} className="btn-primary text-xs py-1.5"><Plus size={14} className="mr-1" /> Assign Shift</button>
          <button onClick={load} className="btn-secondary text-xs py-1.5"><RefreshCw size={12} /> Refresh</button>
        </div>
      </div>

      {loading ? <p className="text-muted text-sm">Loading...</p> : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-theme">
              {['Cashier','Device','Started','Duration','Sales','Txns','Expected Cash','Action'].map(h => (
                <th key={h} className="p-3 text-left font-bold text-muted text-xs">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {activeSessions.length === 0 && <tr><td colSpan="8" className="p-5 text-center text-muted">No active POS sessions</td></tr>}
              {activeSessions.map(s => (
                <tr key={s.id} className="border-b border-theme/50 hover:bg-surface-2/30">
                  <td className="p-3 font-semibold text-primary">{s.cashier?.name}</td>
                  <td className="p-3 text-muted">{s.device_id || '—'}</td>
                  <td className="p-3 text-muted">{new Date(s.started_at).toLocaleTimeString()}</td>
                  <td className="p-3 text-muted">{durationMins(s.started_at)}m</td>
                  <td className="p-3 font-bold text-brand-500">{formatCurrency(s.stats?.total_sales || 0)}</td>
                  <td className="p-3 text-muted">{s.stats?.total_transactions || 0}</td>
                  <td className="p-3 text-emerald-600 font-bold">{formatCurrency(s.stats?.expected_cash || 0)}</td>
                  <td className="p-3">
                    <button onClick={() => setForceModal(s)} className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1 font-semibold">
                      <XCircle size={13} /> Force Close
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="section-title mt-2"><Clock size={16} className="text-purple-500" /> Shift History</h2>
      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-theme">
            {['Cashier','Status','Opening','Expected','Actual','Variance','Date'].map(h => (
              <th key={h} className="p-3 text-left font-bold text-muted text-xs">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {closedSessions.length === 0 && <tr><td colSpan="7" className="p-5 text-center text-muted">No closed shifts in this period</td></tr>}
            {closedSessions.map(s => {
              const v = s.computed?.variance;
              return (
                <tr key={s.id} className="border-b border-theme/50 hover:bg-surface-2/30">
                  <td className="p-3 font-semibold text-primary">{s.cashier?.name}</td>
                  <td className="p-3"><span className={`status-pill text-xs ${s.status === 'closed' ? 'badge-success' : 'badge-critical'}`}>{s.status}</span></td>
                  <td className="p-3 text-muted">{formatCurrency(s.opening_balance)}</td>
                  <td className="p-3 text-muted">{formatCurrency(s.computed?.expected_cash || 0)}</td>
                  <td className="p-3 text-muted">{s.computed?.actual_cash != null ? formatCurrency(s.computed.actual_cash) : '—'}</td>
                  <td className={`p-3 font-bold ${v === null ? 'text-muted' : v >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {v === null ? '—' : (v >= 0 ? '+' : '') + formatCurrency(v)}
                  </td>
                  <td className="p-3 text-muted">{new Date(s.started_at).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Force close modal */}
      {forceModal && (
        <div className="modal-overlay" onClick={() => setForceModal(null)}>
          <div className="modal-panel max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black text-primary mb-1">Force Close Session</h3>
            <p className="text-sm text-muted mb-4">Cashier: <span className="font-bold text-primary">{forceModal.cashier?.name}</span></p>
            <label className="text-xs font-bold text-muted block mb-1">Reason (required)</label>
            <textarea className="input-field text-sm min-h-[80px] mb-4" placeholder="Enter reason..." value={reason} onChange={e => setReason(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setForceModal(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={forceClose} disabled={!reason.trim() || closing} className="btn-danger flex-1 text-sm">
                {closing ? 'Closing...' : 'Force Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Shift Modal */}
      {assignModal && (
        <div className="modal-overlay" onClick={() => setAssignModal(false)}>
          <div className="modal-panel max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black text-primary mb-1">Assign Shift</h3>
            <p className="text-sm text-muted mb-4">Assign a starting float to a cashier.</p>
            <label className="text-xs font-bold text-muted block mb-1">Select Cashier</label>
            <select className="input-field text-sm mb-3" value={assignCashierId} onChange={e => setAssignCashierId(e.target.value)}>
              <option value="">-- Choose Cashier --</option>
              {cashiers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <label className="text-xs font-bold text-muted block mb-1">Opening Balance (UGX)</label>
            <input type="number" className="input-field text-sm mb-5" placeholder="e.g. 50000" value={assignOpeningBalance} onChange={e => setAssignOpeningBalance(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setAssignModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={handleAssign} disabled={!assignCashierId || !assignOpeningBalance || assigning} className="btn-primary flex-1 text-sm">
                {assigning ? 'Assigning...' : 'Assign Shift'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Tab 3: Cashier Performance ──────────────────────────────── */
function CashierPerfTab({ startDate, endDate }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    managerAPI.cashierPerf({ start_date: startDate, end_date: endDate })
      .then(r => setData(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  if (loading) return <p className="text-muted">Loading...</p>;

  return (
    <div className="space-y-5">
      <div className="glass-card p-5">
        <h2 className="section-title mb-4"><BarChart2 size={16} className="text-brand-500" /> Revenue per Cashier</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000000).toFixed(1)}M`} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="total_revenue" name="Revenue" fill="#14b8a6" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-theme">
            {['Cashier','Email','Transactions','Revenue','Avg Basket','Cash Txns','MoMo Txns'].map(h => (
              <th key={h} className="p-3 text-left font-bold text-muted text-xs">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {data.length === 0 && <tr><td colSpan="7" className="p-5 text-center text-muted">No data in this period</td></tr>}
            {data.map((c, i) => (
              <tr key={i} className="border-b border-theme/50 hover:bg-surface-2/30">
                <td className="p-3 font-semibold text-primary">{c.name}</td>
                <td className="p-3 text-muted text-xs">{c.email}</td>
                <td className="p-3 text-muted">{c.total_transactions}</td>
                <td className="p-3 font-bold text-brand-500">{formatCurrency(c.total_revenue)}</td>
                <td className="p-3 text-muted">{formatCurrency(c.avg_basket)}</td>
                <td className="p-3 text-muted">{c.cash_transactions}</td>
                <td className="p-3 text-muted">{c.momo_transactions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Tab 4: All Transactions ─────────────────────────────────── */
function AllTransactionsTab({ startDate, endDate }) {
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ payment_method: '', status: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await managerAPI.recentTxns({ start_date: startDate, end_date: endDate, limit: 200, ...filter });
      setTxns(r.data.data || []);
    } catch (e) {}
    setLoading(false);
  }, [startDate, endDate, filter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap items-end glass-card p-3">
        <div>
          <label className="text-xs font-bold text-muted block mb-1">Payment Method</label>
          <select className="input-field py-1.5 text-sm" value={filter.payment_method} onChange={e => setFilter(f => ({ ...f, payment_method: e.target.value }))}>
            <option value="">All</option>
            <option value="cash">Cash</option>
            <option value="mtn_momo">MTN MoMo</option>
            <option value="airtel_money">Airtel Money</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-muted block mb-1">Status</label>
          <select className="input-field py-1.5 text-sm" value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
            <option value="">All</option>
            <option value="completed">Completed</option>
            <option value="voided">Voided</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        <button onClick={load} className="btn-primary py-1.5 text-sm h-[38px]">Filter</button>
      </div>

      {loading ? <p className="text-muted">Loading...</p> : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-theme">
              {['Receipt','Cashier','Time','Payment','Amount','Status'].map(h => (
                <th key={h} className="p-3 text-left font-bold text-muted text-xs">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {txns.length === 0 && <tr><td colSpan="6" className="p-5 text-center text-muted">No transactions found</td></tr>}
              {txns.map(t => (
                <tr key={t.id} className="border-b border-theme/50 hover:bg-surface-2/30">
                  <td className="p-3 font-mono text-xs text-primary">{t.receipt_number}</td>
                  <td className="p-3 text-muted">{t.cashier?.name}</td>
                  <td className="p-3 text-muted text-xs">{new Date(t.createdAt || t.created_at).toLocaleString()}</td>
                  <td className="p-3 text-muted capitalize">{t.payment_method?.replace('_', ' ')}</td>
                  <td className="p-3 font-bold text-brand-500">{formatCurrency(t.total_amount)}</td>
                  <td className="p-3">
                    <span className={`status-pill text-xs ${t.status === 'completed' ? 'badge-success' : t.status === 'voided' ? 'badge-critical' : 'badge-warning'}`}>{t.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Tab 5: Purchase Requests ────────────────────────────────── */
function ManagerPurchaseRequestsTab() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [reqRes, prodRes] = await Promise.all([
          purchaseRequestsAPI.getAll(),
          productsAPI.getAll()
        ]);
        setRequests(reqRes.data.data || []);
        setProducts(prodRes.data.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await purchaseRequestsAPI.updateStatus(id, status);
      setRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
    } catch (error) {
      alert(`Failed to ${status} request.`);
    }
  };

  if (loading) return <p className="text-muted">Loading purchase requests...</p>;

  return (
    <div className="space-y-4">
      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-theme">
            <th className="p-4 font-bold text-muted text-left">ID & Date</th>
            <th className="p-4 font-bold text-muted text-left">Items Requested</th>
            <th className="p-4 font-bold text-muted text-left">Reason</th>
            <th className="p-4 font-bold text-muted text-center">Status</th>
            <th className="p-4 font-bold text-muted text-right">Actions</th>
          </tr></thead>
          <tbody>
            {requests.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-muted">No purchase requests found</td></tr>}
            {requests.map(req => (
              <tr key={req.id} className="border-b border-theme/50 hover:bg-surface-2/30">
                <td className="p-4">
                  <p className="font-semibold text-primary">PR #{req.id}</p>
                  <p className="text-xs text-muted">{new Date(req.created_at).toLocaleDateString()}</p>
                </td>
                <td className="p-4">
                  {req.items && req.items.length > 0 ? (
                    <ul className="text-xs space-y-1">
                      {req.items.map((item, idx) => {
                        const prod = products.find(p => p.id === item.product_id);
                        return (
                          <li key={idx} className="flex gap-2">
                            <span className="font-bold text-brand-500">{item.quantity_requested}x</span>
                            <span className="text-secondary">{prod ? prod.name : `Product #${item.product_id}`}</span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : <span className="text-xs text-muted">No items</span>}
                </td>
                <td className="p-4">
                  <p className="text-sm font-medium text-primary">{req.reason}</p>
                  {req.notes && <p className="text-xs text-muted mt-0.5">{req.notes}</p>}
                </td>
                <td className="p-4 text-center">
                  {req.status === 'pending' ? <span className="status-pill badge-warning text-xs">Pending</span>
                    : req.status === 'approved' ? <span className="status-pill badge-success text-xs">Approved</span>
                    : <span className="status-pill badge-critical text-xs">Rejected</span>}
                </td>
                <td className="p-4 text-right">
                  {req.status === 'pending' && (user?.role === 'admin' || user?.role === 'manager') ? (
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleUpdateStatus(req.id, 'approved')} className="btn-secondary px-3 py-1.5 text-emerald-500 hover:bg-emerald-500/10 text-xs font-bold">Approve</button>
                      <button onClick={() => handleUpdateStatus(req.id, 'rejected')} className="btn-secondary px-3 py-1.5 text-red-500 hover:bg-red-500/10 text-xs font-bold">Reject</button>
                    </div>
                  ) : <span className="text-xs text-muted italic">No actions</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Main Dashboard ──────────────────────────────────────────── */
export default function ManagerDashboard() {
  const [tab, setTab] = useState('Overview');
  const [overview, setOverview] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [products, setProducts] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 13); return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchBase = useCallback(async () => {
    setLoading(true);
    const [ov, al, pr, rv] = await Promise.allSettled([
      managerAPI.overview(),
      alertsAPI.getAll({ is_read: 0 }),
      productsAPI.getAll(),
      reportsAPI.daily({ start_date: startDate, end_date: endDate })
    ]);
    setOverview(ov.status === 'fulfilled' ? ov.value.data.data : null);
    setAlerts(al.status === 'fulfilled' ? al.value.data.data || [] : []);
    setProducts(pr.status === 'fulfilled' ? pr.value.data.data || [] : []);
    setRevenueData(rv.status === 'fulfilled' ? rv.value.data.data || [] : []);
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => { fetchBase(); }, [fetchBase]);

  const handleAlertRead = async (alertId) => {
    try {
      await alertsAPI.markRead(alertId);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (e) {}
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-primary flex items-center gap-2">
            <BarChart2 size={22} className="text-purple-500" /> Manager Command Centre
          </h1>
          <p className="text-muted text-sm mt-0.5">Full system oversight — A&B Supermarket</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-2 items-end glass-card p-2 px-3">
            <div>
              <label className="text-[10px] font-bold text-muted uppercase block mb-0.5">From</label>
              <input type="date" className="input-field py-1 text-xs" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted uppercase block mb-0.5">To</label>
              <input type="date" className="input-field py-1 text-xs" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <button onClick={fetchBase} className="btn-secondary text-xs py-1.5"><RefreshCw size={13} /> Refresh</button>
          <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-1.5">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Live
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap border-b border-theme pb-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-xs font-semibold px-4 py-2 rounded-t-xl transition-all ${tab === t ? 'bg-brand-600 text-white' : 'btn-secondary py-2 text-xs'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {loading && tab === 'Overview' ? (
        <div className="flex items-center justify-center h-40"><p className="text-muted">Loading analytics...</p></div>
      ) : (
        <>
          {tab === 'Overview'          && <OverviewTab overview={overview} alerts={alerts} products={products} revenueData={revenueData} onAlertRead={handleAlertRead} />}
          {tab === 'POS Monitor'       && <PosMonitorTab startDate={startDate} endDate={endDate} />}
          {tab === 'Cashier Performance'      && <CashierPerfTab startDate={startDate} endDate={endDate} />}
          {tab === 'All Transactions'  && <AllTransactionsTab startDate={startDate} endDate={endDate} />}
          {tab === 'Purchase Requests' && <ManagerPurchaseRequestsTab />}
        </>
      )}
    </div>
  );
}
