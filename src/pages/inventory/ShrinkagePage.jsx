import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, AlertTriangle, Trash2
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { productsAPI, lossesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function ShrinkagePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    product_id: '',
    quantity: '',
    reason: 'damaged',
    notes: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll();
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find(p => p.id === parseInt(form.product_id));
  const currentStock = selectedProduct ? selectedProduct.stock : 0;
  const isExceedingStock = form.quantity && parseInt(form.quantity) > currentStock;
  const isSubmitDisabled = !form.product_id || !form.quantity || isExceedingStock;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isExceedingStock) return;
    try {
      const product = products.find(p => p.id === parseInt(form.product_id));
      await lossesAPI.create({
        product_id: parseInt(form.product_id),
        quantity: parseInt(form.quantity),
        reason: form.reason,
        notes: form.notes,
        recorded_by: user?.id,
        estimated_loss: product ? product.unit_price * parseInt(form.quantity) : 0
      });
      alert('Loss recorded successfully!');
      navigate('/dashboard/inventory');
    } catch (error) {
      console.error('Failed to record loss:', error);
      alert('Failed to record loss. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/dashboard/inventory')} className="btn-secondary p-2">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-primary flex items-center gap-2">
            <Trash2 size={22} className="text-red-500" /> Record Shrinkage/Loss
          </h1>
          <p className="text-sm text-muted mt-0.5">Log damaged, expired, or stolen items</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Product *</label>
            <select
              required
              className="input-field"
              value={form.product_id}
              onChange={e => setForm({ ...form, product_id: e.target.value })}
            >
              <option value="">— Select Product —</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stock: {p.stock})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Quantity Lost *</label>
            <input
              required
              type="number"
              min="1"
              max={currentStock || undefined}
              className={`input-field ${isExceedingStock ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: e.target.value })}
              placeholder="e.g. 5"
            />
            {isExceedingStock && (
              <p className="text-xs text-red-500 mt-1">
                Cannot record loss greater than available stock ({currentStock}).
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Reason *</label>
            <select
              required
              className="input-field"
              value={form.reason}
              onChange={e => setForm({ ...form, reason: e.target.value })}
            >
              <option value="damaged">Damaged</option>
              <option value="expired">Expired</option>
              <option value="stolen">Stolen</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Notes</label>
            <textarea
              className="input-field"
              rows="3"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Additional details..."
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button type="button" onClick={() => navigate('/dashboard/inventory')} className="btn-secondary flex-1 justify-center">
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitDisabled}
            className={`btn-danger flex-1 justify-center ${isSubmitDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <AlertTriangle size={16} /> Record Loss
          </button>
        </div>
      </form>
    </div>
  );
}
