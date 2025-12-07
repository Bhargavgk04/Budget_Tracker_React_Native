/**
 * Email Service Test Script
 * Run this to verify email configuration before testing the full flow
 * 
 * Usage: node test-email.js your-email@example.com
 */

require('dotenv').config();
const emailService = require('./services/EmailService');

async function testEmailService() {
  const testEmail = process.argv[2];
  
  if (!testEmail) {
    console.error('❌ Error: Please provide an email address');
    console.log('Usage: node test-email.js your-email@example.com');
    process.exit(1);
  }

  console.log('🔧 Testing Email Service Configuration...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`   EMAIL_SERVICE: ${process.env.EMAIL_SERVICE || 'Not set'}`);
  console.log(`   EMAIL_USER: ${process.env.EMAIL_USER || 'Not set'}`);
  console.log(`   EMAIL_PASS: ${process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'Not set'}`);
  console.log('');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Error: EMAIL_USER and EMAIL_PASS must be set in .env file');
    process.exit(1);
  }

  // Test connection
  console.log('🔌 Testing SMTP Connection...');
  const connectionOk = await emailService.verifyConnection();
  
  if (!connectionOk) {
    console.error('❌ Connection failed. Please check your email credentials.');
    process.exit(1);
  }

  // Send test OTP email
  console.log(`📧 Sending test OTP email to ${testEmail}...`);
  const testOTP = '123456';
  
  try {
    const result = await emailService.sendPasswordResetOTP(testEmail, testOTP, 'Test User');
    
    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log('');
      console.log('📬 Please check your inbox (and spam folder) for the test email.');
      console.log('   The test OTP is: 123456');
    } else {
      console.error('❌ Failed to send test email');
    }
  } catch (error) {
    console.error('❌ Error sending test email:', error.message);
    process.exit(1);
  }

  // Send test confirmation email
  console.log('');
  console.log('📧 Sending test confirmation email...');
  
  try {
    const result = await emailService.sendPasswordChangeConfirmation(testEmail, 'Test User');
    
    if (result.success) {
      console.log('✅ Confirmation email sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
    } else {
      console.log('⚠️  Confirmation email failed (non-critical)');
    }
  } catch (error) {
    console.log('⚠️  Confirmation email error (non-critical):', error.message);
  }

  console.log('');
  console.log('✅ Email service test completed!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Check your email inbox');
  console.log('2. If emails received, the service is working correctly');
  console.log('3. If not received, check:');
  console.log('   - Spam/junk folder');
  console.log('   - Email credentials in .env');
  console.log('   - Gmail app password (not regular password)');
  console.log('   - 2FA enabled on Gmail account');
  
  process.exit(0);
}

// Run test
testEmailService().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
