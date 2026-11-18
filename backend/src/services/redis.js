/**
 * Redis Service
 * Handles Redis connection and provides methods for token revocation,
 * rate limiting, and session management
 */

const redis = require('redis');
const logger = require('../utils/logger');

let client = null;
let isConnected = false;

/**
 * Initialize Redis connection
 */
async function connect() {
  if (client && isConnected) {
    return client;
  }

  try {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    
    client = redis.createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis reconnection failed after 10 attempts');
            return new Error('Redis reconnection limit exceeded');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    client.on('error', (err) => {
      logger.error('Redis error:', err);
      isConnected = false;
    });

    client.on('connect', () => {
      logger.info('Redis client connecting...');
    });

    client.on('ready', () => {
      logger.info('✓ Redis client ready');
      isConnected = true;
    });

    client.on('reconnecting', () => {
      logger.warn('Redis client reconnecting...');
      isConnected = false;
    });

    await client.connect();
    return client;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
}

/**
 * Get Redis client (ensure connection first)
 */
async function getClient() {
  if (!client || !isConnected) {
    await connect();
  }
  return client;
}

/**
 * Close Redis connection
 */
async function disconnect() {
  if (client && isConnected) {
    await client.quit();
    isConnected = false;
    logger.info('Redis client disconnected');
  }
}

/**
 * Token Revocation Methods
 */

/**
 * Revoke a token (add to blacklist)
 * @param {string} token - JWT token to revoke
 * @param {number} expiresIn - Seconds until token naturally expires
 */
async function revokeToken(token, expiresIn = 28800) {
  try {
    const redisClient = await getClient();
    const key = `revoked:${token}`;
    await redisClient.setEx(key, expiresIn, '1');
    logger.logAuth('token_revoked', { token_preview: token.substring(0, 20) });
  } catch (error) {
    logger.error('Failed to revoke token:', error);
    throw error;
  }
}

/**
 * Check if token is revoked
 * @param {string} token - JWT token to check
 * @returns {boolean} true if revoked
 */
async function isTokenRevoked(token) {
  try {
    const redisClient = await getClient();
    const key = `revoked:${token}`;
    const result = await redisClient.get(key);
    return result === '1';
  } catch (error) {
    logger.error('Failed to check token revocation:', error);
    // Fail open - if Redis is down, allow the request (JWT expiry still enforced)
    return false;
  }
}

/**
 * Revoke all tokens for a user (on password change, logout all devices)
 * @param {number} userId - User ID
 */
async function revokeAllUserTokens(userId) {
  try {
    const redisClient = await getClient();
    const key = `user_tokens:${userId}`;
    const tokens = await redisClient.sMembers(key);
    
    const pipeline = redisClient.multi();
    for (const token of tokens) {
      pipeline.setEx(`revoked:${token}`, 28800, '1'); // 8 hours
    }
    pipeline.del(key);
    await pipeline.exec();
    
    logger.logAuth('all_tokens_revoked', { user_id: userId, count: tokens.length });
  } catch (error) {
    logger.error('Failed to revoke all user tokens:', error);
    throw error;
  }
}

/**
 * Track user token (for logout all devices functionality)
 * @param {number} userId - User ID
 * @param {string} token - Token to track
 * @param {number} expiresIn - Seconds until token expires
 */
async function trackUserToken(userId, token, expiresIn = 28800) {
  try {
    const redisClient = await getClient();
    const key = `user_tokens:${userId}`;
    await redisClient.sAdd(key, token);
    await redisClient.expire(key, expiresIn);
  } catch (error) {
    logger.error('Failed to track user token:', error);
    // Non-critical - continue even if tracking fails
  }
}

/**
 * Rate Limiting Methods
 */

/**
 * Increment rate limit counter for a key
 * @param {string} key - Rate limit key (e.g., "login:user@email.com")
 * @param {number} windowSeconds - Time window in seconds
 * @returns {number} Current count
 */
async function incrementRateLimit(key, windowSeconds) {
  try {
    const redisClient = await getClient();
    const fullKey = `ratelimit:${key}`;
    
    const count = await redisClient.incr(fullKey);
    
    if (count === 1) {
      // First request in window - set expiry
      await redisClient.expire(fullKey, windowSeconds);
    }
    
    return count;
  } catch (error) {
    logger.error('Failed to increment rate limit:', error);
    // Fail open - if Redis is down, allow the request
    return 0;
  }
}

/**
 * Get remaining rate limit for a key
 * @param {string} key - Rate limit key
 * @param {number} maxRequests - Maximum allowed requests
 * @returns {Object} { remaining, resetTime }
 */
async function getRateLimit(key, maxRequests) {
  try {
    const redisClient = await getClient();
    const fullKey = `ratelimit:${key}`;
    
    const [count, ttl] = await Promise.all([
      redisClient.get(fullKey),
      redisClient.ttl(fullKey),
    ]);
    
    const current = parseInt(count || '0', 10);
    const remaining = Math.max(0, maxRequests - current);
    const resetTime = ttl > 0 ? Date.now() + (ttl * 1000) : null;
    
    return { remaining, resetTime, current };
  } catch (error) {
    logger.error('Failed to get rate limit:', error);
    return { remaining: maxRequests, resetTime: null, current: 0 };
  }
}

/**
 * Session Management Methods
 */

/**
 * Store session data
 * @param {string} sessionId - Session ID
 * @param {Object} data - Session data
 * @param {number} expiresIn - Seconds until expiry
 */
async function setSession(sessionId, data, expiresIn = 28800) {
  try {
    const redisClient = await getClient();
    const key = `session:${sessionId}`;
    await redisClient.setEx(key, expiresIn, JSON.stringify(data));
  } catch (error) {
    logger.error('Failed to set session:', error);
    throw error;
  }
}

/**
 * Get session data
 * @param {string} sessionId - Session ID
 * @returns {Object|null} Session data or null
 */
async function getSession(sessionId) {
  try {
    const redisClient = await getClient();
    const key = `session:${sessionId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Failed to get session:', error);
    return null;
  }
}

/**
 * Delete session
 * @param {string} sessionId - Session ID
 */
async function deleteSession(sessionId) {
  try {
    const redisClient = await getClient();
    const key = `session:${sessionId}`;
    await redisClient.del(key);
  } catch (error) {
    logger.error('Failed to delete session:', error);
    throw error;
  }
}

/**
 * Cache Methods
 */

/**
 * Set cache value
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} expiresIn - Seconds until expiry
 */
async function setCache(key, value, expiresIn = 300) {
  try {
    const redisClient = await getClient();
    const fullKey = `cache:${key}`;
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await redisClient.setEx(fullKey, expiresIn, stringValue);
  } catch (error) {
    logger.error('Failed to set cache:', error);
    // Non-critical - continue even if caching fails
  }
}

/**
 * Get cache value
 * @param {string} key - Cache key
 * @returns {any} Cached value or null
 */
async function getCache(key) {
  try {
    const redisClient = await getClient();
    const fullKey = `cache:${key}`;
    const value = await redisClient.get(fullKey);
    
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    logger.error('Failed to get cache:', error);
    return null;
  }
}

/**
 * Delete cache value
 * @param {string} key - Cache key
 */
async function deleteCache(key) {
  try {
    const redisClient = await getClient();
    const fullKey = `cache:${key}`;
    await redisClient.del(fullKey);
  } catch (error) {
    logger.error('Failed to delete cache:', error);
  }
}

/**
 * Invalidate cache by pattern
 * @param {string} pattern - Pattern to match (e.g., "products:*")
 */
async function invalidateCachePattern(pattern) {
  try {
    const redisClient = await getClient();
    const fullPattern = `cache:${pattern}`;
    const keys = await redisClient.keys(fullPattern);
    
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`Invalidated ${keys.length} cache entries matching pattern: ${pattern}`);
    }
  } catch (error) {
    logger.error('Failed to invalidate cache pattern:', error);
  }
}

/**
 * Health check
 */
async function healthCheck() {
  try {
    if (!client || !isConnected) {
      return { status: 'disconnected', healthy: false };
    }
    
    const start = Date.now();
    await client.ping();
    const latency = Date.now() - start;
    
    return {
      status: 'connected',
      healthy: true,
      latency,
    };
  } catch (error) {
    return {
      status: 'error',
      healthy: false,
      error: error.message,
    };
  }
}

module.exports = {
  connect,
  getClient,
  disconnect,
  healthCheck,
  // Token revocation
  revokeToken,
  isTokenRevoked,
  revokeAllUserTokens,
  trackUserToken,
  // Rate limiting
  incrementRateLimit,
  getRateLimit,
  // Session management
  setSession,
  getSession,
  deleteSession,
  // Caching
  setCache,
  getCache,
  deleteCache,
  invalidateCachePattern,
};
