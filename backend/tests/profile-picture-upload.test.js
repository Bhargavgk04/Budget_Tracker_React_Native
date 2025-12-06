/**
 * Test Suite: Profile Picture Upload
 * Tests for profile picture upload, delete, and image processing
 * Requirements: 1.9
 */

const request = require('supertest');
const path = require('path');
const fs = require('fs').promises;
const app = require('../server');
const User = require('../models/User');
const ImageProcessor = require('../utils/imageProcessor');

describe('Profile Picture Upload', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Create test user and get auth token
    const testUser = await User.create({
      name: 'Test User',
      email: 'profiletest@example.com',
      password: 'Test@1234'
    });

    userId = testUser._id;
    authToken = testUser.getSignedJwtToken();
  });

  afterAll(async () => {
    // Clean up test user
    await User.deleteMany({ email: 'profiletest@example.com' });
    
    // Clean up uploaded test images
    try {
      const uploadsDir = path.join(__dirname, '../uploads/profile-pictures');
      const files = await fs.readdir(uploadsDir);
      for (const file of files) {
        if (file.includes('test')) {
          await fs.unlink(path.join(uploadsDir, file));
        }
      }
    } catch (error) {
      // Directory might not exist, ignore
    }
  });

  describe('POST /api/user/profile/picture', () => {
    test('should upload profile picture successfully', async () => {
      // Create a test image buffer (1x1 pixel PNG)
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );

      const response = await request(app)
        .post('/api/user/profile/picture')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('profilePicture', testImageBuffer, 'test.png')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profilePicture).toBeDefined();
      expect(response.body.data.profilePicture).toContain('/uploads/profile-pictures/');
      expect(response.body.message).toBe('Profile picture uploaded successfully');
    });

    test('should fail without authentication', async () => {
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );

      const response = await request(app)
        .post('/api/user/profile/picture')
        .attach('profilePicture', testImageBuffer, 'test.png')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test('should fail without file upload', async () => {
      const response = await request(app)
        .post('/api/user/profile/picture')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Please upload an image file');
    });

    test('should replace existing profile picture', async () => {
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );

      // Upload first image
      const firstResponse = await request(app)
        .post('/api/user/profile/picture')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('profilePicture', testImageBuffer, 'test1.png')
        .expect(200);

      const firstImageUrl = firstResponse.body.data.profilePicture;

      // Upload second image
      const secondResponse = await request(app)
        .post('/api/user/profile/picture')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('profilePicture', testImageBuffer, 'test2.png')
        .expect(200);

      const secondImageUrl = secondResponse.body.data.profilePicture;

      // URLs should be different
      expect(secondImageUrl).not.toBe(firstImageUrl);
    });
  });

  describe('DELETE /api/user/profile/picture', () => {
    test('should delete profile picture successfully', async () => {
      // First upload a picture
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );

      await request(app)
        .post('/api/user/profile/picture')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('profilePicture', testImageBuffer, 'test.png')
        .expect(200);

      // Then delete it
      const response = await request(app)
        .delete('/api/user/profile/picture')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile picture deleted successfully');

      // Verify user profile picture is null
      const user = await User.findById(userId);
      expect(user.profilePicture).toBeNull();
    });

    test('should fail when no profile picture exists', async () => {
      // Ensure no profile picture
      await User.findByIdAndUpdate(userId, { profilePicture: null });

      const response = await request(app)
        .delete('/api/user/profile/picture')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No profile picture to delete');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .delete('/api/user/profile/picture')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Image Processing', () => {
    test('should process and resize image to 500x500', async () => {
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );

      const result = await ImageProcessor.processProfilePicture(
        testImageBuffer,
        'test-image.png'
      );

      expect(result.filename).toBeDefined();
      expect(result.url).toContain('/uploads/profile-pictures/');
      expect(result.dimensions.width).toBe(500);
      expect(result.dimensions.height).toBe(500);

      // Clean up
      await ImageProcessor.deleteProfilePicture(result.filename);
    });

    test('should validate image buffer', async () => {
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );

      const isValid = await ImageProcessor.validateImage(testImageBuffer);
      expect(isValid).toBe(true);
    });

    test('should reject invalid image buffer', async () => {
      const invalidBuffer = Buffer.from('not an image');

      await expect(
        ImageProcessor.validateImage(invalidBuffer)
      ).rejects.toThrow();
    });
  });
});
