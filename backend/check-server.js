/**
 * Quick server health check script
 * Run this to verify the backend is working
 */

const http = require('http');

const PORT = process.env.PORT || 3000;
const HOST = 'localhost';

console.log(`\n🔍 Checking if backend server is running on http://${HOST}:${PORT}...\n`);

const options = {
  hostname: HOST,
  port: PORT,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Backend server is running!');
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Response:`, JSON.parse(data));
      console.log('\n✅ Everything looks good! You can now use the app.\n');
      process.exit(0);
    } else {
      console.log(`⚠️  Server responded with status: ${res.statusCode}`);
      console.log(`   Response:`, data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Backend server is NOT running!');
  console.log(`   Error: ${error.message}`);
  console.log('\n📝 To start the backend server:');
  console.log('   1. Open a terminal');
  console.log('   2. cd backend');
  console.log('   3. npm start');
  console.log('\n   Then run this check again.\n');
  process.exit(1);
});

req.on('timeout', () => {
  console.log('❌ Request timed out!');
  console.log('   The server might be starting up or not responding.');
  req.destroy();
  process.exit(1);
});

req.end();
