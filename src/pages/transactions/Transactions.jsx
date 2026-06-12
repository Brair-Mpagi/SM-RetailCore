import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingBag, Search, FileText, Lock, Calculator, CheckCircle, AlertTriangle, ChevronDown, Package } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { transactionsAPI, cashSessionsAPI, managerAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function Transactions() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All Receipts');
  const [transactions, setTransactions] = useState([]);
  const [expandedTx, setExpandedTx] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [closingSession, setClosingSession] = useState(null);
  
  // Close Drawer Modal State
  const [countedCash, setCountedCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  const TABS = user?.role === 'cashier' ? ['All Receipts'] : ['All Receipts', 'Till Closeouts (Z-Reports)'];

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await transactionsAPI.getAll();
        setTransactions(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  // Fetch cash sessions (till closeouts)
  useEffect(() => {
    const fetchSessions = async () => {
      if (user?.role !== 'cashier') {
        try {
          const response = await managerAPI.shiftBreakdowns({ limit: 100 });
          setSessions(response.data.data || []);
        } catch (error) {
          console.error('Failed to fetch sessions:', error);
        }
      } else {
        try {
          const response = await cashSessionsAPI.getActive();
          if (response.data?.data) {
            setActiveSession(response.data.data);
          }
        } catch (error) {
          // If 404, they have no active session
          setActiveSession(null);
        }
      }
    };
    fetchSessions();
  }, [user]);

  // 1) Receipt filtering
  const roleFilteredTxs = useMemo(() => {
    if (user?.role === 'cashier') {
      if (!activeSession) return [];
      return transactions.filter(t => t.cash_session_id === activeSession.id);
    }
    return transactions;
  }, [user, transactions, activeSession]);

  const filteredTxs = useMemo(() => {
    const q = search.toLowerCase();
    return roleFilteredTxs.filter(t => 
      t.receipt_number?.toLowerCase().includes(q) || 
      t.cashier?.name?.toLowerCase().includes(q)
    );
  }, [roleFilteredTxs, search]);

  // 2) Drawer Sessions Filtering
  const filteredSessions = useMemo(() => {
    const q = search.toLowerCase();
    return sessions.filter(s => {
      const name = (s.cashier?.name || s.cashier_name || '').toLowerCase();
      return name.includes(q);
    });
  }, [sessions, search]);

  const handleCloseOut = async (e) => {
    e.preventDefault();
    const actual = parseInt(countedCash.replace(/[^0-9]/g, '')) || 0;
    
    try {
      await cashSessionsAPI.close(closingSession.id, {
        actual_cash: actual,
        notes: closeNotes
      });
      
      // Refresh sessions
      const response = await managerAPI.allActiveSessions();
      setSessions(response.data.data || []);
      
      setClosingSession(null);
      setCountedCash('');
      setCloseNotes('');
    } catch (error) {
      console.error('Failed to close session:', error);
      alert('Failed to close session. Please try again.');
    }
  };

  const PAYMENT_LABELS = {
    cash: 'CASH',
    mtn_momo: 'MTN MoMo',
    airtel_money: 'Airtel Money'
  };

  return (
    <div className="animate-fade-in max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between gap-3 mb-8 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-500/15 rounded-2xl flex items-center justify-center border border-indigo-500/30">
            <ShoppingBag size={24} className="text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-primary tracking-tight">Transactions</h1>
            <p className="text-sm text-muted">
              {user?.role === 'cashier' ? 'Your sales history for this session.' : 'Complete transaction history and drawer closeouts.'}
            </p>
          </div>
        </div>
      </div>

      {TABS.length > 1 && (
        <div className="flex gap-2 mb-6 border-b border-theme/30 pb-2">
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === t ? 'bg-indigo-600 text-white shadow-md' : 'text-muted hover:bg-surface-2 hover:text-primary'
              }`}>
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="glass-card mb-6 p-2 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input 
            className="input-field pl-9" 
            placeholder="Search by receipt # or cashier..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {activeTab === 'All Receipts' && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-theme bg-surface-2/50">
                  <th className="p-4 font-bold text-muted">Receipt #</th>
                  <th className="p-4 font-bold text-muted">Cashier</th>
                  <th className="p-4 font-bold text-muted text-right">Amount</th>
                  <th className="p-4 font-bold text-muted">Method</th>
                  <th className="p-4 font-bold text-muted">Status</th>
                  <th className="p-4 font-bold text-muted">Time</th>
                  <th className="p-4 font-bold text-muted w-10"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-muted">
                      Loading transactions...
                    </td>
                  </tr>
                ) : filteredTxs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-muted">
                      <FileText size={24} className="mx-auto mb-2 opacity-50" />
                      No receipts found.
                    </td>
                  </tr>
                ) : (
                  filteredTxs.map(tx => (
                    <React.Fragment key={tx.id}>
                      <tr 
                        onClick={() => setExpandedTx(expandedTx === tx.id ? null : tx.id)}
                        className="border-b border-theme hover:bg-surface-2/30 transition-colors cursor-pointer"
                      >
                        <td className="p-4 font-bold text-primary">{tx.receipt_number}</td>
                        <td className="p-4 text-muted">{tx.cashier?.name || 'Unknown'}</td>
                        <td className="p-4 font-bold text-emerald-500 text-right">{formatCurrency(tx.total_amount)}</td>
                        <td className="p-4">
                          {tx.payment_method === 'cash' && <span className="px-2 py-1 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">CASH</span>}
                          {tx.payment_method === 'mtn_momo' && <span className="px-2 py-1 rounded-md text-xs font-bold bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">MTN MoMo</span>}
                          {tx.payment_method === 'airtel_money' && <span className="px-2 py-1 rounded-md text-xs font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20">Airtel Money</span>}
                        </td>
                        <td className="p-4">
                          {tx.status === 'completed' 
                            ? <span className="text-emerald-500 text-xs font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full"><span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1"/> Completed</span>
                            : tx.status === 'refunded'
                            ? <span className="text-amber-500 text-xs font-bold bg-amber-500/10 px-2.5 py-1 rounded-full"><span className="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full mr-1"/> Refunded</span>
                            : <span className="text-red-500 text-xs font-bold bg-red-500/10 px-2.5 py-1 rounded-full"><span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full mr-1"/> Voided</span>
                          }
                        </td>
                        <td className="p-4 text-muted text-xs">
                          {new Date(tx.created_at).toLocaleString('en-US', { hour:'numeric', minute:'2-digit', month:'short', day:'numeric' })}
                        </td>
                        <td className="p-4 text-right">
                          <ChevronDown size={16} className={`text-muted transition-transform ${expandedTx === tx.id ? 'rotate-180' : ''}`} />
                        </td>
                      </tr>
                      {expandedTx === tx.id && (
                        <tr className="bg-surface-2/10 border-b border-theme">
                          <td colSpan="7" className="p-0">
                            <div className="p-4 pl-12 border-l-4 border-indigo-500/30 ml-4 my-2 rounded-r-xl">
                              <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Items Sold</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {tx.items?.map(item => (
                                  <div key={item.id} className="flex items-center gap-3 bg-surface p-3 rounded-xl border border-theme shadow-sm">
                                    <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <Package size={16} className="text-indigo-500"/>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-bold text-primary truncate">{item.product?.name || `Product #${item.product_id}`}</p>
                                      <p className="text-xs text-muted">{item.quantity} × {formatCurrency(item.unit_price)}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <p className="text-sm font-black text-primary">{formatCurrency(item.subtotal)}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Till Closeouts (Z-Reports)' && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-theme bg-surface-2/50">
                  <th className="p-4 font-bold text-muted">Cashier</th>
                  <th className="p-4 font-bold text-muted">Opened</th>
                  <th className="p-4 font-bold text-muted">Opening Cash</th>
                  <th className="p-4 font-bold text-muted">Expected Cash</th>
                  <th className="p-4 font-bold text-muted">Counted Cash</th>
                  <th className="p-4 font-bold text-muted">Variance</th>
                  <th className="p-4 font-bold text-muted">Status</th>
                  <th className="p-4 font-bold text-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.length === 0 && (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-muted">
                      <Lock size={24} className="mx-auto mb-2 opacity-30" />
                      No till closeout sessions found.
                    </td>
                  </tr>
                )}
                {filteredSessions.map(s => {
                  const opening = parseFloat(s.opening_balance || s.computed?.opening_balance || 0);
                  const expected = parseFloat(s.expected_cash || s.computed?.expected_cash || 0);
                  const actual = s.actual_cash != null ? parseFloat(s.actual_cash) : s.computed?.actual_cash;
                  const variance = actual !== null && actual !== undefined ? actual - expected : null;
                  const cashierName = s.cashier?.name || s.cashier_name || `Session #${s.id}`;
                  return (
                    <tr key={s.id} className="border-b border-theme hover:bg-surface-2/30 transition-colors">
                      <td className="p-4 font-bold text-primary">{cashierName}</td>
                      <td className="p-4 text-muted text-xs">{new Date(s.started_at || s.opened_at).toLocaleString('en-US', { hour:'numeric', minute:'2-digit', month:'short', day:'numeric' })}</td>
                      <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(opening)}</td>
                      <td className="p-4 font-mono font-bold text-primary">{formatCurrency(expected)}</td>
                      <td className="p-4 font-mono text-muted">{actual !== null && actual !== undefined ? formatCurrency(actual) : '—'}</td>
                      <td className="p-4 font-mono font-bold">
                        {variance === null ? '—' : 
                         variance < 0 ? <span className="text-red-500">{formatCurrency(variance)}</span> : 
                         variance > 0 ? <span className="text-emerald-500">+{formatCurrency(variance)}</span> : 
                         <span className="text-emerald-500">Exact Match</span>}
                      </td>
                      <td className="p-4">
                        {s.status === 'open' 
                          ? <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider bg-emerald-500/10 px-2 border border-emerald-500/20 py-1 rounded">Active</span>
                          : <span className="text-muted text-xs font-bold uppercase tracking-wider bg-surface-2 px-2 py-1 border border-theme rounded">Closed</span>}
                      </td>
                      <td className="p-4 text-right">
                        {s.status === 'open' && (
                          <button onClick={() => setClosingSession(s)} className="btn-primary text-xs py-1.5 px-3">
                            <Lock size={12} /> Z-Report Close
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drawer Closeout Modal */}
      {closingSession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-theme rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slide-up">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-5 text-white">
              <h2 className="text-xl font-black flex items-center gap-2">
                <Calculator size={20} /> Close Cash Drawer
              </h2>
              <p className="text-white/80 text-sm mt-1">{closingSession.cashier_name}'s Session</p>
            </div>
            
            <form onSubmit={handleCloseOut} className="p-5 space-y-4">
              <div className="bg-surface-2 p-4 rounded-xl border border-theme flex justify-between items-center">
                <span className="text-muted font-bold text-sm tracking-wider uppercase">System Expected Cash</span>
                <span className="text-xl font-black font-mono text-primary">{formatCurrency(closingSession.expected_cash)}</span>
              </div>

              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Physically Counted Cash</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-bold">UGX</span>
                  <input type="number" required autoFocus
                    className="input-field pl-12 text-lg font-mono font-bold bg-surface border-indigo-500/30 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    placeholder="e.g. 145000"
                    value={countedCash}
                    onChange={e => setCountedCash(e.target.value)}
                  />
                </div>
              </div>

              {countedCash && (
                <div className={`p-3 rounded-lg border flex items-center gap-2 ${
                  parseInt(countedCash) - closingSession.expected_cash < 0 
                  ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400' 
                  : parseInt(countedCash) - closingSession.expected_cash > 0
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-500'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-500'
                }`}>
                  {parseInt(countedCash) - closingSession.expected_cash < 0 ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase">Variance</p>
                    <p className="font-mono font-bold">
                      {formatCurrency(parseInt(countedCash) - closingSession.expected_cash)}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Closeout Notes (Required if Short/Over)</label>
                <input type="text"
                  className="input-field"
                  placeholder="Explain any discrepancy..."
                  required={(countedCash && parseInt(countedCash) !== closingSession.expected_cash)}
                  value={closeNotes}
                  onChange={e => setCloseNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-theme">
                <button type="button" onClick={() => { setClosingSession(null); setCountedCash(''); setCloseNotes(''); }} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center bg-indigo-600 hover:bg-indigo-700">
                  <Lock size={16} /> Confirm Closeout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
