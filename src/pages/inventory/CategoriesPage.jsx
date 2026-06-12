import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, X, Search, CheckCircle, Tag, Grid } from 'lucide-react';
import InventoryNav from '../../components/inventory/InventoryNav';
import { categoriesAPI } from '../../services/api';

function CategoryModal({ category, onSave, onClose }) {
  const [form, setForm] = useState({
    name: category?.name || '',
    description: category?.description || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface border border-theme rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-theme">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <Grid size={18} className="text-brand-500"/> {category ? 'Edit Category' : 'New Category'}
          </h2>
          <button onClick={onClose} className="btn-secondary p-1.5"><X size={16}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Category Name *</label>
            <input required autoFocus className="input-field" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Beverages"/>
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Description</label>
            <textarea rows="3" className="input-field resize-none" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional details..."/>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving || !form.name.trim()} className="btn-primary flex-1 justify-center">
              <CheckCircle size={15}/> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'create' | category object

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await categoriesAPI.getAll();
      setCategories(res.data.data || res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (data) => {
    if (modal && modal.id) {
      await categoriesAPI.update(modal.id, data);
    } else {
      await categoriesAPI.create(data);
    }
    await fetchData();
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete category "${name}"? This will fail if products are still assigned to it.`)) return;
    try {
      await categoriesAPI.delete(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete category. Make sure it has no products assigned.');
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return categories.filter(c => c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q));
  }, [categories, search]);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-muted">Loading categories...</p></div>;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-5">
      <InventoryNav activeTab="Categories" />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-black text-primary flex items-center gap-2">
            <Grid size={22} className="text-brand-500"/> Product Categories
          </h1>
          <p className="text-sm text-muted mt-0.5">{categories.length} categories found</p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary gap-2">
          <Plus size={16}/> Add Category
        </button>
      </div>

      <div className="glass-card p-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
          <input className="input-field pl-9" placeholder="Search categories..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-theme bg-surface-2/50">
                <th className="p-4 font-bold text-muted">Category Name</th>
                <th className="p-4 font-bold text-muted">Description</th>
                <th className="p-4 font-bold text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-muted">No categories found.</td>
                </tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id} className="border-b border-theme hover:bg-surface-2/30 transition-colors">
                    <td className="p-4 font-bold text-primary">{c.name}</td>
                    <td className="p-4 text-muted max-w-[300px] truncate">{c.description || '—'}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setModal(c)} className="btn-secondary p-1.5 text-brand-500 hover:bg-brand-500/10" title="Edit">
                          <Edit2 size={14}/>
                        </button>
                        <button onClick={() => handleDelete(c.id, c.name)} className="btn-secondary p-1.5 text-red-500 hover:bg-red-500/10" title="Delete">
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <CategoryModal
          category={modal === 'create' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
