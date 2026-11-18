/**
 * Rate Limiting Middleware
 * Implements sliding window rate limiting with Redis
 * Protects against brute force attacks and API abuse
 */

const redisService = require('../services/redis');
const logger = require('../utils/logger');

/**
 * Generic rate limiter
 * @param {Object} options - Rate limit options
 * @param {number} options.windowSeconds - Time window in seconds
 * @param {number} options.maxRequests - Maximum requests per window
 * @param {Function} options.keyGenerator - Function to generate rate limit key
 * @param {string} options.message - Custom error message
 */
function rateLimiter(options) {
  const {
    windowSeconds = 900, // 15 minutes
    maxRequests = 100,
    keyGenerator = (req) => req.ip,
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false,
  } = options;

  return async (req, res, next) => {
    try {
      const key = keyGenerator(req);
      
      if (!key) {
        // If key generation fails, allow request
        return next();
      }

      // Get current rate limit status
      const { current, remaining, resetTime } = await redisService.getRateLimit(
        key,
        maxRequests
      );

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining - 1));
      if (resetTime) {
        res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString());
      }

      // Check if limit exceeded
      if (current >= maxRequests) {
        logger.logSecurity('rate_limit_exceeded', {
          key,
          current,
          limit: maxRequests,
          ip: req.ip,
          user_id: req.user?.id,
          endpoint: req.originalUrl,
        });

        return res.status(429).json({
          error: message,
          code: 429,
          retry_after: resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : windowSeconds,
        });
      }

      // Increment counter
      await redisService.incrementRateLimit(key, windowSeconds);

      // If configured, decrement on successful response
      if (skipSuccessfulRequests) {
        const originalSend = res.send;
        res.send = function (data) {
          if (res.statusCode < 400) {
            // Successful response, decrement counter
            redisService.incrementRateLimit(key, windowSeconds).then(count => {
              redisService.getClient().then(client => {
                client.decr(`ratelimit:${key}`);
              });
            });
          }
          return originalSend.call(this, data);
        };
      }

      next();
    } catch (error) {
      logger.error('Rate limiter error:', error);
      // Fail open - if Redis is down, allow the request
      next();
    }
  };
}

/**
 * Login rate limiter
 * Strict limits to prevent brute force attacks
 */
exports.loginRateLimiter = rateLimiter({
  windowSeconds: 900, // 15 minutes
  maxRequests: 5,
  keyGenerator: (req) => {
    const email = req.body.email || 'unknown';
    return `login:${email}`;
  },
  message: 'Too many login attempts. Please try again in 15 minutes.',
});

/**
 * Per-user API rate limiter
 * Applies after authentication
 */
exports.userRateLimiter = rateLimiter({
  windowSeconds: 60, // 1 minute
  maxRequests: 100,
  keyGenerator: (req) => {
    return req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
  },
  message: 'API rate limit exceeded. Please slow down.',
});

/**
 * Transaction creation rate limiter
 * Prevents transaction spam
 */
exports.transactionRateLimiter = rateLimiter({
  windowSeconds: 60, // 1 minute
  maxRequests: 20,
  keyGenerator: (req) => {
    return req.user ? `txn:${req.user.id}` : null;
  },
  message: 'Too many transactions. Please wait before creating another.',
  skipSuccessfulRequests: false, // Count all attempts, even failed ones
});

/**
 * Password reset rate limiter
 * Prevent abuse of password reset functionality
 */
exports.passwordResetRateLimiter = rateLimiter({
  windowSeconds: 3600, // 1 hour
  maxRequests: 3,
  keyGenerator: (req) => {
    const email = req.body.email || 'unknown';
    return `reset:${email}`;
  },
  message: 'Too many password reset requests. Please try again in an hour.',
});

/**
 * General API rate limiter
 * Default rate limit for all authenticated endpoints
 */
exports.generalRateLimiter = rateLimiter({
  windowSeconds: 60, // 1 minute
  maxRequests: 60,
  keyGenerator: (req) => {
    return req.user ? `api:${req.user.id}` : `api:${req.ip}`;
  },
  message: 'Rate limit exceeded. Please try again later.',
});

/**
 * Aggressive rate limiter for sensitive operations
 */
exports.sensitiveOperationRateLimiter = rateLimiter({
  windowSeconds: 60, // 1 minute
  maxRequests: 10,
  keyGenerator: (req) => {
    return req.user ? `sensitive:${req.user.id}:${req.originalUrl}` : null;
  },
  message: 'Too many sensitive operations. Please wait.',
});

/**
 * Rate limiter for void/refund operations
 */
exports.voidRefundRateLimiter = rateLimiter({
  windowSeconds: 300, // 5 minutes
  maxRequests: 5,
  keyGenerator: (req) => {
    return req.user ? `void:${req.user.id}` : null;
  },
  message: 'Too many void/refund requests. This activity is being monitored.',
});

module.exports = {
  rateLimiter,
  loginRateLimiter: exports.loginRateLimiter,
  userRateLimiter: exports.userRateLimiter,
  transactionRateLimiter: exports.transactionRateLimiter,
  passwordResetRateLimiter: exports.passwordResetRateLimiter,
  generalRateLimiter: exports.generalRateLimiter,
  sensitiveOperationRateLimiter: exports.sensitiveOperationRateLimiter,
  voidRefundRateLimiter: exports.voidRefundRateLimiter,
};
