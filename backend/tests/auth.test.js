const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

jest.setTimeout(30000);

describe('Enhanced Authentication System', () => {
  let testUser;
  let authToken;
  let refreshToken;

  beforeEach(async () => {
    // Clean up test data
    await User.deleteMany({});
    await AuditLog.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with auto-generated UID', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Test@1234',
          rememberMe: false
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty('uid');
      expect(res.body.data.user.uid).toHaveLength(8);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('should return error for duplicate email', async () => {
      await User.create({
        name: 'Existing User',
        email: 'test@example.com',
        password: 'Test@1234'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Test@1234'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email already exists');
    });

    it('should validate password strength', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'weak'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Password must contain');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@1234'
      });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@1234',
          rememberMe: false
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.message).toBe('Welcome back!');

      authToken = res.body.data.token;
      refreshToken = res.body.data.refreshToken;
    });

    it('should support remember me with extended token expiry', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@1234',
          rememberMe: true
        });

      expect(res.status).toBe(200);
      
      // Check that refresh token has extended expiry
      const user = await User.findById(testUser._id);
      const tokenObj = user.refreshTokens[0];
      expect(tokenObj.rememberMe).toBe(true);
      
      // Check expiry is 30 days
      const expiryDiff = tokenObj.expiresAt - new Date();
      const daysDiff = expiryDiff / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeGreaterThan(29);
      expect(daysDiff).toBeLessThan(31);
    });

    it('should log failed login attempts', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword'
        });

      expect(res.status).toBe(401);
      
      // Check audit log
      const logs = await AuditLog.find({ userId: testUser._id, eventType: 'login_failed' });
      expect(logs.length).toBe(1);
      expect(logs[0].success).toBe(false);
      expect(logs[0].reason).toBe('Invalid password');
    });

    it('should lock account after 5 failed attempts', async () => {
      // Make 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'WrongPassword'
          });
      }

      // 6th attempt should return account locked
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@1234'
        });

      expect(res.status).toBe(423);
      expect(res.body.error).toContain('Account temporarily locked');
    });

    it('should log successful login to audit log', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@1234'
        });

      const logs = await AuditLog.find({ userId: testUser._id, eventType: 'login' });
      expect(logs.length).toBe(1);
      expect(logs[0].success).toBe(true);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    beforeEach(async () => {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@1234'
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@1234'
        });

      refreshToken = loginRes.body.data.refreshToken;
    });

    it('should refresh access token with valid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.refreshToken).not.toBe(refreshToken);
    });

    it('should return error for invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@1234'
      });
    });

    it('should send password reset token', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Password reset link sent');

      // Check user has reset token
      const user = await User.findById(testUser._id);
      expect(user.passwordResetToken).toBeDefined();
      expect(user.passwordResetExpires).toBeDefined();
    });

    it('should log password reset request', async () => {
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      const logs = await AuditLog.find({ 
        userId: testUser._id, 
        eventType: 'password_reset_request' 
      });
      expect(logs.length).toBe(1);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let resetToken;

    beforeEach(async () => {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@1234'
      });

      const forgotRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      resetToken = forgotRes.body.resetToken;
    });

    it('should reset password with valid token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'NewTest@1234'
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Password reset successful');

      // Verify can login with new password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'NewTest@1234'
        });

      expect(loginRes.status).toBe(200);
    });

    it('should invalidate all sessions on password reset', async () => {
      // Login to create session
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@1234'
        });

      // Reset password
      await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'NewTest@1234'
        });

      // Check all refresh tokens are cleared
      const user = await User.findById(testUser._id);
      expect(user.refreshTokens.length).toBe(0);
    });

    it('should log password reset completion', async () => {
      await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'NewTest@1234'
        });

      const logs = await AuditLog.find({ 
        userId: testUser._id, 
        eventType: 'password_reset_complete' 
      });
      expect(logs.length).toBe(1);
    });
  });

  describe('POST /api/auth/change-password', () => {
    beforeEach(async () => {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@1234'
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@1234'
        });

      authToken = loginRes.body.data.token;
      refreshToken = loginRes.body.data.refreshToken;
    });

    it('should change password with valid current password', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'Test@1234',
          newPassword: 'NewTest@1234',
          refreshToken
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Password changed successfully');
    });

    it('should return error for incorrect current password', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'NewTest@1234'
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Current password is incorrect');
    });

    it('should return error if new password same as current', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'Test@1234',
          newPassword: 'Test@1234'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('must be different');
    });

    it('should invalidate other sessions but keep current', async () => {
      // Create another session
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@1234'
        });

      // Change password with current refresh token
      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'Test@1234',
          newPassword: 'NewTest@1234',
          refreshToken
        });

      // Check only current refresh token remains
      const user = await User.findById(testUser._id);
      expect(user.refreshTokens.length).toBe(1);
      expect(user.refreshTokens[0].token).toBe(refreshToken);
    });

    it('should log password change', async () => {
      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'Test@1234',
          newPassword: 'NewTest@1234'
        });

      const logs = await AuditLog.find({ 
        userId: testUser._id, 
        eventType: 'password_change' 
      });
      expect(logs.length).toBe(1);
    });
  });

  describe('GET /api/auth/audit-logs', () => {
    beforeEach(async () => {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@1234'
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@1234'
        });

      authToken = loginRes.body.data.token;
    });

    it('should return user audit logs', async () => {
      const res = await request(app)
        .get('/api/auth/audit-logs')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('logs');
      expect(res.body.data).toHaveProperty('suspiciousActivity');
      expect(Array.isArray(res.body.data.logs)).toBe(true);
    });

    it('should detect suspicious activity', async () => {
      // Create multiple failed login attempts
      for (let i = 0; i < 3; i++) {
        await AuditLog.create({
          userId: testUser._id,
          eventType: 'login_failed',
          ipAddress: '192.168.1.7',
          success: false
        });
      }

      const res = await request(app)
        .get('/api/auth/audit-logs')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.body.data.suspiciousActivity.suspicious).toBe(true);
      expect(res.body.data.suspiciousActivity.failedAttempts).toBeGreaterThanOrEqual(3);
    });
  });

  describe('POST /api/auth/logout', () => {
    beforeEach(async () => {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@1234'
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@1234'
        });

      authToken = loginRes.body.data.token;
      refreshToken = loginRes.body.data.refreshToken;
    });

    it('should logout and clear refresh tokens', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logged out successfully');

      // Check refresh token is removed
      const user = await User.findById(testUser._id);
      expect(user.refreshTokens.length).toBe(0);
    });

    it('should log logout event', async () => {
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ refreshToken });

      const logs = await AuditLog.find({ 
        userId: testUser._id, 
        eventType: 'logout' 
      });
      expect(logs.length).toBe(1);
    });
  });
});
