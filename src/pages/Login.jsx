import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { authAPI } from '../services/api';
import {
  ShoppingCart, AlertCircle, Eye, EyeOff, ChevronRight,
  Sun, Moon, KeyRound, ArrowLeft, CheckCircle, Shield, Loader2, Mail, Lock
} from 'lucide-react';

/* ─── Forgot Password Flow (Manager only) ─────────────────────── */
function ForgotPasswordPanel({ onBack }) {
  const [step, setStep] = useState('email'); // 'email' | 'pin' | 'done'
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [generatedPin, setGeneratedPin] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleRequestPin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword(email);
      const data = res.data?.data;
      if (data?.success) {
        setGeneratedPin(data.pin); // LAN-only: show PIN directly
        setStep('pin');
      } else {
        setError('No manager account found with that email. Only managers can reset passwords here.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate reset PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirm) { setError('Passwords do not match.'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await authAPI.resetPasswordWithPin(email, pin, newPassword);
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. PIN may be expired — request a new one.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="btn-secondary p-2" title="Back to login">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h3 className="text-lg font-black text-primary flex items-center gap-2">
            <KeyRound size={18} className="text-brand-500" /> Password Reset
          </h3>
          <p className="text-xs text-muted">Manager accounts only</p>
        </div>
      </div>

      {step === 'email' && (
        <form onSubmit={handleRequestPin} className="space-y-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2">
            <Shield size={14} className="flex-shrink-0 mt-0.5" />
            <span>Password resets are only available for manager accounts. Staff passwords can only be reset by the manager from User Management.</span>
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Manager Email</label>
            <input type="email" id="reset-email" className="input-field" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="manager@andrewbrothers.ug" required />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 border border-red-500/30 rounded-xl p-3">
              <AlertCircle size={15} />{error}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
            {loading ? 'Generating PIN...' : 'Get Reset PIN'}
          </button>
        </form>
      )}

      {step === 'pin' && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          {generatedPin && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Your Reset PIN</p>
              <p className="text-3xl font-black text-amber-600 dark:text-amber-400 tracking-widest font-mono">{generatedPin}</p>
              <p className="text-xs text-muted mt-1">Valid for 15 minutes. Keep this private — used to confirm your identity.</p>
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">PIN (from above)</label>
            <input id="reset-pin" className="input-field font-mono text-lg tracking-widest text-center" maxLength={6}
              value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} placeholder="••••••" required />
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">New Password</label>
            <div className="relative">
              <input id="reset-new-password" type={showPw ? 'text' : 'password'} className="input-field pr-10"
                value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 8 characters" required />
              <button type="button" onClick={() => setShowPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Confirm Password</label>
            <input id="reset-confirm-password" type="password" className={`input-field ${confirm && confirm !== newPassword ? 'border-red-500' : ''}`}
              value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" required />
            {confirm && confirm !== newPassword && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 border border-red-500/30 rounded-xl p-3">
              <AlertCircle size={15} />{error}
            </div>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={() => { setStep('email'); setError(''); }} className="btn-secondary flex-1 justify-center">
              <ArrowLeft size={14} /> Back
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      )}

      {step === 'done' && (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-500" />
          </div>
          <h3 className="text-lg font-black text-primary mb-1">Password Reset!</h3>
          <p className="text-sm text-muted mb-5">Your password has been updated. You can now log in with your new password.</p>
          <button onClick={onBack} className="btn-primary justify-center">
            <ChevronRight size={16} /> Back to Login
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Main Login Page ─────────────────────────────────────────── */
export default function Login() {
  const { login, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      // Read role from auth context after login sets the user
      const savedUser = JSON.parse(localStorage.getItem('rstms_user') || '{}');
      const routes = { manager: '/dashboard/manager', cashier: '/dashboard/pos', stock: '/dashboard/inventory' };
      navigate(routes[savedUser?.role] || '/dashboard/manager');
    } else {
      setError(result.error || 'Invalid credentials. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300"
      style={{ background: 'var(--bg-base)' }}>

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse
          ${isDark ? 'bg-brand-900' : 'bg-brand-100'}`} />
        <div className={`absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse
          ${isDark ? 'bg-purple-900' : 'bg-purple-100'}`} style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0" style={{
          backgroundImage: isDark
            ? 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)'
            : 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg,rgba(0,0,0,0.03) 1px,transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Theme toggle */}
      <button onClick={toggleTheme}
        className="absolute top-4 right-4 btn-secondary p-2.5 z-10"
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
        {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-500" />}
      </button>

      <div className="w-full max-w-5xl mx-auto grid lg:grid-cols-2 gap-8 relative animate-fade-in">

        {/* ── Left: Brand Panel ── */}
        <div className="hidden lg:flex flex-col justify-between py-8 pr-4">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-600/30">
                <ShoppingCart size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-primary">Andrew &amp; Brothers</h1>
                <p className="text-xs text-muted font-semibold tracking-widest uppercase">Supermarket · Fort Portal, Uganda</p>
              </div>
            </div>

            <h2 className="text-4xl font-black text-primary mb-4 leading-tight">
              AI-Powered<br />
              <span className="text-gradient">Sales System</span>
            </h2>
          </div>
        </div>

        {/* ── Right: Login / Forgot Password Panel ── */}
        <div className="glass-card p-8 flex flex-col justify-center">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-2 lg:hidden">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-teal-600 rounded-xl flex items-center justify-center">
              <ShoppingCart size={16} className="text-white" />
            </div>
            <span className="font-bold text-primary text-sm">Andrew &amp; Brothers RSTMS</span>
          </div>

          {showForgot ? (
            <ForgotPasswordPanel onBack={() => setShowForgot(false)} />
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-black text-primary mb-2 tracking-tight">Welcome Back</h2>
                <p className="text-muted text-sm">Please sign in to access your dashboard</p>
              </div>

              <form id="login-form" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-2">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/60" />
                    <input id="login-email" type="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="input-field pl-11 py-3 text-[15px]" placeholder="email@andrewbrothers.ug" required />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-2">Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/60" />
                    <input id="login-password" type={showPw ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="input-field pl-11 pr-11 py-3 text-[15px]" placeholder="••••••••" required />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="flex justify-end mt-1.5">
                    <button type="button" onClick={() => setShowForgot(true)}
                      className="text-xs text-brand-500 hover:text-brand-400 font-semibold transition-colors">
                      Forgot password?
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                    <AlertCircle size={15} />{error}
                  </div>
                )}

                <button id="login-submit" type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 mt-4 text-[15px] font-bold shadow-lg shadow-brand-500/20">
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><span>Sign In</span><ChevronRight size={18} /></>
                  }
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
