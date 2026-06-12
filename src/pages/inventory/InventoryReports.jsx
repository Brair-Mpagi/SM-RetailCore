import React, { useState, useEffect } from 'react';
import { FileText, Download, Package, AlertTriangle } from 'lucide-react';
import { formatCurrency, getDaysToExpiry } from '../../utils/formatters';
import { productsAPI, lossesAPI } from '../../services/api';

export default function InventoryReports() {
  const [products, setProducts] = useState([]);
  const [losses, setLosses] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        productsAPI.getAll(),
        lossesAPI.getAll({ start_date: startDate, end_date: endDate }),
        import('../../services/api').then(m => m.purchaseOrdersAPI.getAll())
      ]);
      setProducts(results[0].status === 'fulfilled' ? (results[0].value.data.data || []) : []);
      setLosses(results[1].status === 'fulfilled' ? (results[1].value.data.data || []) : []);
      setPurchaseOrders(results[2].status === 'fulfilled' ? (results[2].value.data.data || []) : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted">Loading reports...</p>
      </div>
    );
  }

  const totalStockValue = products.reduce((sum, p) => sum + (p.stock * p.unit_price), 0);
  const lowStockItems = products.filter(p => p.stock <= p.reorder_point);
  const outOfStock = products.filter(p => p.stock === 0);
  const totalLoss = losses.reduce((sum, l) => sum + (l.estimated_loss || 0), 0);
  
  // Filter POs within the date range
  const start = new Date(startDate);
  start.setHours(0,0,0,0);
  const end = new Date(endDate);
  end.setHours(23,59,59,999);
  const recentPOs = purchaseOrders.filter(po => {
    const d = new Date(po.order_date || po.created_at);
    return d >= start && d <= end;
  });

  const recentProducts = products.filter(p => {
    // If the backend doesn't return created_at, this will just be empty
    if (!p.created_at && !p.createdAt) return false;
    const d = new Date(p.createdAt || p.created_at);
    return d >= start && d <= end;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-primary flex items-center gap-2">
            <FileText size={22} className="text-brand-500" /> Inventory Reports
          </h1>
          <p className="text-muted text-sm mt-0.5">Comprehensive stock & logistics analysis</p>
        </div>
        <div className="flex gap-3 flex-wrap items-end glass-card p-2 px-3">
          <div>
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-0.5">Report Start Date</label>
            <input type="date" className="input-field py-1.5 text-xs" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-0.5">Report End Date</label>
            <input type="date" className="input-field py-1.5 text-xs" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <button onClick={fetchData} className="btn-primary py-1.5 text-xs h-[34px] print:hidden">
            Filter
          </button>
          <button onClick={() => window.print()} className="btn-secondary py-1.5 text-xs h-[34px] print:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 inline"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg> Print
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Stock Value', value: formatCurrency(totalStockValue), icon: Package, color: 'text-brand-500', bg: 'bg-brand-500/10' },
          { label: 'Low Stock Items', value: lowStockItems.length, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Purchase Orders', value: recentPOs.length, icon: Package, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'Total Losses', value: formatCurrency(totalLoss), icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
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

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Low Stock Table */}
        <div className="glass-card p-5">
          <h2 className="section-title mb-4">Low Stock Alerts</h2>
          <div className="overflow-x-auto max-h-64 overflow-y-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface-1 z-10">
                <tr className="border-b border-theme">
                  <th className="p-3 font-bold text-muted text-left">Product</th>
                  <th className="p-3 font-bold text-muted text-right">Stock</th>
                  <th className="p-3 font-bold text-muted text-right">Shortage</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.length === 0 ? (
                  <tr><td colSpan="3" className="p-5 text-center text-muted">No low stock items</td></tr>
                ) : lowStockItems.map(p => (
                  <tr key={p.id} className="border-b border-theme/50 hover:bg-surface-2/30">
                    <td className="p-3 font-semibold text-primary">{p.name}</td>
                    <td className="p-3 text-right font-bold text-red-500">{p.stock}</td>
                    <td className="p-3 text-right font-bold text-amber-500">{p.reorder_point - p.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recorded Losses Table */}
        <div className="glass-card p-5">
          <h2 className="section-title mb-4">Recorded Losses (Period)</h2>
          <div className="overflow-x-auto max-h-64 overflow-y-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface-1 z-10">
                <tr className="border-b border-theme">
                  <th className="p-3 font-bold text-muted text-left">Product</th>
                  <th className="p-3 font-bold text-muted text-left">Reason</th>
                  <th className="p-3 font-bold text-muted text-right">Loss Value</th>
                </tr>
              </thead>
              <tbody>
                {losses.length === 0 ? (
                  <tr><td colSpan="3" className="p-5 text-center text-muted">No losses in this period</td></tr>
                ) : losses.map(l => (
                  <tr key={l.id} className="border-b border-theme/50 hover:bg-surface-2/30">
                    <td className="p-3 font-semibold text-primary">{l.product?.name || `Product #${l.product_id}`}</td>
                    <td className="p-3 text-muted capitalize">{l.reason?.replace('_', ' ')}</td>
                    <td className="p-3 text-right font-bold text-rose-500">{formatCurrency(l.estimated_loss)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Purchase Orders Table */}
        <div className="glass-card p-5">
          <h2 className="section-title mb-4">Purchase Orders (Period)</h2>
          <div className="overflow-x-auto max-h-64 overflow-y-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface-1 z-10">
                <tr className="border-b border-theme">
                  <th className="p-3 font-bold text-muted text-left">PO Number</th>
                  <th className="p-3 font-bold text-muted text-left">Date</th>
                  <th className="p-3 font-bold text-muted text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentPOs.length === 0 ? (
                  <tr><td colSpan="3" className="p-5 text-center text-muted">No purchase orders in this period</td></tr>
                ) : recentPOs.map(po => (
                  <tr key={po.id} className="border-b border-theme/50 hover:bg-surface-2/30">
                    <td className="p-3 font-mono text-primary font-bold">{po.po_number}</td>
                    <td className="p-3 text-muted">{new Date(po.order_date).toLocaleDateString()}</td>
                    <td className="p-3 text-right font-bold text-emerald-500">{formatCurrency(po.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* New Products Table */}
        <div className="glass-card p-5">
          <h2 className="section-title mb-4">New Products Added (Period)</h2>
          <div className="overflow-x-auto max-h-64 overflow-y-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface-1 z-10">
                <tr className="border-b border-theme">
                  <th className="p-3 font-bold text-muted text-left">Product</th>
                  <th className="p-3 font-bold text-muted text-left">Category</th>
                  <th className="p-3 font-bold text-muted text-right">Unit Price</th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.length === 0 ? (
                  <tr><td colSpan="3" className="p-5 text-center text-muted">No products added in this period</td></tr>
                ) : recentProducts.map(p => (
                  <tr key={p.id} className="border-b border-theme/50 hover:bg-surface-2/30">
                    <td className="p-3 font-semibold text-primary">{p.name}</td>
                    <td className="p-3 text-muted">{p.category_name || 'N/A'}</td>
                    <td className="p-3 text-right font-bold text-brand-500">{formatCurrency(p.unit_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
            <p className="text-xs text-muted font-bold uppercase tracking-wider mb-8">Prepared By (Stock Personnel)</p>
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
            <p className="text-xs text-muted font-bold uppercase tracking-wider mb-8">Approved By (Manager)</p>
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
