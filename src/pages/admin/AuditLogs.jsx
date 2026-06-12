import React, { useState, useEffect } from 'react';
import { Activity, Search, Filter, Download, Shield, Eye } from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';
import { auditLogsAPI } from '../../services/api';

const ACTION_COLORS = {
  sale_created: 'badge-success',
  refund_processed: 'badge-warning',
  void_authorized: 'badge-critical',
  user_created: 'badge-info',
  po_created: 'badge-info',
  stock_received: 'badge-success',
  product_price_updated: 'badge-warning',
  promotion_created: 'badge-info',
  cash_session_opened: 'badge-success',
  login_failed: 'badge-critical',
  backup_completed: 'badge-success',
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await auditLogsAPI.getAll();
      setLogs(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const types = ['all', ...Array.from(new Set(logs.map(l => l.action)))];

  const filtered = logs.filter(l => {
    const matchSearch = l.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.action?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || l.action === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-primary flex items-center gap-2">
            <Activity size={22} className="text-indigo-600 dark:text-indigo-400" /> Audit Logs
          </h1>
          <p className="text-muted text-sm mt-0.5">Immutable system action trail · ACID protected · Read-only</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-1.5">
            <Shield size={12} /> Tamper-proof
          </div>
          <button className="btn-secondary text-xs py-1.5"><Download size={13} /> Export CSV</button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-theme flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="input-field pl-8 py-2 text-sm" placeholder="Search by user or action…" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input-field py-2 text-sm w-auto">
            {types.map(t => <option key={t} value={t}>{t === 'all' ? '— All actions —' : t.replace(/_/g, ' ')}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>{['Timestamp','User','Action','Entity','IP Address'].map(h=><th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-muted">Loading audit logs...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-muted">No logs found</td>
                </tr>
              ) : (
                filtered.map(log => (
                  <tr key={log.id} className="hover:bg-surface-2 transition-colors">
                    <td className="table-cell text-xs font-mono text-muted">{formatDateTime(log.created_at || log.timestamp)}</td>
                    <td className="table-cell font-semibold text-primary">{log.user_name || 'System'}</td>
                    <td className="table-cell">
                      <span className={`status-pill text-xs capitalize ${ACTION_COLORS[log.action] || 'badge-info'}`}>
                        {log.action?.replace(/_/g,' ')}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-muted capitalize">
                      {log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ''}
                    </td>
                    <td className="table-cell text-xs font-mono text-muted">{log.ip_address || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-theme text-center text-xs text-muted">
          Showing {filtered.length} of {logs.length} log entries
        </div>
      </div>
    </div>
  );
}
