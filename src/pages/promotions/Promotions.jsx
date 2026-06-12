import React, { useState, useEffect } from 'react';
import { Tag, Plus, X, CheckCircle, Calendar } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { promotionsAPI, productsAPI } from '../../services/api';

function PromoModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '', discount_type: 'percentage', discount_value: '',
    target: 'category', product_id: '', category_id: '1',
    start_date: '', end_date: '',
  });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await Promise.allSettled([
          productsAPI.getAll()
        ]);
        const prodsRes = results[0].status === 'fulfilled' ? results[0].value : { data: { data: [] } };
        setProducts(prodsRes.data.data || []);
        // Extract unique categories from products
        const cats = [...new Set(prodsRes.data.data.map(p => p.category_name))].filter(Boolean);
        setCategories(cats.map((name, idx) => ({ id: idx + 1, name })));
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await promotionsAPI.create({
        name: form.name,
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        product_id: form.target === 'product' ? parseInt(form.product_id) : null,
        category_id: form.target === 'category' ? parseInt(form.category_id) : null,
        start_date: form.start_date,
        end_date: form.end_date,
        is_active: 1
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create promotion:', error);
      alert('Failed to create promotion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-primary">Create Promotion</h2>
          <button onClick={onClose} className="btn-secondary p-2"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Promotion Name *</label>
            <input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Weekend Beverages Deal" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Discount Type</label>
              <select className="input-field" value={form.discount_type} onChange={e => set('discount_type', e.target.value)}>
                <option value="percentage">Percentage %</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Value</label>
              <input type="number" className="input-field" value={form.discount_value}
                onChange={e => set('discount_value', e.target.value)}
                placeholder={form.discount_type === 'percentage' ? '10' : '500'} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Applies To</label>
            <div className="flex gap-2 mb-2">
              {['category','product'].map(t => (
                <button key={t} type="button" onClick={() => set('target', t)}
                  className={`text-xs px-3 py-2 rounded-xl capitalize font-semibold transition-all border ${form.target===t ? 'bg-brand-600 text-white border-transparent' : 'btn-secondary py-2'}`}>
                  {t}
                </button>
              ))}
            </div>
            {form.target === 'category' ? (
              <select className="input-field" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : (
              <select className="input-field" value={form.product_id} onChange={e => set('product_id', e.target.value)}>
                <option value="">— Select product —</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Start Date *</label>
              <input type="date" className="input-field" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">End Date *</label>
              <input type="date" className="input-field" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button disabled={loading} className="btn-primary flex-1 justify-center" onClick={handleSubmit}>
              <CheckCircle size={16} /> {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Promotions() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await promotionsAPI.getAll();
      setPromos(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggle = async (id) => {
    const promo = promos.find(p => p.id === id);
    try {
      // Toggle is_active status
      setPromos(prev => prev.map(p => p.id === id ? { ...p, is_active: p.is_active ? 0 : 1 } : p));
    } catch (error) {
      console.error('Failed to toggle promotion:', error);
      // Revert on error
      setPromos(prev => prev.map(p => p.id === id ? { ...p, is_active: promo.is_active } : p));
    }
  };

  const now = new Date();
  const active = promos.filter(p => p.is_active && new Date(p.end_date) >= now);
  const expired = promos.filter(p => !p.is_active || new Date(p.end_date) < now);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted">Loading promotions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-primary flex items-center gap-2">
            <Tag size={22} className="text-emerald-600 dark:text-emerald-400" /> Promotions
          </h1>
          <p className="text-muted text-sm mt-0.5">{active.length} active · {expired.length} expired/disabled</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={16} /> New Promotion</button>
      </div>

      {/* Active */}
      {active.length > 0 && (
        <div>
          <h2 className="section-title mb-3 text-emerald-600 dark:text-emerald-400">✅ Active Promotions</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {active.map(p => (
              <div key={p.id} className="glass-card p-5 border-emerald-500/20">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-black text-primary">{p.name}</h3>
                    <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                      <Calendar size={11} /> {formatDate(p.start_date)} → {formatDate(p.end_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="status-pill badge-success text-xs">Active</span>
                    <button onClick={() => toggle(p.id)} className="btn-danger py-1 px-2 text-xs">Disable</button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {p.discount_value}{p.discount_type === 'percentage' ? '%' : ' UGX'}
                    </p>
                    <p className="text-[10px] text-muted capitalize">{p.discount_type} off</p>
                  </div>
                  <div className="flex-1 p-2.5 bg-surface-2 border border-theme rounded-xl text-center">
                    <p className="text-xs font-semibold text-primary capitalize">
                      {p.product_id ? `Product #${p.product_id}` : p.category_id ? `Category #${p.category_id}` : 'All'}
                    </p>
                    <p className="text-[10px] text-muted">Applies to</p>
                  </div>
                </div>
                <p className="text-xs text-muted mt-2">Created by {p.created_by || 'System'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expired/Disabled */}
      {expired.length > 0 && (
        <div>
          <h2 className="section-title mb-3 text-muted">⏸ Expired / Disabled</h2>
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr>
                {['Name','Type','Value','Period','Status','Action'].map(h=><th key={h} className="table-header">{h}</th>)}
              </tr></thead>
              <tbody>
                {expired.map(p => (
                  <tr key={p.id} className="hover:bg-surface-2 transition-colors opacity-70">
                    <td className="table-cell font-semibold text-primary">{p.name}</td>
                    <td className="table-cell capitalize text-muted">{p.discount_type}</td>
                    <td className="table-cell font-bold">{p.discount_value}{p.discount_type==='percentage'?'%':' UGX'}</td>
                    <td className="table-cell text-xs text-muted">{formatDate(p.start_date)} → {formatDate(p.end_date)}</td>
                    <td className="table-cell"><span className="status-pill badge-critical text-xs">Inactive</span></td>
                    <td className="table-cell">
                      <button onClick={() => toggle(p.id)} className="btn-success py-1 px-2 text-xs">Reactivate</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreate && <PromoModal onClose={() => setShowCreate(false)} onSuccess={fetchPromotions} />}
    </div>
  );
}
