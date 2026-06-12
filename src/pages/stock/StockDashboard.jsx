import React, { useState, useEffect } from 'react';
import {
  BarChart2, TrendingUp, Package, AlertTriangle,
  Trash2, RefreshCw, AlertCircle, DollarSign,
  TrendingDown, ChevronRight, ShieldCheck, Activity
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line, Legend
} from 'recharts';
import { formatCurrency, getDaysToExpiry } from '../../utils/formatters';
import { productsAPI, lossesAPI } from '../../services/api';
import ProductAnalyticsModal from '../../components/inventory/ProductAnalyticsModal';

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: '12px',
        color: '#fff',
        fontSize: '12px',
        padding: '8px 12px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      <p style={{ color: '#9ca3af', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 700 }}>
          {p.name}: {typeof p.value === 'number' && p.value > 500 ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

function FinancialHealthCard({ products, losses }) {
  const totalInventoryValue = products.reduce((s, p) => s + (p.stock || 0) * (p.unit_price || 0), 0);
  const totalCostValue = products.reduce((s, p) => s + (p.stock || 0) * (p.cost_price || 0), 0);
  const potentialProfit = totalInventoryValue - totalCostValue;

  const productsWithMargin = products.filter(p => p.unit_price > 0 && p.cost_price >= 0);
  const avgMargin = productsWithMargin.length > 0
    ? productsWithMargin.reduce((s, p) => s + ((p.unit_price - p.cost_price) / p.unit_price * 100), 0) / productsWithMargin.length
    : 0;

  const totalLoss = losses.reduce((s, l) => s + (l.estimated_loss || 0), 0);
  const netValue = potentialProfit - totalLoss;

  // Category breakdown for pie chart
  const catMap = {};
  products.forEach(p => {
    const cat = p.category?.name || 'Other';
    if (!catMap[cat]) catMap[cat] = 0;
    catMap[cat] += (p.stock || 0) * (p.unit_price || 0);
  });
  const categoryData = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  const marginColor = avgMargin > 30 ? '#10b981' : avgMargin > 15 ? '#f59e0b' : '#ef4444';
  const marginLabel = avgMargin > 30 ? 'Excellent' : avgMargin > 15 ? 'Moderate' : 'Low';

  return (
    <div className="glass-card p-5">
      <h2 className="section-title mb-4">
        <DollarSign size={16} className="text-emerald-500" /> Financial Health — Inventory
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          {
            label: 'Retail Value',
            value: formatCurrency(totalInventoryValue),
            icon: TrendingUp,
            color: 'text-brand-500',
            bg: 'bg-brand-500/10',
            sub: 'at selling price'
          },
          {
            label: 'Cost Value',
            value: formatCurrency(totalCostValue),
            icon: Package,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            sub: 'at cost price'
          },
          {
            label: 'Potential Profit',
            value: formatCurrency(potentialProfit),
            icon: ShieldCheck,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            sub: 'if all stock sold'
          },
          {
            label: 'Shrinkage Loss',
            value: formatCurrency(totalLoss),
            icon: Trash2,
            color: 'text-red-500',
            bg: 'bg-red-500/10',
            sub: 'recorded losses'
          },
        ].map((k, i) => (
          <div key={i} className="glass-card-light p-4 rounded-2xl">
            <div className={`w-8 h-8 ${k.bg} rounded-lg flex items-center justify-center mb-2`}>
              <k.icon size={14} className={k.color} />
            </div>
            <p className={`text-sm font-black ${k.color} leading-tight`}>{k.value}</p>
            <p className="text-[11px] text-muted mt-0.5 leading-tight">{k.label}</p>
            <p className="text-[10px] text-muted opacity-70">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Avg Margin Gauge */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-primary">Average Gross Margin</p>
          <div className="relative h-5 bg-surface-2 rounded-full border border-theme overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(avgMargin, 100)}%`, backgroundColor: marginColor }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted">0%</span>
            <span className="text-lg font-black" style={{ color: marginColor }}>{avgMargin.toFixed(1)}% — {marginLabel}</span>
            <span className="text-xs text-muted">100%</span>
          </div>
          <div className="p-3 rounded-xl border border-theme bg-surface-2/50">
            <p className="text-xs text-secondary leading-relaxed">
              {avgMargin > 30
                ? '✅ Healthy margins across the inventory. Continue current pricing strategy.'
                : avgMargin > 15
                ? '⚠ Moderate margins. Review pricing on low-margin product lines.'
                : '🚨 Compressed margins. Audit cost prices vs selling prices immediately.'}
            </p>
          </div>
          {/* Net after losses */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <div>
              <p className="text-xs text-muted">Net Profit (after shrinkage)</p>
              <p className="text-sm font-black text-emerald-500">{formatCurrency(netValue)}</p>
            </div>
            {netValue > 0 ? <TrendingUp size={18} className="text-emerald-500" /> : <TrendingDown size={18} className="text-red-500" />}
          </div>
        </div>

        {/* Inventory Value by Category */}
        <div>
          <p className="text-xs font-bold text-primary mb-2">Stock Value by Category</p>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie
                    data={categoryData} dataKey="value" nameKey="name"
                    innerRadius={35} outerRadius={60} paddingAngle={3}
                  >
                    {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-1">
                {categoryData.map((d, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted truncate">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                      {d.name}
                    </span>
                    <span className="font-bold text-primary">{formatCurrency(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted text-sm">No category data available</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StockDashboard() {
  const [products, setProducts] = useState([]);
  const [losses, setLosses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortOption, setSortOption] = useState('lowest');
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        productsAPI.getAll(),
        lossesAPI.getAll()
      ]);
      setProducts(results[0].status === 'fulfilled' ? (results[0].value.data.data || []) : []);
      setLosses(results[1].status === 'fulfilled' ? (results[1].value.data.data || []) : []);
    } catch (error) {
      console.error('Failed to fetch stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted">Loading stock analytics...</p>
        </div>
      </div>
    );
  }

  const lowStock = products.filter(p => p.stock <= p.reorder_point);
  const outOfStock = products.filter(p => p.stock === 0);
  const expiring7d = products.filter(p => {
    const d = getDaysToExpiry(p.expiry_date);
    return d !== null && d >= 0 && d <= 7;
  });
  const totalLoss = losses.reduce((s, l) => s + (l.estimated_loss || 0), 0);

  const categories = Array.from(new Set(products.map(p => p.category?.name).filter(Boolean))).sort();

  let filteredProducts = products;
  if (filterCategory !== 'all') {
    filteredProducts = products.filter(p => p.category?.name === filterCategory);
  }

  let sortedProducts = [...filteredProducts];
  if (sortOption === 'lowest') {
    sortedProducts.sort((a, b) => a.stock - b.stock);
  } else if (sortOption === 'highest') {
    sortedProducts.sort((a, b) => b.stock - a.stock);
  } else if (sortOption === 'rop') {
    sortedProducts.sort((a, b) => (a.stock - a.reorder_point) - (b.stock - b.reorder_point));
  } else if (sortOption === 'value') {
    sortedProducts.sort((a, b) => (b.stock * b.cost_price) - (a.stock * a.cost_price));
  }

  const chartData = sortedProducts.slice(0, 15).map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    stock: p.stock,
    rop: p.reorder_point,
    category: p.category?.name || 'Uncategorized',
    value: p.stock * (p.cost_price || 0)
  }));

  const KPIs = [
    { label: 'Total Products', value: products.length, icon: Package, color: 'text-brand-500', bg: 'bg-brand-500/10' },
    { label: 'Low Stock', value: lowStock.length, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Out of Stock', value: outOfStock.length, icon: Package, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Expiring ≤7d', value: expiring7d.length, icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Shrinkage Loss', value: formatCurrency(totalLoss), icon: Trash2, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-primary flex items-center gap-2">
            <BarChart2 size={22} className="text-brand-500" /> Stock Analytics
          </h1>
          <p className="text-sm text-muted mt-0.5">Real-time inventory health & movement trends</p>
        </div>
        <button onClick={fetchData} className="btn-secondary text-xs py-1.5">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {KPIs.map((k, i) => (
          <div key={i} className="kpi-card">
            <div className={`w-9 h-9 ${k.bg} rounded-xl flex items-center justify-center mb-2`}>
              <k.icon size={16} className={k.color} />
            </div>
            <p className={`text-xl font-black ${k.color} leading-none`}>{k.value}</p>
            <p className="text-[11px] text-muted mt-1 leading-tight">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Financial Health Section */}
      <FinancialHealthCard products={products} losses={losses} />

      {/* Analytics Chart */}
      <div className="glass-card p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="section-title"><TrendingUp size={16} className="text-brand-500"/> Stock Level Analytics</h2>
            <span className="text-xs text-muted">Showing top 15 out of {filteredProducts.length} items</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="input-field py-1.5 text-xs w-36 bg-surface-2"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              className="input-field py-1.5 text-xs w-44 bg-surface-2"
              value={sortOption}
              onChange={e => setSortOption(e.target.value)}
            >
              <option value="lowest">Lowest Stock First</option>
              <option value="highest">Highest Stock First</option>
              <option value="rop">Closest to ROP</option>
              <option value="value">Highest Total Value</option>
            </select>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.1)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} angle={-25} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            <Bar dataKey="stock" fill="#14b8a6" name="Current Stock" radius={[4,4,0,0]} barSize={24} />
            <Line type="monotone" dataKey="rop" stroke="#fbbf24" strokeWidth={2} name="Reorder Point" dot={{ r: 3, fill: '#fbbf24', strokeWidth: 0 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Expiry Tracker — CLICKABLE */}
      <div className="glass-card p-5">
        <h2 className="section-title mb-1">
          <AlertCircle size={16} className="text-orange-500"/> Expiry Tracker
        </h2>
        <p className="text-xs text-muted mb-4">Click any row to view full product analytics and expiry details</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-theme">
                {['Product', 'SKU', 'Expiry Date', 'Days Left', 'Stock', 'Status', ''].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products
                .filter(p => p.expiry_date && getDaysToExpiry(p.expiry_date) !== null)
                .sort((a, b) => {
                  const daysA = getDaysToExpiry(a.expiry_date);
                  const daysB = getDaysToExpiry(b.expiry_date);
                  const getScore = (d) => {
                    if (d >= 0 && d <= 30) return d;
                    if (d < 0) return 30 + Math.abs(d);
                    return 1000 + d;
                  };
                  return getScore(daysA) - getScore(daysB);
                })
                .slice(0, 20)
                .map(p => {
                  const days = getDaysToExpiry(p.expiry_date);
                  const statusStyle = days <= 0 ? 'badge-critical' : days <= 3 ? 'badge-critical' : days <= 7 ? 'badge-warning' : 'badge-success';
                  const label = days <= 0 ? 'EXPIRED' : days <= 7 ? `${days}d — Urgent` : `${days}d`;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      className="border-b border-theme/50 last:border-0 hover:bg-brand-500/5 transition-colors cursor-pointer group"
                    >
                      <td className="table-cell font-semibold text-primary group-hover:text-brand-500 transition-colors">{p.name}</td>
                      <td className="table-cell font-mono text-xs text-muted">{p.sku}</td>
                      <td className="table-cell text-xs text-muted">{p.expiry_date}</td>
                      <td className="table-cell font-black text-primary">{days <= 0 ? 0 : days}</td>
                      <td className="table-cell font-bold">{p.stock}</td>
                      <td className="table-cell">
                        <span className={`status-pill text-[10px] ${statusStyle}`}>{label}</span>
                      </td>
                      <td className="table-cell">
                        <ChevronRight size={14} className="text-muted group-hover:text-brand-500 transition-colors" />
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Analytics Modal */}
      {selectedProduct && (
        <ProductAnalyticsModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}
