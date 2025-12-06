#!/usr/bin/env node

/**
 * Test MongoDB Connection
 * Run this script to verify your database connection is working
 */

require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 Testing MongoDB Connection...\n');

// Check if MONGODB_URI is set
if (!process.env.MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in .env file');
  process.exit(1);
}

console.log('📝 Connection String:', process.env.MONGODB_URI.replace(/:[^:@]+@/, ':****@'));
console.log('⏳ Connecting...\n');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ Successfully connected to MongoDB!');
  console.log('📊 Database:', mongoose.connection.db.databaseName);
  console.log('🌐 Host:', mongoose.connection.host);
  
  // List collections
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('\n📁 Collections:');
  if (collections.length === 0) {
    console.log('   (No collections yet - they will be created when you add data)');
  } else {
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
  }
  
  console.log('\n✨ Database connection is working perfectly!');
  console.log('🚀 You can now start the server with: npm run dev\n');
  
  process.exit(0);
})
.catch((error) => {
  console.error('❌ Connection failed!');
  console.error('\n📋 Error details:');
  console.error(error.message);
  
  console.log('\n💡 Troubleshooting tips:');
  console.log('   1. Check your MongoDB Atlas credentials');
  console.log('   2. Ensure your IP address is whitelisted in MongoDB Atlas');
  console.log('   3. Verify the connection string format');
  console.log('   4. Check if MongoDB Atlas cluster is running');
  
  process.exit(1);
});

// Handle connection errors
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('❌ Connection timeout - taking too long to connect');
  console.log('💡 Check your internet connection and MongoDB Atlas status');
  process.exit(1);
}, 10000);
