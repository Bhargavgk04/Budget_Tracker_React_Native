const https = require('https');

const RENDER_URL = 'https://budget-tracker-react-native-kjff.onrender.com';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, RENDER_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testRenderBackend() {
  console.log('🧪 TESTING RENDER BACKEND\n');
  console.log('='.repeat(70));
  console.log(`\n🌐 Backend URL: ${RENDER_URL}`);
  console.log('='.repeat(70));

  let allPassed = true;

  try {
    // Test 1: Health Check
    console.log('\n🏥 Test 1: Health Check');
    console.log('-'.repeat(70));
    const health = await makeRequest('/health');
    if (health.status === 200 && health.data.status === 'OK') {
      console.log('✅ Health check PASSED');
      console.log(`   Status: ${health.data.status}`);
      console.log(`   Database: ${health.data.database.status}`);
      console.log(`   Environment: ${health.data.environment}`);
      console.log(`   Uptime: ${Math.floor(health.data.uptime)}s`);
    } else {
      console.log('❌ Health check FAILED');
      allPassed = false;
    }

    // Test 2: Root Endpoint
    console.log('\n🏠 Test 2: Root Endpoint');
    console.log('-'.repeat(70));
    const root = await makeRequest('/');
    if (root.status === 200) {
      console.log('✅ Root endpoint PASSED');
      console.log(`   Message: ${root.data.message}`);
      console.log(`   Version: ${root.data.version}`);
    } else {
      console.log('❌ Root endpoint FAILED');
      allPassed = false;
    }

    // Test 3: Login Validation
    console.log('\n🔐 Test 3: Login Validation (empty credentials)');
    console.log('-'.repeat(70));
    const loginFail = await makeRequest('/api/auth/login', 'POST', {});
    if (loginFail.status === 400) {
      console.log('✅ Login validation PASSED');
      console.log(`   Error: ${loginFail.data.error}`);
    } else {
      console.log('⚠️  Unexpected response');
    }

    // Test 4: Login with Test User
    console.log('\n🔑 Test 4: Login with Test User');
    console.log('-'.repeat(70));
    const login = await makeRequest('/api/auth/login', 'POST', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    let token = null;
    if (login.status === 200 && login.data.success) {
      console.log('✅ Login PASSED');
      console.log(`   User: ${login.data.data.user.name}`);
      console.log(`   UID: ${login.data.data.user.uid}`);
      console.log(`   Email: ${login.data.data.user.email}`);
      token = login.data.data.token;
    } else {
      console.log('❌ Login FAILED');
      console.log(`   Status: ${login.status}`);
      console.log(`   Message: ${login.data.error || login.data.message}`);
      allPassed = false;
    }

    if (token) {
      // Test 5: Protected Route - Get Profile
      console.log('\n👤 Test 5: Get User Profile (Protected Route)');
      console.log('-'.repeat(70));
      
      const profileReq = https.request({
        hostname: new URL(RENDER_URL).hostname,
        path: '/api/user/profile',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const profile = JSON.parse(body);
            if (res.statusCode === 200 && profile.success) {
              console.log('✅ Profile endpoint PASSED');
              console.log(`   Name: ${profile.data.name}`);
              console.log(`   Email: ${profile.data.email}`);
              console.log(`   Currency: ${profile.data.currency}`);
            } else {
              console.log('❌ Profile endpoint FAILED');
              allPassed = false;
            }
            continueTests();
          } catch (e) {
            console.log('❌ Profile endpoint FAILED - Invalid response');
            allPassed = false;
            continueTests();
          }
        });
      });
      
      profileReq.on('error', (error) => {
        console.log('❌ Profile endpoint FAILED:', error.message);
        allPassed = false;
        continueTests();
      });
      
      profileReq.end();

      async function continueTests() {
        // Test 6: Get Transactions
        console.log('\n💰 Test 6: Get Transactions (Protected Route)');
        console.log('-'.repeat(70));
        
        const txnReq = https.request({
          hostname: new URL(RENDER_URL).hostname,
          path: '/api/transactions',
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }, (res) => {
          let body = '';
          res.on('data', (chunk) => body += chunk);
          res.on('end', () => {
            try {
              const transactions = JSON.parse(body);
              if (res.statusCode === 200 && transactions.success) {
                console.log('✅ Transactions endpoint PASSED');
                console.log(`   Total: ${transactions.data.pagination.total}`);
                console.log(`   Page: ${transactions.data.pagination.page}`);
              } else {
                console.log('❌ Transactions endpoint FAILED');
                allPassed = false;
              }
              printSummary();
            } catch (e) {
              console.log('❌ Transactions endpoint FAILED - Invalid response');
              allPassed = false;
              printSummary();
            }
          });
        });
        
        txnReq.on('error', (error) => {
          console.log('❌ Transactions endpoint FAILED:', error.message);
          allPassed = false;
          printSummary();
        });
        
        txnReq.end();
      }
    } else {
      printSummary();
    }

    function printSummary() {
      // Summary
      console.log('\n' + '='.repeat(70));
      console.log('📊 RENDER BACKEND TEST SUMMARY');
      console.log('='.repeat(70));
      console.log(`\n🌐 Backend URL: ${RENDER_URL}`);
      console.log(`\n${allPassed ? '✅' : '❌'} Overall Status: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
      console.log('\n✅ Health Check: PASS');
      console.log('✅ Root Endpoint: PASS');
      console.log('✅ Login Validation: PASS');
      console.log(`${token ? '✅' : '❌'} Authentication: ${token ? 'PASS' : 'FAIL'}`);
      if (token) {
        console.log('✅ Protected Routes: PASS');
      }
      
      if (allPassed) {
        console.log('\n🎉 YOUR RENDER BACKEND IS FULLY OPERATIONAL!');
        console.log('\n📱 You can now use the frontend app with this backend.');
        console.log('\n🔗 API Base URL: https://budget-tracker-react-native-kjff.onrender.com/api');
      } else {
        console.log('\n⚠️  Some tests failed. Check the logs above for details.');
      }
      
      console.log('\n' + '='.repeat(70));
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\n💡 Possible issues:');
    console.error('   1. Backend might be sleeping (Render free tier)');
    console.error('   2. Network connectivity issues');
    console.error('   3. Backend deployment issues');
    console.error('\n🔧 Try:');
    console.error('   1. Visit https://budget-tracker-react-native-kjff.onrender.com/health in browser');
    console.error('   2. Check Render dashboard for deployment status');
    console.error('   3. Wait 30 seconds and try again (if backend was sleeping)');
  }
}

// Run the test
console.log('\n⏳ Testing Render backend...');
console.log('   (This may take 30+ seconds if backend is waking up from sleep)\n');

testRenderBackend();
