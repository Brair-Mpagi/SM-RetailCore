import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, ClipboardList
} from 'lucide-react';
import { productsAPI, stocktakesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function CycleCountPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({});
  const [submitted, setSubmitted] = useState(false);

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

  const setCount = (id, val) => {
    setCounts(prev => ({ ...prev, [id]: Number(val) || 0 }));
  };

  const handleSubmit = async () => {
    try {
      const items = Object.entries(counts).map(([productId, counted]) => ({
        product_id: parseInt(productId),
        counted_quantity: counted,
        system_quantity: products.find(p => p.id === parseInt(productId))?.stock || 0
      }));

      await stocktakesAPI.create({
        counted_by: user?.id,
        items
      });

      setSubmitted(true);
      setTimeout(() => navigate('/dashboard/inventory'), 2000);
    } catch (error) {
      console.error('Failed to submit stocktake:', error);
      alert('Failed to submit count. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted">Loading products...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <CheckCircle size={48} className="text-emerald-500 mb-4" />
        <p className="text-lg font-bold text-primary">Stocktake Submitted!</p>
        <p className="text-sm text-muted">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/dashboard/inventory')} className="btn-secondary p-2">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-primary flex items-center gap-2">
            <ClipboardList size={22} className="text-brand-500" /> Cycle Count
          </h1>
          <p className="text-sm text-muted mt-0.5">Count {products.length} products</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-theme bg-surface-2/50">
                <th className="p-4 font-bold text-muted text-left">Product</th>
                <th className="p-4 font-bold text-muted text-left">SKU</th>
                <th className="p-4 font-bold text-muted text-right">System Stock</th>
                <th className="p-4 font-bold text-muted text-right">Counted</th>
                <th className="p-4 font-bold text-muted text-right">Variance</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const counted = counts[p.id] ?? null;
                const variance = counted !== null ? counted - p.stock : null;
                return (
                  <tr key={p.id} className="border-b border-theme hover:bg-surface-2/30">
                    <td className="p-4 font-semibold text-primary">{p.name}</td>
                    <td className="p-4 font-mono text-xs text-muted">{p.sku}</td>
                    <td className="p-4 text-right font-bold">{p.stock}</td>
                    <td className="p-4 text-right">
                      <input
                        type="number"
                        className="input-field w-24 text-center"
                        value={counts[p.id] ?? ''}
                        onChange={e => setCount(p.id, e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td className="p-4 text-right">
                      {variance !== null && (
                        <span className={`font-bold ${
                          variance === 0 ? 'text-emerald-500' :
                          variance > 0 ? 'text-blue-500' :
                          'text-red-500'
                        }`}>
                          {variance > 0 ? '+' : ''}{variance}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={() => navigate('/dashboard/inventory')} className="btn-secondary flex-1 justify-center">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={Object.keys(counts).length === 0}
          className="btn-primary flex-1 justify-center"
        >
          <CheckCircle size={16} /> Submit Count
        </button>
      </div>
    </div>
  );
}
