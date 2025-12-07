const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const Category = require("../models/Category");
const AuditLog = require("../models/AuditLog");
const {
  validateRegister,
  validateLogin,
  validateChangePassword,
} = require("../middleware/validation");

const router = express.Router();

// Helper function to extract device info from request
const getDeviceInfo = (req) => {
  const userAgent = req.get("user-agent") || "unknown";
  return {
    platform: req.body.platform || "unknown",
    version: req.body.appVersion || "unknown",
    userAgent,
    browser: userAgent.split("/")[0] || "unknown",
  };
};

// Helper function to get IP address
const getIpAddress = (req) => {
  return req.ip || req.connection.remoteAddress || "unknown";
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post("/register", validateRegister, async (req, res, next) => {
  try {
    const { name, email, password, rememberMe = false } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Email already exists",
      });
    }

    // Create user (UID will be auto-generated in pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
    });

    // Create default categories for the user
    await Category.createDefaultCategories(user._id);

    // Get device info
    const deviceInfo = getDeviceInfo(req);
    const ipAddress = getIpAddress(req);

    // Generate tokens
    const token = user.getSignedJwtToken();
    const refreshToken = user.generateRefreshToken(rememberMe, deviceInfo);
    user.lastLogin = new Date();
    await user.save();

    // Log registration event
    await AuditLog.logEvent({
      userId: user._id,
      eventType: "login",
      ipAddress,
      userAgent: deviceInfo.userAgent,
      deviceInfo,
      success: true,
      metadata: { action: "registration" },
    });

    // Remove sensitive data from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshTokens;

    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        token,
        refreshToken,
      },
      message: "User registered successfully",
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post("/login", validateLogin, async (req, res, next) => {
  try {
    const { email, password, rememberMe = false } = req.body;
    const deviceInfo = getDeviceInfo(req);
    const ipAddress = getIpAddress(req);

    // Check for user and include password
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      // Log failed attempt (create temporary user ID for tracking)
      await AuditLog.logEvent({
        userId: null,
        eventType: "login_failed",
        ipAddress,
        userAgent: deviceInfo.userAgent,
        deviceInfo,
        success: false,
        reason: "User not found",
        metadata: { email },
      });

      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      await AuditLog.logEvent({
        userId: user._id,
        eventType: "login_failed",
        ipAddress,
        userAgent: deviceInfo.userAgent,
        deviceInfo,
        success: false,
        reason: "Account locked",
      });

      return res.status(423).json({
        success: false,
        error:
          "Account temporarily locked due to too many failed login attempts",
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      // Increment login attempts
      await user.incLoginAttempts();

      // Log failed attempt
      await AuditLog.logEvent({
        userId: user._id,
        eventType: "login_failed",
        ipAddress,
        userAgent: deviceInfo.userAgent,
        deviceInfo,
        success: false,
        reason: "Invalid password",
      });

      // Check if account should be locked
      const updatedUser = await User.findById(user._id);
      if (updatedUser.isLocked) {
        await AuditLog.logEvent({
          userId: user._id,
          eventType: "account_locked",
          ipAddress,
          userAgent: deviceInfo.userAgent,
          deviceInfo,
          success: true,
          metadata: { attempts: updatedUser.loginAttempts },
        });
      }

      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = new Date();

    // Generate tokens with remember me support
    const token = user.getSignedJwtToken();
    const refreshToken = user.generateRefreshToken(rememberMe, deviceInfo);
    await user.save();

    // Log successful login
    await AuditLog.logEvent({
      userId: user._id,
      eventType: "login",
      ipAddress,
      userAgent: deviceInfo.userAgent,
      deviceInfo,
      success: true,
      metadata: { rememberMe },
    });

    // Remove sensitive data from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshTokens;
    delete userResponse.loginAttempts;
    delete userResponse.lockUntil;

    res.status(200).json({
      success: true,
      data: {
        user: userResponse,
        token,
        refreshToken,
      },
      message: "Welcome back!",
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
router.post("/refresh-token", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const deviceInfo = getDeviceInfo(req);
    const ipAddress = getIpAddress(req);

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: "Refresh token is required",
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find user and check if refresh token exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid refresh token",
      });
    }

    // Check if refresh token exists in user's tokens and not expired
    const tokenObj = user.refreshTokens.find(
      (t) => t.token === refreshToken && t.expiresAt > new Date()
    );

    if (!tokenObj) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired refresh token",
      });
    }

    // Generate new tokens with same remember me setting
    const newToken = user.getSignedJwtToken();
    const newRefreshToken = user.generateRefreshToken(
      tokenObj.rememberMe,
      deviceInfo
    );

    // Remove old refresh token
    user.refreshTokens = user.refreshTokens.filter(
      (t) => t.token !== refreshToken
    );

    await user.save();

    // Log token refresh
    await AuditLog.logEvent({
      userId: user._id,
      eventType: "token_refresh",
      ipAddress,
      userAgent: deviceInfo.userAgent,
      deviceInfo,
      success: true,
    });

    res.status(200).json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Refresh token expired",
      });
    }
    next(error);
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post("/logout", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const authHeader = req.header("Authorization");
    const deviceInfo = getDeviceInfo(req);
    const ipAddress = getIpAddress(req);

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Remove specific refresh token if provided
    if (refreshToken) {
      user.refreshTokens = user.refreshTokens.filter(
        (tokenObj) => tokenObj.token !== refreshToken
      );
    } else {
      // Remove all refresh tokens (logout from all devices)
      user.refreshTokens = [];
    }

    await user.save();

    // Log logout event
    await AuditLog.logEvent({
      userId: user._id,
      eventType: "logout",
      ipAddress,
      userAgent: deviceInfo.userAgent,
      deviceInfo,
      success: true,
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get("/me", async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user audit logs
// @route   GET /api/auth/audit-logs
// @access  Private
router.get("/audit-logs", async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const limit = parseInt(req.query.limit) || 30;

    // Get user's recent activity
    const logs = await AuditLog.getUserActivity(decoded.id, limit);

    // Check for suspicious activity
    const suspiciousActivity = await AuditLog.detectSuspiciousActivity(
      decoded.id
    );

    res.status(200).json({
      success: true,
      data: {
        logs,
        suspiciousActivity,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
router.post(
  "/change-password",
  validateChangePassword,
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const token = req.header("Authorization")?.replace("Bearer ", "");
      const deviceInfo = getDeviceInfo(req);
      const ipAddress = getIpAddress(req);

      if (!token) {
        return res.status(401).json({
          success: false,
          error: "No token provided",
        });
      }

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: "Current password and new password are required",
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("+password");

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // Verify current password
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: "Current password is incorrect",
        });
      }

      // Check if new password is same as current
      const isSamePassword = await user.matchPassword(newPassword);
      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          error: "New password must be different from current password",
        });
      }

      // Validate new password strength
      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          error: "Password must be at least 8 characters",
        });
      }

      // Set new password
      user.password = newPassword;

      // Get current refresh token to keep
      const currentRefreshToken = req.body.refreshToken;

      // Invalidate all other sessions except current
      if (currentRefreshToken) {
        await user.invalidateOtherSessions(currentRefreshToken);
      } else {
        // If no refresh token provided, clear all
        user.refreshTokens = [];
      }

      await user.save();

      // Send password change notification email
      const emailSent = await sendPasswordChangeNotification(user.email);
      if (!emailSent) {
        console.error('Failed to send password change notification email');
        // Continue with the process even if email fails
      }

      // Log password change
      await AuditLog.logEvent({
        userId: user._id,
        eventType: "password_change",
        ipAddress,
        userAgent: deviceInfo.userAgent,
        deviceInfo,
        success: true,
      });

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
