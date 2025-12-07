const mongoose = require('mongoose');
const User = require('./models/User');
const emailService = require('./services/emailService');
require('dotenv').config();

// Test OTP functionality
async function testOTPFunctionality() {
  try {
    console.log('🧪 Testing OTP Functionality...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Find or create test user
    let testUser = await User.findOne({ email: 'test@example.com' });
    
    if (!testUser) {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: true
      });
      console.log('✅ Created test user');
    } else {
      console.log('✅ Found existing test user');
    }
    
    // Test 1: Generate OTP
    console.log('\n📧 Test 1: Generating OTP...');
    const otp = testUser.generatePasswordChangeOTP();
    await testUser.save();
    console.log(`✅ Generated OTP: ${otp}`);
    
    // Test 2: Verify OTP
    console.log('\n🔍 Test 2: Verifying OTP...');
    const verificationResult = testUser.verifyPasswordChangeOTP(otp);
    console.log(`✅ OTP verification: ${verificationResult.valid ? 'VALID' : 'INVALID'}`);
    if (!verificationResult.valid && verificationResult.error) {
      console.log(`   Error: ${verificationResult.error}`);
    }
    await testUser.save();
    
    // Regenerate OTP for remaining tests (since verification clears it)
    console.log('\n🔄 Regenerating OTP for remaining tests...');
    const newOtp = testUser.generatePasswordChangeOTP();
    await testUser.save();
    console.log(`✅ New OTP generated: ${newOtp}`);
    
    // Test 3: Check if OTP is expired
    console.log('\n⏰ Test 3: Checking OTP expiration...');
    const isExpired = testUser.isPasswordChangeOTPExpired();
    console.log(`✅ OTP expired: ${isExpired ? 'YES' : 'NO'}`);
    
    // Test 4: Send OTP email
    console.log('\n📨 Test 4: Sending OTP email...');
    try {
      await emailService.sendOTPEmail(
        testUser.email,
        otp,
        'Password Change',
        testUser.name
      );
      console.log('✅ OTP email sent successfully');
    } catch (emailError) {
      console.log('❌ Email sending failed:', emailError.message);
    }
    
    // Test 5: Check OTP attempts
    console.log('\n🔄 Test 5: Testing OTP attempts...');
    console.log(`Current attempts: ${testUser.passwordChangeOTPAttempts}`);
    
    // Simulate failed attempts
    for (let i = 0; i < 2; i++) {
      testUser.incrementPasswordChangeOTPAttempts();
      await testUser.save();
      console.log(`Attempt ${i + 1}: ${testUser.passwordChangeOTPAttempts}`);
    }
    
    // Test 6: Check if attempts exceeded
    console.log('\n🚫 Test 6: Checking attempt limits...');
    const attemptsExceeded = testUser.isPasswordChangeOTPAttemptsExceeded();
    console.log(`✅ Attempts exceeded: ${attemptsExceeded ? 'YES' : 'NO'}`);
    
    // Test 7: Clear OTP
    console.log('\n🧹 Test 7: Clearing OTP...');
    testUser.clearPasswordChangeOTP();
    await testUser.save();
    console.log('✅ OTP cleared');
    
    console.log('\n🎉 All OTP tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the test
testOTPFunctionality();
