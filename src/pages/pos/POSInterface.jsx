import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ShoppingCart, Camera, Search, X, Plus, Minus,
  Printer, DollarSign, Smartphone, AlertCircle, CheckCircle,
  Zap, Trash2, RotateCcw, Hash, Package, Keyboard,
  CornerDownLeft, Tag, RefreshCw, Clock, LogOut, PauseCircle, List,
  Mail, MessageSquare, ChevronRight, AlertTriangle, Receipt, Barcode,
  UserCircle, CreditCard, Wifi, WifiOff, QrCode, PlayCircle, Lock, Calculator
} from 'lucide-react';
import { io } from 'socket.io-client';
import BarcodeScanner from '../../components/pos/BarcodeScanner';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, PAYMENT_LABELS } from '../../utils/formatters';
import { productsAPI, transactionsAPI, cashSessionsAPI, promotionsAPI, paymentsAPI } from '../../services/api';
import { useSettings } from '../../contexts/SettingsContext';

/* ── Constants ──────────────────────────────────────────── */
const PAYMENT_METHODS = [
  { id: 'cash',          label: 'Cash',         sub: 'Count & give change',  icon: DollarSign,  color: 'emerald' },
  { id: 'mtn_momo',     label: 'MTN MoMo',     sub: 'Mobile money payment', icon: Smartphone,  color: 'yellow' },
  { id: 'airtel_money', label: 'Airtel Money',  sub: 'Mobile money payment', icon: Smartphone,  color: 'red' },
];

/* ── Promotion helper ───────────────────────────────────── */
function applyPromotion(product, promotions = []) {
  const now = new Date();
  const promo = promotions.find(p =>
    p.is_active &&
    new Date(p.start_date) <= now && new Date(p.end_date) >= now &&
    (p.product_id === product.id || !p.product_id)
  );
  if (!promo) return { price: product.unit_price, promo: null };
  const discount = promo.discount_type === 'percentage'
    ? Math.round(product.unit_price * promo.discount_value / 100)
    : promo.discount_value;
  return { price: Math.max(0, product.unit_price - discount), promo };
}



/* ────────────────────────────────────────────────────────── */
/* On-screen Numpad                                          */
/* ────────────────────────────────────────────────────────── */
function Numpad({ value, onChange, onConfirm, onClose, title }) {
  const press = (d) => onChange(v => v === '0' ? d : (v + d).slice(0, 6));
  const del   = ()  => onChange(v => v.length > 1 ? v.slice(0, -1) : '0');
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel max-w-xs" onClick={e => e.stopPropagation()}>
        <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">{title}</p>
        <div className="text-5xl font-black text-primary text-center bg-surface-2 rounded-2xl py-5 mb-4 border border-theme tracking-widest">
          {value}
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[1,2,3,4,5,6,7,8,9,'00',0,'⌫'].map((k, i) => (
            <button key={i}
              onClick={() => k === '⌫' ? del() : press(String(k))}
              className="py-5 rounded-xl text-2xl font-black btn-secondary justify-center active:scale-95 transition-transform">
              {k}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={() => onConfirm(Math.max(1, Number(value)))}
            className="btn-primary flex-1 justify-center py-3"><CheckCircle size={16}/> Confirm</button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Product Found Toast (scan feedback)                       */
/* ────────────────────────────────────────────────────────── */
function ScanToast({ product, onDismiss, promotions }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 2000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const { price, promo } = applyPromotion(product, promotions);
  const exceedsStock = (product.cartQty || 0) > (product.stock || 0);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div className={`flex items-center gap-3 ${exceedsStock ? 'bg-amber-600' : 'bg-emerald-600'} text-white px-5 py-3 rounded-2xl shadow-2xl`}>
        {exceedsStock ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
        <div>
          <p className="font-bold text-sm">{product.name}</p>
          <p className="text-xs opacity-80">
            {formatCurrency(price)} · stock: {product.stock || 0}
            {exceedsStock && ' (Exceeds stock!)'}
          </p>
        </div>
        {promo && <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">PROMO</span>}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Held Transactions Modal                                   */
/* ────────────────────────────────────────────────────────── */
function HeldCartsModal({ heldCarts, onClose, onResume, onDiscard }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <PauseCircle size={18} className="text-brand-500" /> Parked Sales
          </h2>
          <button onClick={onClose} className="btn-secondary p-2"><X size={18}/></button>
        </div>

        {heldCarts.length === 0 ? (
          <div className="text-center py-10 text-muted">
            <List size={40} className="mx-auto mb-3 opacity-20"/>
            <p>No parked sales.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {heldCarts.map(hc => {
              const total = hc.items.reduce((s, c) => s + (c.salePrice * c.qty), 0);
              const itemCount = hc.items.reduce((s, c) => s + c.qty, 0);
              return (
                <div key={hc.id} className="p-3 bg-surface-2 border border-theme rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-primary text-sm mb-0.5">Sale from {hc.time}</p>
                    <p className="text-xs text-muted">{itemCount} items · Subtotal {formatCurrency(total)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => onDiscard(hc.id)} className="btn-secondary text-red-500 hover:bg-red-500/10 px-3 py-1.5 text-xs">
                      Discard
                    </button>
                    <button onClick={() => onResume(hc)} className="btn-primary bg-brand-500 hover:bg-brand-600 px-4 py-1.5 text-xs border-none text-white">
                      Resume
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Return / Refund Modal                                     */
/* ────────────────────────────────────────────────────────── */
function ReturnModal({ onClose, onReturn }) {
  const [receiptNo, setReceiptNo] = useState('');
  const [found, setFound] = useState(null);
  const [step, setStep] = useState('search'); // search | select | confirm
  const [selectedItems, setSelectedItems] = useState([]);
  const [reason, setReason]   = useState('');
  const [condition, setCondition] = useState('resale');
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const lookup = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setNotFound(false);
      const response = await transactionsAPI.getByReceipt(receiptNo.trim());
      if (response.data.data) {
        setFound(response.data.data);
        setStep('select');
      } else {
        setFound(null);
        setNotFound(true);
      }
    } catch (error) {
      console.error('Failed to lookup receipt:', error);
      setFound(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const refundTotal = selectedItems.reduce((s,i) => s + i.subtotal, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <RotateCcw size={18} className="text-amber-500" /> Return / Refund
          </h2>
          <button onClick={onClose} className="btn-secondary p-2"><X size={18}/></button>
        </div>

        {step === 'search' && (
          <>
            <form onSubmit={lookup} className="flex gap-2 mb-4">
              <input autoFocus className="input-field py-3 font-mono"
                placeholder="Receipt number (e.g. REC-20260423-0001)"
                value={receiptNo} onChange={e => setReceiptNo(e.target.value)} />
              <button type="submit" disabled={loading} className="btn-primary px-5 flex-shrink-0">
                {loading ? 'Searching...' : 'Find'}
              </button>
            </form>
            {notFound && (
              <div className="flex items-center gap-2 text-red-500 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm">
                <AlertCircle size={15}/> Receipt not found. Check number and try again.
              </div>
            )}
          </>
        )}

        {step === 'select' && found && (
          <div className="space-y-4">
            <div className="p-4 bg-surface-2 rounded-xl border border-theme">
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-primary text-sm">{found.receipt_number}</span>
                <span className="font-bold text-brand-500">{formatCurrency(found.total_amount)}</span>
              </div>
              <p className="text-xs text-muted">{found.cashier} · {PAYMENT_LABELS[found.payment_method]} · {found.created_at?.slice(0,10)}</p>
            </div>
            <p className="text-xs font-bold text-muted uppercase">Select items to return:</p>
            {(found.items || [{ name: 'Full transaction', subtotal: found.total_amount }]).map((item, i) => {
              const sel = selectedItems.find(x => x.name === item.name);
              return (
                <label key={i} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${sel ? 'border-amber-500/50 bg-amber-500/10' : 'border-theme bg-surface-2 hover:bg-surface-3'}`}>
                  <input type="checkbox" checked={!!sel}
                    onChange={e => {
                      if (e.target.checked) setSelectedItems(prev => [...prev, item]);
                      else setSelectedItems(prev => prev.filter(x => x.name !== item.name));
                    }}
                    className="w-4 h-4 accent-amber-500" />
                  <span className="flex-1 text-sm text-primary font-medium">{item.name}</span>
                  <span className="font-bold text-sm">{formatCurrency(item.subtotal || found.total_amount)}</span>
                </label>
              );
            })}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted uppercase block mb-1.5">Condition</label>
                <select className="input-field" value={condition} onChange={e => setCondition(e.target.value)}>
                  <option value="resale">Resale (stock returned)</option>
                  <option value="damaged">Damaged (no stock return)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted uppercase block mb-1.5">Reason *</label>
                <select className="input-field" value={reason} onChange={e => setReason(e.target.value)}>
                  <option value="">— select —</option>
                  <option>Defective / damaged product</option>
                  <option>Wrong item supplied</option>
                  <option>Customer changed mind</option>
                  <option>Expired product</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep('search')} className="btn-secondary flex-1 justify-center">Back</button>
              <button disabled={!reason || selectedItems.length === 0}
                onClick={() => { onReturn({ ...found, refundAmount: refundTotal, condition, reason }); onClose(); }}
                className="btn-primary flex-1 justify-center bg-amber-600 hover:bg-amber-500 shadow-amber-900/30"
                style={{boxShadow:'none'}}>
                <RotateCcw size={16}/> Refund {formatCurrency(refundTotal)}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Close Shift Modal                                         */

/* ────────────────────────────────────────────────────────── */
/* Receipt Modal                                             */
/* ────────────────────────────────────────────────────────── */
function ReceiptModal({ receipt, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-4">
          <div className="w-14 h-14 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={28} className="text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-primary">Sale Complete!</h2>
          <p className="font-mono text-xs text-muted mt-1">{receipt.receipt_number}</p>
        </div>

        {/* Thermal-style receipt */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 mb-4 font-mono text-xs border border-theme shadow-inner">
          <p className="text-center font-black text-gray-900 dark:text-white mb-0.5 text-sm">ANDREW &amp; BROTHERS</p>
          <p className="text-center text-gray-500 dark:text-gray-400 text-[10px] mb-3">Fort Portal, Uganda · +256 775 000 000</p>
          <div className="border-t border-dashed border-gray-300 dark:border-zinc-700 mb-2"/>
          {receipt.items.map((item, i) => (
            <div key={i} className="flex justify-between mb-0.5">
              <span className="text-gray-600 dark:text-gray-400 truncate mr-2">{item.name} ×{item.qty}</span>
              <span className="text-gray-900 dark:text-white flex-shrink-0">{formatCurrency(item.salePrice * item.qty)}</span>
            </div>
          ))}
          <div className="border-t border-dashed border-gray-300 dark:border-zinc-700 mt-2 mb-2"/>
          <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Subtotal</span><span>{formatCurrency(receipt.subtotal)}</span></div>
          {receipt.discountAmt > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−{formatCurrency(receipt.discountAmt)}</span></div>}
          <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>VAT 18%</span><span>{formatCurrency(receipt.vatAmount)}</span></div>
          <div className="flex justify-between font-black text-base text-gray-900 dark:text-white mt-1 mb-2">
            <span>TOTAL</span><span>{formatCurrency(receipt.total)}</span>
          </div>
          
          {receipt.payment_method === 'cash' && (
            <div className="pt-2 border-t border-dashed border-gray-300 dark:border-zinc-700">
              <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Cash Tendered</span><span>{formatCurrency(receipt.amount_tendered)}</span></div>
              <div className="flex justify-between text-green-600 font-bold mt-0.5"><span>Change</span><span>{formatCurrency(receipt.change_given)}</span></div>
            </div>
          )}
          
          {receipt.momo_reference && <div className="flex justify-between text-gray-500 dark:text-gray-400 text-[10px] mt-1"><span>Ref</span><span>{receipt.momo_reference}</span></div>}
          <div className="border-t border-dashed border-gray-300 dark:border-zinc-700 mt-3 mb-2"/>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-1">{receipt.timestamp}</p>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-2">{receipt.cashier} · {receipt.device}</p>
          
          <div className="flex flex-col items-center mt-3 mb-2">
            <div className="h-10 w-full max-w-[200px] flex opacity-80 mix-blend-multiply dark:mix-blend-normal dark:bg-white px-2 py-1" style={{
              backgroundImage: 'repeating-linear-gradient(to right, #000, #000 2px, transparent 2px, transparent 4px, #000 4px, #000 5px, transparent 5px, transparent 7px)'
            }}></div>
            <p className="text-[10px] tracking-[0.2em] font-mono text-gray-900 dark:text-white mt-1">{receipt.receipt_number}</p>
          </div>
          
          <p className="text-center font-black text-gray-900 dark:text-white mt-2">Asante — Karibu Tena! 🛒</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <button onClick={onClose} className="btn-secondary justify-center py-2 text-xs flex-col gap-0.5">
            <X size={14}/> <span>Cancel</span>
          </button>
          <button onClick={() => window.print()} className="btn-secondary justify-center py-2 text-xs flex-col gap-0.5">
            <Printer size={14}/> <span>Print</span>
          </button>
        </div>
        <button onClick={onClose} className="btn-primary w-full justify-center py-3">
          <RotateCcw size={16}/> Confirm Sale
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* MAIN POS TERMINAL                                         */
/* ────────────────────────────────────────────────────────── */
export default function POSInterface() {
  const { user, logout } = useAuth();
  const { getSetting } = useSettings();
  const vatRate = getSetting('vat_rate', 18) / 100;

  /* Data from API */
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  /* Fetch products and promotions on mount */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const results = await Promise.allSettled([
          productsAPI.getAll(),
          promotionsAPI.getAll()
        ]);
        setProducts(results[0].status === 'fulfilled' ? (results[0].value.data.data || []) : []);
        setPromotions(results[1].status === 'fulfilled' ? (results[1].value.data.data || []) : []);
      } catch (error) {
        console.error('Failed to fetch POS data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /* Shift / Cash Session State */
  const [activeSession, setActiveSession] = useState(null);
  const [showStartShift, setShowStartShift] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');
  const [isStartingShift, setIsStartingShift] = useState(false);

  const [showEndShift, setShowEndShift] = useState(false);
  const [actualCash, setActualCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [isEndingShift, setIsEndingShift] = useState(false);

  // Use a ref to track if a session was found — avoids stale closure in the interval
  const sessionFoundRef = React.useRef(false);

  useEffect(() => {
    sessionFoundRef.current = false;

    const fetchSession = async () => {
      try {
        const response = await cashSessionsAPI.getActive();
        if (response.data?.data) {
          sessionFoundRef.current = true;
          setActiveSession(response.data.data);
          setShowStartShift(false);
        }
      } catch (error) {
        if (error.response?.status === 404 || error.response?.data?.code === 404) {
          // No session yet — keep waiting
          setShowStartShift(true);
        } else {
          console.error("Failed to fetch session", error);
        }
      }
    };

    // Initial fetch on mount
    fetchSession();

    // Always poll every 3 seconds; stop when session is found
    const pollInterval = setInterval(() => {
      if (!sessionFoundRef.current) {
        fetchSession();
      } else {
        clearInterval(pollInterval);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAssignedShift = async () => {
    try {
      const response = await cashSessionsAPI.getActive();
      if (response.data?.data) {
        setActiveSession(response.data.data);
        setShowStartShift(false);
      } else {
        alert("No session data returned from the server.");
      }
    } catch (error) {
      if (error.response?.status === 404) {
        alert("No assigned shift found yet. Please ask the manager to assign you a float.");
      } else {
        alert(`Error fetching session: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  const handleEndShift = async (e) => {
    e.preventDefault();
    if (!actualCash) return;
    try {
      setIsEndingShift(true);
      await cashSessionsAPI.close(activeSession.id, {
        actual_cash: parseFloat(actualCash),
        notes: closeNotes
      });
      setActiveSession(null);
      setShowEndShift(false);
      setActualCash('');
      setCloseNotes('');
      setShowStartShift(true); // Prompt to start a new shift
    } catch (err) {
      console.error("Failed to end shift:", err);
      alert(err.response?.data?.error || "Failed to end shift");
    } finally {
      setIsEndingShift(false);
    }
  };

  /* Cart */
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);

  /* Search & Scan */
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scanToast, setScanToast] = useState(null);       // product just scanned
  const [scanError, setScanError] = useState(null);       // barcode not found
  const scanInputRef = useRef(null);

  /* Payment */
  const [payMethod, setPayMethod] = useState('cash');
  const [tendered, setTendered] = useState('');
  const [momoRef, setMomoRef] = useState('');

  /* Pesapal Payment States */
  const [customerPhone, setCustomerPhone] = useState('');
  const [isPesapalPending, setIsPesapalPending] = useState(false);
  const [pesapalStatusText, setPesapalStatusText] = useState('');
  const [pesapalRef, setPesapalRef] = useState('');
  const [isManualConfirm, setIsManualConfirm] = useState(false);

  const activePesapalRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const handlePaymentSuccessRef = useRef(null);

  /* Modals */
  const [numpadItem, setNumpadItem] = useState(null);
  const [numpadVal, setNumpadVal] = useState('1');
  const [showReturn, setShowReturn] = useState(false);
  const [heldCarts, setHeldCarts] = useState([]);
  const [showHeldCarts, setShowHeldCarts] = useState(false);

  const [showReceipt, setShowReceipt]     = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [txCount, setTxCount] = useState(0);
  const [recentTx, setRecentTx] = useState([]);

  /* Scanner & Calculator States */

  /* ── Audio Beep ───────────────────────────────────────── */
  const playBeep = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch (e) {
      console.error("Audio beep failed", e);
    }
  }, []);

  /* Auto-focus scan input */
  useEffect(() => {
    if (activeSession && !showScanner && !numpadItem && !showReturn) {
      setTimeout(() => scanInputRef.current?.focus(), 50);
    }
  }, [activeSession, showScanner, numpadItem, showReturn]);

  const handleInputBlur = (e) => {
    // If we want to keep auto-focus without the button, we could, but let's just let it blur normally.
  };

  /* ── Product lookup ───────────────────────────────────── */
  const findProduct = useCallback((code) => {
    const q = code.toLowerCase().trim();
    return products.find(p =>
      p.barcode === code ||
      p.sku?.toLowerCase() === q ||
      p.name?.toLowerCase().includes(q)
    );
  }, [products]);

  /* ── Live search ──────────────────────────────────────── */
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) { setResults([]); return; }
    setResults(
      products.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q))
      ).slice(0, 8)
    );
  }, [query, products]);

  const [isRefundMode, setIsRefundMode] = useState(false);

  /* ── Add to cart ──────────────────────────────────────── */
  const addToCart = useCallback((product) => {
    if (!product) return;
    playBeep(); // Play scan sound
    const { price, promo } = applyPromotion(product, promotions);
    
    const finalPrice = isRefundMode ? -price : price;
    
    setCart(prev => {
      const ex = prev.find(c => c.id === product.id && c.isRefund === isRefundMode);
      const newQty = ex ? ex.qty + 1 : 1;
      
      setScanToast({ ...product, salePrice: finalPrice, isRefund: isRefundMode, cartQty: newQty });
      
      if (ex) return prev.map(c => (c.id === product.id && c.isRefund === isRefundMode) ? { ...c, qty: newQty } : c);
      return [...prev, { ...product, salePrice: finalPrice, promo, qty: 1, isRefund: isRefundMode }];
    });
    
    setQuery('');
    setResults([]);
    setScanError(null);
    setIsRefundMode(false); // Auto-disable to prevent accidental refund scans
  }, [isRefundMode, promotions, playBeep]);

  /* ── Barcode detected ─────────────────────────────────── */
  const handleScan = useCallback((code) => {
    setShowScanner(false);
    const product = findProduct(code);
    if (product) {
      addToCart(product);
    } else {
      setScanError(code);
      setQuery(code);
    }
  }, [findProduct, addToCart]);

  /* ── Phone scanner via WebSocket ─────────────────────── */
  const [phoneConnected, setPhoneConnected] = useState(false);
  const [showPhoneScanner, setShowPhoneScanner] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const socketRef = useRef(null);
  
  // Use relative path so it's proxied by Vite, avoiding Mixed Content on HTTPS
  const BACKEND_URL = '/';
  const SCAN_URL = `${window.location.protocol}//${window.location.hostname}:5173/scan${sessionId ? '?sid='+sessionId : ''}`;

  // Use a ref to always access the latest handleScan function without re-binding the socket
  const handleScanRef = useRef(null);
  useEffect(() => {
    handleScanRef.current = handleScan;
  }, [handleScan]);

  useEffect(() => {
    // Connect to Socket.IO using same origin (proxied by Vite)
    const socket = io(BACKEND_URL, { transports: ['websocket', 'polling'], path: '/socket.io' });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_pos');
      setSessionId(socket.id);
      console.log('[WS] Connected to scanner relay');
    });

    socket.on('scanner_ready', () => {
      setPhoneConnected(true);
    });

    socket.on('barcode_scan', ({ barcode }) => {
      console.log('[WS] Barcode received from phone:', barcode);
      if (handleScanRef.current) handleScanRef.current(barcode);
    });

    socket.on('payment_status_update', ({ merchantReference, status, pesapalOrderTrackingId }) => {
      console.log(`[WS] Received payment status update: ${merchantReference} -> ${status}`);
      if (activePesapalRef.current === merchantReference) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        if (status === 'paid') {
          if (handlePaymentSuccessRef.current) {
            handlePaymentSuccessRef.current(pesapalOrderTrackingId, merchantReference);
          }
        } else if (status === 'failed') {
          alert('Mobile Money payment request failed. Please check customer phone and retry.');
          setIsPesapalPending(false);
          setPesapalStatusText('');
          activePesapalRef.current = null;
        }
      }
    });

    socket.on('disconnect', () => {
      setPhoneConnected(false);
      console.log('[WS] Disconnected from scanner relay');
    });

    return () => {
      socket.disconnect();
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []); // eslint-disable-line


  /* ── Search submit (Enter key) ─────────────────────────── */
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const product = findProduct(query.trim());
    if (product) {
      addToCart(product);
    } else if (results.length === 1) {
      addToCart(results[0]);
    } else {
      setScanError(query.trim());
    }
  };

  /* ── Cart helpers ─────────────────────────────────────── */
  const updateQty = (id, delta) =>
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c).filter(c => c.qty > 0));
  const setQty = (id, qty) =>
    setCart(prev => qty <= 0 ? prev.filter(c => c.id !== id) : prev.map(c => c.id === id ? { ...c, qty } : c));
  const removeItem = (id) => setCart(prev => prev.filter(c => c.id !== id));
  const clearCart  = () => { setCart([]); setDiscount(0); setTendered(''); setMomoRef(''); };

  const holdCart = () => {
    if (cart.length === 0) return;
    setHeldCarts(prev => [
      { id: Date.now(), items: [...cart], time: new Date().toLocaleTimeString('en-GB') },
      ...prev
    ]);
    clearCart();
  };

  const resumeCart = (hc) => {
    setCart(hc.items);
    setHeldCarts(prev => prev.filter(c => c.id !== hc.id));
    setShowHeldCarts(false);
  };

  /* ── Totals ───────────────────────────────────────────── */
  const itemCount    = cart.reduce((s, c) => s + c.qty, 0);
  const subtotal     = cart.reduce((s, c) => s + c.salePrice * c.qty, 0);
  const discountAmt  = Math.round(subtotal * discount / 100);
  const taxable      = subtotal - discountAmt;
  const vatAmount    = Math.round(taxable * vatRate);
  const total        = taxable + vatAmount;
  const change       = payMethod === 'cash' ? Math.max(0, Number(tendered) - total) : 0;
  const shortfall    = payMethod === 'cash' && tendered ? Math.max(0, total - Number(tendered)) : 0;
  const hasStockWarning = cart.some(item => item.qty > (item.stock || 0));
  const canConfirm   = cart.length > 0 && !hasStockWarning && (
    payMethod === 'cash' ||
    (isManualConfirm && momoRef)
  );

  // Set up handlePaymentSuccess callback ref to avoid closures
  useEffect(() => {
    handlePaymentSuccessRef.current = (trackingId, ref) => {
      finalizeAutomatedSale(trackingId, ref);
    };
  });

  const finalizeAutomatedSale = async (trackingId, ref) => {
    try {
      playBeep();
      const saleData = {
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.qty,
          unit_price: item.salePrice,
          subtotal: item.salePrice * item.qty
        })),
        subtotal,
        discount_amount: discountAmt,
        tax_amount: vatAmount,
        total_amount: total,
        payment_method: payMethod,
        amount_tendered: total,
        change_given: 0,
        momo_reference: trackingId || ref,
        cash_session_id: activeSession.id
      };
      
      const response = await transactionsAPI.create(saleData);
      const transaction = response.data.data;
      
      const receipt = {
        receipt_number: transaction.receipt_number,
        items: [...cart],
        subtotal,
        discountAmt,
        vatAmount,
        total,
        payment_method: payMethod,
        amount_tendered: total,
        change_given: 0,
        momo_reference: trackingId || ref,
        cashier: activeSession.cashier?.name || user?.name || 'Cashier',
        device: activeSession.device_id || 'POS-001',
        timestamp: new Date().toLocaleString('en-GB'),
      };
      
      setLastReceipt(receipt);
      setTxCount(c => c + 1);
      
      const sessionRes = await cashSessionsAPI.getActive();
      setActiveSession(sessionRes.data.data);
      
      setShowReceipt(true);
      clearCart();
      setIsPesapalPending(false);
      setPesapalStatusText('');
      setCustomerPhone('');
      setPesapalRef('');
      activePesapalRef.current = null;
    } catch (error) {
      console.error('Failed to finalize automated sale:', error);
      alert(`Payment succeeded but transaction failed to register: ${error.response?.data?.error || error.message}. Please note your tracking ID: ${trackingId}`);
    }
  };

  const startPolling = (reference, trackingId) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    console.log('[Polling] Starting payment status polling for:', reference);
    let pollCount = 0;
    const maxPolls = 60; // 5 minutes max (60 polls × 5 seconds)

    const interval = setInterval(async () => {
      try {
        pollCount++;
        console.log(`[Polling] Check #${pollCount} for ref ${reference}`);
        
        const res = await paymentsAPI.status(reference);
        if (res.data?.success && res.data?.data) {
          const { status, orderTrackingId, paymentMethod } = res.data.data;
          console.log(`[Polling] Status: ${status}`);
          
          // Update status text based on current state
          if (status === 'pending') {
            setPesapalStatusText(`Waiting for payment confirmation... (${pollCount})`);
          }
          
          if (status === 'paid') {
            clearInterval(interval);
            pollingIntervalRef.current = null;
            console.log('[Polling] Payment confirmed! Finalizing sale...');
            setPesapalStatusText('Payment successful! Completing transaction...');
            await finalizeAutomatedSale(orderTrackingId || trackingId, reference);
          } else if (status === 'failed') {
            clearInterval(interval);
            pollingIntervalRef.current = null;
            console.warn('[Polling] Payment failed');
            alert('Payment was rejected or failed. Please check and try again.');
            setIsPesapalPending(false);
            setPesapalStatusText('');
            activePesapalRef.current = null;
          }
        }
        
        // Timeout after max polls
        if (pollCount >= maxPolls) {
          clearInterval(interval);
          pollingIntervalRef.current = null;
          console.warn('[Polling] Timeout reached');
          alert('Payment confirmation timeout. Please check payment status manually.');
          setIsPesapalPending(false);
          setPesapalStatusText('');
          activePesapalRef.current = null;
        }
        
      } catch (err) {
        console.warn('[Polling Check Failed]', err.message);
        
        // After multiple failed polls, stop trying
        if (pollCount >= 10) {
          clearInterval(interval);
          pollingIntervalRef.current = null;
          alert('Unable to verify payment status. Please check manually.');
          setIsPesapalPending(false);
          setPesapalStatusText('');
          activePesapalRef.current = null;
        }
      }
    }, 5000);

    pollingIntervalRef.current = interval;
  };

  const startPesapalPayment = async () => {
    if (!customerPhone || customerPhone.trim().length < 9) {
      alert('Please enter a valid phone number (at least 9 digits)');
      return;
    }

    try {
      setIsPesapalPending(true);
      setPesapalStatusText('Initiating payment request...');
      
      const res = await paymentsAPI.initiate({
        amount: total,
        phone_number: customerPhone.trim(),
        description: `POS Checkout for Andrew & Brothers Supermarket`
      });

      if (res.data?.success && res.data?.data) {
        const { merchantReference, orderTrackingId, redirectUrl } = res.data.data;
        activePesapalRef.current = merchantReference;
        setPesapalRef(merchantReference);
        
        console.log('[Pesapal] Payment initiated:', { merchantReference, orderTrackingId, redirectUrl });
        
        // Open Pesapal payment page in new window/tab
        if (redirectUrl) {
          setPesapalStatusText('Opening payment page... Complete payment on the new window.');
          window.open(redirectUrl, '_blank', 'width=800,height=600');
        } else {
          setPesapalStatusText('Waiting for customer to enter PIN on mobile device...');
        }
        
        // Start status polling loop (check every 5 seconds)
        startPolling(merchantReference, orderTrackingId);
      } else {
        throw new Error(res.data?.error || 'Invalid API response');
      }
    } catch (err) {
      console.error('[Pesapal Initiation Failed]', err);
      alert(`Failed to initiate payment: ${err.response?.data?.error || err.message}`);
      setIsPesapalPending(false);
      setPesapalStatusText('');
    }
  };

  /* ── Confirm Sale ─────────────────────────────────────── */
  const confirmSale = async () => {
    if (!canConfirm || !activeSession) return;
    
    try {
      const saleData = {
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.qty,
          unit_price: item.salePrice,
          subtotal: item.salePrice * item.qty
        })),
        subtotal,
        discount_amount: discountAmt,
        tax_amount: vatAmount,
        total_amount: total,
        payment_method: payMethod,
        amount_tendered: payMethod === 'cash' ? Number(tendered) : total,
        change_given: change,
        momo_reference: momoRef || null,
        cash_session_id: activeSession.id
      };
      
      const response = await transactionsAPI.create(saleData);
      const transaction = response.data.data;
      
      const receipt = {
        receipt_number: transaction.receipt_number,
        items: [...cart],
        subtotal,
        discountAmt,
        vatAmount,
        total,
        payment_method: payMethod,
        amount_tendered: payMethod === 'cash' ? Number(tendered) : total,
        change_given: change,
        momo_reference: momoRef,
        cashier: activeSession.cashier?.name || user?.name || 'Cashier',
        device: activeSession.device_id || 'POS-001',
        timestamp: new Date().toLocaleString('en-GB'),
      };
      
      setLastReceipt(receipt);
      setTxCount(c => c + 1);
      
      // Update session cash tracking from server
      const sessionRes = await cashSessionsAPI.getActive();
      setActiveSession(sessionRes.data.data);

      
      setShowReceipt(true);
      clearCart();
    } catch (error) {
      console.error('Failed to create transaction:', error);
      alert('Failed to complete sale. Please try again.');
    }
  };

  /* ────────────────────────────────────────────────────────── */
  /*   MAIN POS LAYOUT — always rendered; gate overlays it    */
  /* ────────────────────────────────────────────────────────── */
  /* ────────────────────────────────────────────────────────── */
  /*   MAIN POS LAYOUT — always rendered; gate overlays it    */
  /* ────────────────────────────────────────────────────────── */
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <ShoppingCart size={48} className="mx-auto mb-4 text-brand-500 animate-pulse" />
          <p className="text-muted">Loading POS system...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col animate-fade-in relative" style={{ height: 'calc(100vh - 72px)' }}>



      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-500/15 rounded-xl flex items-center justify-center">
            <ShoppingCart size={18} className="text-brand-400" />
          </div>
          <div>
            <h1 className="text-base font-black text-primary leading-none">Point of Sale</h1>
            <p className="text-xs text-muted leading-none mt-0.5">
              {activeSession ? `${activeSession.device_id || 'POS'} · ${activeSession.cashier?.name || 'Cashier'}` : 'Andrew & Brothers Supermarket'}
            </p>
          </div>
          {activeSession && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg ml-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>
            Shift Open · {activeSession.stats?.total_transactions || 0} tx
          </div>
          )}
        </div>
        {activeSession && (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowEndShift(true)}
            className="btn-danger flex items-center gap-1.5 text-xs py-1.5 px-3"
          >
            <Lock size={13}/> End Shift
          </button>
          <button 
            onClick={holdCart} 
            disabled={cart.length === 0}
            className={`text-xs py-1.5 ${cart.length > 0 ? 'btn-secondary text-brand-600 dark:text-brand-400' : 'btn-secondary opacity-50'}`}
          >
            <PauseCircle size={13}/> Hold
          </button>
          {heldCarts.length > 0 && (
            <button onClick={() => setShowHeldCarts(true)} className="btn-primary flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs py-1.5">
              <List size={13}/> Saved ({heldCarts.length})
            </button>
          )}

        </div>
        )}
      </div>

      {/* ── Split Layout ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-3 min-h-0 overflow-hidden">

        {/* ═══════════════════════════════════════════════ */}
        {/* LEFT PANEL — Scan + Cart                       */}
        {/* ═══════════════════════════════════════════════ */}
        <div className="flex flex-col gap-3 overflow-hidden relative min-h-0">

          {/* Scan Toast */}
          {scanToast && <ScanToast product={scanToast} onDismiss={() => setScanToast(null)} promotions={promotions} />}

          {/* ── Scan / Search Bar ── */}
          <div className="glass-card p-3 flex-shrink-0">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Barcode size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  ref={scanInputRef}
                  id="pos-scan-input"
                  type="text"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setScanError(null); }}
                  onBlur={handleInputBlur}
                  placeholder="Scan barcode — or type product name / SKU…"
                  className="input-field pl-9 pr-8 py-3 text-lg font-medium transition-all"
                  autoComplete="off"
                  spellCheck="false"
                />
                {query && (
                  <button type="button" onClick={() => { setQuery(''); setResults([]); setScanError(null); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary">
                    <X size={15}/>
                  </button>
                )}
              </div>
              {/* Phone scanner button */}
              <button type="button" onClick={() => setShowPhoneScanner(true)}
                className={`btn-secondary px-3 flex-shrink-0 transition-colors ${
                  phoneConnected
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                    : 'text-muted hover:text-brand-500 hover:border-brand-500/30'
                }`}
                title="Connect Phone as Scanner">
                <Smartphone size={18}/>
              </button>

              <button type="button" onClick={() => setIsRefundMode(!isRefundMode)}
                className={`btn-secondary px-3 flex-shrink-0 transition-colors flex items-center gap-2 font-bold text-sm tooltip ${isRefundMode ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20' : 'text-muted hover:text-red-500 hover:border-red-500/30'}`}
                title="Return Item (Refund Mode)">
                <CornerDownLeft size={18}/>
                <span className="hidden sm:inline">{isRefundMode ? 'Return Mode On' : 'Return Item'}</span>
              </button>
            </form>
            
            {isRefundMode && (
              <div className="flex items-center gap-2 mt-2 text-xs font-bold text-amber-600 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-1.5 animate-fade-in">
                <RotateCcw size={13}/> RETURN MODE ACTIVE: The next item scanned will be added as a negative return.
              </div>
            )}


            {/* Scan error */}
            {scanError && (
              <div className="flex items-center gap-2 mt-2 text-xs text-red-500 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
                <AlertCircle size={13}/> No product found for barcode: <span className="font-mono font-bold">{scanError}</span>
              </div>
            )}
          </div>

          {/* ── Search Results Dropdown ── */}
          {results.length > 0 && (
            <div className="glass-card overflow-hidden flex-shrink-0 border-brand-500/20" style={{borderWidth:2}}>
              <p className="text-[11px] font-bold text-muted uppercase tracking-wider px-4 pt-3 pb-1">
                {results.length} result{results.length > 1 ? 's' : ''} — tap to add
              </p>
              {results.map(p => {
                const { price, promo } = applyPromotion(p);
                return (
                  <button key={p.id} onClick={() => addToCart(p)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-500/10 transition-colors border-t border-theme text-left active:bg-brand-500/20">
                    <div className="w-9 h-9 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package size={14} className="text-brand-400"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary truncate">{p.name}</p>
                      <p className="text-xs text-muted">{p.sku} · {p.stock} in stock</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {promo ? (
                        <>
                          <p className="text-[10px] line-through text-muted">{formatCurrency(p.unit_price)}</p>
                          <p className="text-sm font-bold text-emerald-500">{formatCurrency(price)}</p>
                          <p className="text-[10px] text-emerald-500">🏷 {promo.name}</p>
                        </>
                      ) : (
                        <p className="text-sm font-bold text-primary">{formatCurrency(price)}</p>
                      )}
                    </div>
                    <Plus size={16} className="text-brand-400 flex-shrink-0 ml-1"/>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Cart ── */}
          <div className="glass-card flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Cart header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-theme flex-shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingCart size={15} className="text-brand-500"/>
                <span className="font-black text-primary text-sm">
                  Transaction {activeSession ? `#${(activeSession.stats?.total_transactions || 0) + 1}` : ''}
                </span>
                {cart.length > 0 && (
                  <span className="text-xs bg-brand-500/20 text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded-full font-bold">
                    {itemCount} item{itemCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {cart.length > 0 && (
                <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1 font-bold">
                  <Trash2 size={12}/> Void All
                </button>
              )}
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted py-12">
                  <Barcode size={48} className="mb-3 opacity-10"/>
                  <p className="text-sm font-semibold opacity-50">Ready to scan</p>
                  <p className="text-xs opacity-30 mt-1">Scan a barcode or search above</p>
                </div>
              ) : (
                <div>
                  {cart.map((item, idx) => (
                    <div key={item.id} className={`flex items-center gap-3 px-5 py-4 border-b border-theme last:border-0 ${idx % 2 === 0 ? '' : 'bg-surface-2/50'}`}>
                      {/* Line number */}
                      <span className="text-sm text-muted font-mono w-5 flex-shrink-0 text-center">{idx+1}</span>
                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-primary leading-tight truncate">
                          {item.name}
                          {item.qty > (item.stock || 0) && (
                            <span className="ml-2 text-[10px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/30 whitespace-nowrap align-middle">
                              <AlertTriangle size={10} className="inline mr-1" style={{marginTop:'-2px'}}/>
                              Exceeds stock
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-muted font-medium">{formatCurrency(item.salePrice)} each</p>
                          {item.promo && (
                            <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                              🏷 {item.promo.name}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Qty controls */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => updateQty(item.id, -1)}
                          className="w-7 h-7 rounded-lg bg-surface-2 hover:bg-red-500/20 hover:text-red-500 border border-theme flex items-center justify-center text-muted transition-colors">
                          <Minus size={12}/>
                        </button>
                        <button onClick={() => { setNumpadItem(item); setNumpadVal(String(item.qty)); }}
                          className="text-sm font-black text-primary w-10 h-7 text-center bg-surface-2 hover:bg-brand-500/20 hover:text-brand-500 border border-theme rounded-lg transition-colors">
                          {item.qty}
                        </button>
                        <button onClick={() => updateQty(item.id, 1)}
                          className="w-7 h-7 rounded-lg bg-surface-2 hover:bg-emerald-500/20 hover:text-emerald-500 border border-theme flex items-center justify-center text-muted transition-colors">
                          <Plus size={12}/>
                        </button>
                      </div>
                      {/* Line total */}
                      <div className="w-24 text-right flex-shrink-0">
                        <p className="text-base font-black text-primary">{formatCurrency(item.salePrice * item.qty)}</p>
                      </div>
                      {/* Remove */}
                      <button onClick={() => removeItem(item.id)}
                        className="text-muted hover:text-red-500 transition-colors flex-shrink-0">
                        <X size={14}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart footer total */}
            {cart.length > 0 && (
              <div className="border-t border-theme px-4 py-3 flex-shrink-0 bg-surface-2/50">
                <div className="flex justify-between text-xs text-muted mb-1">
                  <span>Subtotal ({itemCount} items)</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-500 mb-1">
                    <span>Discount {discount}%</span>
                    <span>−{formatCurrency(discountAmt)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-muted">
                  <span>VAT 18%</span>
                  <span>{formatCurrency(vatAmount)}</span>
                </div>
              </div>
            )}
          </div>


        </div>

        {/* ═══════════════════════════════════════════════ */}
        {/* RIGHT PANEL — Payment                          */}
        {/* ═══════════════════════════════════════════════ */}
        <div className="flex flex-col gap-3 overflow-y-auto flex-shrink-0">

          {/* ── Order Total ── */}
          <div className="glass-card p-5 flex-shrink-0">
            <div className="text-center mb-4">
              <p className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Amount Due</p>
              <p className="text-6xl font-black text-gradient leading-none tracking-tight">
                {formatCurrency(total)}
              </p>
              {cart.length > 0 && (
                <p className="text-xs text-muted mt-1">{itemCount} item{itemCount!==1?'s':''} · VAT incl.</p>
              )}
            </div>

            {/* Discount */}
            <div className="mb-4">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-1.5">
                Discount %
              </label>
              <div className="flex gap-2">
                <input type="number" min="0" max="50" value={discount}
                  onChange={e => setDiscount(Math.min(50, Math.max(0, Number(e.target.value))))}
                  className="input-field py-2 w-20 text-center font-bold"/>
                <div className="flex gap-1 flex-1">
                  {[5,10,15,20].map(d => (
                    <button key={d} onClick={() => setDiscount(discount === d ? 0 : d)}
                      className={`flex-1 text-xs py-2 rounded-xl border font-bold transition-all ${
                        discount === d ? 'bg-brand-500/20 border-brand-500/50 text-brand-600 dark:text-brand-400' : 'btn-secondary py-2'
                      }`}>{d}%</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment methods */}
            <div className="space-y-2 mb-4">
              {PAYMENT_METHODS.map(pm => (
                <button key={pm.id} id={`pay-${pm.id}`}
                  onClick={() => { setPayMethod(pm.id); setTendered(''); setMomoRef(''); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                    payMethod === pm.id
                      ? pm.color === 'emerald' ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-400'
                        : pm.color === 'yellow' ? 'bg-yellow-500/15 border-yellow-500/50 text-yellow-700 dark:text-yellow-400'
                        : 'bg-red-500/15 border-red-500/50 text-red-700 dark:text-red-400'
                      : 'btn-secondary py-3'
                  }`}>
                  <pm.icon size={17}/>
                  <div className="text-left flex-1">
                    <p className="font-bold leading-none">{pm.label}</p>
                    <p className="text-[10px] opacity-60 mt-0.5 leading-none">{pm.sub}</p>
                  </div>
                  {payMethod === pm.id && <CheckCircle size={15} className="flex-shrink-0"/>}
                </button>
              ))}
            </div>

            {/* Cash tendered */}
            {payMethod === 'cash' && (
              <div className="mb-4">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-1.5">
                  Amount Tendered
                </label>
                <input id="amount-tendered" type="number" value={tendered}
                  onChange={e => setTendered(e.target.value)}
                  className="input-field py-3 text-2xl font-black text-center mb-2"
                  placeholder={total || '0'}/>
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {[5000,10000,20000,50000,100000,200000].map(a => (
                    <button key={a} onClick={() => setTendered(String(a))}
                      className={`text-xs py-2 rounded-xl border font-bold transition-all ${
                        Number(tendered) === a ? 'bg-brand-500/20 border-brand-500/50 text-brand-600 dark:text-brand-400' : 'btn-secondary py-2'
                      }`}>
                      {a >= 1000 ? `${a/1000}k` : a}
                    </button>
                  ))}
                </div>
                {/* Exact amount shortcut */}
                <button onClick={() => setTendered(String(total))}
                  className="w-full text-xs py-2 rounded-xl btn-secondary justify-center mb-3 font-bold">
                  Exact: {formatCurrency(total)}
                </button>
                {/* Change / shortfall */}
                {tendered && (
                  <div className={`flex justify-between items-center px-3 py-3 rounded-xl text-base font-black border ${
                    shortfall > 0 ? 'bg-red-500/10 border-red-500/30 text-red-500'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    <span>{shortfall > 0 ? 'Short' : 'Change Due'}</span>
                    <span>{formatCurrency(shortfall > 0 ? shortfall : change)}</span>
                  </div>
                )}
              </div>
            )}

            {/* MoMo ref / Phone Input */}
            {(payMethod === 'mtn_momo' || payMethod === 'airtel_money') && (
              <div className="mb-4">
                {isManualConfirm ? (
                  <>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-1.5 flex justify-between items-center">
                      <span>Transaction Reference *</span>
                      <button 
                        onClick={() => setIsManualConfirm(false)}
                        className="text-[10px] text-brand-500 hover:underline bg-none border-none p-0 cursor-pointer font-bold lowercase normal-case"
                      >
                        Switch to Automated PIN Prompt
                      </button>
                    </label>
                    <input id="momo-ref" value={momoRef} onChange={e => setMomoRef(e.target.value)}
                      className="input-field py-3 font-mono"
                      placeholder={payMethod === 'mtn_momo' ? 'MTNMOMO2026xxxxxxx' : 'AIRTELMONEY2026xxx'}/>
                    <p className="text-[10px] text-muted mt-1">Ask customer to confirm payment and share reference</p>
                  </>
                ) : (
                  <>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-1.5 flex justify-between items-center">
                      <span>Customer Mobile Number *</span>
                      <button 
                        onClick={() => setIsManualConfirm(true)}
                        className="text-[10px] text-brand-500 hover:underline bg-none border-none p-0 cursor-pointer font-bold lowercase normal-case"
                      >
                        Use Manual Reference Entry
                      </button>
                    </label>
                    <input 
                      id="customer-phone" 
                      value={customerPhone} 
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="input-field py-3 font-mono text-center font-bold text-lg"
                      placeholder="077xxxxxxx / 075xxxxxxx"
                    />
                    <p className="text-[10px] text-muted mt-1">Triggers automated USSD PIN prompt on customer's phone.</p>
                  </>
                )}
              </div>
            )}

            {/* CONFIRM SALE */}
            {payMethod === 'cash' || isManualConfirm ? (
              <button id="confirm-sale-btn" onClick={confirmSale}
                disabled={cart.length === 0 || hasStockWarning || !canConfirm}
                className={`w-full justify-center py-5 text-xl font-black rounded-2xl transition-all ${
                  cart.length === 0 || hasStockWarning || !canConfirm
                    ? 'btn-secondary opacity-40 cursor-not-allowed text-xl py-5 justify-center'
                    : 'btn-primary animate-pulse-ring'
                }`}>
                <CheckCircle size={20}/>
                {cart.length === 0
                  ? 'Waiting for items…'
                  : hasStockWarning
                    ? 'Resolve Stock Warning'
                    : canConfirm
                      ? `✓ Confirm — ${formatCurrency(total)}`
                      : payMethod === 'cash'
                        ? `Enter ${formatCurrency(shortfall)} more`
                        : 'Enter MoMo Reference'
                }
              </button>
            ) : (
              <button id="confirm-sale-btn" onClick={startPesapalPayment}
                disabled={cart.length === 0 || hasStockWarning || isPesapalPending || !customerPhone || customerPhone.trim().length < 9}
                className={`w-full justify-center py-5 text-xl font-black rounded-2xl transition-all ${
                  cart.length === 0 || hasStockWarning || isPesapalPending || !customerPhone || customerPhone.trim().length < 9
                    ? 'btn-secondary opacity-40 cursor-not-allowed text-xl py-5 justify-center'
                    : 'btn-primary animate-pulse-ring'
                }`}>
                <Zap size={20} className={isPesapalPending ? 'animate-bounce' : ''}/>
                {cart.length === 0
                  ? 'Waiting for items…'
                  : hasStockWarning
                    ? 'Resolve Stock Warning'
                    : isPesapalPending
                      ? 'Processing payment...'
                      : `⚡ Pay — ${formatCurrency(total)}`
                }
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals & Overlays ── */}
      {/* Pesapal Processing Overlay */}
      {isPesapalPending && (
        <div className="modal-overlay z-[100] bg-black/70 backdrop-blur-md" onClick={e => e.stopPropagation()}>
          <div className="modal-panel max-w-sm text-center p-8 border border-brand-500/20 shadow-2xl relative animate-scale-up">
            <div className="w-20 h-20 bg-brand-500/10 border border-brand-500/30 rounded-3xl flex items-center justify-center mx-auto mb-5 relative">
              <div className="absolute inset-0 rounded-3xl border border-brand-500 animate-ping opacity-25" />
              <Zap size={36} className="text-brand-500 animate-pulse" />
            </div>
            
            <h3 className="text-xl font-black text-primary mb-2">Automated Payment</h3>
            <p className="text-sm text-secondary mb-4 leading-relaxed font-semibold">
              {pesapalStatusText}
            </p>
            
            {pesapalRef && (
              <div className="p-3 bg-surface-2 border border-theme rounded-xl font-mono text-xs text-muted mb-6">
                Ref: {pesapalRef}
              </div>
            )}

            <div className="flex gap-2.5">
              <button 
                onClick={() => {
                  if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                  }
                  setIsPesapalPending(false);
                  setPesapalStatusText('');
                  activePesapalRef.current = null;
                }}
                className="btn-secondary flex-1 justify-center py-2.5 text-xs font-bold"
              >
                Cancel / Switch Mode
              </button>
              <button 
                onClick={() => startPolling(pesapalRef, '')}
                className="btn-primary bg-brand-600 hover:bg-brand-500 border-none flex-1 justify-center py-2.5 text-xs text-white font-bold"
              >
                <RefreshCw size={12} className="animate-spin-slow"/> Verify Status
              </button>
            </div>
          </div>
        </div>
      )}

      {showScanner && <BarcodeScanner onDetected={handleScan} onClose={() => setShowScanner(false)} />}

      {/* Phone Scanner Modal */}
      {showPhoneScanner && (
        <div className="modal-overlay" onClick={() => setShowPhoneScanner(false)}>
          <div className="modal-panel max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                <Smartphone size={18} className="text-brand-500" /> Phone Scanner
              </h2>
              <button onClick={() => setShowPhoneScanner(false)} className="btn-secondary p-2"><X size={18}/></button>
            </div>

            <div className="flex items-center gap-2 mb-4 p-3 rounded-xl border text-sm font-semibold"
              style={{ background: phoneConnected ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                       borderColor: phoneConnected ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)' }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: phoneConnected ? '#10b981' : '#f59e0b', animation: 'pulse 1.5s infinite' }} />
              <span style={{ color: phoneConnected ? '#10b981' : '#f59e0b' }}>
                {phoneConnected ? 'Scanner relay connected & ready' : 'Relay connecting…'}
              </span>
            </div>

            <div className="bg-white rounded-2xl p-4 mb-4 flex items-center justify-center" style={{ minHeight: 180 }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(SCAN_URL)}`}
                alt="Scanner QR Code"
                className="rounded-lg"
                style={{ width: 160, height: 160 }}
              />
            </div>

            <div className="space-y-2 text-xs text-muted">
              <p className="font-bold text-primary text-sm">How to use:</p>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Connect phone to same Wi-Fi as this computer</li>
                <li>Open camera app → scan the QR code above</li>
                <li>Or type this URL in phone browser:<br/>
                  <code className="text-brand-500 font-bold text-xs bg-brand-500/10 px-1.5 py-0.5 rounded mt-1 inline-block break-all">{SCAN_URL}</code>
                </li>
                <li>Allow camera → point at product barcode</li>
                <li>Product appears in cart automatically!</li>
              </ol>
            </div>

            <div className="mt-4 p-3 bg-surface-2 rounded-xl text-xs text-muted border border-theme">
              <p className="font-semibold text-primary mb-1">📱 USB alternative:</p>
              <p>Enable USB tethering on the phone → connect via USB → open the URL above in phone Chrome.</p>
            </div>
          </div>
        </div>
      )}

      {numpadItem && (
        <Numpad
          title={`Qty — ${numpadItem.name}`}
          value={numpadVal}
          onChange={setNumpadVal}
          onConfirm={(qty) => { setQty(numpadItem.id, qty); setNumpadItem(null); }}
          onClose={() => setNumpadItem(null)}
        />
      )}

      {showReturn && (
        <ReturnModal
          onClose={() => setShowReturn(false)}
          onReturn={(tx) => {
            setRecentTx(prev => [{ ...tx, status: 'refunded' }, ...prev.slice(0,4)]);
            if (tx.payment_method === 'cash') {
              setSession(s => ({ ...s, cashRefunds: (s.cashRefunds||0) + tx.total_amount }));
            }
          }}
        />
      )}



      {showHeldCarts && (
        <HeldCartsModal
          heldCarts={heldCarts}
          onClose={() => setShowHeldCarts(false)}
          onResume={resumeCart}
          onDiscard={(id) => setHeldCarts(prev => prev.filter(c => c.id !== id))}
        />
      )}

      {showReceipt && lastReceipt && (
        <ReceiptModal receipt={lastReceipt} onClose={() => setShowReceipt(false)} />
      )}

      {/* Start Shift Modal / Waiting Screen */}
      {showStartShift && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-theme rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-slide-up text-center">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white flex flex-col items-center">
              <Lock size={48} className="mb-3 opacity-90" />
              <h2 className="text-xl font-black">Register Locked</h2>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-muted text-sm font-medium">
                Waiting for Manager to assign shift. Please see your manager to receive your opening balance float.
              </p>
              
              <button onClick={checkAssignedShift} className="btn-primary w-full justify-center py-3 bg-emerald-600 hover:bg-emerald-700">
                <RefreshCw size={16} /> Check for Assigned Shift
              </button>
              
              <button type="button" onClick={logout} className="text-muted hover:text-red-500 text-sm font-bold mt-2 block w-full text-center">
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Shift Modal */}
      {showEndShift && activeSession && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-theme rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slide-up">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-5 text-white">
              <h2 className="text-xl font-black flex items-center gap-2">
                <Calculator size={20} /> Close Cash Drawer
              </h2>
              <p className="text-white/80 text-sm mt-1">{activeSession.cashier?.name}'s Session</p>
            </div>
            
            <form onSubmit={handleEndShift} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div className="bg-surface-2 p-3 rounded-xl border border-theme text-center">
                  <p className="text-xs text-muted font-bold uppercase mb-1">Opening Cash</p>
                  <p className="font-mono font-bold text-primary">{formatCurrency(activeSession.opening_balance)}</p>
                </div>
                <div className="bg-surface-2 p-3 rounded-xl border border-theme text-center">
                  <p className="text-xs text-muted font-bold uppercase mb-1">Cash Sales</p>
                  <p className="font-mono font-bold text-emerald-500">+{formatCurrency(activeSession.stats?.cash_sales || 0)}</p>
                </div>
              </div>

              <div className="bg-surface-2 p-4 rounded-xl border border-theme flex justify-between items-center">
                <span className="text-muted font-bold text-sm tracking-wider uppercase">Expected Cash</span>
                <span className="text-xl font-black font-mono text-primary">{formatCurrency(activeSession.stats?.expected_cash || activeSession.opening_balance)}</span>
              </div>

              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Physically Counted Cash</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-bold">UGX</span>
                  <input type="number" required autoFocus
                    className="input-field pl-12 text-lg font-mono font-bold bg-surface border-indigo-500/30 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    placeholder="e.g. 145000"
                    value={actualCash}
                    onChange={e => setActualCash(e.target.value)}
                  />
                </div>
              </div>

              {actualCash && (
                <div className={`p-3 rounded-lg border flex items-center gap-2 ${
                  parseInt(actualCash) - (activeSession.stats?.expected_cash || activeSession.opening_balance) < 0 
                  ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400' 
                  : parseInt(actualCash) - (activeSession.stats?.expected_cash || activeSession.opening_balance) > 0
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-500'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-500'
                }`}>
                  {parseInt(actualCash) - (activeSession.stats?.expected_cash || activeSession.opening_balance) < 0 ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase">Variance</p>
                    <p className="font-mono font-bold">
                      {formatCurrency(parseInt(actualCash) - (activeSession.stats?.expected_cash || activeSession.opening_balance))}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Closeout Notes (Required if Short/Over)</label>
                <input type="text"
                  className="input-field"
                  placeholder="Explain any discrepancy..."
                  required={(actualCash && parseInt(actualCash) !== (activeSession.stats?.expected_cash || activeSession.opening_balance))}
                  value={closeNotes}
                  onChange={e => setCloseNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-theme">
                <button type="button" onClick={() => setShowEndShift(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={isEndingShift} className="btn-primary flex-1 justify-center bg-indigo-600 hover:bg-indigo-700">
                  <Lock size={16} /> {isEndingShift ? 'Closing...' : 'Confirm Closeout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
