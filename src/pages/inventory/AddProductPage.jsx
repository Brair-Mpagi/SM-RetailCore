import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Package, Save, Plus, Trash2, Zap, AlertCircle, RefreshCw, Camera, Smartphone, X } from 'lucide-react';
import { productsAPI } from '../../services/api';
import api from '../../services/api';
import BarcodeScanner from '../../components/pos/BarcodeScanner';
import { io } from 'socket.io-client';

const UOM = ['pcs','kg','litre','bottle','packet','can','bar','tube','box','bag','carton'];
const EMPTY_ROW = () => ({ name:'', barcode:'', category_id:'', supplier_id:'', unit_price:'', cost_price:'', stock:'', reorder_point:'5', unit_of_measure:'pcs', expiry_date:'', location:'', _autoBarcode:false });

export default function AddProductPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('single'); // 'single' | 'bulk'
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerTarget, setScannerTarget] = useState(null);

  const [phoneConnected, setPhoneConnected] = useState(false);
  const [showPhoneScanner, setShowPhoneScanner] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const socketRef = useRef(null);

  const BACKEND_URL = '/';
  const SCAN_URL = `${window.location.protocol}//${window.location.hostname}:5173/scan${sessionId ? '?sid='+sessionId : ''}`;

  const handleScanRef = useRef(null);

  // Single form
  const [form, setForm] = useState({ name:'', barcode:'', category_id:'', supplier_id:'', unit_price:'', cost_price:'', stock:'', reorder_point:'', unit_of_measure:'pcs', expiry_date:'', location:'' });

  // Bulk rows
  const [rows, setRows] = useState([EMPTY_ROW(), EMPTY_ROW()]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/suppliers')]).then(([cr, sr]) => {
      const cats = cr.data.data || cr.data || [];
      const sups = sr.data.data || sr.data || [];
      setCategories(cats);
      setSuppliers(sups);
      if (cats[0]) { setForm(p => ({ ...p, category_id: cats[0].id })); }
    }).catch(console.error);
  }, []);

  const generateBarcode = async (count = 1) => {
    const res = await productsAPI.getNextBarcode(count);
    return res.data.data.barcodes;
  };

  const handleAutoBarcode = async () => {
    const barcodes = await generateBarcode(1);
    setForm(p => ({ ...p, barcode: barcodes[0] }));
  };

  const handleAutoBarcodesForRows = async () => {
    const needed = rows.filter(r => !r.barcode).length;
    if (needed === 0) return;
    const barcodes = await generateBarcode(needed);
    let idx = 0;
    setRows(prev => prev.map(r => r.barcode ? r : { ...r, barcode: barcodes[idx++], _autoBarcode: true }));
  };

  const handleScan = (code) => {
    if (scannerTarget === 'single') {
      setForm(p => ({ ...p, barcode: code }));
    } else if (typeof scannerTarget === 'number') {
      setRow(scannerTarget, 'barcode', code);
    }
    setShowScanner(false);
    setScannerTarget(null);
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

  const addRow = () => setRows(p => [...p, EMPTY_ROW()]);
  const removeRow = (i) => setRows(p => p.filter((_, j) => j !== i));
  const setRow = (i, k, v) => setRows(p => p.map((r, j) => j === i ? { ...r, [k]: v } : r));

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await productsAPI.create({
        ...form,
        unit_price: parseFloat(form.unit_price) || 0,
        cost_price: parseFloat(form.cost_price) || 0,
        stock: parseInt(form.stock) || 0,
        reorder_point: parseInt(form.reorder_point) || 5,
        is_active: 1
      });
      setResult({ ok: true, created: 1, errors: [] });
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to create product';
      setResult({ ok: false, created: 0, errors: [msg] });
    } finally { setLoading(false); }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const products = rows.filter(r => r.name && r.category_id && r.unit_price).map(r => ({
        ...r,
        unit_price: parseFloat(r.unit_price) || 0,
        cost_price: parseFloat(r.cost_price) || 0,
        stock: parseInt(r.stock) || 0,
        reorder_point: parseInt(r.reorder_point) || 5,
      }));
      if (products.length === 0) { alert('Fill in at least one complete product row.'); setLoading(false); return; }
      const res = await productsAPI.bulkCreate(products);
      const d = res.data.data;
      setResult({ ok: d.errors === 0, created: d.created, errors: d.errorDetails?.map(e => `Row ${e.index + 1}: ${e.error}`) || [] });
    } catch (err) {
      setResult({ ok: false, created: 0, errors: [err.response?.data?.error || 'Bulk create failed'] });
    } finally { setLoading(false); }
  };

  if (result) return (
    <div className="max-w-xl mx-auto mt-16 animate-fade-in">
      <div className="glass-card p-8 text-center">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${result.ok ? 'bg-emerald-500/15' : 'bg-amber-500/15'}`}>
          {result.ok ? <CheckCircle size={32} className="text-emerald-500"/> : <AlertCircle size={32} className="text-amber-500"/>}
        </div>
        <h2 className="text-xl font-black text-primary mb-1">{result.created} product{result.created !== 1 ? 's' : ''} created</h2>
        {result.errors.length > 0 && (
          <div className="mt-3 text-left space-y-1 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            {result.errors.map((e, i) => <p key={i}>• {e}</p>)}
          </div>
        )}
        <div className="flex gap-3 mt-6">
          <button onClick={() => setResult(null)} className="btn-secondary flex-1 justify-center"><RefreshCw size={15}/> Add More</button>
          <button onClick={() => navigate('/dashboard/inventory')} className="btn-primary flex-1 justify-center"><CheckCircle size={15}/> Done</button>
        </div>
      </div>
    </div>
  );

  const formFields = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Product Name *</label>
        <input required className="input-field" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Coca-Cola 500ml"/>
      </div>
      <div>
        <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Barcode</label>
        <div className="flex gap-2">
          <input className="input-field font-mono flex-1" value={form.barcode} onChange={e => set('barcode', e.target.value)} placeholder="Auto-generate or enter"/>
          <button type="button" onClick={() => { setShowPhoneScanner(true); setScannerTarget('single'); }} className={`btn-secondary px-3 flex-shrink-0 text-xs transition-colors ${phoneConnected ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400' : ''}`} title="Phone Scanner"><Smartphone size={15}/></button>
          <button type="button" onClick={() => { setShowScanner(true); setScannerTarget('single'); }} className="btn-secondary px-3 flex-shrink-0 text-xs" title="Scan barcode"><Camera size={15}/></button>
          <button type="button" onClick={handleAutoBarcode} className="btn-secondary px-3 flex-shrink-0 text-xs" title="Auto-generate barcode"><Zap size={15}/></button>
        </div>
      </div>
      <div>
        <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Selling Price (UGX) *</label>
        <input required type="number" className="input-field" value={form.unit_price} onChange={e => set('unit_price', e.target.value)} placeholder="2500"/>
      </div>
      <div>
        <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Cost Price (UGX)</label>
        <input type="number" className="input-field" value={form.cost_price} onChange={e => set('cost_price', e.target.value)} placeholder="1800"/>
      </div>
      <div>
        <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Opening Stock</label>
        <input type="number" className="input-field" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="50"/>
      </div>
      <div>
        <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Reorder Point</label>
        <input type="number" className="input-field" value={form.reorder_point} onChange={e => set('reorder_point', e.target.value)} placeholder="20"/>
      </div>
      <div>
        <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Category *</label>
        <select required className="input-field" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
          <option value="">Select Category</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Supplier</label>
        <select className="input-field" value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)}>
          <option value="">Select Supplier</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Unit of Measure</label>
        <select className="input-field" value={form.unit_of_measure} onChange={e => set('unit_of_measure', e.target.value)}>
          {UOM.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Expiry Date</label>
        <input type="date" className="input-field" value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)}/>
      </div>
      <div className="md:col-span-2">
        <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Location (Aisle/Shelf)</label>
        <input className="input-field" value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Aisle 4, Shelf B"/>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/dashboard/inventory')} className="btn-secondary p-2"><ArrowLeft size={18}/></button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-primary flex items-center gap-2"><Package size={22} className="text-brand-500"/> Add Products</h1>
          <p className="text-sm text-muted mt-0.5">Single or bulk product creation with automatic barcode sequencing</p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => setMode('single')} className={`px-5 py-2 rounded-xl text-sm font-bold border transition-all ${mode === 'single' ? 'bg-brand-500 text-white border-brand-500 shadow-md' : 'btn-secondary'}`}>
          Single Product
        </button>
        <button onClick={() => setMode('bulk')} className={`px-5 py-2 rounded-xl text-sm font-bold border transition-all ${mode === 'bulk' ? 'bg-brand-500 text-white border-brand-500 shadow-md' : 'btn-secondary'}`}>
          Bulk Add
        </button>
      </div>

      {mode === 'single' ? (
        <form onSubmit={handleSingleSubmit} className="glass-card p-6">
          {formFields}
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={() => navigate('/dashboard/inventory')} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              <Save size={16}/> {loading ? 'Saving…' : 'Add Product'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleBulkSubmit}>
          <div className="glass-card overflow-hidden mb-4">
            <div className="flex items-center justify-between px-4 py-3 border-b border-theme">
              <p className="font-bold text-sm text-primary">{rows.length} rows · Barcodes auto-assigned if blank (10000001, 10000002…)</p>
              <button type="button" onClick={handleAutoBarcodesForRows} className="btn-secondary text-xs px-3 gap-1.5">
                <Zap size={13}/> Auto-fill barcodes
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-theme bg-surface-2/50">
                    {['#','Name *','Barcode','Price *','Cost','Stock','Reorder','Category *','Supplier','UOM','Expiry','Location',''].map((h, i) => (
                      <th key={i} className="px-3 py-2 font-bold text-muted text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b border-theme hover:bg-surface-2/30">
                      <td className="px-3 py-1.5 text-muted font-mono">{i+1}</td>
                      <td className="px-2 py-1"><input className="input-field py-1 text-xs w-36" value={row.name} onChange={e => setRow(i,'name',e.target.value)} placeholder="Product name"/></td>
                      <td className="px-2 py-1">
                        <div className="flex gap-1">
                          <input className={`input-field py-1 text-xs font-mono w-24 ${row._autoBarcode ? 'border-brand-500/40 bg-brand-500/5' : ''}`} value={row.barcode} onChange={e => setRow(i,'barcode',e.target.value)} placeholder="Auto"/>
                          <button type="button" onClick={() => { setShowPhoneScanner(true); setScannerTarget(i); }} className={`btn-secondary p-1 flex-shrink-0 text-xs transition-colors ${phoneConnected ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400' : ''}`} title="Phone Scanner"><Smartphone size={13}/></button>
                          <button type="button" onClick={() => { setShowScanner(true); setScannerTarget(i); }} className="btn-secondary p-1 flex-shrink-0 text-xs" title="Scan barcode"><Camera size={13}/></button>
                        </div>
                      </td>
                      <td className="px-2 py-1"><input type="number" className="input-field py-1 text-xs w-20" value={row.unit_price} onChange={e => setRow(i,'unit_price',e.target.value)} placeholder="Price"/></td>
                      <td className="px-2 py-1"><input type="number" className="input-field py-1 text-xs w-20" value={row.cost_price} onChange={e => setRow(i,'cost_price',e.target.value)} placeholder="Cost"/></td>
                      <td className="px-2 py-1"><input type="number" className="input-field py-1 text-xs w-16" value={row.stock} onChange={e => setRow(i,'stock',e.target.value)} placeholder="0"/></td>
                      <td className="px-2 py-1"><input type="number" className="input-field py-1 text-xs w-16" value={row.reorder_point} onChange={e => setRow(i,'reorder_point',e.target.value)} placeholder="5"/></td>
                      <td className="px-2 py-1">
                        <select className="input-field py-1 text-xs w-28" value={row.category_id} onChange={e => setRow(i,'category_id',e.target.value)}>
                          <option value="">Select…</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1">
                        <select className="input-field py-1 text-xs w-28" value={row.supplier_id} onChange={e => setRow(i,'supplier_id',e.target.value)}>
                          <option value="">None</option>
                          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1">
                        <select className="input-field py-1 text-xs w-20" value={row.unit_of_measure} onChange={e => setRow(i,'unit_of_measure',e.target.value)}>
                          {UOM.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1"><input type="date" className="input-field py-1 text-xs w-[110px]" value={row.expiry_date} onChange={e => setRow(i,'expiry_date',e.target.value)} /></td>
                      <td className="px-2 py-1"><input className="input-field py-1 text-xs w-28" value={row.location} onChange={e => setRow(i,'location',e.target.value)} placeholder="Aisle A"/></td>
                      <td className="px-2 py-1">
                        <button type="button" onClick={() => removeRow(i)} className="text-muted hover:text-red-500 transition-colors p-1"><Trash2 size={13}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-theme">
              <button type="button" onClick={addRow} className="btn-secondary text-xs gap-1.5"><Plus size={13}/> Add Row</button>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/dashboard/inventory')} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              <Save size={16}/> {loading ? 'Saving…' : `Save ${rows.filter(r => r.name).length} Products`}
            </button>
          </div>
        </form>
      )}

      {showScanner && (
        <BarcodeScanner onDetected={handleScan} onClose={() => { setShowScanner(false); setScannerTarget(null); }} />
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
  );
}
