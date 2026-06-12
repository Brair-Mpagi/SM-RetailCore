import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, CheckCircle, Truck
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { productsAPI, purchaseOrdersAPI, purchaseRequestsAPI, suppliersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function PurchaseOrderPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    supplier_id: '',
    expected_delivery_date: '',
    notes: ''
  });
  const [items, setItems] = useState([{ product_id: '', quantity: '', unit_cost: '' }]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, reqRes, supRes] = await Promise.all([
        productsAPI.getAll(),
        purchaseRequestsAPI.getAll(),
        suppliersAPI.getAll()
      ]);
      setProducts(prodRes.data.data || []);
      setSuppliers(supRes.data.data || []);
      
      // Filter for approved requests that are not yet converted to POs
      const allRequests = reqRes.data.data || [];
      const approvedRequests = allRequests.filter(r => r.status === 'approved');
      setPurchaseRequests(approvedRequests);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRequestSelect = (e) => {
    const reqId = e.target.value;
    setSelectedRequestId(reqId);
    
    if (reqId) {
      const request = purchaseRequests.find(r => r.id === parseInt(reqId));
      if (request && request.items) {
        // Auto-populate items from request
        setItems(request.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity_requested,
          unit_cost: '' // User still needs to enter cost
        })));
      }
    } else {
      setItems([{ product_id: '', quantity: '', unit_cost: '' }]);
    }
  };

  const addItem = () => {
    setItems([...items, { product_id: '', quantity: '', unit_cost: '' }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await purchaseOrdersAPI.create({
        ...form,
        request_id: selectedRequestId ? parseInt(selectedRequestId) : null,
        supplier_id: parseInt(form.supplier_id),
        items: items.map(item => ({
          product_id: parseInt(item.product_id),
          quantity_ordered: parseInt(item.quantity),
          unit_cost: parseFloat(item.unit_cost)
        })),
        status: 'pending',
        created_by: user?.id
      });
      alert('Purchase order created successfully!');
      navigate('/dashboard/inventory');
    } catch (error) {
      console.error('Failed to create purchase order:', error);
      alert('Failed to create purchase order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted">Loading products...</p>
      </div>
    );
  }

  const totalValue = items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_cost) || 0);
  }, 0);

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/dashboard/inventory')} className="btn-secondary p-2">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-primary flex items-center gap-2">
            <Truck size={22} className="text-brand-500" /> Create Purchase Order
          </h1>
          <p className="text-sm text-muted mt-0.5">Order stock from suppliers</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="glass-card p-6">
          <h3 className="font-bold text-primary mb-4">Order Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Link to Purchase Request (Required)</label>
              <select
                required
                className="input-field border-brand-500/50 bg-brand-500/5"
                value={selectedRequestId}
                onChange={handleRequestSelect}
              >
                <option value="">— Select an Approved Request —</option>
                {purchaseRequests.map(req => (
                  <option key={req.id} value={req.id}>
                    PR #{req.id} - {req.reason} ({new Date(req.created_at).toLocaleDateString()})
                  </option>
                ))}
              </select>
              {purchaseRequests.length === 0 && (
                <p className="text-xs text-amber-500 mt-1">No approved purchase requests found. You must have an approved PR to create an order.</p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Supplier *</label>
              <select
                required
                className="input-field"
                value={form.supplier_id}
                onChange={e => setForm({ ...form, supplier_id: e.target.value })}
              >
                <option value="">— Select Supplier —</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Expected Delivery *</label>
              <input
                required
                type="date"
                className="input-field"
                value={form.expected_delivery_date}
                onChange={e => setForm({ ...form, expected_delivery_date: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Notes</label>
              <textarea
                className="input-field"
                rows="2"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-primary">Order Items</h3>
            <button type="button" onClick={addItem} className="btn-secondary text-xs">
              <Plus size={14} /> Add Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1">
                  <select
                    required
                    className="input-field"
                    value={item.product_id}
                    onChange={e => updateItem(index, 'product_id', e.target.value)}
                  >
                    <option value="">— Select Product —</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <input
                    required
                    type="number"
                    className="input-field"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={e => updateItem(index, 'quantity', e.target.value)}
                  />
                </div>
                <div className="w-32">
                  <input
                    required
                    type="number"
                    className="input-field"
                    placeholder="Unit Cost"
                    value={item.unit_cost}
                    onChange={e => updateItem(index, 'unit_cost', e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="btn-secondary p-2 text-red-500"
                  disabled={items.length === 1}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-theme flex justify-between items-center">
            <span className="font-bold text-muted">Total Order Value:</span>
            <span className="text-2xl font-black text-brand-500">{formatCurrency(totalValue)}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/dashboard/inventory')} className="btn-secondary flex-1 justify-center">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
            <CheckCircle size={16} /> {submitting ? 'Creating...' : 'Create Purchase Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
