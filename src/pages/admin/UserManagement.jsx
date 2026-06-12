import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Lock, Unlock, Search, Shield, BarChart2, ShoppingCart, Package, X, CheckCircle, Clock, Calendar } from 'lucide-react';
import { ROLE_COLORS } from '../../utils/formatters';
import { formatDate } from '../../utils/formatters';
import { usersAPI } from '../../services/api';

const ROLE_ICONS = { manager: Shield, cashier: ShoppingCart, stock: Package };
const ROLE_OPTIONS = ['manager', 'cashier', 'stock'];

// Create / Edit User Modal
function UserModal({ user = null, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'cashier',
    device_id: user?.device_id || '',
    password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [pwMatch, setPwMatch] = useState(true);

  const submit = async (e) => {
    e.preventDefault();
    if (!user && form.password !== form.confirm_password) { setPwMatch(false); return; }
    
    try {
      setLoading(true);
      const payload = {
        name: form.name,
        email: form.email,
        role: form.role,
        device_id: form.device_id || null,
      };
      
      if (form.password) {
        payload.password = form.password;
      }
      
      if (user) {
        await usersAPI.update(user.id, payload);
      } else {
        await usersAPI.create(payload);
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save user:', error);
      alert('Failed to save user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-primary">{user ? 'Edit User' : 'Create New User'}</h2>
          <button onClick={onClose} className="btn-secondary p-2"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Full Name *</label>
            <input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Sarah Nakato" required />
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Email Address *</label>
            <input type="email" className="input-field" value={form.email} onChange={e => set('email', e.target.value)} placeholder="sarah@andrewbrothers.ug" required />
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Role *</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_OPTIONS.map(r => (
                <button key={r} type="button" onClick={() => set('role', r)}
                  className={`p-2.5 rounded-xl border text-left text-sm font-semibold transition-all capitalize ${
                    form.role === r ? `${ROLE_COLORS[r]} border` : 'border-theme bg-surface-2 text-secondary hover:bg-surface-3'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Device / Station</label>
            <input className="input-field font-mono" value={form.device_id} onChange={e => set('device_id', e.target.value)} placeholder="POS-003 or LAPTOP-02" />
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">{user ? 'New Password (leave blank to keep)' : 'Password *'}</label>
            <input type="password" className="input-field" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Minimum 8 characters" required={!user} />
          </div>
          {!user && (
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Confirm Password *</label>
              <input type="password" className={`input-field ${!pwMatch ? 'border-red-500' : ''}`}
                value={form.confirm_password} onChange={e => { set('confirm_password', e.target.value); setPwMatch(true); }}
                placeholder="Repeat password" required />
              {!pwMatch && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              <CheckCircle size={16} /> {loading ? 'Saving...' : user ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({ user, onClose, onSuccess }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { alert('Password must be at least 8 characters'); return; }
    
    try {
      setLoading(true);
      await usersAPI.resetPassword(user.id, { new_password: password });
      alert('Password reset successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to reset password:', error);
      alert('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-primary">Reset Password</h2>
          <button onClick={onClose} className="btn-secondary p-2"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">Target User:</p>
            <p className="text-sm font-semibold text-primary">{user.name} ({user.role})</p>
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">New Password *</label>
            <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 8 characters" required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center bg-amber-600 hover:bg-amber-500 border-none shadow-none text-white">
              <Lock size={16} /> {loading ? 'Resetting...' : 'Force Reset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('User Accounts');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);

  const TABS = ['User Accounts'];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLock = async (id) => {
    const user = users.find(u => u.id === id);
    try {
      await usersAPI.update(id, { is_active: user.is_active ? 0 : 1 });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: u.is_active ? 0 : 1 } : u));
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      alert('Failed to update user status.');
    }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  const roleCounts = ROLE_OPTIONS.reduce((acc, r) => ({ ...acc, [r]: users.filter(u => u.role === r).length }), {});

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
        <div>
          <h1 className="text-2xl font-black text-primary flex items-center gap-2">
            <Users size={22} className="text-blue-600 dark:text-blue-400" /> Staff Management
          </h1>
          <p className="text-muted text-sm mt-0.5">{users.filter(u => u.is_active).length} active staff</p>
        </div>
        {activeTab === 'User Accounts' && (
          <button onClick={() => setShowCreate(true)} className="btn-primary"><UserPlus size={16} /> Create User</button>
        )}
      </div>

      {activeTab === 'User Accounts' && (
        <div className="space-y-5 animate-fade-in">
          {/* Role KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ROLE_OPTIONS.map(r => {
              const Icon = ROLE_ICONS[r];
              return (
                <div key={r} className={`kpi-card border ${ROLE_COLORS[r]}`}>
                  <Icon size={20} className="mb-2" />
                  <p className="text-2xl font-black">{roleCounts[r]}</p>
                  <p className="text-xs capitalize font-semibold opacity-80">{r}s</p>
                </div>
              );
            })}
          </div>

          {/* Search + Table */}
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-theme">
              <div className="relative max-w-md">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  className="input-field pl-8 py-2 text-sm" placeholder="Search users…" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>{['Name','Email','Role','Device','Created','Status','Actions'].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-muted">Loading users...</td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-muted">No users found</td>
                    </tr>
                  ) : (
                    filtered.map(u => {
                      const Icon = ROLE_ICONS[u.role];
                      return (
                        <tr key={u.id} className="hover:bg-surface-2 transition-colors">
                          <td className="table-cell font-bold text-primary">{u.name}</td>
                          <td className="table-cell text-xs font-mono">{u.email}</td>
                          <td className="table-cell">
                            <span className={`status-pill text-xs capitalize ${ROLE_COLORS[u.role]}`}>
                              {Icon && <Icon size={11} />} {u.role}
                            </span>
                          </td>
                          <td className="table-cell text-xs font-mono text-muted">{u.device_id || '—'}</td>
                          <td className="table-cell text-xs text-muted">{formatDate(u.created_at)}</td>
                          <td className="table-cell">
                            <span className={`status-pill text-xs ${u.is_active ? 'badge-success' : 'badge-critical'}`}>
                              {u.is_active ? 'Active' : 'Locked'}
                            </span>
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => setEditUser(u)} className="btn-secondary py-1 px-2 text-xs">Edit</button>
                              <button onClick={() => setResetUser(u)} className="btn-secondary py-1 px-2 text-xs text-amber-600 border-amber-500/30 hover:bg-amber-500/10">Reset PW</button>
                              <button onClick={() => toggleLock(u.id)}
                                className={`py-1 px-2 text-xs rounded-lg border font-semibold transition-all ${
                                  u.is_active ? 'btn-danger py-1 px-2 text-xs' : 'btn-success py-1 px-2 text-xs'}`}>
                                {u.is_active ? <><Lock size={11} /> Lock</> : <><Unlock size={11} /> Unlock</>}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showCreate && <UserModal onClose={() => setShowCreate(false)} onSuccess={fetchUsers} />}
      {editUser && <UserModal user={editUser} onClose={() => setEditUser(null)} onSuccess={fetchUsers} />}
      {resetUser && <ResetPasswordModal user={resetUser} onClose={() => setResetUser(null)} onSuccess={fetchUsers} />}
    </div>
  );
}
