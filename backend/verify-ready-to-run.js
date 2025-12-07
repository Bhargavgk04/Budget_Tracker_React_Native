const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function verifyApplication() {
  console.log('\n🔍 VERIFYING APPLICATION READINESS\n');
  console.log('='.repeat(70));
  
  let allChecks = true;
  const issues = [];
  const warnings = [];

  // Check 1: Environment File
  console.log('\n📄 Checking Environment Configuration...');
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    console.log('✅ .env file exists');
    
    const requiredVars = [
      'MONGODB_URI',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'PORT'
    ];
    
    const missingVars = requiredVars.filter(v => !process.env[v]);
    if (missingVars.length > 0) {
      console.log(`❌ Missing required variables: ${missingVars.join(', ')}`);
      issues.push(`Missing environment variables: ${missingVars.join(', ')}`);
      allChecks = false;
    } else {
      console.log('✅ All required environment variables present');
    }
    
    // Check optional but recommended
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('⚠️  Email configuration missing (optional but recommended)');
      warnings.push('Email service not configured - password reset emails won\'t work');
    }
  } else {
    console.log('❌ .env file not found');
    issues.push('.env file missing');
    allChecks = false;
  }

  // Check 2: Required Directories
  console.log('\n📁 Checking Required Directories...');
  const requiredDirs = ['models', 'routes', 'middleware', 'services', 'config', 'uploads'];
  let dirCheck = true;
  
  for (const dir of requiredDirs) {
    const dirPath = path.join(__dirname, dir);
    if (fs.existsSync(dirPath)) {
      console.log(`✅ ${dir}/ directory exists`);
    } else {
      console.log(`❌ ${dir}/ directory missing`);
      issues.push(`${dir}/ directory missing`);
      dirCheck = false;
    }
  }
  
  if (dirCheck) {
    console.log('✅ All required directories present');
  } else {
    allChecks = false;
  }

  // Check 3: Required Files
  console.log('\n📝 Checking Required Files...');
  const requiredFiles = [
    'server.js',
    'package.json',
    'models/User.js',
    'models/Transaction.js',
    'models/Category.js',
    'routes/auth.js',
    'routes/transactions.js',
    'routes/users.js',
    'middleware/auth.js',
    'middleware/errorHandler.js'
  ];
  
  let fileCheck = true;
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} missing`);
      issues.push(`${file} missing`);
      fileCheck = false;
    }
  }
  
  if (fileCheck) {
    console.log('✅ All required files present');
  } else {
    allChecks = false;
  }

  // Check 4: Database Connection
  console.log('\n🗄️  Checking Database Connection...');
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Database connection successful');
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    
    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`✅ Found ${collections.length} collections`);
    
    // Check if users collection exists
    const hasUsers = collections.some(c => c.name === 'users');
    if (hasUsers) {
      const User = require('./models/User');
      const userCount = await User.countDocuments();
      console.log(`✅ Users collection exists (${userCount} users)`);
      
      if (userCount === 0) {
        warnings.push('No users in database - you may want to create a test user');
      }
    }
    
  } catch (error) {
    console.log('❌ Database connection failed');
    console.log(`   Error: ${error.message}`);
    issues.push(`Database connection failed: ${error.message}`);
    allChecks = false;
  }

  // Check 5: Node Modules
  console.log('\n📦 Checking Dependencies...');
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    console.log('✅ node_modules directory exists');
    
    const packageJson = require('./package.json');
    const requiredPackages = [
      'express',
      'mongoose',
      'bcryptjs',
      'jsonwebtoken',
      'dotenv',
      'cors',
      'helmet'
    ];
    
    let packagesOk = true;
    for (const pkg of requiredPackages) {
      try {
        require.resolve(pkg);
        console.log(`✅ ${pkg} installed`);
      } catch (e) {
        console.log(`❌ ${pkg} not installed`);
        issues.push(`${pkg} package missing`);
        packagesOk = false;
      }
    }
    
    if (!packagesOk) {
      console.log('\n💡 Run: npm install');
      allChecks = false;
    }
  } else {
    console.log('❌ node_modules not found');
    console.log('💡 Run: npm install');
    issues.push('Dependencies not installed');
    allChecks = false;
  }

  // Check 6: Port Availability
  console.log('\n🔌 Checking Port Availability...');
  const port = process.env.PORT || 3000;
  const net = require('net');
  
  const checkPort = () => {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        }
      });
      server.once('listening', () => {
        server.close();
        resolve(true);
      });
      server.listen(port);
    });
  };
  
  const portAvailable = await checkPort();
  if (portAvailable) {
    console.log(`✅ Port ${port} is available`);
  } else {
    console.log(`⚠️  Port ${port} is already in use`);
    warnings.push(`Port ${port} is in use - server might already be running or choose different port`);
  }

  // Final Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(70));
  
  if (allChecks && issues.length === 0) {
    console.log('\n✅ ALL CHECKS PASSED!');
    console.log('\n🎉 Your application is READY TO RUN!');
    console.log('\n📝 To start the application:');
    console.log('   npm start          # Production mode');
    console.log('   npm run dev        # Development mode with auto-reload');
    console.log('\n🌐 Server will be available at:');
    console.log(`   http://localhost:${port}`);
    console.log(`   http://localhost:${port}/health (health check)`);
    console.log(`   http://localhost:${port}/api (API endpoints)`);
  } else {
    console.log('\n❌ ISSUES FOUND!');
    console.log('\n🔧 Please fix the following issues:');
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
    console.log('\n💡 After fixing issues, run this script again to verify.');
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    warnings.forEach((warning, index) => {
      console.log(`   ${index + 1}. ${warning}`);
    });
  }
  
  console.log('\n' + '='.repeat(70));
  
  // Cleanup
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  
  process.exit(allChecks ? 0 : 1);
}

// Run verification
verifyApplication().catch(error => {
  console.error('\n❌ Verification failed:', error.message);
  process.exit(1);
});
