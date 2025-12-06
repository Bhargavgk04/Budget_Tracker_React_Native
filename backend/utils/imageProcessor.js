/**
 * Image Processing Utility
 * Handles image compression, resizing, and optimization
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

class ImageProcessor {
  /**
   * Process and compress profile picture
   * @param {Buffer} imageBuffer - Image buffer from multer
   * @param {string} filename - Desired filename
   * @returns {Promise<Object>} - Processed image info
   */
  static async processProfilePicture(imageBuffer, filename) {
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../uploads/profile-pictures');
      await fs.mkdir(uploadsDir, { recursive: true });

      // Generate unique filename
      const timestamp = Date.now();
      const uniqueFilename = `${timestamp}-${filename}`;
      const filepath = path.join(uploadsDir, uniqueFilename);

      // Process image: resize to 500x500, compress, and convert to JPEG
      await sharp(imageBuffer)
        .resize(500, 500, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({
          quality: 85,
          progressive: true
        })
        .toFile(filepath);

      // Get file stats
      const stats = await fs.stat(filepath);

      return {
        filename: uniqueFilename,
        filepath: filepath,
        url: `/uploads/profile-pictures/${uniqueFilename}`,
        size: stats.size,
        dimensions: { width: 500, height: 500 }
      };
    } catch (error) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  /**
   * Delete profile picture file
   * @param {string} filename - Filename to delete
   */
  static async deleteProfilePicture(filename) {
    try {
      const filepath = path.join(__dirname, '../uploads/profile-pictures', filename);
      await fs.unlink(filepath);
      return true;
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      return false;
    }
  }

  /**
   * Generate thumbnail from image
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} filename - Desired filename
   * @returns {Promise<Object>} - Thumbnail info
   */
  static async generateThumbnail(imageBuffer, filename) {
    try {
      const uploadsDir = path.join(__dirname, '../uploads/thumbnails');
      await fs.mkdir(uploadsDir, { recursive: true });

      const timestamp = Date.now();
      const uniqueFilename = `thumb-${timestamp}-${filename}`;
      const filepath = path.join(uploadsDir, uniqueFilename);

      // Create 150x150 thumbnail
      await sharp(imageBuffer)
        .resize(150, 150, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({
          quality: 80
        })
        .toFile(filepath);

      return {
        filename: uniqueFilename,
        url: `/uploads/thumbnails/${uniqueFilename}`
      };
    } catch (error) {
      throw new Error(`Thumbnail generation failed: ${error.message}`);
    }
  }

  /**
   * Validate image buffer
   * @param {Buffer} imageBuffer - Image buffer to validate
   * @returns {Promise<boolean>}
   */
  static async validateImage(imageBuffer) {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      
      // Check if it's a valid image
      if (!metadata.format) {
        return false;
      }

      // Check dimensions (minimum 100x100)
      if (metadata.width < 100 || metadata.height < 100) {
        throw new Error('Image dimensions must be at least 100x100 pixels');
      }

      return true;
    } catch (error) {
      throw new Error(`Image validation failed: ${error.message}`);
    }
  }
}

module.exports = ImageProcessor;
