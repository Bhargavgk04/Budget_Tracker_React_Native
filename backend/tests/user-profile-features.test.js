/**
 * Test Suite: User Profile Features
 * Tests for enhanced user model with 2FA and profile features
 * Requirements: 1.9, 1.11, 1.12
 */

const mongoose = require('mongoose');
const User = require('../models/User');

jest.setTimeout(30000);

describe('User Profile Features', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb+srv://bhargavkatkam0_db_user:Bhargavk%401104@budget-tracker-prod.fd2ctnp.mongodb.net/', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterAll(async () => {
    // Clean up and close connection
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  afterEach(async () => {
    // Clean up after each test
    await User.deleteMany({});
  });

  describe('Profile Picture', () => {
    test('should create user with default null profile picture', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@1234'
      });

      expect(user.profilePicture).toBeNull();
    });

    test('should allow setting profile picture URL', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@1234',
        profilePicture: 'https://example.com/profile.jpg'
      });

      expect(user.profilePicture).toBe('https://example.com/profile.jpg');
    });
  });

  describe('2FA Features', () => {
    test('should create user with 2FA disabled by default', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@1234'
      });

      expect(user.twoFactorEnabled).toBe(false);
      expect(user.twoFactorSecret).toBeNull();
      expect(user.twoFactorBackupCodes).toEqual([]);
    });

    test('should enable 2FA with secret', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@1234'
      });

      const secret = 'JBSWY3DPEHPK3PXP';
      await user.enable2FA(secret);

      const updatedUser = await User.findById(user._id).select('+twoFactorSecret');
      expect(updatedUser.twoFactorEnabled).toBe(true);
      expect(updatedUser.twoFactorSecret).toBe(secret);
    });

    test('should disable 2FA and clear secret', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@1234'
      });

      await user.enable2FA('JBSWY3DPEHPK3PXP');
      await user.disable2FA();

      const updatedUser = await User.findById(user._id).select('+twoFactorSecret');
      expect(updatedUser.twoFactorEnabled).toBe(false);
      expect(updatedUser.twoFactorSecret).toBeNull();
      expect(updatedUser.twoFactorBackupCodes).toEqual([]);
    });

    test('should generate 10 backup codes', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@1234'
      });

      const codes = user.generateBackupCodes();

      expect(codes).toHaveLength(10);
      expect(user.twoFactorBackupCodes).toHaveLength(10);
      
      // Verify all codes are 8 characters (4 bytes hex)
      codes.forEach(code => {
        expect(code).toHaveLength(8);
        expect(code).toMatch(/^[A-F0-9]{8}$/);
      });
    });

    test('should verify and mark backup code as used', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@1234'
      });

      const codes = user.generateBackupCodes();
      const firstCode = codes[0];

      // Verify code
      const isValid = user.verifyBackupCode(firstCode);
      expect(isValid).toBe(true);

      // Check that code is marked as used
      const usedCode = user.twoFactorBackupCodes.find(bc => bc.code === firstCode);
      expect(usedCode.used).toBe(true);

      // Try to use same code again
      const isValidAgain = user.verifyBackupCode(firstCode);
      expect(isValidAgain).toBe(false);
    });

    test('should not verify invalid backup code', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@1234'
      });

      user.generateBackupCodes();

      const isValid = user.verifyBackupCode('INVALID1');
      expect(isValid).toBe(false);
    });
  });

  describe('Currency Support', () => {
    test('should support extended currency list', async () => {
      const currencies = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NZD', 'MXN', 'SGD', 'HKD', 'NOK', 'KRW', 'TRY', 'RUB', 'BRL', 'ZAR', 'DKK', 'PLN', 'THB', 'MYR'];

      for (const currency of currencies) {
        const user = await User.create({
          name: `Test User ${currency}`,
          email: `test-${currency.toLowerCase()}@example.com`,
          password: 'Test@1234',
          currency
        });

        expect(user.currency).toBe(currency);
        await User.deleteOne({ _id: user._id });
      }
    });

    test('should default to INR if not specified', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@1234'
      });

      expect(user.currency).toBe('INR');
    });
  });

  describe('Biometric Authentication', () => {
    test('should have biometric disabled by default', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@1234'
      });

      expect(user.preferences.biometric).toBe(false);
    });

    test('should allow enabling biometric authentication', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@1234',
        preferences: {
          biometric: true
        }
      });

      expect(user.preferences.biometric).toBe(true);
    });
  });

  describe('Account Creation Date and Last Login', () => {
    test('should automatically set createdAt timestamp', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@1234'
      });

      expect(user.createdAt).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    test('should track last login date', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@1234'
      });

      const loginDate = new Date();
      user.lastLogin = loginDate;
      await user.save();

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.lastLogin).toBeDefined();
      expect(updatedUser.lastLogin.getTime()).toBeCloseTo(loginDate.getTime(), -2);
    });
  });
});
