#!/usr/bin/env node

/**
 * Startup script for Budget Tracker Backend
 * This script checks environment variables and starts the server
 */

const fs = require('fs');
const path = require('path');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ Error: .env file not found!');
  console.log('📝 Please create a .env file in the backend directory.');
  console.log('💡 You can copy .env.example and update the values.');
  process.exit(1);
}

// Load environment variables
require('dotenv').config({ path: envPath });

// Check required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Error: Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.log('\n📝 Please update your .env file with these variables.');
  process.exit(1);
}

// Warn about default secrets in production
if (process.env.NODE_ENV === 'production') {
  if (process.env.JWT_SECRET.includes('change-this') || 
      process.env.JWT_REFRESH_SECRET.includes('change-this')) {
    console.error('⚠️  WARNING: You are using default JWT secrets in production!');
    console.error('   Please change JWT_SECRET and JWT_REFRESH_SECRET in your .env file.');
    process.exit(1);
  }
}

console.log('✅ Environment variables loaded successfully');
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🚀 Starting server on port ${process.env.PORT || 3000}...`);
console.log('');

// Start the server
require('./server.js');
