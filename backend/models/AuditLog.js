const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Allow null for failed login attempts where user doesn't exist
    default: null,
    index: true
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'login',
      'login_failed',
      'logout',
      'password_change',
      'password_reset_request',
      'password_reset_complete',
      'token_refresh',
      'account_locked'
    ],
    index: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    default: 'unknown'
  },
  deviceInfo: {
    platform: String,
    version: String,
    browser: String
  },
  success: {
    type: Boolean,
    required: true,
    default: true
  },
  reason: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Indexes for performance
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ eventType: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

// TTL index to auto-delete logs older than 90 days
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Static method to log authentication event
auditLogSchema.statics.logEvent = async function(data) {
  try {
    return await this.create({
      userId: data.userId,
      eventType: data.eventType,
      ipAddress: data.ipAddress || 'unknown',
      userAgent: data.userAgent || 'unknown',
      deviceInfo: data.deviceInfo || {},
      success: data.success !== undefined ? data.success : true,
      reason: data.reason || null,
      metadata: data.metadata || {}
    });
  } catch (error) {
    console.error('Error logging audit event:', error);
    // Don't throw error to prevent blocking main flow
    return null;
  }
};

// Static method to get user's recent activity
auditLogSchema.statics.getUserActivity = async function(userId, limit = 30) {
  return await this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-__v');
};

// Static method to detect suspicious activity
auditLogSchema.statics.detectSuspiciousActivity = async function(userId, timeWindow = 15) {
  const since = new Date(Date.now() - timeWindow * 60 * 1000);
  
  const failedAttempts = await this.countDocuments({
    userId,
    eventType: 'login_failed',
    createdAt: { $gte: since }
  });

  return {
    suspicious: failedAttempts >= 3,
    failedAttempts,
    timeWindow
  };
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
