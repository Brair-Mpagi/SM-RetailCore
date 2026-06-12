import React, { useState, useEffect } from 'react';
import { Settings, Save, Shield, Bell, Database, Globe, Lock, Loader2, AlertCircle } from 'lucide-react';
import { settingsAPI } from '../../services/api';
import { useSettings } from '../../contexts/SettingsContext';

const SECTIONS = ['General', 'Security', 'Alerts', 'Backup', 'Environment'];

export default function SystemSettings() {
  const [activeSection, setActiveSection] = useState('General');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [loadStatus, setLoadStatus] = useState(null); // 'loaded' | 'defaults'

  const { refreshSettings } = useSettings();

  const [general, setGeneral] = useState({
    shop_name: 'Andrew & Brothers Supermarket',
    location: 'Fort Portal, Uganda',
    vat_rate: '18',
    currency: 'UGX',
    timezone: 'Africa/Nairobi',
    receipt_footer: 'Thank you — Karibu Tena!',
  });
  const [security, setSecurity] = useState({
    jwt_expiry: '8h', max_login_attempts: '5',
    lockout_duration: '15', session_timeout: '480',
  });
  const [alertSettings, setAlertSettings] = useState({
    low_stock_threshold: '80', expiry_days_warning: '7',
    refund_rate_threshold: '5', fraud_alert_enabled: true,
  });
  const [backup, setBackup] = useState({
    frequency: 'daily', time: '02:00', retention_days: '30',
    location: '/var/backups/rstms', auto_backup: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await settingsAPI.getAll();
      if (res.data && res.data.data && res.data.data.length > 0) {
        setLoadStatus('loaded');
        const settings = res.data.data;
        
        // Transform array into objects
        const g = { ...general };
        const s = { ...security };
        const a = { ...alertSettings };
        const b = { ...backup };

        settings.forEach(item => {
          let val = item.value;
          if (item.type === 'boolean') val = val === 'true';
          
          if (item.category === 'General') g[item.key] = val;
          else if (item.category === 'Security') s[item.key] = val;
          else if (item.category === 'Alerts') a[item.key] = val;
          else if (item.category === 'Backup') b[item.key] = val;
        });

        setGeneral(g);
        setSecurity(s);
        setAlertSettings(a);
        setBackup(b);
      } else {
        setLoadStatus('defaults');
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setError('Failed to load settings from server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Flatten into array
      const payload = [
        ...Object.entries(general).map(([k, v]) => ({ key: k, value: v, category: 'General', type: typeof v })),
        ...Object.entries(security).map(([k, v]) => ({ key: k, value: v, category: 'Security', type: typeof v })),
        ...Object.entries(alertSettings).map(([k, v]) => ({ key: k, value: v, category: 'Alerts', type: typeof v })),
        ...Object.entries(backup).map(([k, v]) => ({ key: k, value: v, category: 'Backup', type: typeof v })),
      ];

      await settingsAPI.update(payload);
      
      setSaved(true); 
      setLoadStatus('loaded');
      refreshSettings(); // Update the global settings context
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings to server.');
    } finally {
      setSaving(false);
    }
  };

  const setG = (k, v) => setGeneral(f => ({ ...f, [k]: v }));
  const setSec = (k, v) => setSecurity(f => ({ ...f, [k]: v }));
  const setAl = (k, v) => setAlertSettings(f => ({ ...f, [k]: v }));
  const setBk = (k, v) => setBackup(f => ({ ...f, [k]: v }));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-brand-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-primary flex items-center gap-2">
            <Settings size={22} className="text-slate-600 dark:text-slate-400" /> System Settings
          </h1>
          <p className="text-muted text-sm mt-0.5">Environment configuration and system parameters</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className={`btn-primary transition-all flex items-center gap-2 ${saved ? 'bg-emerald-600 hover:bg-emerald-500' : ''} ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-xl flex items-center gap-2 text-sm font-medium">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {loadStatus === 'loaded' && !error && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl flex items-center gap-2 text-sm font-medium">
          <Database size={16} /> Settings successfully loaded from database.
        </div>
      )}
      
      {loadStatus === 'defaults' && !error && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-3 rounded-xl flex items-center gap-2 text-sm font-medium">
          <AlertCircle size={16} /> Database settings empty. Using local defaults. Please save to persist.
        </div>
      )}

      <div className="flex gap-1 flex-wrap">
        {SECTIONS.map(s => (
          <button key={s} onClick={() => setActiveSection(s)}
            className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${activeSection===s ? 'bg-brand-600 text-white' : 'btn-secondary py-2 text-xs'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="glass-card p-6">
        {activeSection === 'General' && (
          <div className="space-y-4">
            <h2 className="section-title mb-4"><Globe size={16} className="text-brand-500 dark:text-brand-400" /> General Configuration</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: 'Supermarket Name', key: 'shop_name' },
                { label: 'Location', key: 'location' },
                { label: 'VAT Rate (%)', key: 'vat_rate', type: 'number' },
                { label: 'Currency Code', key: 'currency' },
                { label: 'Timezone', key: 'timezone' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">{f.label}</label>
                  <input type={f.type || 'text'} className="input-field"
                    value={general[f.key]} onChange={e => setG(f.key, e.target.value)} />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Receipt Footer Message</label>
                <textarea className="input-field" rows={2} value={general.receipt_footer} onChange={e => setG('receipt_footer', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'Security' && (
          <div className="space-y-4">
            <h2 className="section-title mb-4"><Lock size={16} className="text-red-500 dark:text-red-400" /> Security Settings</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: 'JWT Token Expiry', key: 'jwt_expiry', placeholder: '8h' },
                { label: 'Max Login Attempts', key: 'max_login_attempts', type: 'number' },
                { label: 'Lockout Duration (min)', key: 'lockout_duration', type: 'number' },
                { label: 'Session Timeout (min)', key: 'session_timeout', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">{f.label}</label>
                  <input type={f.type || 'text'} className="input-field"
                    value={security[f.key]} onChange={e => setSec(f.key, e.target.value)} placeholder={f.placeholder} />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'Alerts' && (
          <div className="space-y-4">
            <h2 className="section-title mb-4"><Bell size={16} className="text-amber-500 dark:text-amber-400" /> Alert Thresholds</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: 'Low Stock % Threshold', key: 'low_stock_threshold', type: 'number' },
                { label: 'Expiry Warning (days)', key: 'expiry_days_warning', type: 'number' },
                { label: 'Refund Rate Alert (%)', key: 'refund_rate_threshold', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">{f.label}</label>
                  <input type={f.type} className="input-field"
                    value={alertSettings[f.key]} onChange={e => setAl(f.key, e.target.value)} />
                </div>
              ))}
              <div className="flex items-center gap-3 p-4 bg-surface-2 rounded-xl border border-theme">
                <input type="checkbox" id="fraud-alert" className="w-4 h-4 accent-brand-500"
                  checked={alertSettings.fraud_alert_enabled}
                  onChange={e => setAl('fraud_alert_enabled', e.target.checked)} />
                <label htmlFor="fraud-alert" className="text-sm font-semibold text-primary cursor-pointer">Enable Fraud Detection Alerts</label>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'Backup' && (
          <div className="space-y-4">
            <h2 className="section-title mb-4"><Database size={16} className="text-blue-500 dark:text-blue-400" /> Backup Configuration</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Frequency</label>
                <select className="input-field" value={backup.frequency} onChange={e => setBk('frequency', e.target.value)}>
                  {['hourly','daily','weekly'].map(f => <option key={f} value={f} className="capitalize">{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Time (EAT)</label>
                <input type="time" className="input-field" value={backup.time} onChange={e => setBk('time', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Retention (days)</label>
                <input type="number" className="input-field" value={backup.retention_days} onChange={e => setBk('retention_days', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Backup Path</label>
                <input className="input-field font-mono text-xs" value={backup.location} onChange={e => setBk('location', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'Environment' && (
          <div>
            <h2 className="section-title mb-4"><Shield size={16} className="text-violet-500 dark:text-violet-400" /> Environment Variables</h2>
            <div className="space-y-2">
              {[
                ['NODE_ENV', 'production'],
                ['PORT', '3001'],
                ['DB_HOST', '192.168.1.1'],
                ['DB_PORT', '3306'],
                ['DB_NAME', 'rstms_db'],
                ['DB_USER', 'rstms_user'],
                ['DB_PASS', '••••••••••'],
                ['JWT_SECRET', '••••••••••••••••'],
                ['JWT_EXPIRY', security.jwt_expiry],
                ['VAT_RATE', (parseFloat(general.vat_rate || 0) / 100).toFixed(2)],
                ['CURRENCY', general.currency],
                ['RECEIPT_PRINTER_PORT', '/dev/usb/lp0'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center gap-3 p-3 bg-surface-2 rounded-xl border border-theme">
                  <span className="font-mono text-xs text-brand-600 dark:text-brand-400 w-48 flex-shrink-0">{k}</span>
                  <span className="font-mono text-xs text-primary">{v}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted mt-3">⚠️ Edit .env file on the server to change some of these values. Dynamic settings are stored in database.</p>
          </div>
        )}
      </div>
    </div>
  );
}
