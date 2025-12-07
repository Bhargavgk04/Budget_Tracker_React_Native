const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const categoryRoutes = require('./routes/categories');
const budgetRoutes = require('./routes/budgets');
const analyticsRoutes = require('./routes/analytics');
const userRoutes = require('./routes/users');
const friendRoutes = require('./routes/friends');
const splitRoutes = require('./routes/splits');
const settlementRoutes = require('./routes/settlements');
const groupRoutes = require('./routes/groups');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');
const validationMiddleware = require('./middleware/validation');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Render deployment
app.set('trust proxy', true);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
const allowedOrigins = [
  'https://budget-tracker-react-native-kjff.onrender.com',
  'http://localhost:19006',  // For local development with Expo
  'http://localhost:3000',   // For local backend development
  'http://192.168.0.125:8081', // Your mobile device IP
  'http://192.168.0.125:3000', // Your mobile device IP for backend
  'http://192.168.0.125:*',   // Allow all ports from your mobile device IP
  'http://192.168.0.*:*',     // Allow all devices on your local network
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in the allowed list
    if (allowedOrigins.includes(origin) || 
        process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Block requests from other origins
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  skipSuccessfulRequests: true,
  trustProxy: false,
});

app.use('/api/auth', authLimiter);
app.use('/api', limiter);

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (uploaded images)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request timeout middleware (30 seconds)
app.use((req, res, next) => {
  req.setTimeout(30000);
  res.setTimeout(30000);
  next();
});

// Request ID middleware for tracking
app.use((req, res, next) => {
  req.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Performance monitoring middleware
app.use((req, res, next) => {
  req.startTime = Date.now();
  
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - req.startTime;
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    
    // Log slow requests
    if (responseTime > 1000) {
      console.warn(`Slow request: ${req.method} ${req.path} - ${responseTime}ms`);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
});

// Health check endpoint with database status
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const dbName = mongoose.connection.name || 'unknown';
  
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    database: {
      status: dbStatus,
      name: dbName,
      host: mongoose.connection.host || 'unknown'
    }
  });
});

// Root route to fix 404 errors
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Budget Tracker Backend API',
    version: '1.0.0',
    status: 'Running',
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', authMiddleware, splitRoutes);
app.use('/api/transactions', authMiddleware, transactionRoutes);
app.use('/api/categories', authMiddleware, categoryRoutes);
app.use('/api/budgets', authMiddleware, budgetRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/user', authMiddleware, userRoutes);
app.use('/api/friends', authMiddleware, friendRoutes);
app.use('/api/settlements', authMiddleware, settlementRoutes);
app.use('/api/groups', authMiddleware, groupRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use(errorHandler);

// Database connection with enhanced error handling
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://bhargavkatkam0_db_user:Bhargavk%401104@budget-tracker-prod.fd2ctnp.mongodb.net/';
    
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')); // Hide password in logs
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000,
    });
    
    console.log('✓ Connected to MongoDB successfully');
    console.log(`  Database: ${mongoose.connection.name}`);
    console.log(`  Host: ${mongoose.connection.host}`);
    
    // Monitor connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully');
    });
    
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    console.error('  Please check:');
    console.error('  1. MongoDB URI is correct in .env file');
    console.error('  2. MongoDB server is running');
    console.error('  3. Network connectivity');
    console.error('  4. Database credentials are valid');
    throw error;
  }
};

// Connect to database and start server
connectDB()
.then(() => {
  // Start server only after successful database connection
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✓ Server running on port ${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  API Base URL: https://budget-tracker-react-native-kjff.onrender.com/api`);
    console.log(`  Health Check: https://budget-tracker-react-native-kjff.onrender.com/health\n`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
      mongoose.connection.close();
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
      mongoose.connection.close();
      process.exit(0);
    });
  });

})
.catch((error) => {
  console.error('Database connection error:', error);
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err);
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  }
});

module.exports = app;