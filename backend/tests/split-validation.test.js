const SplitService = require('../services/SplitService');

describe('SplitService Validation - Individual Share Limits', () => {
  describe('Share exceeding total amount', () => {
    test('should reject when single participant share exceeds total', () => {
      const amount = 200;
      const splitType = 'custom';
      const participants = [
        { user: 'user1', share: 250 }
      ];

      const result = SplitService.validateSplit(amount, splitType, participants);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Participant 1: share (250.00) cannot exceed transaction amount (200.00)');
    });

    test('should reject when one of multiple participants has share exceeding total', () => {
      const amount = 200;
      const splitType = 'custom';
      const participants = [
        { user: 'user1', share: 50 },
        { user: 'user2', share: 250 },
        { user: 'user3', share: 50 }
      ];

      const result = SplitService.validateSplit(amount, splitType, participants);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Participant 2'))).toBe(true);
      expect(result.errors.some(e => e.includes('250.00'))).toBe(true);
    });

    test('should accept when share equals total amount', () => {
      const amount = 200;
      const splitType = 'custom';
      const participants = [
        { user: 'user1', share: 200 }
      ];

      const result = SplitService.validateSplit(amount, splitType, participants);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Negative share validation', () => {
    test('should reject negative share values', () => {
      const amount = 200;
      const splitType = 'custom';
      const participants = [
        { user: 'user1', share: -50 }
      ];

      const result = SplitService.validateSplit(amount, splitType, participants);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('share must be a non-negative number'))).toBe(true);
    });
  });

  describe('Percentage validation', () => {
    test('should reject percentage exceeding 100%', () => {
      const amount = 200;
      const splitType = 'percentage';
      const participants = [
        { user: 'user1', share: 220, percentage: 110 }
      ];

      const result = SplitService.validateSplit(amount, splitType, participants);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('percentage cannot exceed 100%'))).toBe(true);
    });

    test('should reject negative percentage', () => {
      const amount = 200;
      const splitType = 'percentage';
      const participants = [
        { user: 'user1', share: 0, percentage: -10 }
      ];

      const result = SplitService.validateSplit(amount, splitType, participants);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('percentage cannot be negative'))).toBe(true);
    });

    test('should accept valid percentage split', () => {
      const amount = 200;
      const splitType = 'percentage';
      const participants = [
        { user: 'user1', share: 100, percentage: 50 },
        { user: 'user2', share: 100, percentage: 50 }
      ];

      const result = SplitService.validateSplit(amount, splitType, participants);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Valid shares within bounds', () => {
    test('should accept valid custom split', () => {
      const amount = 200;
      const splitType = 'custom';
      const participants = [
        { user: 'user1', share: 80 },
        { user: 'user2', share: 70 },
        { user: 'user3', share: 50 }
      ];

      const result = SplitService.validateSplit(amount, splitType, participants);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should accept share at boundary (0)', () => {
      const amount = 200;
      const splitType = 'custom';
      const participants = [
        { user: 'user1', share: 200 },
        { user: 'user2', share: 0 }
      ];

      const result = SplitService.validateSplit(amount, splitType, participants);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Multiple validation errors', () => {
    test('should report all validation errors when multiple participants have invalid shares', () => {
      const amount = 200;
      const splitType = 'custom';
      const participants = [
        { user: 'user1', share: 250 },
        { user: 'user2', share: 300 },
        { user: 'user3', share: 50 }
      ];

      const result = SplitService.validateSplit(amount, splitType, participants);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors.some(e => e.includes('Participant 1'))).toBe(true);
      expect(result.errors.some(e => e.includes('Participant 2'))).toBe(true);
    });
  });
});
