const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

const User = require('./models/User');
const Friendship = require('./models/Friendship');

// Generate a unique UID
function generateUID() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let uid = '';
  for (let i = 0; i < 8; i++) {
    uid += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return uid;
}

async function createTestUsers() {
  console.log('\n' + '='.repeat(60));
  console.log('CREATING TEST USERS');
  console.log('='.repeat(60));

  try {
    // Check if test users already exist
    const existingUser1 = await User.findOne({ email: 'testuser1@example.com' });
    const existingUser2 = await User.findOne({ email: 'testuser2@example.com' });

    let user1, user2;

    // Create User 1
    if (existingUser1) {
      console.log('\n⚠️  Test User 1 already exists');
      user1 = existingUser1;
    } else {
      console.log('\n--- Creating Test User 1 ---');
      const hashedPassword1 = await bcrypt.hash('Test@123', 12);
      
      user1 = await User.create({
        uid: generateUID(),
        name: 'Test User 1',
        email: 'testuser1@example.com',
        password: hashedPassword1,
        emailVerified: true
      });

      console.log('✓ Test User 1 created successfully');
    }
    
    console.log('  Name:', user1.name);
    console.log('  Email:', user1.email);
    console.log('  UID:', user1.uid);
    console.log('  ID:', user1._id);
    console.log('  Password: Test@123');

    // Create User 2
    if (existingUser2) {
      console.log('\n⚠️  Test User 2 already exists');
      user2 = existingUser2;
    } else {
      console.log('\n--- Creating Test User 2 ---');
      const hashedPassword2 = await bcrypt.hash('Test@123', 12);
      
      user2 = await User.create({
        uid: generateUID(),
        name: 'Test User 2',
        email: 'testuser2@example.com',
        password: hashedPassword2,
        emailVerified: true
      });

      console.log('✓ Test User 2 created successfully');
    }
    
    console.log('  Name:', user2.name);
    console.log('  Email:', user2.email);
    console.log('  UID:', user2.uid);
    console.log('  ID:', user2._id);
    console.log('  Password: Test@123');

    // Create friendship between users
    console.log('\n--- Creating Friendship ---');
    const existingFriendship = await Friendship.findBetweenUsers(user1._id, user2._id);
    
    if (existingFriendship) {
      console.log('⚠️  Friendship already exists');
      console.log('  Status:', existingFriendship.status);
      
      if (existingFriendship.status !== 'accepted') {
        existingFriendship.status = 'accepted';
        existingFriendship.respondedAt = new Date();
        await existingFriendship.save();
        console.log('✓ Friendship status updated to accepted');
      }
    } else {
      const friendship = await Friendship.create({
        requester: user1._id,
        recipient: user2._id,
        status: 'accepted',
        requestedAt: new Date(),
        respondedAt: new Date()
      });

      console.log('✓ Friendship created successfully');
      console.log('  Status:', friendship.status);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST USERS READY');
    console.log('='.repeat(60));
    
    console.log('\n📝 Use these credentials for testing:\n');
    
    console.log('User 1:');
    console.log('  Email: testuser1@example.com');
    console.log('  Password: Test@123');
    console.log('  UID:', user1.uid);
    console.log('  ID:', user1._id);
    
    console.log('\nUser 2:');
    console.log('  Email: testuser2@example.com');
    console.log('  Password: Test@123');
    console.log('  UID:', user2.uid);
    console.log('  ID:', user2._id);

    console.log('\n✅ Users are friends and ready for split testing!');
    
    console.log('\n📋 Next steps:');
    console.log('1. Update test-transaction-split.js with these credentials');
    console.log('2. Run: node test-simple-transaction.js');
    console.log('3. Run: node test-transaction-split.js');

  } catch (error) {
    console.error('\n✗ Error creating test users:');
    console.error(error.message);
    if (error.code === 11000) {
      console.error('\nDuplicate key error. Users may already exist.');
      console.error('Try deleting existing test users first or use different emails.');
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  }
}

// Run the script
createTestUsers();
