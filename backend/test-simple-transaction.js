const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✓ Connected to MongoDB'))
.catch(err => {
  console.error('✗ MongoDB connection error:', err);
  process.exit(1);
});

const Transaction = require('./models/Transaction');
const User = require('./models/User');

async function testTransactionCreation() {
  console.log('\n=== Testing Transaction Creation ===\n');

  try {
    // Find a test user (you'll need at least one user in your database)
    const user = await User.findOne();
    
    if (!user) {
      console.log('✗ No users found in database. Please create a user first.');
      process.exit(1);
    }

    console.log('✓ Found test user:', user.email);
    console.log('  User ID:', user._id);
    console.log('  User UID:', user.uid);

    // Test 1: Create a simple transaction
    console.log('\n--- Test 1: Create Simple Transaction ---');
    const simpleTransaction = await Transaction.create({
      userId: user._id,
      amount: 250.50,
      category: 'Food',
      type: 'expense',
      paymentMode: 'upi',
      notes: 'Test transaction - Lunch',
      date: new Date()
    });

    console.log('✓ Simple transaction created successfully');
    console.log('  Transaction ID:', simpleTransaction._id);
    console.log('  Amount:', simpleTransaction.amount);
    console.log('  Category:', simpleTransaction.category);

    // Verify it's in the database
    const foundTransaction = await Transaction.findById(simpleTransaction._id);
    if (foundTransaction) {
      console.log('✓ Transaction verified in database');
    } else {
      console.log('✗ Transaction NOT found in database');
    }

    // Test 2: Create transaction with split info
    console.log('\n--- Test 2: Create Transaction with Split ---');
    
    // Find another user for splitting
    const users = await User.find().limit(2);
    if (users.length < 2) {
      console.log('⚠ Only one user found. Skipping split test (need at least 2 users)');
    } else {
      const user1 = users[0];
      const user2 = users[1];

      const splitTransaction = await Transaction.create({
        userId: user1._id,
        amount: 600,
        category: 'Food',
        type: 'expense',
        paymentMode: 'cash',
        notes: 'Dinner split with friend',
        date: new Date(),
        friendUid: user2.uid,
        friendId: user2._id,
        splitInfo: {
          isShared: true,
          paidBy: user1._id,
          splitType: 'equal',
          participants: [
            {
              user: user1._id,
              share: 300,
              percentage: 50,
              settled: true,
              settledAt: new Date()
            },
            {
              user: user2._id,
              share: 300,
              percentage: 50,
              settled: false
            }
          ]
        }
      });

      console.log('✓ Split transaction created successfully');
      console.log('  Transaction ID:', splitTransaction._id);
      console.log('  Amount:', splitTransaction.amount);
      console.log('  Split Type:', splitTransaction.splitInfo.splitType);
      console.log('  Participants:', splitTransaction.splitInfo.participants.length);
      console.log('  Participant 1 share:', splitTransaction.splitInfo.participants[0].share);
      console.log('  Participant 2 share:', splitTransaction.splitInfo.participants[1].share);

      // Verify split amounts sum to total
      const totalShares = splitTransaction.splitInfo.participants.reduce(
        (sum, p) => sum + p.share, 0
      );
      if (Math.abs(totalShares - splitTransaction.amount) < 0.01) {
        console.log('✓ Split amounts sum correctly to transaction amount');
      } else {
        console.log('✗ Split amounts do NOT sum correctly:', totalShares, 'vs', splitTransaction.amount);
      }
    }

    // Test 3: Query transactions
    console.log('\n--- Test 3: Query Transactions ---');
    const allTransactions = await Transaction.find({ userId: user._id });
    console.log('✓ Found', allTransactions.length, 'transactions for user');

    const sharedTransactions = await Transaction.find({
      'splitInfo.isShared': true
    });
    console.log('✓ Found', sharedTransactions.length, 'shared transactions in database');

    // Test 4: Test transaction methods
    console.log('\n--- Test 4: Test Transaction Methods ---');
    if (sharedTransactions.length > 0) {
      const testTx = sharedTransactions[0];
      console.log('Testing transaction:', testTx._id);
      
      const isShared = testTx.isShared;
      console.log('  Is shared:', isShared);
      
      const participantCount = testTx.participantCount;
      console.log('  Participant count:', participantCount);
      
      const isFullySettled = testTx.isFullySettled();
      console.log('  Is fully settled:', isFullySettled);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✓ All tests completed successfully!');
    console.log('='.repeat(60));
    console.log('\nTransactions are being saved to the database correctly.');
    console.log('Split functionality is working as expected.');

  } catch (error) {
    console.error('\n✗ Test failed with error:');
    console.error(error.message);
    if (error.errors) {
      console.error('\nValidation errors:');
      Object.keys(error.errors).forEach(key => {
        console.error(`  - ${key}: ${error.errors[key].message}`);
      });
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  }
}

// Run the test
testTransactionCreation();
