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
const Friendship = require('./models/Friendship');

async function checkDatabaseStatus() {
  console.log('\n' + '='.repeat(60));
  console.log('DATABASE STATUS CHECK');
  console.log('='.repeat(60));

  try {
    // Check Users
    console.log('\n--- USERS ---');
    const userCount = await User.countDocuments();
    console.log(`Total users: ${userCount}`);
    
    if (userCount > 0) {
      const users = await User.find().limit(5).select('uid name email');
      console.log('\nSample users:');
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name} (${user.email}) - UID: ${user.uid}`);
      });
    } else {
      console.log('⚠️  No users found. You need to create users first.');
    }

    // Check Transactions
    console.log('\n--- TRANSACTIONS ---');
    const transactionCount = await Transaction.countDocuments();
    console.log(`Total transactions: ${transactionCount}`);
    
    if (transactionCount > 0) {
      const recentTransactions = await Transaction.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'name email');
      
      console.log('\nRecent transactions:');
      recentTransactions.forEach((tx, index) => {
        console.log(`  ${index + 1}. ${tx.amount} - ${tx.category} (${tx.type})`);
        console.log(`     User: ${tx.userId?.name || 'Unknown'}`);
        console.log(`     Date: ${tx.date.toLocaleDateString()}`);
        console.log(`     Created: ${tx.createdAt.toLocaleString()}`);
      });

      // Check for shared transactions
      const sharedCount = await Transaction.countDocuments({ 'splitInfo.isShared': true });
      console.log(`\nShared transactions: ${sharedCount}`);
      
      if (sharedCount > 0) {
        const sharedTx = await Transaction.find({ 'splitInfo.isShared': true })
          .limit(3)
          .populate('splitInfo.paidBy', 'name')
          .populate('splitInfo.participants.user', 'name');
        
        console.log('\nSample shared transactions:');
        sharedTx.forEach((tx, index) => {
          console.log(`  ${index + 1}. Amount: ${tx.amount}`);
          console.log(`     Split Type: ${tx.splitInfo.splitType}`);
          console.log(`     Paid By: ${tx.splitInfo.paidBy?.name || 'Unknown'}`);
          console.log(`     Participants: ${tx.splitInfo.participants.length}`);
          tx.splitInfo.participants.forEach((p, i) => {
            const userName = p.user?.name || p.nonAppUser?.name || 'Unknown';
            console.log(`       ${i + 1}. ${userName}: ${p.share} (${p.settled ? 'Settled' : 'Pending'})`);
          });
        });
      }

      // Transaction statistics
      console.log('\n--- TRANSACTION STATISTICS ---');
      const stats = await Transaction.aggregate([
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            avgAmount: { $avg: '$amount' }
          }
        }
      ]);

      stats.forEach(stat => {
        console.log(`${stat._id.toUpperCase()}:`);
        console.log(`  Count: ${stat.count}`);
        console.log(`  Total: ₹${stat.total.toFixed(2)}`);
        console.log(`  Average: ₹${stat.avgAmount.toFixed(2)}`);
      });

      // Category breakdown
      const categoryStats = await Transaction.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            total: { $sum: '$amount' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);

      if (categoryStats.length > 0) {
        console.log('\nTop 5 Categories:');
        categoryStats.forEach((cat, index) => {
          console.log(`  ${index + 1}. ${cat._id}: ${cat.count} transactions, ₹${cat.total.toFixed(2)}`);
        });
      }
    } else {
      console.log('⚠️  No transactions found. Database is empty.');
    }

    // Check Friendships
    console.log('\n--- FRIENDSHIPS ---');
    const friendshipCount = await Friendship.countDocuments();
    console.log(`Total friendships: ${friendshipCount}`);
    
    if (friendshipCount > 0) {
      const acceptedCount = await Friendship.countDocuments({ status: 'accepted' });
      const pendingCount = await Friendship.countDocuments({ status: 'pending' });
      
      console.log(`  Accepted: ${acceptedCount}`);
      console.log(`  Pending: ${pendingCount}`);

      const friendships = await Friendship.find({ status: 'accepted' })
        .limit(5)
        .populate('requester', 'name email')
        .populate('recipient', 'name email');
      
      if (friendships.length > 0) {
        console.log('\nSample friendships:');
        friendships.forEach((f, index) => {
          console.log(`  ${index + 1}. ${f.requester?.name} ↔ ${f.recipient?.name}`);
          console.log(`     Balance: ₹${Math.abs(f.balance.amount).toFixed(2)} (${f.balance.direction})`);
        });
      }
    } else {
      console.log('⚠️  No friendships found.');
    }

    // Database health check
    console.log('\n--- DATABASE HEALTH ---');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`Total collections: ${collections.length}`);
    console.log('Collections:', collections.map(c => c.name).join(', '));

    // Check indexes
    const transactionIndexes = await Transaction.collection.getIndexes();
    console.log(`\nTransaction indexes: ${Object.keys(transactionIndexes).length}`);

    console.log('\n' + '='.repeat(60));
    console.log('STATUS CHECK COMPLETE');
    console.log('='.repeat(60));

    // Recommendations
    console.log('\n--- RECOMMENDATIONS ---');
    if (userCount === 0) {
      console.log('❌ Create at least one user account to test transactions');
    } else if (userCount === 1) {
      console.log('⚠️  Create at least one more user to test split functionality');
    } else {
      console.log('✓ Sufficient users for testing');
    }

    if (transactionCount === 0) {
      console.log('❌ No transactions found. Run test scripts to create test data');
    } else {
      console.log('✓ Transactions exist in database');
    }

    if (sharedCount === 0 && transactionCount > 0) {
      console.log('⚠️  No shared transactions found. Test split functionality');
    } else if (sharedCount > 0) {
      console.log('✓ Split functionality is being used');
    }

    if (friendshipCount === 0 && userCount > 1) {
      console.log('⚠️  No friendships found. Users need to be friends to split expenses');
    } else if (friendshipCount > 0) {
      console.log('✓ Friendships exist');
    }

  } catch (error) {
    console.error('\n✗ Error checking database status:');
    console.error(error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  }
}

// Run the check
checkDatabaseStatus();
