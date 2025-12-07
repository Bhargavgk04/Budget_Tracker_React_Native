const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const { setupTestDatabase, teardownTestDatabase } = require('./testUtils');

// Mock nodemailer
jest.mock('nodemailer');
const nodemailer = require('nodemailer');

// Mock createTransport to return a mock transport
nodemailer.createTransport.mockReturnValue({
  sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
});

describe('OTP API Tests', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    await setupTestDatabase();
    
    // Create a test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      isEmailVerified: true
    });
    
    // Get auth token
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    authToken = res.body.token;
  });

  afterAll(async () => {
    await teardownTestDatabase();
    await mongoose.connection.close();
  });

  describe('POST /api/auth/request-password-change-otp', () => {
    it('should send OTP for password change', async () => {
      const res = await request(app)
        .post('/api/auth/request-password-change-otp')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'test@example.com'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('OTP sent to your email');
      
      // Verify email was sent
      expect(nodemailer.createTransport().sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('Password Change OTP')
        })
      );
    });

    it('should return 404 if user not found', async () => {
      const res = await request(app)
        .post('/api/auth/request-password-change-otp')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'nonexistent@example.com'
        });

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/verify-otp-change-password', () => {
    let otp;
    
    beforeEach(async () => {
      // Request OTP first
      const user = await User.findOne({ email: 'test@example.com' });
      otp = user.generatePasswordChangeOTP();
      await user.save();
    });

    it('should verify OTP and change password', async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp-change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'test@example.com',
          otp,
          newPassword: 'newSecurePassword123!'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Password changed successfully');
    });

    it('should return 400 for invalid OTP', async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp-change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'test@example.com',
          otp: 'wrongotp',
          newPassword: 'newSecurePassword123!'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/resend-password-change-otp', () => {
    it('should resend OTP for password change', async () => {
      const res = await request(app)
        .post('/api/auth/resend-password-change-otp')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'test@example.com'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('New OTP sent to your email');
    });
  });
});
