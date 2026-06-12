const express = require('express');
const router = express.Router();

/**
 * Scanner relay router.
 * The io instance is attached to the app by server.js via app.set('io', io).
 */

// POST /api/v1/scanner/scan
// Called by the phone's /scan page with { barcode: string, sid?: string }
router.post('/scan', (req, res) => {
  const { barcode, sid } = req.body;
  if (!barcode || typeof barcode !== 'string' || barcode.trim() === '') {
    return res.status(400).json({ error: 'barcode is required' });
  }

  const code = barcode.trim();
  const io = req.app.get('io');

  if (io) {
    if (sid) {
      // Emit strictly to the specific POS terminal socket
      io.to(sid).emit('barcode_scan', { barcode: code, ts: Date.now() });
    } else {
      // Fallback: emit to all POS clients if no session ID provided
      io.to('pos').emit('barcode_scan', { barcode: code, ts: Date.now() });
    }
  }

  res.json({ ok: true, barcode: code, sid: sid || null });
});

// GET /api/v1/scanner/status
router.get('/status', (req, res) => {
  const io = req.app.get('io');
  const sockets = io ? io.sockets.adapter.rooms.get('pos') : null;
  const posClients = sockets ? sockets.size : 0;

  res.json({
    ok: true,
    posClientsConnected: posClients,
    serverTime: new Date().toISOString()
  });
});

module.exports = router;
