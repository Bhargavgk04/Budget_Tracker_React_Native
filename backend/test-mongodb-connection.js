const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
  try {
    console.log('🔄 Testing MongoDB connection...\n');
    
    const mongoURI = process.env.MONGODB_URI;
    console.log('MongoDB URI:', mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('\n✅ Successfully connected to MongoDB!');
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📦 Collections in database (${collections.length}):`);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Count documents in each collection
    console.log('\n📊 Document counts:');
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`   - ${col.name}: ${count} documents`);
    }
    
    console.log('\n✅ MongoDB is working properly!\n');
    
  } catch (error) {
    console.error('\n❌ MongoDB connection failed!');
    console.error('Error:', error.message);
    console.error('\nPlease check:');
    console.error('1. MONGODB_URI in .env file is correct');
    console.error('2. MongoDB Atlas cluster is running');
    console.error('3. IP address is whitelisted in MongoDB Atlas');
    console.error('4. Network connectivity\n');
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed.');
    process.exit(0);
  }
};

testConnection();
