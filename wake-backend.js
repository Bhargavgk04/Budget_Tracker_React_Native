#!/usr/bin/env node

/**
 * Wake up Render backend from sleep
 * Run this before using the app if backend has been idle
 */

const https = require('https');

const BACKEND_URL = 'https://budget-tracker-react-native-kjff.onrender.com';

console.log('🔄 Waking up backend...');
console.log(`📡 Pinging: ${BACKEND_URL}/health`);

const startTime = Date.now();

https.get(`${BACKEND_URL}/health`, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    const duration = Date.now() - startTime;
    
    try {
      const response = JSON.parse(data);
      
      if (response.status === 'OK') {
        console.log(`✅ Backend is awake! (${duration}ms)`);
        console.log(`📊 Database: ${response.database}`);
        console.log(`⏱️  Uptime: ${Math.floor(response.uptime)}s`);
        console.log('\n🎉 Ready to use the app!');
      } else {
        console.log(`⚠️  Backend responded but status is: ${response.status}`);
        console.log(`📊 Database: ${response.database}`);
      }
    } catch (error) {
      console.error('❌ Invalid response from backend');
      console.error('Response:', data);
    }
  });
}).on('error', (error) => {
  const duration = Date.now() - startTime;
  
  if (error.code === 'ECONNREFUSED') {
    console.error(`❌ Backend is not responding (${duration}ms)`);
    console.error('💡 Backend may be down or still starting up');
    console.error('⏳ Wait 30 seconds and try again');
  } else {
    console.error(`❌ Error: ${error.message} (${duration}ms)`);
  }
  
  process.exit(1);
});

// Timeout after 60 seconds
setTimeout(() => {
  console.error('\n⏱️  Timeout: Backend took too long to respond');
  console.error('💡 This usually means backend is waking up from sleep');
  console.error('⏳ Wait another 30 seconds and try again');
  process.exit(1);
}, 60000);
