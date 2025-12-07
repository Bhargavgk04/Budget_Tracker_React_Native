const API_URL = 'https://budget-tracker-react-native-kjff.onrender.com/api';

async function wakeBackend() {
  console.log('🚀 Waking up backend...');
  console.log('URL:', API_URL);
  console.log('\nThis may take 30-60 seconds on Render free tier...\n');

  const startTime = Date.now();

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'test'
      }),
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`✅ Backend responded in ${elapsed} seconds`);
    console.log('Status:', response.status, response.statusText);
    
    if (response.status === 502) {
      console.log('\n⚠️  Backend is still waking up. Please wait and try again.');
    } else {
      console.log('\n✅ Backend is awake and ready!');
      console.log('\nYou can now:');
      console.log('1. Test forgot password flow: node test-forgot-password-flow.js');
      console.log('2. Use the mobile app');
    }

  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ Error after ${elapsed} seconds:`, error.message);
    
    if (error.message.includes('fetch failed')) {
      console.log('\n⚠️  Network error. Please check:');
      console.log('1. Your internet connection');
      console.log('2. Backend URL is correct');
      console.log('3. Render service is running');
    }
  }
}

wakeBackend();
