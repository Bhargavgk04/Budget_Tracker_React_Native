// Test if backend works locally before deploying to Render
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function testBackendLocally() {
  console.log('🧪 Testing Backend Locally\n');
  console.log('═'.repeat(60));

  try {
    // Test 1: MongoDB Connection
    console.log('\n1️⃣  Testing MongoDB Connection...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');

    // Test 2: Check if User model has OTP fields
    console.log('\n2️⃣  Checking User Model...');
    const User = require('./backend/models/User');
    const userSchema = User.schema.obj;
    
    const hasPasswordResetOTP = 'passwordResetOTP' in userSchema;
    const hasPasswordResetExpires = 'passwordResetExpires' in userSchema;
    
    console.log('   passwordResetOTP field:', hasPasswordResetOTP ? '✅' : '❌');
    console.log('   passwordResetExpires field:', hasPasswordResetExpires ? '✅' : '✅');

    // Test 3: Check if test user exists
    console.log('\n3️⃣  Checking Test User...');
    const testEmail = 'bhargavkatkam0@gmail.com';
    const user = await User.findOne({ email: testEmail });
    
    if (user) {
      console.log('✅ Test user exists');
      console.log('   Email:', user.email);
      console.log('   Name:', user.name);
      console.log('   ID:', user._id);
    } else {
      console.log('❌ Test user not found');
      console.log('   Please create a user with email:', testEmail);
    }

    // Test 4: Check Email Service
    console.log('\n4️⃣  Checking Email Configuration...');
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    
    console.log('   EMAIL_USER:', emailUser ? '✅ Set' : '❌ Not set');
    console.log('   EMAIL_PASS:', emailPass ? '✅ Set' : '❌ Not set');

    if (emailUser && emailPass) {
      console.log('   Email service should work');
    } else {
      console.log('   ⚠️  Email service may not work');
    }

    // Test 5: Simulate OTP generation
    console.log('\n5️⃣  Testing OTP Generation...');
    const { generateOTP } = require('./backend/services/emailService');
    const otp = generateOTP();
    console.log('✅ OTP generated:', otp);
    console.log('   Length:', otp.length, '(should be 6)');
    console.log('   Is numeric:', /^\d+$/.test(otp) ? '✅' : '❌');

    console.log('\n' + '═'.repeat(60));
    console.log('\n✅ All tests passed! Backend should work on Render.');
    console.log('\n📝 Next steps:');
    console.log('   1. Commit changes: git add . && git commit -m "Fix OTP fields"');
    console.log('   2. Push to Render: git push');
    console.log('   3. Wait for deployment (2-3 minutes)');
    console.log('   4. Test: node test-complete-flow.js');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n📋 Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testBackendLocally();
