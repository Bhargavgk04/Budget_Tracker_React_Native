const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const morgan = require("morgan");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth");
const transactionRoutes = require("./routes/transactions");
const categoryRoutes = require("./routes/categories");
const budgetRoutes = require("./routes/budgets");
const userRoutes = require("./routes/users");
const friendRoutes = require("./routes/friends");
const splitRoutes = require("./routes/splits");
const settlementRoutes = require("./routes/settlements");
const groupRoutes = require("./routes/groups");
const notificationRoutes = require("./routes/notifications");

// Import middleware
const errorHandler = require("./middleware/errorHandler");
const authMiddleware = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Render deployment
app.set("trust proxy", 1);

// Security middleware
app.use(
  helmet({
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
      preload: true,
    },
  })
);

// CORS configuration
const allowedOrigins = [
  "https://budget-tracker-react-native-kjff.onrender.com",
  "http://localhost:19006",
  "http://localhost:3000",
  "http://192.168.0.125:8081",
  "http://192.168.0.125:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV === "development"
      ) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    optionsSuccessStatus: 200,
    maxAge: 86400, // Cache preflight for 24 hours
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Request ID middleware for debugging
app.use((req, res, next) => {
  req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Middleware
app.use(compression());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Apply rate limiting
app.use("/api/", limiter);
app.use("/api/auth/", authLimiter);

// Health check endpoint with database status
app.get("/health", async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const status = dbStatus === 'connected' ? 200 : 503;
  
  res.status(status).json({
    status: dbStatus === 'connected' ? "OK" : "DEGRADED",
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", authMiddleware, transactionRoutes);
app.use("/api/categories", authMiddleware, categoryRoutes);
app.use("/api/budgets", authMiddleware, budgetRoutes);
app.use("/api/users", authMiddleware, userRoutes);
app.use("/api/user", authMiddleware, userRoutes);
app.use("/api/friends", authMiddleware, friendRoutes);
app.use("/api/splits", authMiddleware, splitRoutes);
app.use("/api/settlements", authMiddleware, settlementRoutes);
app.use("/api/groups", authMiddleware, groupRoutes);
app.use("/api/notifications", authMiddleware, notificationRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Budget Tracker API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      transactions: "/api/transactions",
      budgets: "/api/budgets",
      categories: "/api/categories",
      users: "/api/users",
      friends: "/api/friends",
      splits: "/api/splits",
      settlements: "/api/settlements",
      groups: "/api/groups",
      notifications: "/api/notifications",
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error("MongoDB URI is not defined in environment variables");
    }

    await mongoose.connect(mongoURI);

    console.log("✅ MongoDB Connected Successfully");
    console.log(`📊 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("❌ Server startup error:", error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("👋 SIGTERM received, shutting down gracefully...");
  await mongoose.connection.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("👋 SIGINT received, shutting down gracefully...");
  await mongoose.connection.close();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
