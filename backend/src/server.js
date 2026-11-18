require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { sequelize } = require('./models');
const redisService = require('./services/redis');
const logger = require('./utils/logger');
const initShiftAutoClose = require('./cron/shiftAutoClose');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Create HTTP + Socket.IO server ──────────────────────────────────────────
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Make io available to route handlers via app.get('io')
app.set('io', io);

// ── Socket.IO connection handling ───────────────────────────────────────────
io.on('connection', (socket) => {
  // POS terminals join the 'pos' room to receive scan events
  socket.on('join_pos', () => {
    socket.join('pos');
    console.log(`[WS] POS client joined: ${socket.id}`);
    socket.emit('scanner_ready', { message: 'Connected to scanner relay' });
  });

  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Health check endpoint with Redis status
app.get('/health', async (req, res) => {
  const posRoom = io.sockets.adapter.rooms.get('pos');
  const redisHealth = await redisService.healthCheck();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    websocket: {
      posClients: posRoom ? posRoom.size : 0
    },
    redis: redisHealth
  });
});

// API Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/categories', require('./routes/categories'));
app.use('/api/v1/suppliers', require('./routes/suppliers'));
app.use('/api/v1/products', require('./routes/products'));
app.use('/api/v1/inventory', require('./routes/inventory'));
app.use('/api/v1/transactions', require('./routes/transactions'));
app.use('/api/v1/cash-sessions', require('./routes/cashSessions'));
app.use('/api/v1/returns', require('./routes/returns'));
app.use('/api/v1/purchase-orders', require('./routes/purchaseOrders'));
app.use('/api/v1/purchase-requests', require('./routes/purchaseRequests'));
app.use('/api/v1/stocktakes', require('./routes/stocktakes'));
app.use('/api/v1/promotions', require('./routes/promotions'));
app.use('/api/v1/reports', require('./routes/reports'));
app.use('/api/v1/alerts', require('./routes/alerts'));
app.use('/api/v1/losses', require('./routes/losses'));
app.use('/api/v1/audit-logs', require('./routes/auditLogs'));
app.use('/api/v1/forecasts', require('./routes/forecasts'));
app.use('/api/v1/scanner', require('./routes/scanner'));
app.use('/api/v1/shelf-tags', require('./routes/shelfTags'));
app.use('/api/v1/manager', require('./routes/manager'));
app.use('/api/v1/settings', require('./routes/settings'));
app.use('/api/v1/payments', require('./routes/payments'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    code: 404
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({
    error: message,
    code: statusCode,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Database connection and server start
const startServer = async () => {
  try {
    // Connect to database
    await sequelize.authenticate();
    logger.info('✓ Database connection established');

    const modelCount = Object.keys(sequelize.models).length;
    logger.info(`✓ Loaded ${modelCount} models`);

    // Connect to Redis
    try {
      await redisService.connect();
      logger.info('✓ Redis connection established');
    } catch (redisError) {
      logger.warn('⚠ Redis connection failed - some features will be degraded:', redisError.message);
      logger.warn('  - Token revocation will not work');
      logger.warn('  - Rate limiting will be bypassed');
      logger.warn('  - Session management will use fallback');
    }

    if (process.env.DB_SYNC === 'true') {
      logger.warn('⚠ Running database sync (DB_SYNC=true)...');
      await sequelize.sync({ alter: false });
      logger.info('✓ Database schema synchronized');
    }

    // Seed default system settings (safe to run every boot — uses upsert)
    try {
      const { SystemSetting } = require('./models');
      const defaults = [
        { key: 'shop_name',            value: 'Andrew & Brothers Supermarket', category: 'General', type: 'string' },
        { key: 'location',             value: 'Fort Portal, Uganda',            category: 'General', type: 'string' },
        { key: 'vat_rate',             value: '18',                             category: 'General', type: 'number' },
        { key: 'currency',             value: 'UGX',                            category: 'General', type: 'string' },
        { key: 'timezone',             value: 'Africa/Nairobi',                 category: 'General', type: 'string' },
        { key: 'receipt_footer',       value: 'Thank you — Karibu Tena!',       category: 'General', type: 'string' },
        { key: 'jwt_expiry',           value: '8h',                             category: 'Security', type: 'string' },
        { key: 'max_login_attempts',   value: '5',                              category: 'Security', type: 'number' },
        { key: 'lockout_duration',     value: '15',                             category: 'Security', type: 'number' },
        { key: 'session_timeout',      value: '480',                            category: 'Security', type: 'number' },
        { key: 'low_stock_threshold',  value: '80',                             category: 'Alerts',   type: 'number' },
        { key: 'expiry_days_warning',  value: '7',                              category: 'Alerts',   type: 'number' },
        { key: 'refund_rate_threshold',value: '5',                              category: 'Alerts',   type: 'number' },
        { key: 'fraud_alert_enabled',  value: 'true',                           category: 'Alerts',   type: 'boolean' },
        { key: 'backup_frequency',     value: 'daily',                          category: 'Backup',   type: 'string' },
        { key: 'backup_time',          value: '02:00',                          category: 'Backup',   type: 'string' },
        { key: 'retention_days',       value: '30',                             category: 'Backup',   type: 'number' },
        { key: 'backup_location',      value: '/var/backups/rstms',             category: 'Backup',   type: 'string' },
        { key: 'auto_backup',          value: 'true',                           category: 'Backup',   type: 'boolean' },
      ];
      for (const s of defaults) {
        await SystemSetting.findOrCreate({ where: { key: s.key }, defaults: s });
      }
      logger.info('✓ System settings seeded');
    } catch (e) {
      logger.warn('⚠ Could not seed system settings:', e.message);
    }

    // Initialize cron jobs
    initShiftAutoClose();

    // ── Use httpServer (not app) so Socket.IO works ──────────────────────
    httpServer.listen(PORT, () => {
      logger.info('─────────────────────────────────────────');
      logger.info(`✓ Server running on port ${PORT}`);
      logger.info(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`✓ API Base URL: http://localhost:${PORT}/api/v1`);
      logger.info(`✓ WebSocket:    ws://localhost:${PORT}`);
      logger.info(`✓ Scanner relay: POST /api/v1/scanner/scan`);
      logger.info('─────────────────────────────────────────');
    });
  } catch (error) {
    logger.error('✗ Unable to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing server gracefully...');
  httpServer.close();
  await sequelize.close();
  await redisService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing server gracefully...');
  httpServer.close();
  await sequelize.close();
  await redisService.disconnect();
  process.exit(0);
});

startServer();

module.exports = app;
