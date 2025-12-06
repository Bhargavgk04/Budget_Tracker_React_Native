const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// Test user credentials (you'll need to update these with actual test users)
const testUsers = {
  user1: {
    email: 'test1@example.com',
    password: 'Test@123'
  },
  user2: {
    email: 'test2@example.com',
    password: 'Test@123'
  }
};

let tokens = {};
let userIds = {};
let testTransactionId = null;

// Helper function to login and get token
async function login(email, password) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    return {
      token: response.data.token,
      userId: response.data.data.user._id,
      uid: response.data.data.user.uid
    };
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw error;
  }
}

// Test 1: Create a basic transaction
async function testBasicTransaction() {
  console.log('\n=== Test 1: Create Basic Transaction ===');
  try {
    const response = await axios.post(
      `${API_URL}/transactions`,
      {
        amount: 500,
        category: 'Food',
        type: 'expense',
        paymentMode: 'upi',
        notes: 'Test transaction',
        date: new Date()
      },
      {
        headers: { Authorization: `Bearer ${tokens.user1}` }
      }
    );

    testTransactionId = response.data.data._id;
    console.log('✓ Basic transaction created successfully');
    console.log('Transaction ID:', testTransactionId);
    console.log('Amount:', response.data.data.amount);
    console.log('Category:', response.data.data.category);
    return true;
  } catch (error) {
    console.error('✗ Failed to create basic transaction');
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

// Test 2: Create transaction with friend UID
async function testTransactionWithFriend() {
  console.log('\n=== Test 2: Create Transaction with Friend UID ===');
  try {
    const response = await axios.post(
      `${API_URL}/transactions`,
      {
        amount: 1000,
        category: 'Food',
        type: 'expense',
        paymentMode: 'cash',
        notes: 'Dinner with friend',
        date: new Date(),
        friendUid: userIds.user2Uid // Using user2's UID
      },
      {
        headers: { Authorization: `Bearer ${tokens.user1}` }
      }
    );

    console.log('✓ Transaction with friend created successfully');
    console.log('Transaction ID:', response.data.data._id);
    console.log('Friend UID:', response.data.data.friendUid);
    console.log('Friend ID:', response.data.data.friendId);
    
    if (response.data.data.friendId) {
      console.log('✓ Friend ID was automatically populated');
    } else {
      console.log('✗ Friend ID was NOT populated (may need to be friends first)');
    }
    
    return true;
  } catch (error) {
    console.error('✗ Failed to create transaction with friend');
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

// Test 3: Create transaction with equal split
async function testEqualSplit() {
  console.log('\n=== Test 3: Create Transaction with Equal Split ===');
  try {
    // First create a transaction
    const transactionResponse = await axios.post(
      `${API_URL}/transactions`,
      {
        amount: 600,
        category: 'Food',
        type: 'expense',
        paymentMode: 'upi',
        notes: 'Lunch split equally',
        date: new Date()
      },
      {
        headers: { Authorization: `Bearer ${tokens.user1}` }
      }
    );

    const transactionId = transactionResponse.data.data._id;
    console.log('✓ Transaction created:', transactionId);

    // Now add equal split
    const splitResponse = await axios.post(
      `${API_URL}/transactions/${transactionId}/split`,
      {
        splitType: 'equal',
        paidBy: userIds.user1,
        participants: [
          {
            user: userIds.user1,
            share: 300,
            percentage: 50
          },
          {
            user: userIds.user2,
            share: 300,
            percentage: 50
          }
        ]
      },
      {
        headers: { Authorization: `Bearer ${tokens.user1}` }
      }
    );

    console.log('✓ Equal split created successfully');
    console.log('Split Type:', splitResponse.data.data.splitInfo.splitType);
    console.log('Participants:', splitResponse.data.data.splitInfo.participants.length);
    console.log('Participant 1 share:', splitResponse.data.data.splitInfo.participants[0].share);
    console.log('Participant 2 share:', splitResponse.data.data.splitInfo.participants[1].share);
    
    // Verify split amounts sum to total
    const totalShares = splitResponse.data.data.splitInfo.participants.reduce(
      (sum, p) => sum + p.share, 0
    );
    if (Math.abs(totalShares - 600) < 0.01) {
      console.log('✓ Split amounts sum correctly to transaction amount');
    } else {
      console.log('✗ Split amounts do NOT sum correctly:', totalShares, 'vs', 600);
    }
    
    return true;
  } catch (error) {
    console.error('✗ Failed to create equal split');
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

// Test 4: Create transaction with percentage split
async function testPercentageSplit() {
  console.log('\n=== Test 4: Create Transaction with Percentage Split ===');
  try {
    // First create a transaction
    const transactionResponse = await axios.post(
      `${API_URL}/transactions`,
      {
        amount: 1000,
        category: 'Food',
        type: 'expense',
        paymentMode: 'card',
        notes: 'Dinner split by percentage',
        date: new Date()
      },
      {
        headers: { Authorization: `Bearer ${tokens.user1}` }
      }
    );

    const transactionId = transactionResponse.data.data._id;
    console.log('✓ Transaction created:', transactionId);

    // Now add percentage split (60-40)
    const splitResponse = await axios.post(
      `${API_URL}/transactions/${transactionId}/split`,
      {
        splitType: 'percentage',
        paidBy: userIds.user1,
        participants: [
          {
            user: userIds.user1,
            share: 600,
            percentage: 60
          },
          {
            user: userIds.user2,
            share: 400,
            percentage: 40
          }
        ]
      },
      {
        headers: { Authorization: `Bearer ${tokens.user1}` }
      }
    );

    console.log('✓ Percentage split created successfully');
    console.log('Split Type:', splitResponse.data.data.splitInfo.splitType);
    console.log('Participant 1: 60% =', splitResponse.data.data.splitInfo.participants[0].share);
    console.log('Participant 2: 40% =', splitResponse.data.data.splitInfo.participants[1].share);
    
    // Verify percentages sum to 100
    const totalPercentage = splitResponse.data.data.splitInfo.participants.reduce(
      (sum, p) => sum + p.percentage, 0
    );
    if (Math.abs(totalPercentage - 100) < 0.01) {
      console.log('✓ Percentages sum correctly to 100%');
    } else {
      console.log('✗ Percentages do NOT sum to 100%:', totalPercentage);
    }
    
    return true;
  } catch (error) {
    console.error('✗ Failed to create percentage split');
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

// Test 5: Create transaction with custom split
async function testCustomSplit() {
  console.log('\n=== Test 5: Create Transaction with Custom Split ===');
  try {
    // First create a transaction
    const transactionResponse = await axios.post(
      `${API_URL}/transactions`,
      {
        amount: 850,
        category: 'Food',
        type: 'expense',
        paymentMode: 'upi',
        notes: 'Custom split amounts',
        date: new Date()
      },
      {
        headers: { Authorization: `Bearer ${tokens.user1}` }
      }
    );

    const transactionId = transactionResponse.data.data._id;
    console.log('✓ Transaction created:', transactionId);

    // Now add custom split
    const splitResponse = await axios.post(
      `${API_URL}/transactions/${transactionId}/split`,
      {
        splitType: 'custom',
        paidBy: userIds.user1,
        participants: [
          {
            user: userIds.user1,
            share: 500
          },
          {
            user: userIds.user2,
            share: 350
          }
        ]
      },
      {
        headers: { Authorization: `Bearer ${tokens.user1}` }
      }
    );

    console.log('✓ Custom split created successfully');
    console.log('Split Type:', splitResponse.data.data.splitInfo.splitType);
    console.log('Participant 1 share:', splitResponse.data.data.splitInfo.participants[0].share);
    console.log('Participant 2 share:', splitResponse.data.data.splitInfo.participants[1].share);
    
    return true;
  } catch (error) {
    console.error('✗ Failed to create custom split');
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

// Test 6: Get shared transactions
async function testGetSharedTransactions() {
  console.log('\n=== Test 6: Get Shared Transactions ===');
  try {
    const response = await axios.get(
      `${API_URL}/transactions/shared`,
      {
        headers: { Authorization: `Bearer ${tokens.user1}` }
      }
    );

    console.log('✓ Retrieved shared transactions');
    console.log('Total shared transactions:', response.data.count);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('\nFirst shared transaction:');
      const first = response.data.data[0];
      console.log('- Amount:', first.amount);
      console.log('- Split Type:', first.splitInfo?.splitType);
      console.log('- Participants:', first.splitInfo?.participants?.length);
      console.log('- Is Shared:', first.splitInfo?.isShared);
    }
    
    return true;
  } catch (error) {
    console.error('✗ Failed to get shared transactions');
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

// Test 7: Verify transaction is in database
async function testVerifyTransactionInDB() {
  console.log('\n=== Test 7: Verify Transaction in Database ===');
  try {
    if (!testTransactionId) {
      console.log('⚠ No test transaction ID available');
      return false;
    }

    const response = await axios.get(
      `${API_URL}/transactions/${testTransactionId}`,
      {
        headers: { Authorization: `Bearer ${tokens.user1}` }
      }
    );

    console.log('✓ Transaction found in database');
    console.log('Transaction details:');
    console.log('- ID:', response.data.data._id);
    console.log('- Amount:', response.data.data.amount);
    console.log('- Category:', response.data.data.category);
    console.log('- Type:', response.data.data.type);
    console.log('- Created At:', response.data.data.createdAt);
    
    return true;
  } catch (error) {
    console.error('✗ Failed to verify transaction in database');
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

// Test 8: Test invalid split (should fail)
async function testInvalidSplit() {
  console.log('\n=== Test 8: Test Invalid Split (Should Fail) ===');
  try {
    // First create a transaction
    const transactionResponse = await axios.post(
      `${API_URL}/transactions`,
      {
        amount: 1000,
        category: 'Food',
        type: 'expense',
        paymentMode: 'cash',
        notes: 'Test invalid split',
        date: new Date()
      },
      {
        headers: { Authorization: `Bearer ${tokens.user1}` }
      }
    );

    const transactionId = transactionResponse.data.data._id;

    // Try to add split with amounts that don't sum to total
    try {
      await axios.post(
        `${API_URL}/transactions/${transactionId}/split`,
        {
          splitType: 'custom',
          paidBy: userIds.user1,
          participants: [
            {
              user: userIds.user1,
              share: 400 // Only 400 instead of 1000
            },
            {
              user: userIds.user2,
              share: 300 // Total is 700, not 1000
            }
          ]
        },
        {
          headers: { Authorization: `Bearer ${tokens.user1}` }
        }
      );
      
      console.log('✗ Invalid split was accepted (should have been rejected)');
      return false;
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✓ Invalid split was correctly rejected');
        console.log('Error message:', error.response.data.error);
        return true;
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('✗ Test failed unexpectedly');
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('='.repeat(60));
  console.log('TRANSACTION AND SPLIT TESTING SUITE');
  console.log('='.repeat(60));

  try {
    // Login both test users
    console.log('\n--- Logging in test users ---');
    const user1Auth = await login(testUsers.user1.email, testUsers.user1.password);
    tokens.user1 = user1Auth.token;
    userIds.user1 = user1Auth.userId;
    userIds.user1Uid = user1Auth.uid;
    console.log('✓ User 1 logged in:', user1Auth.uid);

    const user2Auth = await login(testUsers.user2.email, testUsers.user2.password);
    tokens.user2 = user2Auth.token;
    userIds.user2 = user2Auth.userId;
    userIds.user2Uid = user2Auth.uid;
    console.log('✓ User 2 logged in:', user2Auth.uid);

    // Run all tests
    const results = {
      basicTransaction: await testBasicTransaction(),
      transactionWithFriend: await testTransactionWithFriend(),
      equalSplit: await testEqualSplit(),
      percentageSplit: await testPercentageSplit(),
      customSplit: await testCustomSplit(),
      sharedTransactions: await testGetSharedTransactions(),
      verifyInDB: await testVerifyTransactionInDB(),
      invalidSplit: await testInvalidSplit()
    };

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    
    const passed = Object.values(results).filter(r => r === true).length;
    const total = Object.keys(results).length;
    
    Object.entries(results).forEach(([test, result]) => {
      const status = result ? '✓ PASS' : '✗ FAIL';
      console.log(`${status}: ${test}`);
    });
    
    console.log('\n' + '-'.repeat(60));
    console.log(`Total: ${passed}/${total} tests passed`);
    console.log('='.repeat(60));

    if (passed === total) {
      console.log('\n🎉 All tests passed! Transactions and splits are working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the errors above.');
    }

  } catch (error) {
    console.error('\n❌ Test suite failed to complete');
    console.error('Error:', error.message);
  }
}

// Run the tests
runTests();
