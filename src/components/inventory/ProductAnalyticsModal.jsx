import React, { useState, useEffect } from 'react';
import {
  X, TrendingUp, TrendingDown, Package, DollarSign,
  AlertTriangle, Activity, BarChart2, Clock, Zap, ShieldAlert
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import { formatCurrency, getDaysToExpiry } from '../../utils/formatters';
import { managerAPI } from '../../services/api';

const CHART_COLORS = {
  brand: '#14b8a6',
  purple: '#8b5cf6',
  amber: '#f59e0b',
  red: '#ef4444',
  emerald: '#10b981',
};

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs shadow-xl">
      <p className="text-muted mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {typeof p.value === 'number' && p.value > 500 ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

function StockHealthBar({ current, reorder, max }) {
  const safeMax = max || Math.max(current * 2, reorder * 3, 1);
  const pct = Math.min((current / safeMax) * 100, 100);
  const ropPct = Math.min((reorder / safeMax) * 100, 100);
  const color = current === 0 ? '#ef4444' : current <= reorder ? '#f59e0b' : '#10b981';
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted">
        <span>0</span>
        <span className="text-amber-500 font-bold">ROP: {reorder}</span>
        <span>{safeMax}</span>
      </div>
      <div className="relative h-4 bg-surface-2 rounded-full overflow-hidden border border-theme">
        {/* ROP marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
          style={{ left: `${ropPct}%` }}
        />
        {/* Stock bar */}
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex justify-between text-xs">
        <span style={{ color }} className="font-black">{current} in stock</span>
        <span className={`font-semibold ${current <= reorder ? 'text-amber-500' : 'text-emerald-500'}`}>
          {current <= reorder ? '⚠ Below Reorder Point' : '✓ Healthy'}
        </span>
      </div>
    </div>
  );
}

function ExpiryCountdown({ expiryDate }) {
  if (!expiryDate) return null;
  const days = getDaysToExpiry(expiryDate);
  if (days === null) return null;

  const isExpired = days <= 0;
  const isUrgent = days <= 3;
  const isWarning = days <= 7;

  const color = isExpired ? '#ef4444' : isUrgent ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';
  const label = isExpired ? 'EXPIRED' : isUrgent ? `${days} days — CRITICAL` : isWarning ? `${days} days — Warning` : `${days} days`;
  const ring = Math.max(0, Math.min(100, isExpired ? 0 : (days / 90) * 100));

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border" style={{ borderColor: `${color}40`, backgroundColor: `${color}0a` }}>
      <div className="relative w-16 h-16 flex-shrink-0">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="26" fill="none" stroke="var(--border-color)" strokeWidth="6" />
          <circle
            cx="32" cy="32" r="26" fill="none"
            stroke={color} strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 26}`}
            strokeDashoffset={`${2 * Math.PI * 26 * (1 - ring / 100)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Clock size={18} style={{ color }} />
        </div>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color }}>Expiry Status</p>
        <p className="text-lg font-black text-primary">{label}</p>
        <p className="text-xs text-muted mt-0.5">{expiryDate}</p>
      </div>
    </div>
  );
}

export default function ProductAnalyticsModal({ product: productProp, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productProp?.id) return;
    setLoading(true);
    managerAPI.productAnalytics(productProp.id)
      .then(r => setData(r.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [productProp?.id]);

  if (!productProp) return null;

  const prod = data?.product || {};
  const summary = data?.period_summary || {};
  const dailySales = data?.daily_sales || [];

  const maxStock = Math.max(
    (productProp.stock || productProp.current_stock || 0) * 2,
    (productProp.reorder_point || 0) * 3,
    50
  );

  const currentStock = prod.current_stock ?? productProp.stock ?? productProp.current_stock ?? 0;
  const reorderPoint = prod.reorder_point ?? productProp.reorder_point ?? 0;
  const marginPct = prod.gross_margin_pct ?? (
    productProp.unit_price > 0
      ? ((productProp.unit_price - productProp.cost_price) / productProp.unit_price * 100)
      : 0
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel w-full max-w-3xl animate-fade-in"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: '92vh' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Package size={18} className="text-brand-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                {prod.category || productProp.category?.name || 'Product'}
              </span>
            </div>
            <h2 className="text-xl font-black text-primary leading-tight">
              {prod.name || productProp.name}
            </h2>
            <p className="text-xs text-muted mt-0.5">SKU: {prod.sku || productProp.sku}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-surface-2 transition-colors"
          >
            <X size={18} className="text-muted" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-muted text-sm">Loading analytics...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Top KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  icon: DollarSign, label: 'Selling Price',
                  value: formatCurrency(prod.unit_price ?? productProp.unit_price ?? 0),
                  color: 'text-brand-500', bg: 'bg-brand-500/10'
                },
                {
                  icon: TrendingUp, label: 'Gross Margin',
                  value: `${marginPct.toFixed(1)}%`,
                  color: marginPct > 30 ? 'text-emerald-500' : marginPct > 15 ? 'text-amber-500' : 'text-red-500',
                  bg: marginPct > 30 ? 'bg-emerald-500/10' : marginPct > 15 ? 'bg-amber-500/10' : 'bg-red-500/10'
                },
                {
                  icon: BarChart2, label: '14d Units Sold',
                  value: summary.total_units_sold ?? '—',
                  color: 'text-purple-500', bg: 'bg-purple-500/10'
                },
                {
                  icon: Zap, label: 'Avg/Active Day',
                  value: summary.avg_daily_sales != null ? `${summary.avg_daily_sales} units` : '—',
                  color: 'text-amber-500', bg: 'bg-amber-500/10'
                }
              ].map((k, i) => (
                <div key={i} className="glass-card-light p-4 rounded-2xl">
                  <div className={`w-8 h-8 ${k.bg} rounded-lg flex items-center justify-center mb-2`}>
                    <k.icon size={14} className={k.color} />
                  </div>
                  <p className={`text-base font-black ${k.color}`}>{k.value}</p>
                  <p className="text-[11px] text-muted mt-0.5">{k.label}</p>
                </div>
              ))}
            </div>

            {/* Stock Health Bar */}
            <div className="glass-card p-4">
              <p className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                <Package size={14} className="text-brand-500" /> Stock Health
              </p>
              <StockHealthBar current={currentStock} reorder={reorderPoint} max={maxStock} />
              {summary.days_of_stock_remaining != null && (
                <p className="text-xs text-muted mt-2 text-center">
                  At current sell rate: <span className={`font-bold ${summary.days_of_stock_remaining < 3 ? 'text-red-500' : summary.days_of_stock_remaining < 7 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    ~{summary.days_of_stock_remaining} day{summary.days_of_stock_remaining !== 1 ? 's' : ''} of stock remaining
                  </span>
                </p>
              )}
            </div>

            {/* Expiry Countdown */}
            {(prod.expiry_date || productProp.expiry_date) && (
              <ExpiryCountdown expiryDate={prod.expiry_date || productProp.expiry_date} />
            )}

            {/* Daily Sales Chart */}
            <div className="glass-card p-4">
              <p className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                <Activity size={14} className="text-brand-500" /> Daily Sales — Last 14 Days
              </p>
              {dailySales.length === 0 || dailySales.every(d => d.units_sold === 0) ? (
                <div className="flex items-center justify-center h-32 text-muted text-sm">
                  No sales recorded in this period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={dailySales} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="paGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: 'var(--text-muted)', fontSize: 9 }}
                      tickFormatter={d => d.slice(5)}
                      axisLine={false} tickLine={false}
                    />
                    <YAxis
                      yAxisId="units"
                      tick={{ fill: 'var(--text-muted)', fontSize: 9 }}
                      axisLine={false} tickLine={false}
                    />
                    <YAxis
                      yAxisId="rev"
                      orientation="right"
                      tick={{ fill: 'var(--text-muted)', fontSize: 9 }}
                      axisLine={false} tickLine={false}
                      tickFormatter={v => `${(v / 1000).toFixed(0)}K`}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      yAxisId="units" type="monotone" dataKey="units_sold"
                      name="Units Sold" stroke="#14b8a6" strokeWidth={2} fill="url(#paGrad)"
                    />
                    <Area
                      yAxisId="rev" type="monotone" dataKey="revenue"
                      name="Revenue" stroke="#8b5cf6" strokeWidth={1.5} fill="url(#revGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Financial Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="glass-card-light p-3 rounded-2xl text-center">
                <p className="text-xs text-muted mb-1">Cost Price</p>
                <p className="text-sm font-black text-primary">
                  {formatCurrency(prod.cost_price ?? productProp.cost_price ?? 0)}
                </p>
              </div>
              <div className="glass-card-light p-3 rounded-2xl text-center">
                <p className="text-xs text-muted mb-1">14d Revenue</p>
                <p className="text-sm font-black text-brand-500">
                  {formatCurrency(summary.total_revenue ?? 0)}
                </p>
              </div>
              <div className="glass-card-light p-3 rounded-2xl text-center">
                <p className="text-xs text-muted mb-1">Shrinkage Loss</p>
                <p className="text-sm font-black text-red-500">
                  {formatCurrency(summary.total_loss_value ?? 0)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
