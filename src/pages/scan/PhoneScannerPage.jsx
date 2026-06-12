import React, { useRef, useEffect, useState, useCallback } from 'react';
import { scannerAPI } from '../../services/api';

/**
 * PhoneScannerPage — standalone page for Android phone camera scanning.
 * Accessible at /scan (no auth required).
 * Opens the rear camera, uses BarcodeDetector API, and POSTs each scan to the backend.
 * The backend then relays via WebSocket to the POS terminal.
 */
export default function PhoneScannerPage() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animRef = useRef(null);
  const detectorRef = useRef(null);
  const lastCode = useRef('');
  const lastCodeTime = useRef(0);

  const [status, setStatus] = useState('idle'); // idle | starting | scanning | error | no-api
  const [lastScan, setLastScan] = useState(null);
  const [scanCount, setScanCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const beep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 1760;
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.3);
    } catch {}
  }, []);

  const sendBarcode = useCallback(async (barcode) => {
    if (sending) return;
    setSending(true);
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const sid = searchParams.get('sid');
      await scannerAPI.scan(barcode, sid);
      beep();
      setScanCount(c => c + 1);
      setLastScan({ barcode, time: new Date().toLocaleTimeString() });
    } catch (err) {
      console.error('Failed to send barcode:', err);
      setLastScan({ barcode, error: true, time: new Date().toLocaleTimeString() });
    } finally {
      setSending(false);
    }
  }, [sending, beep]);

  const startCamera = useCallback(async () => {
    if (!('BarcodeDetector' in window)) {
      setStatus('no-api');
      return;
    }

    setStatus('starting');

    try {
      detectorRef.current = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e', 'itf']
      });
    } catch {
      setStatus('no-api');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
          setStatus('scanning');
          scanLoop();
        } catch (playErr) {
          if (playErr.name === 'AbortError' || playErr.message.includes('interrupted')) {
            console.warn('Camera play interrupted (likely unmount)');
            return;
          }
          throw playErr;
        }
      }
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setErrorMsg('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setErrorMsg('No camera found on this device.');
      } else {
        setErrorMsg('Camera error: ' + err.message);
      }
      setStatus('error');
    }
  }, []); // eslint-disable-line

  const scanLoop = useCallback(async () => {
    if (!videoRef.current || !detectorRef.current) return;
    const video = videoRef.current;
    if (video.readyState >= 2) {
      try {
        const barcodes = await detectorRef.current.detect(video);
        if (barcodes.length > 0) {
          const code = barcodes[0].rawValue;
          const now = Date.now();
          if (code && (code !== lastCode.current || now - lastCodeTime.current > 2500)) {
            lastCode.current = code;
            lastCodeTime.current = now;
            await sendBarcode(code);
          }
        }
      } catch {}
    }
    animRef.current = requestAnimationFrame(scanLoop);
  }, [sendBarcode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []); // eslint-disable-line

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track?.getCapabilities) return;
    const caps = track.getCapabilities();
    if (!caps.torch) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn(t => !t);
    } catch {}
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await sendBarcode(manualCode.trim());
    setManualCode('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '16px',
      fontFamily: "'Inter', system-ui, sans-serif",
      color: '#f1f5f9'
    }}>
      {/* Header */}
      <div style={{ width: '100%', maxWidth: 480, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18
            }}>📡</div>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: '#e2e8f0' }}>POS Scanner</p>
              <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>Andrew & Brothers</p>
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: status === 'scanning' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${status === 'scanning' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
            borderRadius: 20, padding: '4px 10px'
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: status === 'scanning' ? '#10b981' : '#ef4444',
              animation: status === 'scanning' ? 'pulse 1.5s infinite' : 'none'
            }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: status === 'scanning' ? '#10b981' : '#ef4444' }}>
              {status === 'scanning' ? 'Camera Active' : status === 'starting' ? 'Starting…' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Scan count pill */}
        <div style={{
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 8, padding: '6px 12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 8
        }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Scans sent to POS</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#818cf8' }}>{scanCount}</span>
        </div>
      </div>

      {/* Camera viewfinder */}
      <div style={{ width: '100%', maxWidth: 480, marginBottom: 16 }}>
        {(status === 'scanning' || status === 'starting') && (
          <div style={{
            position: 'relative',
            background: '#000',
            borderRadius: 16,
            overflow: 'hidden',
            aspectRatio: '4/3',
            border: '2px solid rgba(99,102,241,0.4)',
            boxShadow: '0 0 40px rgba(99,102,241,0.2)'
          }}>
            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />

            {/* Overlay */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
              {/* Viewfinder */}
              <div style={{
                position: 'relative',
                width: '75%', height: '45%',
                border: '2px solid #818cf8',
                borderRadius: 8,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                zIndex: 10
              }}>
                {/* Corner accents */}
                {[
                  { top: -2, left: -2, borderTop: '4px solid #818cf8', borderLeft: '4px solid #818cf8', borderTopLeftRadius: 6 },
                  { top: -2, right: -2, borderTop: '4px solid #818cf8', borderRight: '4px solid #818cf8', borderTopRightRadius: 6 },
                  { bottom: -2, left: -2, borderBottom: '4px solid #818cf8', borderLeft: '4px solid #818cf8', borderBottomLeftRadius: 6 },
                  { bottom: -2, right: -2, borderBottom: '4px solid #818cf8', borderRight: '4px solid #818cf8', borderBottomRightRadius: 6 }
                ].map((s, i) => (
                  <div key={i} style={{ position: 'absolute', width: 20, height: 20, ...s }} />
                ))}
                {/* Scan line */}
                <div style={{
                  position: 'absolute', left: 0, right: 0, height: 2,
                  background: 'linear-gradient(90deg, transparent, #818cf8, transparent)',
                  boxShadow: '0 0 10px 3px rgba(129,140,248,0.6)',
                  animation: 'scanline 2s ease-in-out infinite',
                  top: '50%'
                }} />
              </div>
            </div>

            {/* Last scan feedback */}
            {lastScan && (
              <div style={{
                position: 'absolute', bottom: 10, left: 10, right: 10, zIndex: 20,
                background: lastScan.error ? 'rgba(239,68,68,0.9)' : 'rgba(16,185,129,0.9)',
                borderRadius: 10, padding: '8px 14px',
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                <span style={{ fontSize: 14 }}>{lastScan.error ? '❌' : '✅'}</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#fff' }}>
                    {lastScan.error ? 'Send failed' : 'Sent to POS!'}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace' }}>
                    {lastScan.barcode}
                  </p>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>
                  {lastScan.time}
                </span>
              </div>
            )}

            {/* Torch button */}
            <button
              onClick={toggleTorch}
              style={{
                position: 'absolute', top: 10, right: 10, zIndex: 20,
                background: torchOn ? 'rgba(251,191,36,0.9)' : 'rgba(0,0,0,0.5)',
                border: 'none', borderRadius: 8, padding: '8px',
                color: torchOn ? '#000' : '#fff', cursor: 'pointer', fontSize: 18
              }}
              title="Toggle flashlight"
            >
              🔦
            </button>

            {/* Starting overlay */}
            {status === 'starting' && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.6)'
              }}>
                <p style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>Starting camera…</p>
              </div>
            )}
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12, padding: 16, marginBottom: 16
          }}>
            <p style={{ margin: 0, color: '#f87171', fontWeight: 600, fontSize: 13 }}>⚠️ {errorMsg}</p>
          </div>
        )}

        {/* No BarcodeDetector API */}
        {status === 'no-api' && (
          <div style={{
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 12, padding: 16, marginBottom: 16
          }}>
            <p style={{ margin: 0, color: '#fbbf24', fontWeight: 600, fontSize: 13 }}>
              ⚠️ Camera scanning not supported in this browser.
            </p>
            <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: 12 }}>
              Use Chrome on Android for camera scanning. Or enter barcodes manually below.
            </p>
          </div>
        )}
      </div>

      {/* Manual entry */}
      <div style={{ width: '100%', maxWidth: 480 }}>
        <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Manual / USB Entry
        </p>
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={manualCode}
            onChange={e => setManualCode(e.target.value)}
            placeholder="Type or scan barcode…"
            autoComplete="off"
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10,
              padding: '12px 14px',
              color: '#f1f5f9',
              fontSize: 16,
              fontFamily: 'monospace',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={!manualCode.trim() || sending}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', borderRadius: 10,
              padding: '12px 18px',
              color: '#fff', fontWeight: 700, fontSize: 14,
              cursor: manualCode.trim() && !sending ? 'pointer' : 'not-allowed',
              opacity: manualCode.trim() && !sending ? 1 : 0.5
            }}
          >
            {sending ? '…' : 'Send'}
          </button>
        </form>
        <p style={{ margin: '8px 0 0', fontSize: 11, color: '#475569' }}>
          Plug in a USB barcode scanner — it will type into this field automatically.
        </p>
      </div>

      {/* How it works info */}
      <div style={{
        width: '100%', maxWidth: 480, marginTop: 20,
        background: 'rgba(99,102,241,0.05)',
        border: '1px solid rgba(99,102,241,0.15)',
        borderRadius: 12, padding: 14
      }}>
        <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 12, color: '#818cf8' }}>How it works</p>
        <ul style={{ margin: 0, padding: '0 0 0 16px', color: '#64748b', fontSize: 12, lineHeight: 1.8 }}>
          <li>Point camera at a barcode</li>
          <li>It's detected & sent to the POS system instantly</li>
          <li>The product appears in the cart automatically</li>
          <li>Works over Wi-Fi or USB tethering</li>
        </ul>
      </div>

      <style>{`
        @keyframes scanline {
          0%, 100% { top: 10%; }
          50% { top: 90%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
