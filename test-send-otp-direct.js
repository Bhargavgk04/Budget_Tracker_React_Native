const API_URL = 'https://budget-tracker-react-native-kjff.onrender.com/api';

async function testSendOTP() {
  console.log('Testing /auth/send-otp endpoint...\n');
  
  const testEmail = 'bhargavkatkam0@gmail.com';
  
  try {
    console.log('Sending request to:', `${API_URL}/auth/send-otp`);
    console.log('Email:', testEmail);
    console.log('');
    
    const response = await fetch(`${API_URL}/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail }),
    });

    console.log('Response Status:', response.status, response.statusText);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('\nRaw Response Body:');
    console.log(text);
    
    if (text) {
      try {
        const data = JSON.parse(text);
        console.log('\nParsed JSON:');
        console.log(JSON.stringify(data, null, 2));
        
        if (data.success) {
          console.log('\n✅ SUCCESS!');
          if (data.otp) {
            console.log('📧 OTP (dev mode):', data.otp);
          }
        } else {
          console.log('\n❌ FAILED:', data.error || data.message);
        }
      } catch (e) {
        console.log('\n⚠️  Response is not JSON');
      }
    } else {
      console.log('\n⚠️  Empty response body');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSendOTP();
