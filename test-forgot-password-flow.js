const API_URL = 'https://budget-tracker-react-native-kjff.onrender.com/api';
const TEST_EMAIL = 'bhargavkatkam0@gmail.com';

async function testForgotPasswordFlow() {
  console.log('=== Testing Forgot Password Flow ===\n');

  try {
    // Step 1: Send OTP
    console.log('Step 1: Sending OTP to', TEST_EMAIL);
    console.log('Waking up backend (this may take 30-60 seconds)...\n');
    
    const otpResponse = await fetch(`${API_URL}/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: TEST_EMAIL }),
    });

    console.log('OTP Response Status:', otpResponse.status, otpResponse.statusText);
    
    const responseText = await otpResponse.text();
    console.log('Raw Response:', responseText);
    
    let otpData;
    try {
      otpData = JSON.parse(responseText);
      console.log('OTP Response:', JSON.stringify(otpData, null, 2));
    } catch (e) {
      console.error('Failed to parse JSON response');
      return;
    }

    if (!otpResponse.ok) {
      console.error('❌ Failed to send OTP');
      return;
    }

    console.log('✅ OTP sent successfully!');
    
    // In development mode, the OTP is returned in the response
    if (otpData.otp) {
      console.log('\n📧 OTP Code (dev mode):', otpData.otp);
      console.log('\nNext steps:');
      console.log('1. Enter this OTP in the app');
      console.log('2. The app will call /auth/verify-otp');
      console.log('3. Then call /auth/reset-password-otp with new password');
    } else {
      console.log('\n📧 Check your email for the OTP code');
    }

    console.log('\n=== Test Complete ===');
    console.log('\nAPI Endpoints being used:');
    console.log('1. POST /auth/send-otp - Send OTP to email');
    console.log('2. POST /auth/verify-otp - Verify OTP code');
    console.log('3. POST /auth/reset-password-otp - Reset password with OTP');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('ENOTFOUND') || error.message.includes('fetch failed')) {
      console.error('\n⚠️  Backend might be sleeping (Render free tier)');
      console.error('Try accessing the URL in browser first to wake it up:');
      console.error(API_URL);
    }
  }
}

// Run the test
testForgotPasswordFlow();
