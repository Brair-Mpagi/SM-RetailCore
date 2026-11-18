/**
 * Idempotency Middleware
 * Prevents duplicate transaction submissions by caching responses
 * Uses Redis to store idempotency keys and their corresponding responses
 */

const redisService = require('../services/redis');
const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * Idempotent request handler
 * @param {number} ttl - Time to live for cached response (seconds)
 * @param {Function} keyGenerator - Optional custom key generator
 */
function idempotent(ttl = 3600, keyGenerator = null) {
  return async (req, res, next) => {
    try {
      // Get idempotency key from header
      let idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];
      
      // If no key provided and this is a transaction, generate from request body
      if (!idempotencyKey && keyGenerator) {
        idempotencyKey = keyGenerator(req);
      }

      if (!idempotencyKey) {
        // For POST requests without idempotency key, generate warning
        if (req.method === 'POST' && req.path.includes('transactions')) {
          logger.warn('Transaction request without idempotency key', {
            user_id: req.user?.id,
            path: req.path,
            ip: req.ip,
          });
        }
        return next();
      }

      // Validate idempotency key format
      if (typeof idempotencyKey !== 'string' || idempotencyKey.length < 10 || idempotencyKey.length > 200) {
        return res.status(400).json({
          error: 'Invalid Idempotency-Key format',
          code: 400,
          details: 'Idempotency-Key must be a string between 10 and 200 characters',
        });
      }

      const cacheKey = `idempotency:${req.user?.id || 'anon'}:${idempotencyKey}`;

      // Check if request was already processed
      const cached = await redisService.getCache(cacheKey);
      
      if (cached) {
        logger.info('Idempotent request - returning cached response', {
          idempotency_key: idempotencyKey,
          user_id: req.user?.id,
          status_code: cached.statusCode,
        });

        // Return cached response
        return res
          .status(cached.statusCode)
          .set('X-Idempotent-Replay', 'true')
          .json(cached.body);
      }

      // Store original res.json and res.status functions
      const originalJson = res.json.bind(res);
      const originalStatus = res.status.bind(res);
      let statusCode = 200;
      
      // Override res.status to capture status code
      res.status = function (code) {
        statusCode = code;
        return originalStatus(code);
      };

      // Override res.json to cache the response
      res.json = function (body) {
        // Only cache successful responses (2xx status codes)
        if (statusCode >= 200 && statusCode < 300) {
          const responseData = {
            statusCode,
            body,
            timestamp: new Date().toISOString(),
          };

          // Cache the response asynchronously (don't block response)
          redisService.setCache(cacheKey, responseData, ttl)
            .then(() => {
              logger.info('Cached idempotent response', {
                idempotency_key: idempotencyKey,
                user_id: req.user?.id,
                status_code: statusCode,
                ttl,
              });
            })
            .catch(error => {
              logger.error('Failed to cache idempotent response:', error);
            });
        }

        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error('Idempotency middleware error:', error);
      // Fail open - if Redis is down, allow the request to proceed
      next();
    }
  };
}

/**
 * Generate idempotency key from request body
 * Used when client doesn't provide explicit key
 */
function generateKeyFromBody(req) {
  try {
    // Create deterministic hash from request body
    const bodyString = JSON.stringify(req.body);
    const hash = crypto.createHash('sha256').update(bodyString).digest('hex');
    return `auto_${hash.substring(0, 32)}`;
  } catch (error) {
    return null;
  }
}

/**
 * Idempotency middleware for transaction creation
 * 1 hour TTL for transaction responses
 */
exports.transactionIdempotency = idempotent(3600, null);

/**
 * Idempotency middleware for payment operations
 * 24 hour TTL for payment responses
 */
exports.paymentIdempotency = idempotent(86400, null);

/**
 * General idempotency middleware
 * 1 hour TTL
 */
exports.generalIdempotency = idempotent(3600, null);

module.exports = {
  idempotent,
  transactionIdempotency: exports.transactionIdempotency,
  paymentIdempotency: exports.paymentIdempotency,
  generalIdempotency: exports.generalIdempotency,
  generateKeyFromBody,
};
