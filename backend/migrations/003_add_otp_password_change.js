/**
 * Migration: Add OTP fields for password change functionality
 * 
 * This migration adds the following fields to the User schema:
 * - passwordChangeOTP: String - Stores the 6-digit OTP
 * - passwordChangeOTPExpires: Date - Expiration time for OTP
 * - passwordChangeOTPAttempts: Number - Track failed attempts
 */

require('dotenv').config(); // Load environment variables
const mongoose = require('mongoose');
const User = require('../models/User');

async function migrate() {
  try {
    console.log('Starting migration: Add OTP fields for password change...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update all existing users to add the new fields with default values
    const result = await User.updateMany(
      {}, // Match all documents
      {
        $set: {
          passwordChangeOTP: undefined,
          passwordChangeOTPExpires: undefined,
          passwordChangeOTPAttempts: 0
        }
      },
      { upsert: false }
    );

    console.log(`Migration completed. Updated ${result.modifiedCount} users.`);
    
    // Verify the schema by checking one user
    const sampleUser = await User.findOne();
    if (sampleUser) {
      console.log('Sample user schema verification:');
      console.log('- passwordChangeOTP:', sampleUser.passwordChangeOTP);
      console.log('- passwordChangeOTPExpires:', sampleUser.passwordChangeOTPExpires);
      console.log('- passwordChangeOTPAttempts:', sampleUser.passwordChangeOTPAttempts);
    }

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrate };
