const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    unique: true,
    required: false, // Will be auto-generated in pre-save hook
    index: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't include password in queries by default
  },
  profilePicture: {
    type: String,
    default: null
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    default: null,
    select: false // Don't include in queries by default for security
  },
  twoFactorBackupCodes: [{
    code: String,
    used: {
      type: Boolean,
      default: false
    }
  }],
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NZD', 'MXN', 'SGD', 'HKD', 'NOK', 'KRW', 'TRY', 'RUB', 'BRL', 'ZAR', 'DKK', 'PLN', 'THB', 'MYR']
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'amoled'],
      default: 'light'
    },
    notifications: {
      budgetAlerts: {
        type: Boolean,
        default: true
      },
      friendRequests: {
        type: Boolean,
        default: true
      },
      settlements: {
        type: Boolean,
        default: true
      },
      recurring: {
        type: Boolean,
        default: true
      }
    },
    biometric: {
      type: Boolean,
      default: false
    },
    language: {
      type: String,
      default: 'en'
    },
    dateFormat: {
      type: String,
      default: 'DD/MM/YYYY'
    }
  },
  role: {
    type: String,
    enum: ['owner', 'member'],
    default: 'owner'
  },
  familyAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  refreshTokens: [{
    token: String,
    deviceInfo: {
      platform: String,
      version: String,
      userAgent: String
    },
    rememberMe: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true
    }
  }],
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerificationToken: String,
  emailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-validate middleware to generate UID before validation
userSchema.pre('validate', async function(next) {
  // Generate UID if new user and UID doesn't exist
  if (this.isNew && !this.uid) {
    try {
      this.uid = await this.constructor.generateUniqueUID();
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to generate unique UID
userSchema.statics.generateUniqueUID = async function() {
  const crypto = require('crypto');
  let uid;
  let exists = true;
  
  while (exists) {
    // Generate 8-character alphanumeric UID
    uid = crypto.randomBytes(4).toString('hex').toUpperCase();
    exists = await this.findOne({ uid });
  }
  
  return uid;
};

// Method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT token
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '1h' }
  );
};

// Method to generate refresh token with remember me support
userSchema.methods.generateRefreshToken = function(rememberMe = false, deviceInfo = {}) {
  // Set expiry based on remember me option
  const expiryDays = rememberMe ? 30 : 7;
  const expiresIn = `${expiryDays}d`;
  
  const refreshToken = jwt.sign(
    { id: this._id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn }
  );

  // Store refresh token in database with device info
  this.refreshTokens.push({
    token: refreshToken,
    deviceInfo: {
      platform: deviceInfo.platform || 'unknown',
      version: deviceInfo.version || 'unknown',
      userAgent: deviceInfo.userAgent || 'unknown'
    },
    rememberMe,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
  });

  // Keep only last 5 refresh tokens per device
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }

  return refreshToken;
};

// Method to generate password reset token
userSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = require('crypto').randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.passwordResetToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Method to handle failed login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Method to enable 2FA
userSchema.methods.enable2FA = function(secret) {
  this.twoFactorEnabled = true;
  this.twoFactorSecret = secret;
  return this.save();
};

// Method to disable 2FA
userSchema.methods.disable2FA = function() {
  this.twoFactorEnabled = false;
  this.twoFactorSecret = null;
  this.twoFactorBackupCodes = [];
  return this.save();
};

// Method to generate backup codes for 2FA
userSchema.methods.generateBackupCodes = function() {
  const crypto = require('crypto');
  const codes = [];
  
  for (let i = 0; i < 10; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push({ code, used: false });
  }
  
  this.twoFactorBackupCodes = codes;
  return codes.map(c => c.code);
};

// Method to verify backup code
userSchema.methods.verifyBackupCode = function(code) {
  const backupCode = this.twoFactorBackupCodes.find(
    bc => bc.code === code.toUpperCase() && !bc.used
  );
  
  if (backupCode) {
    backupCode.used = true;
    return true;
  }
  
  return false;
};

// Static method to clean up expired refresh tokens
userSchema.statics.cleanupExpiredTokens = function() {
  return this.updateMany(
    {},
    {
      $pull: {
        refreshTokens: {
          expiresAt: { $lt: new Date() }
        }
      }
    }
  );
};

// Method to invalidate all sessions except current
userSchema.methods.invalidateOtherSessions = function(currentRefreshToken) {
  this.refreshTokens = this.refreshTokens.filter(
    tokenObj => tokenObj.token === currentRefreshToken
  );
  return this.save();
};

module.exports = mongoose.model('User', userSchema);