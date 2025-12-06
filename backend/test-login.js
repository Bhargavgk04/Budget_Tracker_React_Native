const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

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

async function testLogin() {
  console.log('\n=== Testing Login Credentials ===\n');
  
  const testCredentials = [
    { email: 'testuser1@example.com', password: 'Test@123' },
    { email: 'testuser2@example.com', password: 'Test@123' },
  ];

  for (const creds of testCredentials) {
    console.log(`\nTesting: ${creds.email}`);
    
    try {
      // Find user
      const user = await User.findOne({ email: creds.email });
      
      if (!user) {
        console.log('✗ User not found in database');
        continue;
      }
      
      console.log('✓ User found in database');
      console.log('  Name:', user.name);
      console.log('  Email:', user.email);
      console.log('  UID:', user.uid);
      
      // Test password
      const isMatch = await bcrypt.compare(creds.password, user.password);
      
      if (isMatch) {
        console.log('✓ Password matches!');
        console.log('  This user can login successfully');
      } else {
        console.log('✗ Password does NOT match');
        console.log('  Stored hash:', user.password.substring(0, 20) + '...');
      }
      
    } catch (error) {
      console.log('✗ Error:', error.message);
    }
  }
  
  console.log('\n=== Test Complete ===\n');
  console.log('Use these credentials in your app:');
  console.log('  Email: testuser1@example.com');
  console.log('  Password: Test@123');
  
  await mongoose.connection.close();
}

testLogin();
