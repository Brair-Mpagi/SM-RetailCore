import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import InventoryNav from '../../components/inventory/InventoryNav';
import {
  Package, Plus, Search, AlertTriangle, Truck, AlertCircle, Trash2, RefreshCw,
  X, Filter, ClipboardList, TrendingDown, RotateCcw, FileText, BarChart3, Tags,
  Edit2, CheckCircle, Barcode, Tag, ArrowUp, ArrowDown, Save, Smartphone, Camera
} from 'lucide-react';
import { formatCurrency, formatDate, getDaysToExpiry } from '../../utils/formatters';
import { productsAPI, purchaseOrdersAPI, lossesAPI, alertsAPI, inventoryAPI, purchaseRequestsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { io } from 'socket.io-client';
import BarcodeScanner from '../../components/pos/BarcodeScanner';
import ReceiveStockModal from '../../components/inventory/ReceiveStockModal';

const TABS = ['Overview', 'Products', 'Shelf Tags', 'Barcode Labels'];

/* Inline edit modal */
function EditProductModal({ product, categories, suppliers, onSave, onClose }) {
  const [form, setForm] = useState({
    name: product.name || '', unit_price: product.unit_price || '', cost_price: product.cost_price || '',
    reorder_point: product.reorder_point || '', location: product.location || '', barcode: product.barcode || '',
    category_id: product.category_id || '', supplier_id: product.supplier_id || '', expiry_date: product.expiry_date || ''
  });
  const [saving, setSaving] = useState(false);
  
  const [showScanner, setShowScanner] = useState(false);
  const [phoneConnected, setPhoneConnected] = useState(false);
  const [showPhoneScanner, setShowPhoneScanner] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const socketRef = React.useRef(null);
  const handleScanRef = React.useRef(null);

  const BACKEND_URL = '/';
  const SCAN_URL = `${window.location.protocol}//${window.location.hostname}:5173/scan${sessionId ? '?sid='+sessionId : ''}`;

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleScan = (code) => {
    set('barcode', code);
    setShowScanner(false);
  };

  useEffect(() => {
    handleScanRef.current = handleScan;
  }, [handleScan]);

  useEffect(() => {
    const socket = io(BACKEND_URL, { transports: ['websocket', 'polling'], path: '/socket.io' });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_pos');
      setSessionId(socket.id);
    });

    socket.on('scanner_ready', () => {
      setPhoneConnected(true);
    });

    socket.on('barcode_scan', ({ barcode }) => {
      if (handleScanRef.current) handleScanRef.current(barcode);
    });

    socket.on('disconnect', () => {
      setPhoneConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { 
      const payload = { ...form, unit_price: parseFloat(form.unit_price), cost_price: parseFloat(form.cost_price), reorder_point: parseInt(form.reorder_point) };
      if (!payload.expiry_date) payload.expiry_date = null;
      await onSave(product.id, payload); 
      onClose(); 
    }
    catch { alert('Failed to save'); } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2"><Edit2 size={16} className="text-brand-500"/> Edit Product</h2>
          <button onClick={onClose} className="btn-secondary p-2"><X size={16}/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">Name *</label><input required className="input-field" value={form.name} onChange={e => set('name', e.target.value)}/></div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">Category</label>
              <select className="input-field" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                <option value="">— Select Category —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">Supplier</label>
              <select className="input-field" value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)}>
                <option value="">— Select Supplier —</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div><label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">Sell Price</label><input type="number" className="input-field" value={form.unit_price} onChange={e => set('unit_price', e.target.value)}/></div>
            <div><label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">Cost Price</label><input type="number" className="input-field" value={form.cost_price} onChange={e => set('cost_price', e.target.value)}/></div>
            <div><label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">Reorder Point</label><input type="number" className="input-field" value={form.reorder_point} onChange={e => set('reorder_point', e.target.value)}/></div>
            <div><label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">Location</label><input className="input-field" value={form.location} onChange={e => set('location', e.target.value)}/></div>
            <div><label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">Expiry Date</label><input type="date" className="input-field" value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)}/></div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">Barcode</label>
              <div className="flex gap-2">
                <input className="input-field font-mono flex-1" value={form.barcode} onChange={e => set('barcode', e.target.value)}/>
                <button type="button" onClick={() => setShowPhoneScanner(true)} className={`btn-secondary px-2 flex-shrink-0 text-xs transition-colors ${phoneConnected ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400' : ''}`} title="Phone Scanner"><Smartphone size={15}/></button>
                <button type="button" onClick={() => setShowScanner(true)} className="btn-secondary px-2 flex-shrink-0 text-xs" title="Scan barcode"><Camera size={15}/></button>
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center"><Save size={14}/> {saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>

        {showScanner && (
          <BarcodeScanner onDetected={handleScan} onClose={() => setShowScanner(false)} />
        )}

        {/* Phone Scanner Modal */}
        {showPhoneScanner && (
          <div className="modal-overlay" onClick={() => setShowPhoneScanner(false)}>
            <div className="modal-panel max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                  <Smartphone size={18} className="text-brand-500" /> Phone Scanner
                </h2>
                <button onClick={() => setShowPhoneScanner(false)} className="btn-secondary p-2"><X size={18}/></button>
              </div>

              <div className="flex items-center gap-2 mb-4 p-3 rounded-xl border text-sm font-semibold"
                style={{ background: phoneConnected ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                         borderColor: phoneConnected ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)' }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: phoneConnected ? '#10b981' : '#f59e0b', animation: 'pulse 1.5s infinite' }} />
                <span style={{ color: phoneConnected ? '#10b981' : '#f59e0b' }}>
                  {phoneConnected ? 'Scanner relay connected & ready' : 'Relay connecting…'}
                </span>
              </div>

              <div className="bg-white rounded-2xl p-4 mb-4 flex items-center justify-center" style={{ minHeight: 180 }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(SCAN_URL)}`}
                  alt="Scanner QR Code"
                  className="rounded-lg"
                  style={{ width: 160, height: 160 }}
                />
              </div>

              <div className="space-y-2 text-xs text-muted">
                <p className="font-bold text-primary text-sm">How to use:</p>
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>Connect phone to same Wi-Fi as this computer</li>
                  <li>Open camera app → scan the QR code above</li>
                  <li>Or type this URL in phone browser:<br/>
                    <code className="text-brand-500 font-bold text-xs bg-brand-500/10 px-1.5 py-0.5 rounded mt-1 inline-block break-all">{SCAN_URL}</code>
                  </li>
                  <li>Allow camera → point at product barcode</li>
                  <li>Product barcode appears here automatically!</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* Stock Adjust Modal */
function StockModal({ product, onSave, onClose }) {
  const [delta, setDelta] = useState('');
  const [type, setType] = useState('add');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    const qty = parseInt(delta) || 0;
    try { await onSave(product.id, type === 'add' ? qty : -qty, reason); onClose(); }
    catch { alert('Failed to adjust stock'); } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-primary">Adjust Stock — {product.name}</h2>
          <button onClick={onClose} className="btn-secondary p-2"><X size={16}/></button>
        </div>
        <p className="text-sm text-muted mb-4">Current stock: <strong className="text-primary">{product.stock}</strong></p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {['add','remove'].map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`py-2.5 rounded-xl border font-bold text-sm transition-all ${type === t ? (t === 'add' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-600' : 'bg-red-500/20 border-red-500/50 text-red-500') : 'btn-secondary'}`}>
                {t === 'add' ? '+ Add Stock' : '- Remove Stock'}
              </button>
            ))}
          </div>
          <div><label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">Quantity</label>
            <input required type="number" min="1" className="input-field text-xl font-bold text-center" value={delta} onChange={e => setDelta(e.target.value)} placeholder="0"/>
          </div>
          <div><label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">Reason (optional)</label>
            <input className="input-field" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. GRN receipt, correction…"/>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving || !delta} className="btn-primary flex-1 justify-center"><CheckCircle size={14}/> Confirm</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InventoryDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'Overview');
  const [products, setProducts] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [losses, setLosses] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editProduct, setEditProduct] = useState(null);
  const [stockProduct, setStockProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [receiveStockModal, setReceiveStockModal] = useState(null);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        productsAPI.getAll(), 
        purchaseOrdersAPI.getAll(), 
        lossesAPI.getAll(), 
        alertsAPI.getAll({ is_read: 0 }),
        purchaseRequestsAPI.getAll()
      ]);
      
      if (results[0].status === 'fulfilled') setProducts(results[0].value.data.data || []);
      if (results[1].status === 'fulfilled') setPurchaseOrders(results[1].value.data.data || []);
      if (results[2].status === 'fulfilled') setLosses(results[2].value.data.data || []);
      if (results[3].status === 'fulfilled') setAlerts(results[3].value.data.data || []);
      if (results[4].status === 'fulfilled') setPurchaseRequests(results[4].value.data.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await purchaseRequestsAPI.updateStatus(id, status);
      setPurchaseRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
    } catch (error) {
      console.error(`Failed to ${status} request:`, error);
      alert(`Failed to ${status} request. Only Admins can approve or reject.`);
    }
  };

  const handleUpdateProduct = async (id, data) => {
    await productsAPI.update(id, data);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const handleDeleteProduct = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await productsAPI.delete(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleAdjustStock = async (productId, qty, reason) => {
    await inventoryAPI.adjust({ product_id: productId, quantity: qty, reason: reason || 'Manual adjustment', type: qty > 0 ? 'add' : 'remove' });
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: Math.max(0, (p.stock || 0) + qty) } : p));
  };

  const handleReceiveStock = async (poId, payload) => {
    await purchaseOrdersAPI.receive(poId, payload);
    fetchData(); // Refresh everything to get new stock and PO status
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-muted">Loading inventory…</p></div>;

  const lowStockCount = products.filter(p => p.stock <= p.reorder_point).length;
  const expiringSoon = products.filter(p => { const d = getDaysToExpiry(p.expiry_date); return d !== null && d <= 7 && d >= 0; }).length;
  const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search));

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-primary flex items-center gap-2">
            <Package size={22} className="text-amber-500"/> Inventory Management
          </h1>
          <p className="text-muted text-sm mt-0.5">{products.length} products · {lowStockCount} low-stock alerts</p>
        </div>
        <button onClick={() => navigate('/dashboard/inventory/add-product')} className="btn-primary gap-2"><Plus size={16}/> Add Product</button>
      </div>

      {/* Tabs */}
      <InventoryNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <div className="space-y-5">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Products', val: products.length, icon: Package, color: 'text-brand-500', bg: 'bg-brand-500/10' },
              { label: 'Low Stock', val: lowStockCount, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { label: 'Expiring ≤7d', val: expiringSoon, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
              { label: 'Pending POs', val: purchaseOrders.filter(po => po.status !== 'received').length, icon: Truck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            ].map((s, i) => { const Icon = s.icon; return (
              <div key={i} className="kpi-card">
                <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-2`}><Icon size={16} className={s.color}/></div>
                <p className={`text-xl font-black ${s.color} leading-none`}>{s.val}</p>
                <p className="text-[11px] text-muted mt-1 leading-tight">{s.label}</p>
              </div>
            ); })}
          </div>

          {/* Quick Actions */}
          <div className="glass-card p-5">
            <h3 className="font-black text-primary flex items-center gap-2 mb-4"><Package size={16} className="text-brand-500"/> Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { label:'Add Product', desc:'Create new product entries', icon:Plus, color:'brand', path:'/dashboard/inventory/add-product' },
                { label:'Purchase Orders', desc:'Manage supplier orders', icon:Truck, color:'blue', path:'/dashboard/inventory/purchase-order' },
                { label:'Purchase Request', desc:'Request stock replenishment', icon:ClipboardList, color:'purple', path:'/dashboard/inventory/purchase-request' },
                { label:'Stocktake', desc:'Physical inventory count', icon:ClipboardList, color:'emerald', path:'/dashboard/inventory/cycle-count' },
                { label:'Shrinkage', desc:'Track losses and damages', icon:TrendingDown, color:'red', path:'/dashboard/inventory/shrinkage' },
                { label:'Returns', desc:'Process customer returns', icon:RotateCcw, color:'orange', path:'/dashboard/transactions' },
                { label:'Reports', desc:'Inventory analytics', icon:BarChart3, color:'indigo', path:'/dashboard/inventory/reports' },
                { label:'Shelf Tags', desc:'Print & manage price tags', icon:Tags, color:'teal', path:'/dashboard/inventory/print-tags' },
                { label:'Barcode Labels', desc:'Generate & print barcodes', icon:Barcode, color:'violet', path:'/dashboard/inventory/barcode-labels' },
                { label:'Products', desc:'View, edit, delete products', icon:Edit2, color:'amber', tab:'Products' },
              ].map((a, i) => {
                const Icon = a.icon;
                const colorMap = { brand:'brand-500', blue:'blue-500', purple:'purple-500', emerald:'emerald-500', red:'red-500', orange:'orange-500', indigo:'indigo-500', teal:'teal-500', violet:'violet-500', amber:'amber-500' };
                const c = colorMap[a.color] || 'brand-500';
                return (
                  <button key={i} onClick={() => a.tab ? setActiveTab(a.tab) : navigate(a.path)}
                    className="p-4 hover:bg-surface-2/50 hover:border-brand-500/50 hover:shadow-md transition-all text-left group rounded-xl border border-theme dark:border-white/10">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 bg-${c}/10 rounded-xl flex items-center justify-center group-hover:bg-${c}/20 transition-colors`}>
                        <Icon size={20} className={`text-${c}`}/>
                      </div>
                      <div><h4 className="font-bold text-primary mb-1 text-sm">{a.label}</h4><p className="text-xs text-muted">{a.desc}</p></div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="font-black text-primary flex items-center gap-2 mb-4"><AlertCircle size={16} className="text-red-500"/> Active Alerts</h3>
              <div className="space-y-2">
                {alerts.slice(0, 5).map(a => (
                  <div key={a.id} className={`flex items-start gap-2 p-3 rounded-xl border text-xs ${a.severity === 'critical' ? 'bg-red-500/5 border-red-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                    <AlertTriangle size={12} className={a.severity === 'critical' ? 'text-red-500 mt-0.5' : 'text-amber-500 mt-0.5'}/>
                    <p className="text-secondary leading-relaxed flex-1">{a.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Low Stock */}
          {lowStockCount > 0 && (
            <div className="glass-card p-5">
              <h3 className="font-black text-primary flex items-center gap-2 mb-4"><AlertTriangle size={16} className="text-amber-500"/> Low Stock Items</h3>
              <div className="space-y-0">
                {products.filter(p => p.stock <= p.reorder_point).slice(0, 10).map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-theme last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-primary">{p.name}</p>
                      <p className="text-xs text-muted">SKU: {p.sku} · Reorder: {p.reorder_point}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-black ${p.stock === 0 ? 'text-red-500' : 'text-amber-500'}`}>{p.stock} left</p>
                      <button onClick={() => setStockProduct(p)} className="btn-secondary text-xs px-2 py-1 gap-1"><ArrowUp size={11}/> Add</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Products Tab — full  */}
      {activeTab === 'Products' && (
        <div className="space-y-4">
          <div className="glass-card p-2 flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
              <input className="input-field pl-9" placeholder="Search by name, SKU, or barcode…" value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
            <button onClick={() => navigate('/dashboard/inventory/add-product')} className="btn-primary gap-1.5 px-4"><Plus size={15}/> Add</button>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-theme bg-surface-2/50">
                    <th className="p-4 font-bold text-muted text-left">Product</th>
                    <th className="p-4 font-bold text-muted text-left">SKU / Barcode</th>
                    <th className="p-4 font-bold text-muted text-right">Stock</th>
                    <th className="p-4 font-bold text-muted text-right">Price</th>
                    <th className="p-4 font-bold text-muted text-left">Status</th>
                    <th className="p-4 font-bold text-muted text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan="6" className="p-8 text-center text-muted">No products found</td></tr>
                  ) : filtered.map(p => (
                    <tr key={p.id} className="border-b border-theme hover:bg-surface-2/30 transition-colors">
                      <td className="p-4">
                        <p className="font-semibold text-primary">{p.name}</p>
                        {p.location && <p className="text-xs text-muted">📍 {p.location}</p>}
                      </td>
                      <td className="p-4">
                        <p className="font-mono text-xs text-muted">{p.sku}</p>
                        {p.barcode && <p className="font-mono text-xs text-brand-500">{p.barcode}</p>}
                      </td>
                      <td className="p-4 text-right">
                        <span className={`font-bold ${p.stock === 0 ? 'text-red-500' : p.stock <= p.reorder_point ? 'text-amber-500' : 'text-emerald-500'}`}>{p.stock}</span>
                      </td>
                      <td className="p-4 text-right font-mono">{formatCurrency(p.unit_price)}</td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 items-start">
                          {p.stock === 0 ? <span className="status-pill badge-critical text-xs">Out of Stock</span>
                            : p.stock <= p.reorder_point ? <span className="status-pill badge-warning text-xs">Low Stock</span>
                            : <span className="status-pill badge-success text-xs">In Stock</span>}
                          {(() => {
                            const daysToExpiry = getDaysToExpiry(p.expiry_date);
                            if (daysToExpiry !== null && daysToExpiry < 0) {
                              return <span className="status-pill badge-critical text-[10px] py-0.5 px-2">Expired</span>;
                            }
                            return null;
                          })()}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => setStockProduct(p)} className="btn-secondary p-1.5 text-emerald-500 hover:bg-emerald-500/10" title="Adjust Stock"><ArrowUp size={13}/></button>
                          <button onClick={() => setEditProduct(p)} className="btn-secondary p-1.5 text-brand-500 hover:bg-brand-500/10" title="Edit"><Edit2 size={13}/></button>
                          <button onClick={() => navigate(`/dashboard/inventory/barcode-labels`)} className="btn-secondary p-1.5 text-violet-500 hover:bg-violet-500/10" title="Generate Label"><Barcode size={13}/></button>
                          <button onClick={() => handleDeleteProduct(p.id, p.name)} className="btn-secondary p-1.5 text-red-500 hover:bg-red-500/10" title="Delete"><Trash2 size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Requests Tab */}
      {activeTab === 'Purchase Requests' && (
        <div className="space-y-4">
          <div className="glass-card flex items-center justify-between p-4">
            <div>
              <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                <ClipboardList size={18} className="text-purple-500" /> Purchase Requests
              </h2>
              <p className="text-xs text-muted mt-0.5">Approve or reject stock replenishment requests</p>
            </div>
            <button onClick={() => navigate('/dashboard/inventory/purchase-request')} className="btn-primary gap-1.5 text-xs px-3 py-1.5">
              <Plus size={14} /> New Request
            </button>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-theme bg-surface-2/50">
                    <th className="p-4 font-bold text-muted text-left">ID & Date</th>
                    <th className="p-4 font-bold text-muted text-left">Items Requested</th>
                    <th className="p-4 font-bold text-muted text-left">Reason & Notes</th>
                    <th className="p-4 font-bold text-muted text-center">Status</th>
                    <th className="p-4 font-bold text-muted text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseRequests.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-muted">No purchase requests found</td></tr>
                  ) : purchaseRequests.map(req => (
                    <tr key={req.id} className="border-b border-theme hover:bg-surface-2/30 transition-colors">
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
                        ) : (
                          <span className="text-xs text-muted">No items</span>
                        )}
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
                            <button onClick={() => handleUpdateStatus(req.id, 'approved')} className="btn-secondary p-1.5 text-emerald-500 hover:bg-emerald-500/10" title="Approve"><CheckCircle size={14}/></button>
                            <button onClick={() => handleUpdateStatus(req.id, 'rejected')} className="btn-secondary p-1.5 text-red-500 hover:bg-red-500/10" title="Reject"><X size={14}/></button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted italic">No actions</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Orders Tab */}
      {activeTab === 'Purchase Orders' && (
        <div className="space-y-4">
          <div className="glass-card flex items-center justify-between p-4">
            <div>
              <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                <Truck size={18} className="text-blue-500" /> Purchase Orders
              </h2>
              <p className="text-xs text-muted mt-0.5">Track and receive orders from suppliers</p>
            </div>
            <button onClick={() => navigate('/dashboard/inventory/purchase-order')} className="btn-primary gap-1.5 text-xs px-3 py-1.5">
              <Plus size={14} /> New PO
            </button>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-theme bg-surface-2/50">
                    <th className="p-4 font-bold text-muted text-left">PO # & Date</th>
                    <th className="p-4 font-bold text-muted text-left">Supplier</th>
                    <th className="p-4 font-bold text-muted text-left">Items</th>
                    <th className="p-4 font-bold text-muted text-center">Status</th>
                    <th className="p-4 font-bold text-muted text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-muted">No purchase orders found</td></tr>
                  ) : purchaseOrders.map(po => (
                    <tr key={po.id} className="border-b border-theme hover:bg-surface-2/30 transition-colors">
                      <td className="p-4">
                        <p className="font-semibold text-primary">PO #{po.id}</p>
                        <p className="text-xs text-muted">{new Date(po.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-secondary">{po.supplier?.name || `Supplier #${po.supplier_id}`}</p>
                        {po.expected_at && <p className="text-xs text-muted">Expected: {new Date(po.expected_at).toLocaleDateString()}</p>}
                      </td>
                      <td className="p-4">
                        <ul className="text-xs space-y-1">
                          {po.items?.map((item, idx) => {
                            const isFullyReceived = item.quantity_received >= item.quantity_ordered;
                            return (
                              <li key={idx} className="flex gap-2 items-center">
                                <span className={`font-bold ${isFullyReceived ? 'text-emerald-500' : 'text-brand-500'}`}>
                                  {item.quantity_received}/{item.quantity_ordered}
                                </span>
                                <span className="text-secondary truncate w-32" title={item.product?.name}>
                                  {item.product?.name || `Product #${item.product_id}`}
                                </span>
                                {isFullyReceived && <CheckCircle size={12} className="text-emerald-500"/>}
                              </li>
                            );
                          })}
                        </ul>
                      </td>
                      <td className="p-4 text-center">
                        {po.status === 'draft' || po.status === 'pending' ? <span className="status-pill badge-warning text-xs">Awaiting Delivery</span>
                          : po.status === 'partially_received' ? <span className="status-pill badge-warning text-xs border border-amber-500/20">Partially Received</span>
                          : po.status === 'received' ? <span className="status-pill badge-success text-xs">Fully Received</span>
                          : <span className="status-pill badge-critical text-xs capitalize">{po.status}</span>}
                      </td>
                      <td className="p-4 text-right">
                        {po.status !== 'received' && po.status !== 'cancelled' ? (
                          <button onClick={() => setReceiveStockModal(po)} className="btn-secondary px-3 py-1.5 text-xs text-emerald-500 hover:bg-emerald-500/10 font-bold ml-auto">
                            Receive Stock
                          </button>
                        ) : (
                          <span className="text-xs text-muted italic">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {editProduct && (
        <EditProductModal product={editProduct} categories={categories} suppliers={suppliers}
          onSave={handleUpdateProduct} onClose={() => setEditProduct(null)}/>
      )}
      {stockProduct && (
        <StockModal product={stockProduct} onSave={handleAdjustStock} onClose={() => setStockProduct(null)}/>
      )}
      {receiveStockModal && (
        <ReceiveStockModal po={receiveStockModal} onReceive={handleReceiveStock} onClose={() => setReceiveStockModal(null)}/>
      )}
    </div>
  );
}
