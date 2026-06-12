import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Printer, Search, ArrowLeft, Tag, Plus, Edit2, Trash2, X, CheckCircle, Link, Package } from 'lucide-react';
import InventoryNav from '../../components/inventory/InventoryNav';
import { useNavigate } from 'react-router-dom';
import JsBarcode from 'jsbarcode';
import { formatCurrency } from '../../utils/formatters';
import { productsAPI, shelfTagsAPI } from '../../services/api';

/* Single barcode SVG */
function BarcodeSVG({ value }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !value) return;
    try { JsBarcode(ref.current, value, { format: 'CODE128', width: 1.2, height: 30, displayValue: true, fontSize: 9, margin: 3 }); }
    catch {}
  }, [value]);
  return value ? <svg ref={ref} /> : <span className="text-muted text-xs">No barcode</span>;
}

/* Tag form modal */
function TagModal({ tag, products, onSave, onClose }) {
  const [form, setForm] = useState({
    product_id: tag?.product_id || '',
    product_name: tag?.product_name || '',
    price: tag?.price || '',
    barcode: tag?.barcode || '',
    shelf_location: tag?.shelf_location || '',
    label_text: tag?.label_text || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleProductChange = (pid) => {
    set('product_id', pid);
    if (pid) {
      const p = products.find(x => String(x.id) === String(pid));
      if (p) { set('product_name', p.name); set('price', p.unit_price); set('barcode', p.barcode || ''); }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ ...form, price: parseFloat(form.price) || 0 });
      onClose();
    } catch { alert('Failed to save shelf tag'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <Tag size={18} className="text-teal-500"/> {tag ? 'Edit Shelf Tag' : 'New Shelf Tag'}
          </h2>
          <button onClick={onClose} className="btn-secondary p-2"><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Link to Product (optional)</label>
            <select className="input-field" value={form.product_id} onChange={e => handleProductChange(e.target.value)}>
              <option value="">— Custom (no product link) —</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Product Name *</label>
              <input required className="input-field" value={form.product_name} onChange={e => set('product_name', e.target.value)} placeholder="e.g. Coca-Cola 500ml"/>
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Price (UGX) *</label>
              <input required type="number" className="input-field" value={form.price} onChange={e => set('price', e.target.value)} placeholder="3500"/>
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Barcode</label>
              <input className="input-field font-mono" value={form.barcode} onChange={e => set('barcode', e.target.value)} placeholder="10000001"/>
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Shelf Location</label>
              <input className="input-field" value={form.shelf_location} onChange={e => set('shelf_location', e.target.value)} placeholder="A2-Shelf3"/>
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Label Text</label>
              <input className="input-field" value={form.label_text} onChange={e => set('label_text', e.target.value)} placeholder="Best Before: Dec 2026"/>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              <CheckCircle size={15}/> {saving ? 'Saving…' : 'Save Tag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ShelfTagsPage() {
  const navigate = useNavigate();
  const [tags, setTags] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [modal, setModal] = useState(null); // null | 'create' | tag-obj

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([shelfTagsAPI.getAll(), productsAPI.getAll()]);
      setTags(results[0].status === 'fulfilled' ? (results[0].value.data.data || []) : []);
      setProducts(results[1].status === 'fulfilled' ? (results[1].value.data.data || []) : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tags.filter(t =>
      t.product_name?.toLowerCase().includes(q) ||
      t.barcode?.includes(q) ||
      t.shelf_location?.toLowerCase().includes(q)
    );
  }, [tags, search]);

  const toggleSelect = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const handleSave = async (data) => {
    if (modal && modal.id) {
      await shelfTagsAPI.update(modal.id, data);
    } else {
      await shelfTagsAPI.create(data);
    }
    await fetchData();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this shelf tag?')) return;
    await shelfTagsAPI.delete(id);
    setTags(prev => prev.filter(t => t.id !== id));
    setSelected(s => { const n = new Set(s); n.delete(id); return n; });
  };

  const handlePrint = () => {
    const selectedTags = filtered.filter(t => selected.has(t.id));
    if (selectedTags.length === 0) return alert('Select at least one tag to print');
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Shelf Tags</title>
      <style>
        body{margin:0;padding:8px;font-family:Arial;background:#fff;}
        .tag{display:inline-block;border:1px solid #ccc;border-radius:6px;padding:8px 12px;
          margin:4px;width:160px;text-align:center;vertical-align:top;}
        .name{font-size:11px;font-weight:700;color:#1e293b;margin-bottom:3px;}
        .location{font-size:9px;color:#64748b;margin-bottom:4px;}
        .price{font-size:14px;font-weight:900;color:#0f172a;margin-top:4px;}
        .barcode{font-size:9px;font-family:monospace;color:#475569;}
        .label-text{font-size:9px;color:#64748b;margin-top:2px;}
        @media print{body{padding:2px}}
      </style></head><body>
      ${selectedTags.map(t => `
        <div class="tag">
          <div class="name">${t.product_name}</div>
          ${t.shelf_location ? `<div class="location">📍 ${t.shelf_location}</div>` : ''}
          <div class="barcode">${t.barcode || ''}</div>
          <div class="price">UGX ${Number(t.price).toLocaleString()}</div>
          ${t.label_text ? `<div class="label-text">${t.label_text}</div>` : ''}
        </div>`).join('')}
      <script>window.onload=()=>{window.print();window.close();}<\/script>
      </body></html>
    `);
    win.document.close();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-muted">Loading shelf tags…</p></div>;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-5">
      <InventoryNav activeTab="Shelf Tags" />
      
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button onClick={() => navigate('/dashboard/inventory')} className="btn-secondary p-2"><ArrowLeft size={18}/></button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-primary flex items-center gap-2"><Tag size={22} className="text-teal-500"/> Shelf Tags</h1>
          <p className="text-sm text-muted mt-0.5">{tags.length} tags · {selected.size} selected</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} disabled={selected.size === 0} className="btn-secondary gap-2">
            <Printer size={15}/> Print ({selected.size})
          </button>
          <button onClick={() => setModal('create')} className="btn-primary gap-2">
            <Plus size={15}/> New Tag
          </button>
        </div>
      </div>

      <div className="glass-card p-2 mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
          <input className="input-field pl-9" placeholder="Search by name, barcode, location…" value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        {filtered.length > 0 && (
          <button className="btn-secondary text-xs px-3" onClick={() => {
            if (selected.size === filtered.length) setSelected(new Set());
            else setSelected(new Set(filtered.map(t => t.id)));
          }}>
            {selected.size === filtered.length ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Tag size={40} className="mx-auto mb-3 text-teal-500 opacity-30"/>
          <p className="text-muted">No shelf tags yet. Create one to get started.</p>
          <button onClick={() => setModal('create')} className="btn-primary mt-4 mx-auto"><Plus size={15}/> Create Tag</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(t => {
            const isSel = selected.has(t.id);
            return (
              <div key={t.id} onClick={() => toggleSelect(t.id)}
                className={`glass-card p-4 cursor-pointer transition-all border-2 ${isSel ? 'border-teal-500/50 bg-teal-500/5' : 'border-transparent hover:border-theme'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSel ? 'bg-teal-500 border-teal-500' : 'border-theme'}`}>
                      {isSel && <CheckCircle size={12} className="text-white"/>}
                    </div>
                    {t.product_id && <Link size={12} className="text-brand-500" title="Linked to product"/>}
                  </div>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setModal(t)} className="btn-secondary p-1.5 text-xs"><Edit2 size={12}/></button>
                    <button onClick={() => handleDelete(t.id)} className="btn-secondary p-1.5 text-xs text-red-500 hover:bg-red-500/10"><Trash2 size={12}/></button>
                  </div>
                </div>
                <p className="font-bold text-primary text-sm mb-1 truncate">{t.product_name}</p>
                {t.shelf_location && <p className="text-xs text-muted mb-2">📍 {t.shelf_location}</p>}
                <div className="flex justify-center my-2">
                  <BarcodeSVG value={t.barcode}/>
                </div>
                <p className="text-xl font-black text-teal-600 dark:text-teal-400 text-center">{formatCurrency(t.price)}</p>
                {t.label_text && <p className="text-xs text-muted text-center mt-1 italic">{t.label_text}</p>}
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <TagModal
          tag={modal === 'create' ? null : modal}
          products={products}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
