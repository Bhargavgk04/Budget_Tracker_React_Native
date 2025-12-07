const API_URL = 'https://budget-tracker-react-native-kjff.onrender.com/api';

async function diagnoseBackend() {
  console.log('🔍 Diagnosing Backend Issues\n');
  console.log('Backend URL:', API_URL);
  console.log('═'.repeat(60), '\n');

  // Test 1: Health check
  console.log('Test 1: Basic connectivity');
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'test' }),
    });
    console.log('✅ Backend is reachable');
    console.log('   Status:', response.status);
  } catch (error) {
    console.log('❌ Backend not reachable:', error.message);
    return;
  }

  console.log('\n' + '─'.repeat(60) + '\n');

  // Test 2: Send OTP endpoint
  console.log('Test 2: /auth/send-otp endpoint');
  try {
    const response = await fetch(`${API_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bhargavkatkam0@gmail.com' }),
    });
    
    console.log('   Status:', response.status, response.statusText);
    
    if (response.status === 502) {
      console.log('❌ 502 Bad Gateway - Backend crashed or timed out');
      console.log('\n   Possible causes:');
      console.log('   1. Email service (Gmail) connection failed');
      console.log('   2. Database query timed out');
      console.log('   3. Backend process crashed');
      console.log('   4. Memory limit exceeded');
      console.log('\n   Solutions:');
      console.log('   1. Check backend logs on Render dashboard');
      console.log('   2. Verify EMAIL_USER and EMAIL_PASS in backend/.env');
      console.log('   3. Check if user exists in database');
      console.log('   4. Restart backend service on Render');
    } else {
      const text = await response.text();
      if (text) {
        const data = JSON.parse(text);
        console.log('✅ Endpoint working!');
        console.log('   Response:', JSON.stringify(data, null, 2));
      }
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n' + '─'.repeat(60) + '\n');

  // Test 3: Alternative - forgot-password endpoint
  console.log('Test 3: /auth/forgot-password endpoint (old method)');
  try {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bhargavkatkam0@gmail.com' }),
    });
    
    console.log('   Status:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Old endpoint works!');
      console.log('   Response:', JSON.stringify(data, null, 2));
      console.log('\n   💡 Suggestion: Use /auth/forgot-password instead');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n📋 Summary:');
  console.log('   - If 502 on /auth/send-otp: Backend issue, check Render logs');
  console.log('   - If /auth/forgot-password works: Use that endpoint instead');
  console.log('   - Check Render dashboard for backend logs and errors');
  console.log('\n🔗 Render Dashboard:');
  console.log('   https://dashboard.render.com/');
}

diagnoseBackend();
