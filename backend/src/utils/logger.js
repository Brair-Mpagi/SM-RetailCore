const winston = require('winston');
const path = require('path');

/**
 * Enhanced structured logging with Winston
 * Logs to files and console with different formats for development/production
 */

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'rstms-backend',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Error logs (error level only)
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    
    // Combined logs (all levels)
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
    
    // Transaction logs (for audit trail)
    new winston.transports.File({
      filename: path.join(logsDir, 'transactions.log'),
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 30, // Keep 30 days of transaction logs
    }),
  ],
  
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
    }),
  ],
  
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

/**
 * Helper methods for common logging patterns
 */

// Log transaction operations
logger.logTransaction = (action, data) => {
  logger.info(`TRANSACTION: ${action}`, {
    category: 'transaction',
    action,
    ...data,
  });
};

// Log authentication events
logger.logAuth = (action, data) => {
  logger.info(`AUTH: ${action}`, {
    category: 'auth',
    action,
    ...data,
  });
};

// Log inventory changes
logger.logInventory = (action, data) => {
  logger.info(`INVENTORY: ${action}`, {
    category: 'inventory',
    action,
    ...data,
  });
};

// Log security events
logger.logSecurity = (action, data) => {
  logger.warn(`SECURITY: ${action}`, {
    category: 'security',
    action,
    ...data,
  });
};

// Log API requests (for monitoring)
logger.logRequest = (req, responseTime) => {
  logger.info('API Request', {
    category: 'api',
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    user_id: req.user?.id,
    response_time: responseTime,
  });
};

module.exports = logger;
