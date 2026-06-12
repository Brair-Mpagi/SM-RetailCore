import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, X, Search, CheckCircle, Truck } from 'lucide-react';
import InventoryNav from '../../components/inventory/InventoryNav';
import { suppliersAPI } from '../../services/api';

function SupplierModal({ supplier, onSave, onClose }) {
  const [form, setForm] = useState({
    name: supplier?.name || '',
    contact_person: supplier?.contact_person || '',
    contact_phone: supplier?.contact_phone || '',
    contact_email: supplier?.contact_email || '',
    address: supplier?.address || '',
    status: (supplier?.is_active === 1 || supplier?.is_active === undefined) ? 'active' : 'inactive'
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface border border-theme rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-theme">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <Truck size={18} className="text-blue-500"/> {supplier ? 'Edit Supplier' : 'New Supplier'}
          </h2>
          <button onClick={onClose} className="btn-secondary p-1.5"><X size={16}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Supplier Name *</label>
              <input required autoFocus className="input-field" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Coca-Cola Distributors Ltd"/>
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Contact Person</label>
              <input className="input-field" value={form.contact_person} onChange={e => setForm(p => ({ ...p, contact_person: e.target.value }))} placeholder="e.g. John Doe"/>
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Phone</label>
              <input className="input-field" value={form.contact_phone} onChange={e => setForm(p => ({ ...p, contact_phone: e.target.value }))} placeholder="e.g. +256 700 000000"/>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Email</label>
              <input type="email" className="input-field" value={form.contact_email} onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))} placeholder="e.g. sales@example.com"/>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Address</label>
              <textarea rows="2" className="input-field resize-none" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Physical address..."/>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Status</label>
              <select className="input-field" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2 border-t border-theme">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving || !form.name.trim()} className="btn-primary flex-1 justify-center bg-blue-600 hover:bg-blue-700 border-blue-600">
              <CheckCircle size={15}/> {saving ? 'Saving...' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SuppliersPage() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'create' | supplier object

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await suppliersAPI.getAll();
      setSuppliers(res.data.data || res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (data) => {
    if (modal && modal.id) {
      await suppliersAPI.update(modal.id, data);
    } else {
      await suppliersAPI.create(data);
    }
    await fetchData();
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete supplier "${name}"? This will fail if products or purchase orders are still assigned to it.`)) return;
    try {
      await suppliersAPI.delete(id);
      setSuppliers(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete supplier. Make sure it has no products or POs assigned.');
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return suppliers.filter(s => 
      s.name?.toLowerCase().includes(q) || 
      s.contact_person?.toLowerCase().includes(q) ||
      s.contact_email?.toLowerCase().includes(q) ||
      s.contact_phone?.toLowerCase().includes(q)
    );
  }, [suppliers, search]);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-muted">Loading suppliers...</p></div>;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-5">
      <InventoryNav activeTab="Suppliers" />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-black text-primary flex items-center gap-2">
            <Truck size={22} className="text-blue-500"/> Suppliers
          </h1>
          <p className="text-sm text-muted mt-0.5">{suppliers.length} suppliers found</p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary gap-2 bg-blue-600 hover:bg-blue-700 border-blue-600">
          <Plus size={16}/> Add Supplier
        </button>
      </div>

      <div className="glass-card p-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
          <input className="input-field pl-9" placeholder="Search by name, contact, phone, email..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-theme bg-surface-2/50">
                <th className="p-4 font-bold text-muted">Supplier Name</th>
                <th className="p-4 font-bold text-muted">Contact Info</th>
                <th className="p-4 font-bold text-muted">Status</th>
                <th className="p-4 font-bold text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-muted">No suppliers found.</td>
                </tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.id} className="border-b border-theme hover:bg-surface-2/30 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-primary">{s.name}</p>
                      {s.address && <p className="text-xs text-muted truncate max-w-[200px] mt-0.5">📍 {s.address}</p>}
                    </td>
                    <td className="p-4">
                      {s.contact_person && <p className="text-sm font-semibold text-primary">{s.contact_person}</p>}
                      <div className="text-xs text-muted flex flex-col gap-0.5 mt-0.5">
                        {s.contact_phone && <span>📞 {s.contact_phone}</span>}
                        {s.contact_email && <span>✉️ {s.contact_email}</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      {s.is_active === 1 || s.is_active === true
                        ? <span className="status-pill badge-success text-xs">Active</span>
                        : <span className="status-pill badge-neutral text-xs">Inactive</span>
                      }
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setModal(s)} className="btn-secondary p-1.5 text-blue-500 hover:bg-blue-500/10" title="Edit">
                          <Edit2 size={14}/>
                        </button>
                        <button onClick={() => handleDelete(s.id, s.name)} className="btn-secondary p-1.5 text-red-500 hover:bg-red-500/10" title="Delete">
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
        <SupplierModal
          supplier={modal === 'create' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
