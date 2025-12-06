/**
 * Migration: Add Profile Features to User Model
 * 
 * This migration adds the following fields to existing users:
 * - twoFactorEnabled (default: false)
 * - twoFactorSecret (default: null)
 * - twoFactorBackupCodes (default: [])
 * - Expands currency enum to support 20+ currencies
 * 
 * Requirements: 1.9, 1.11, 1.12
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('../models/User');

const runMigration = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');
    console.log('Starting migration: Add Profile Features...');

    // Update all users to add new fields if they don't exist
    const result = await User.updateMany(
      {
        $or: [
          { twoFactorEnabled: { $exists: false } },
          { twoFactorSecret: { $exists: false } },
          { twoFactorBackupCodes: { $exists: false } }
        ]
      },
      {
        $set: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorBackupCodes: []
        }
      }
    );

    console.log(`Migration completed successfully!`);
    console.log(`Updated ${result.modifiedCount} users`);
    console.log(`Matched ${result.matchedCount} users`);

    // Verify migration
    const usersWithNewFields = await User.countDocuments({
      twoFactorEnabled: { $exists: true }
    });

    console.log(`\nVerification: ${usersWithNewFields} users now have 2FA fields`);

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('Migration failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
