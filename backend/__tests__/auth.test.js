/**
 * Authentication Tests
 * Tests for user authentication, token management, and security features
 */

const request = require('supertest');
const app = require('../src/server');
const { User, AuditLog } = require('../src/models');
const redisService = require('../src/services/redis');

describe('Authentication', () => {
  beforeAll(async () => {
    // Ensure Redis is connected
    try {
      await redisService.connect();
    } catch (error) {
      console.warn('Redis not available for tests');
    }
  });

  beforeEach(async () => {
    await cleanupDatabase();
    // Reset failed login attempts
    await User.update({ failed_attempts: 0 }, { where: {} });
  });

  describe('POST /api/v1/auth/login', () => {
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'manager@test.com',
          password: 'manager123',
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('manager@test.com');
      expect(response.body.data).toHaveProperty('expires_in');
      expect(response.body.data.token_type).toBe('Bearer');
    });

    test('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'manager@test.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.error).toContain('Invalid credentials');
    });

    test('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.error).toContain('Invalid credentials');
    });

    test('should reject login with missing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          password: 'password123',
        })
        .expect(400);

      expect(response.body.error).toContain('Validation failed');
    });

    test('should reject login with missing password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'manager@test.com',
        })
        .expect(400);

      expect(response.body.error).toContain('Validation failed');
    });

    test('should increment failed_attempts on wrong password', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'manager@test.com',
          password: 'wrongpassword',
        })
        .expect(401);

      const user = await User.findOne({ where: { email: 'manager@test.com' } });
      expect(user.failed_attempts).toBe(1);
    });

    test('should lock account after max failed attempts', async () => {
      const maxAttempts = 5;

      // Make 5 failed login attempts
      for (let i = 0; i < maxAttempts; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'manager@test.com',
            password: 'wrongpassword',
          })
          .expect(401);
      }

      // Next attempt should be rejected with account locked
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'manager@test.com',
          password: 'manager123', // Even with correct password
        })
        .expect(423);

      expect(response.body.error).toContain('locked');
    });

    test('should reset failed_attempts on successful login', async () => {
      // Make 2 failed attempts
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'manager@test.com', password: 'wrong' });

      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'manager@test.com', password: 'wrong' });

      // Successful login
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'manager@test.com', password: 'manager123' })
        .expect(200);

      const user = await User.findOne({ where: { email: 'manager@test.com' } });
      expect(user.failed_attempts).toBe(0);
    });

    test('should reject inactive user', async () => {
      // Deactivate user
      await User.update({ is_active: 0 }, { where: { email: 'manager@test.com' } });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'manager@test.com',
          password: 'manager123',
        })
        .expect(401);

      expect(response.body.error).toContain('inactive');
    });

    test('should create audit log on successful login', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'manager@test.com',
          password: 'manager123',
        })
        .expect(200);

      const auditLog = await AuditLog.findOne({
        where: { action: 'login_success' },
        order: [['created_at', 'DESC']],
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog.action).toBe('login_success');
    });

    test('should create audit log on failed login', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'manager@test.com',
          password: 'wrongpassword',
        })
        .expect(401);

      const auditLog = await AuditLog.findOne({
        where: { action: 'login_failed' },
        order: [['created_at', 'DESC']],
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog.action).toBe('login_failed');
    });

    test('should enforce rate limiting on login attempts', async () => {
      // Rate limit is 5 attempts per 15 minutes
      const attempts = 6;

      for (let i = 0; i < attempts; i++) {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'test@example.com',
            password: 'password',
          });

        if (i < 5) {
          expect(response.status).toBe(401); // Invalid credentials
        } else {
          expect(response.status).toBe(429); // Rate limited
          expect(response.body.error).toContain('Too many');
        }
      }
    }, 10000); // Increased timeout for rate limit test
  });

  describe('POST /api/v1/auth/logout', () => {
    test('should logout successfully', async () => {
      // Login first
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'manager@test.com',
          password: 'manager123',
        });

      const token = loginResponse.body.data.token;

      // Logout
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toContain('Logged out');
    });

    test('should reject logout without token', async () => {
      await request(app)
        .post('/api/v1/auth/logout')
        .expect(401);
    });

    test('should reject logout with invalid token', async () => {
      await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer invalid_token_here')
        .expect(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    test('should return current user info', async () => {
      // Login first
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'manager@test.com',
          password: 'manager123',
        });

      const token = loginResponse.body.data.token;

      // Get current user
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.email).toBe('manager@test.com');
      expect(response.body.data.role).toBe('manager');
      expect(response.body.data).not.toHaveProperty('password_hash');
    });

    test('should reject request without token', async () => {
      await request(app)
        .get('/api/v1/auth/me')
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    test('should refresh access token with valid refresh token', async () => {
      // Login first
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'manager@test.com',
          password: 'manager123',
        });

      const refreshToken = loginResponse.body.data.refreshToken;

      // Refresh token
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(response.body.refresh_token).not.toBe(refreshToken); // Should rotate
    });

    test('should reject refresh with invalid token', async () => {
      await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: 'invalid_token' })
        .expect(401);
    });

    test('should reject refresh without token', async () => {
      await request(app)
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(400);
    });

    test('should not reuse old refresh token after rotation', async () => {
      // Login
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'manager@test.com',
          password: 'manager123',
        });

      const oldRefreshToken = loginResponse.body.data.refreshToken;

      // Refresh once
      await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: oldRefreshToken })
        .expect(200);

      // Try to use old refresh token again (should fail)
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: oldRefreshToken })
        .expect(401);

      expect(response.body.error).toContain('Invalid');
    });
  });

  describe('Token Revocation', () => {
    test('should reject revoked access token', async () => {
      // Login
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'manager@test.com',
          password: 'manager123',
        });

      const token = loginResponse.body.data.token;

      // Logout (revokes token)
      await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .send({ refresh_token: loginResponse.body.data.refreshToken })
        .expect(200);

      // Try to use revoked token
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body.error).toContain('revoked');
    });
  });
});
