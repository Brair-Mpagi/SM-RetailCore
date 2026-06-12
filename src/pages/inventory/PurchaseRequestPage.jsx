import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Send, Package
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { productsAPI, purchaseRequestsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function PurchaseRequestPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    product_id: '',
    quantity: '',
    reason: '',
    priority: 'medium'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, reqRes] = await Promise.allSettled([
        productsAPI.getAll(),
        purchaseRequestsAPI.getAll()
      ]);
      
      if (prodRes.status === 'fulfilled') {
        setProducts(prodRes.value.data.data || []);
      }
      if (reqRes.status === 'fulfilled') {
        const allRequests = reqRes.value.data.data || [];
        // Filter requests made by this specific user
        const userRequests = allRequests.filter(r => r.created_by === user?.id);
        setMyRequests(userRequests);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.product_id || !form.quantity) return;

    setSubmitting(true);
    try {
      await purchaseRequestsAPI.create({
        items: [{
          product_id: parseInt(form.product_id),
          quantity_requested: parseInt(form.quantity)
        }],
        reason: form.reason,
        notes: `Priority: ${form.priority}`
      });
      alert('Purchase request submitted successfully and is pending admin approval.');
      setForm({ product_id: '', quantity: '', reason: '', priority: 'medium' });
      fetchData(); // Refresh the table
    } catch (error) {
      console.error('Failed to submit purchase request:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
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
            <Package size={22} className="text-brand-500" /> Purchase Request
          </h1>
          <p className="text-sm text-muted mt-0.5">Request stock replenishment</p>
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
                  {p.name} (Stock: {p.stock}, ROP: {p.reorder_point})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Quantity *</label>
            <input
              required
              type="number"
              className="input-field"
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: e.target.value })}
              placeholder="e.g. 50"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Priority</label>
            <select
              className="input-field"
              value={form.priority}
              onChange={e => setForm({ ...form, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Reason *</label>
            <textarea
              required
              className="input-field"
              rows="3"
              value={form.reason}
              onChange={e => setForm({ ...form, reason: e.target.value })}
              placeholder="Explain why this stock is needed..."
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button type="button" onClick={() => navigate('/dashboard/inventory')} className="btn-secondary flex-1 justify-center">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
            <Send size={16} /> {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>

      {/* My Recent Requests */}
      <div className="glass-card mt-8 overflow-hidden">
        <div className="p-4 border-b border-theme bg-surface-2/50">
          <h3 className="font-bold text-primary flex items-center gap-2">
            <Package size={16} className="text-purple-500" /> My Recent Requests
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-theme">
                <th className="p-4 font-bold text-muted text-left">Date</th>
                <th className="p-4 font-bold text-muted text-left">Items Requested</th>
                <th className="p-4 font-bold text-muted text-left">Reason</th>
                <th className="p-4 font-bold text-muted text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {myRequests.length === 0 ? (
                <tr><td colSpan="4" className="p-6 text-center text-muted">You haven't made any requests yet.</td></tr>
              ) : myRequests.map(req => (
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
                            <li key={idx} className="flex gap-1.5">
                              <span className="font-bold text-brand-500">{item.quantity_requested}x</span>
                              <span className="text-secondary">{prod ? prod.name : `Product #${item.product_id}`}</span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : <span className="text-xs text-muted">No items</span>}
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-medium text-primary">{req.reason}</p>
                  </td>
                  <td className="p-4 text-center">
                    {req.status === 'pending' ? <span className="status-pill badge-warning text-xs">Pending</span>
                      : req.status === 'approved' ? <span className="status-pill badge-success text-xs">Approved</span>
                      : <span className="status-pill badge-critical text-xs">Rejected</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
