const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Friendship = require('../models/Friendship');

describe('Split Validation Integration Tests', () => {
  let authToken;
  let userId;
  let friendId;
  let transactionId;

  beforeAll(async () => {
    // Create test users
    const user = await User.create({
      uid: 'test-user-split-val',
      email: 'splitval@test.com',
      name: 'Test User'
    });
    userId = user._id;

    const friend = await User.create({
      uid: 'test-friend-split-val',
      email: 'friendval@test.com',
      name: 'Test Friend'
    });
    friendId = friend._id;

    // Create friendship
    await Friendship.create({
      user1: userId,
      user2: friendId,
      status: 'accepted'
    });

    // Mock auth token (adjust based on your auth implementation)
    authToken = 'mock-token-' + userId;
  });

  afterAll(async () => {
    await User.deleteMany({ uid: { $in: ['test-user-split-val', 'test-friend-split-val'] } });
    await Transaction.deleteMany({ userId: { $in: [userId, friendId] } });
    await Friendship.deleteMany({ $or: [{ user1: userId }, { user2: userId }] });
  });

  beforeEach(async () => {
    // Create a test transaction
    const transaction = await Transaction.create({
      userId: userId,
      amount: 200,
      category: 'Food',
      description: 'Test transaction',
      type: 'expense',
      date: new Date()
    });
    transactionId = transaction._id;
  });

  afterEach(async () => {
    await Transaction.findByIdAndDelete(transactionId);
  });

  describe('POST /api/transactions/:id/split - Create Split Validation', () => {
    test('should reject split with participant share exceeding total', async () => {
      const splitConfig = {
        splitType: 'custom',
        paidBy: userId,
        participants: [
          { user: userId, share: 50 },
          { user: friendId, share: 250 }
        ]
      };

      const response = await request(app)
        .post(`/api/transactions/${transactionId}/split`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(splitConfig);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('cannot exceed transaction amount');
    });

    test('should reject split with negative share', async () => {
      const splitConfig = {
        splitType: 'custom',
        paidBy: userId,
        participants: [
          { user: userId, share: 250 },
          { user: friendId, share: -50 }
        ]
      };

      const response = await request(app)
        .post(`/api/transactions/${transactionId}/split`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(splitConfig);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('non-negative');
    });

    test('should reject percentage split with percentage > 100%', async () => {
      const splitConfig = {
        splitType: 'percentage',
        paidBy: userId,
        participants: [
          { user: userId, share: 100, percentage: 50 },
          { user: friendId, share: 220, percentage: 110 }
        ]
      };

      const response = await request(app)
        .post(`/api/transactions/${transactionId}/split`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(splitConfig);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('percentage cannot exceed 100%');
    });

    test('should accept valid split with shares within bounds', async () => {
      const splitConfig = {
        splitType: 'custom',
        paidBy: userId,
        participants: [
          { user: userId, share: 100 },
          { user: friendId, share: 100 }
        ]
      };

      const response = await request(app)
        .post(`/api/transactions/${transactionId}/split`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(splitConfig);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.splitInfo.isShared).toBe(true);
    });

    test('should accept split where one share equals total (edge case)', async () => {
      const splitConfig = {
        splitType: 'custom',
        paidBy: userId,
        participants: [
          { user: userId, share: 200 }
        ]
      };

      const response = await request(app)
        .post(`/api/transactions/${transactionId}/split`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(splitConfig);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/transactions/:id/split - Update Split Validation', () => {
    beforeEach(async () => {
      // Create initial valid split
      const transaction = await Transaction.findById(transactionId);
      transaction.splitInfo = {
        isShared: true,
        paidBy: userId,
        splitType: 'custom',
        participants: [
          { user: userId, share: 100, settled: true, settledAt: new Date() },
          { user: friendId, share: 100, settled: false }
        ]
      };
      await transaction.save();
    });

    test('should reject update with participant share exceeding total', async () => {
      const updateConfig = {
        splitType: 'custom',
        participants: [
          { user: userId, share: 50 },
          { user: friendId, share: 250 }
        ]
      };

      const response = await request(app)
        .put(`/api/transactions/${transactionId}/split`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateConfig);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('cannot exceed transaction amount');
    });

    test('should accept valid update with shares within bounds', async () => {
      const updateConfig = {
        splitType: 'custom',
        participants: [
          { user: userId, share: 120 },
          { user: friendId, share: 80 }
        ]
      };

      const response = await request(app)
        .put(`/api/transactions/${transactionId}/split`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateConfig);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.splitInfo.participants[0].share).toBe(120);
      expect(response.body.data.splitInfo.participants[1].share).toBe(80);
    });
  });

  describe('Transaction amount change re-validation', () => {
    test('should validate split when transaction amount is modified', async () => {
      // Create split
      const transaction = await Transaction.findById(transactionId);
      transaction.splitInfo = {
        isShared: true,
        paidBy: userId,
        splitType: 'custom',
        participants: [
          { user: userId, share: 100, settled: true, settledAt: new Date() },
          { user: friendId, share: 100, settled: false }
        ]
      };
      await transaction.save();

      // Modify transaction amount to be less than existing shares
      transaction.amount = 150;
      
      // Validation should catch this if re-validated
      const validation = require('../services/SplitService').validateSplit(
        transaction.amount,
        transaction.splitInfo.splitType,
        transaction.splitInfo.participants
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('must sum to transaction amount'))).toBe(true);
    });
  });
});
