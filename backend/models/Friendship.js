const mongoose = require('mongoose');

const friendshipSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requester is required'],
    index: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required'],
    index: true
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'accepted', 'declined', 'blocked', 'archived'],
      message: 'Status must be one of: pending, accepted, declined, blocked, archived'
    },
    default: 'pending',
    index: true
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: Date,
  archivedAt: Date,
  // Cached balance for performance (updated on transaction/settlement)
  balance: {
    amount: {
      type: Number,
      default: 0,
      validate: {
        validator: function(value) {
          return Number.isFinite(value);
        },
        message: 'Balance amount must be a valid number'
      }
    },
    // Positive: requester owes recipient, Negative: recipient owes requester
    direction: {
      type: String,
      enum: ['requester_owes', 'recipient_owes', 'settled'],
      default: 'settled'
    },
    lastUpdated: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
friendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });
friendshipSchema.index({ requester: 1, status: 1 });
friendshipSchema.index({ recipient: 1, status: 1 });
friendshipSchema.index({ status: 1, createdAt: -1 });

// Virtual to check if friendship is active
friendshipSchema.virtual('isActive').get(function() {
  return this.status === 'accepted';
});

// Virtual to get absolute balance amount
friendshipSchema.virtual('absoluteBalance').get(function() {
  return Math.abs(this.balance.amount);
});

// Pre-save middleware to update respondedAt
friendshipSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status !== 'pending' && !this.respondedAt) {
    this.respondedAt = new Date();
  }
  
  if (this.isModified('status') && this.status === 'archived' && !this.archivedAt) {
    this.archivedAt = new Date();
  }
  
  next();
});

// Instance method to get the other user in the friendship
friendshipSchema.methods.getOtherUser = function(userId) {
  const userIdStr = userId.toString();
  const requesterStr = this.requester.toString();
  const recipientStr = this.recipient.toString();
  
  if (userIdStr === requesterStr) {
    return this.recipient;
  } else if (userIdStr === recipientStr) {
    return this.requester;
  }
  
  return null;
};

// Instance method to check if user is part of this friendship
friendshipSchema.methods.includesUser = function(userId) {
  const userIdStr = userId.toString();
  return userIdStr === this.requester.toString() || userIdStr === this.recipient.toString();
};

// Instance method to update balance
friendshipSchema.methods.updateBalance = function(amount, direction) {
  this.balance.amount = amount;
  this.balance.direction = direction;
  this.balance.lastUpdated = new Date();
  return this.save();
};

// Instance method to archive friendship
friendshipSchema.methods.archive = function() {
  this.status = 'archived';
  this.archivedAt = new Date();
  return this.save();
};

// Static method to find friendship between two users
friendshipSchema.statics.findBetweenUsers = function(userId1, userId2) {
  return this.findOne({
    $or: [
      { requester: userId1, recipient: userId2 },
      { requester: userId2, recipient: userId1 }
    ]
  });
};

// Static method to get all friends for a user
friendshipSchema.statics.getFriendsForUser = function(userId, status = 'accepted') {
  return this.find({
    $or: [
      { requester: userId, status },
      { recipient: userId, status }
    ]
  })
  .populate('requester', 'uid name email profilePicture')
  .populate('recipient', 'uid name email profilePicture')
  .sort({ createdAt: -1 });
};

// Static method to get pending requests for a user
friendshipSchema.statics.getPendingRequests = function(userId) {
  return this.find({
    recipient: userId,
    status: 'pending'
  })
  .populate('requester', 'uid name email profilePicture')
  .sort({ requestedAt: -1 });
};

// Static method to get sent requests for a user
friendshipSchema.statics.getSentRequests = function(userId) {
  return this.find({
    requester: userId,
    status: 'pending'
  })
  .populate('recipient', 'uid name email profilePicture')
  .sort({ requestedAt: -1 });
};

// Static method to check if friendship exists
friendshipSchema.statics.exists = async function(userId1, userId2) {
  const friendship = await this.findBetweenUsers(userId1, userId2);
  return !!friendship;
};

// Static method to check if users are friends (accepted status)
friendshipSchema.statics.areFriends = async function(userId1, userId2) {
  const friendship = await this.findBetweenUsers(userId1, userId2);
  return friendship && friendship.status === 'accepted';
};

module.exports = mongoose.model('Friendship', friendshipSchema);
