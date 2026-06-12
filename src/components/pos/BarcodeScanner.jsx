import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Camera, Flashlight, AlertCircle, CheckCircle, ZapOff } from 'lucide-react';

/**
 * BarcodeScanner — uses the browser BarcodeDetector API (Chrome/Edge v83+)
 * Falls back to manual barcode text entry if the API is not available.
 * Props:
 *   onDetected(barcode: string) - callback when a barcode is scanned
 *   onClose() - callback to close the scanner
 */
export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animRef = useRef(null);
  const detectorRef = useRef(null);
  const lastDetected = useRef('');

  const [status, setStatus] = useState('starting'); // starting | scanning | error | manual
  const [errorMsg, setErrorMsg] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [lastScan, setLastScan] = useState('');

  // Beep sound via Web Audio API
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

  // Start camera
  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      // Check BarcodeDetector availability
      if (!('BarcodeDetector' in window)) {
        setStatus('manual');
        return;
      }

      try {
        detectorRef.current = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e']
        });
      } catch {
        setStatus('manual');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
            setStatus('scanning');
            scan();
          } catch (playErr) {
            if (playErr.name === 'AbortError' || playErr.message.includes('interrupted')) {
              console.warn('Camera play interrupted (likely unmount)');
              return;
            }
            throw playErr;
          }
        }
      } catch (err) {
        if (cancelled) return;
        if (err.name === 'NotAllowedError') {
          setErrorMsg('Camera permission denied. Please allow camera access or use manual entry below.');
        } else if (err.name === 'NotFoundError') {
          setErrorMsg('No camera found on this device. Use manual entry below.');
        } else {
          setErrorMsg('Camera unavailable: ' + err.message);
        }
        setStatus('error');
      }
    };

    const scan = async () => {
      if (cancelled || !videoRef.current || !detectorRef.current) return;
      const video = videoRef.current;
      if (video.readyState >= 2) {
        try {
          const barcodes = await detectorRef.current.detect(video);
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            if (code && code !== lastDetected.current) {
              lastDetected.current = code;
              setLastScan(code);
              beep();
              onDetected(code);
              // Reset after 2s to allow scanning another item
              setTimeout(() => { lastDetected.current = ''; }, 2000);
            }
          }
        } catch {}
      }
      animRef.current = requestAnimationFrame(scan);
    };

    start();
    return () => {
      cancelled = true;
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [onDetected, beep]);

  // Torch toggle
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track || !track.getCapabilities) return;
    const caps = track.getCapabilities();
    if (!caps.torch) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn(t => !t);
    } catch {}
  };

  const submitManual = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      beep();
      onDetected(manualCode.trim());
      setManualCode('');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel max-w-md w-full" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Camera size={20} className="text-brand-400" />
            <h2 className="text-lg font-bold text-primary">Barcode Scanner</h2>
          </div>
          <div className="flex items-center gap-2">
            {status === 'scanning' && (
              <button onClick={toggleTorch}
                className={`p-2 rounded-xl transition-all ${torchOn ? 'bg-amber-500/20 text-amber-400' : 'btn-secondary p-2'}`}
                title="Toggle torch">
                <Flashlight size={16} />
              </button>
            )}
            <button onClick={onClose} className="btn-secondary p-2"><X size={18} /></button>
          </div>
        </div>

        {/* Camera viewfinder */}
        {(status === 'starting' || status === 'scanning') && (
          <div className="relative bg-black rounded-2xl overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Dimmed corners */}
              <div className="absolute inset-0 bg-black/30" />
              {/* Viewfinder box */}
              <div className="relative w-3/4 h-1/2 border-2 border-brand-400 rounded-lg z-10"
                style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)' }}>
                {/* Corner accents */}
                {['top-0 left-0 border-t-4 border-l-4', 'top-0 right-0 border-t-4 border-r-4',
                  'bottom-0 left-0 border-b-4 border-l-4', 'bottom-0 right-0 border-b-4 border-r-4'].map((c, i) => (
                  <div key={i} className={`absolute w-6 h-6 border-brand-400 ${c} rounded-sm`} />
                ))}
                {/* Scan line */}
                <div className="scan-line absolute left-0 right-0 h-0.5 bg-brand-400/80"
                  style={{ position: 'absolute', boxShadow: '0 0 8px 2px rgba(20,184,166,0.6)' }} />
              </div>
            </div>

            {status === 'starting' && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="text-white text-sm font-medium">Starting camera…</div>
              </div>
            )}

            {lastScan && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center z-20">
                <div className="flex items-center gap-2 bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg">
                  <CheckCircle size={13} /> {lastScan}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 mb-4">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{errorMsg}</p>
          </div>
        )}

        {/* Manual / API not available state */}
        {(status === 'manual' || status === 'error') && (
          <div className="mb-2">
            {status === 'manual' && (
              <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 mb-3">
                <ZapOff size={13} /> BarcodeDetector API not available in this browser. Use manual entry.
              </div>
            )}
          </div>
        )}

        {/* Manual barcode entry — always shown as fallback */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
            {status === 'scanning' ? 'Or enter barcode manually:' : 'Manual Barcode Entry'}
          </p>
          <form onSubmit={submitManual} className="flex gap-2">
            <input
              autoFocus={status !== 'scanning'}
              type="text"
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              className="input-field py-3 text-lg font-mono tracking-widest"
              placeholder="Scan or type barcode…"
              id="manual-barcode-input"
            />
            <button type="submit" className="btn-primary px-4 flex-shrink-0">
              Add
            </button>
          </form>
          <p className="text-xs text-muted mt-2">
            Connect a USB barcode scanner — it types directly into this field and submits on Enter.
          </p>
        </div>
      </div>
    </div>
  );
}
