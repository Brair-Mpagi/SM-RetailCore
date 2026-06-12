import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, AlertCircle, AlertTriangle, Package, Shield, Zap, Info, Filter, Sparkles, Loader2 } from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';
import { alertsAPI, productsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import ProductAnalyticsModal from '../../components/inventory/ProductAnalyticsModal';

const SEV_CONFIG = {
  critical: { cls: 'badge-critical bg-red-500/5', Icon: AlertCircle },
  warning:  { cls: 'badge-warning bg-amber-500/5', Icon: AlertTriangle },
  info:     { cls: 'badge-info bg-blue-500/5', Icon: Info },
};

const TYPE_ICON = {
  low_stock: Package, expiry: AlertCircle, fraud: Shield,
  cash_discrepancy: Zap, high_velocity: Zap, system: Info,
};

export default function AlertsCenter() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(false);

  const handleViewProduct = async (productId) => {
    try {
      setLoadingProduct(true);
      const res = await productsAPI.getOne(productId);
      if (res.data?.success && res.data?.data) {
        setSelectedProduct(res.data.data);
      } else {
        alert('Product not found.');
      }
    } catch (err) {
      console.error('Failed to fetch product details:', err);
      alert('Failed to load product details.');
    } finally {
      setLoadingProduct(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await alertsAPI.getAll();
      setAlerts(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const res = await alertsAPI.generate();
      if (res.data?.success) {
        setAlerts(res.data.data || []);
      }
    } catch (error) {
      console.error('Failed to generate alerts:', error);
      alert('Failed to generate AI alerts.');
    } finally {
      setGenerating(false);
    }
  };

  const markRead = async (id) => {
    try {
      await alertsAPI.markRead(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: 1 } : a));
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const markAllRead = async () => {
    try {
      await Promise.all(alerts.filter(a => !a.is_read).map(a => alertsAPI.markRead(a.id)));
      setAlerts(prev => prev.map(a => ({ ...a, is_read: 1 })));
    } catch (error) {
      console.error('Failed to mark all alerts as read:', error);
    }
  };

  const filtered = alerts.filter(a => {
    if (filter === 'unread') return !a.is_read;
    if (filter === 'critical') return a.severity === 'critical';
    if (filter === 'warning') return a.severity === 'warning';
    return true;
  });

  const unread = alerts.filter(a => !a.is_read).length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-primary flex items-center gap-2">
            <Bell size={22} className="text-amber-500 dark:text-amber-400" /> Alerts & AI Insights
          </h1>
          <p className="text-muted text-sm mt-0.5">{unread} unread alerts · {alerts.filter(a=>a.severity==='critical'&&!a.is_read).length} critical</p>
        </div>
        <div className="flex gap-2">
          {['manager', 'admin'].includes(user?.role) && (
            <button onClick={handleGenerate} disabled={generating} className={`btn-primary bg-brand-600 hover:bg-brand-500 text-white border-none transition-all ${generating ? 'opacity-70 cursor-not-allowed' : ''}`}>
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {generating ? 'Scanning DB...' : 'Generate AI Alerts'}
            </button>
          )}
          <button onClick={markAllRead} className="btn-secondary">
            <CheckCheck size={16} /> Mark All Read
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: `All (${alerts.length})` },
          { key: 'unread', label: `Unread (${unread})` },
          { key: 'critical', label: `Critical (${alerts.filter(a=>a.severity==='critical').length})` },
          { key: 'warning', label: `Warning (${alerts.filter(a=>a.severity==='warning').length})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${filter===f.key ? 'bg-brand-600 text-white' : 'btn-secondary py-2 text-xs'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {loading ? (
          <div className="glass-card p-12 text-center">
            <p className="text-muted">Loading alerts...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <CheckCheck size={40} className="mx-auto mb-3 text-emerald-500 opacity-50" />
            <p className="text-muted">No alerts matching this filter</p>
          </div>
        ) : null}
        {filtered.map(alert => {
          const { cls, Icon } = SEV_CONFIG[alert.severity] || SEV_CONFIG.info;
          const TypeIcon = TYPE_ICON[alert.type] || Info;
          return (
            <div key={alert.id} className={`glass-card p-4 border ${cls} ${alert.is_read ? 'opacity-60' : ''} transition-opacity`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cls}`}>
                  <TypeIcon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`status-pill text-[10px] capitalize ${cls}`}>{alert.severity}</span>
                        <span className="text-xs text-muted capitalize">{alert.type.replace(/_/g,' ')}</span>
                        {!alert.is_read && <span className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0" />}
                      </div>
                      <p className="text-sm font-medium text-primary">{alert.message}</p>
                      <p className="text-xs text-muted mt-1">{formatDateTime(alert.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {alert.product_id && (
                        <button
                          onClick={() => handleViewProduct(alert.product_id)}
                          className="btn-primary py-1 px-2.5 text-xs flex items-center gap-1 bg-brand-600 hover:bg-brand-500 text-white border-none shadow-none rounded-lg font-semibold"
                        >
                          <Zap size={11} /> Analyze Product
                        </button>
                      )}
                      {!alert.is_read && (
                        <button onClick={() => markRead(alert.id)} className="btn-secondary py-1 px-2.5 text-xs">
                          Dismiss
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {selectedProduct && (
        <ProductAnalyticsModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
      {loadingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="glass-card p-6 flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-brand-500" size={32} />
            <p className="text-sm font-semibold text-primary">Fetching product details...</p>
          </div>
        </div>
      )}
    </div>
  );
}
