import { SplitService } from '../SplitService';

describe('SplitService Validation - Individual Share Limits', () => {
  describe('Share exceeding total amount', () => {
    test('should reject when single participant share exceeds total', () => {
      const amount = 200;
      const splitType = 'custom';
      const participants = [
        { userId: 'user1', name: 'Alice', share: 250 }
      ];

      const result = SplitService.validateSplit(amount, splitType, participants);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Alice: Share (₹250.00) cannot exceed total amount (₹200.00)');
    });

    test('should reject when one of multiple participants has share exceeding total', () => {
      const amount = 200;
      const splitType = 'custom';
      const participants = [
        { userId: 'user1', name: 'Alice', share: 50 },
        { userId: 'user2', name: 'Bob', share: 250 },
        { userId: 'user3', name: 'Charlie', share: 50 }
      ];

      const result = SplitService.validateSplit(amount, splitType, participants);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Bob'))).toBe(true);
      expect(result.errors.some(e => e.includes('250.00'))).toBe(true);
    });

    test('should accept when share equals total amount', () => {
      const amount = 200;
      const splitType = 'custom';
      const participants = [
        { userId: 'user1', name: 'Alice', share: 200 }
      ];

      const result = SplitService.validateSplit(amount, splitType, participants);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should use fallback name when participant name not provided', () => {
      const amount = 200;
      const splitType = 'custom';
      const participants = [
        { userId: 'user1', share: 250 }
      ];

      const result = SplitService.validateSplit(amount, splitType, participants);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Participant 1'))).toBe(true);
    });
  });

  describe('Negative share validation', () => {
    test('should reject negative share values', () => {
      const amount = 200;
      const splitType = 'custom';
      const participants = [
        { userId: 'user1', name: 'Alice', share: -50 }
      ];

      const result = SplitService.validateSplit(amount, splitType, participants);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Alice: Share cannot be negative');
    });
  });

  describe('Percentage validation', () => {
    test('should reject percentage exceeding 100%', () => {
      const amount = 200;
      const splitType = 'percentage';
      const participants = [
        { userId: 'user1', name: 'Alice', share: 220, percentage: 110 }
      ];

      const result = SplitService.validateSplit(amount, splitType, participants);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Alice: Percentage cannot exceed 100%');
    });

    test('should reject negative percentage', () => {
      const amount = 200;
      const splitType = 'percentage';
      const participants = [
        { userId: 'user1', name: 'Alice', share: 0, percentage: -10 }
      ];

      const result = SplitService.validateSplit(amount, splitType, participants);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Alice: Percentage cannot be negative');
    });

    test('should accept valid percentage split', () => {
      const amount = 200;
      const splitType = 'percentage';
      const participants = [
        { userId: 'user1', name: 'Alice', share: 100, percentage: 50 },
        { userId: 'user2', name: 'Bob', share: 100, percentage: 50 }
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
        { userId: 'user1', name: 'Alice', share: 80 },
        { userId: 'user2', name: 'Bob', share: 70 },
        { userId: 'user3', name: 'Charlie', share: 50 }
      ];

      const result = SplitService.validateSplit(amount, splitType, participants);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should accept share at boundary (0)', () => {
      const amount = 200;
      const splitType = 'custom';
      const participants = [
        { userId: 'user1', name: 'Alice', share: 200 },
        { userId: 'user2', name: 'Bob', share: 0 }
      ];

      const result = SplitService.validateSplit(amount, splitType, participants);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Participant name in error messages', () => {
    test('should include participant name in error messages', () => {
      const amount = 200;
      const splitType = 'custom';
      const participants = [
        { userId: 'user1', name: 'Alice', share: 250 }
      ];

      const result = SplitService.validateSplit(amount, splitType, participants);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Alice');
    });

    test('should show valid range in error message', () => {
      const amount = 200;
      const splitType = 'custom';
      const participants = [
        { userId: 'user1', name: 'Alice', share: 250 }
      ];

      const result = SplitService.validateSplit(amount, splitType, participants);
      
      expect(result.errors[0]).toContain('₹200.00');
      expect(result.errors[0]).toContain('₹250.00');
    });
  });

  describe('Multiple validation errors', () => {
    test('should report all validation errors when multiple participants have invalid shares', () => {
      const amount = 200;
      const splitType = 'custom';
      const participants = [
        { userId: 'user1', name: 'Alice', share: 250 },
        { userId: 'user2', name: 'Bob', share: 300 },
        { userId: 'user3', name: 'Charlie', share: 50 }
      ];

      const result = SplitService.validateSplit(amount, splitType, participants);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors.some(e => e.includes('Alice'))).toBe(true);
      expect(result.errors.some(e => e.includes('Bob'))).toBe(true);
    });
  });
});
