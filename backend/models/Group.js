const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    minlength: [2, 'Group name must be at least 2 characters'],
    maxlength: [100, 'Group name cannot exceed 100 characters']
  },
  type: {
    type: String,
    enum: {
      values: ['trip', 'rent', 'office_lunch', 'custom'],
      message: 'Type must be one of: trip, rent, office_lunch, custom'
    },
    default: 'custom'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required'],
    index: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  // Cached balances for performance
  balances: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    netBalance: {
      type: Number,
      default: 0
    },
    lastUpdated: Date
  }],
  totalExpenses: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isSettled: {
    type: Boolean,
    default: false,
    index: true
  },
  settledAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
groupSchema.index({ createdBy: 1, isActive: 1 });
groupSchema.index({ 'members.user': 1, isActive: 1 });
groupSchema.index({ createdAt: -1 });

// Virtual for active members count
groupSchema.virtual('activeMembersCount').get(function() {
  return this.members.filter(m => m.isActive).length;
});

// Virtual for total members count
groupSchema.virtual('totalMembersCount').get(function() {
  return this.members.length;
});

// Pre-save validation
groupSchema.pre('save', function(next) {
  // Ensure at least 2 members
  const activeMembers = this.members.filter(m => m.isActive);
  if (activeMembers.length < 2) {
    return next(new Error('Group must have at least 2 active members'));
  }
  
  // Update settledAt when group is marked as settled
  if (this.isModified('isSettled') && this.isSettled && !this.settledAt) {
    this.settledAt = new Date();
  }
  
  next();
});

// Instance method to check if user is a member
groupSchema.methods.isMember = function(userId) {
  const userIdStr = userId.toString();
  return this.members.some(m => m.user.toString() === userIdStr && m.isActive);
};

// Instance method to check if user is an admin
groupSchema.methods.isAdmin = function(userId) {
  const userIdStr = userId.toString();
  return this.members.some(m => 
    m.user.toString() === userIdStr && m.role === 'admin' && m.isActive
  );
};

// Instance method to add member
groupSchema.methods.addMember = function(userId, role = 'member') {
  // Check if user is already a member
  const existingMember = this.members.find(m => m.user.toString() === userId.toString());
  
  if (existingMember) {
    // Reactivate if previously left
    if (!existingMember.isActive) {
      existingMember.isActive = true;
      existingMember.leftAt = undefined;
      existingMember.joinedAt = new Date();
    } else {
      throw new Error('User is already a member of this group');
    }
  } else {
    this.members.push({
      user: userId,
      role,
      joinedAt: new Date(),
      isActive: true
    });
  }
  
  return this.save();
};

// Instance method to remove member
groupSchema.methods.removeMember = function(userId) {
  const member = this.members.find(m => 
    m.user.toString() === userId.toString() && m.isActive
  );
  
  if (!member) {
    throw new Error('User is not an active member of this group');
  }
  
  // Check if user has unsettled balance
  const userBalance = this.balances.find(b => b.user.toString() === userId.toString());
  if (userBalance && Math.abs(userBalance.netBalance) > 0.01) {
    throw new Error('Cannot remove member with unsettled balance');
  }
  
  member.isActive = false;
  member.leftAt = new Date();
  
  return this.save();
};

// Instance method to update member balance
groupSchema.methods.updateMemberBalance = function(userId, balance) {
  const existingBalance = this.balances.find(b => b.user.toString() === userId.toString());
  
  if (existingBalance) {
    existingBalance.netBalance = balance;
    existingBalance.lastUpdated = new Date();
  } else {
    this.balances.push({
      user: userId,
      netBalance: balance,
      lastUpdated: new Date()
    });
  }
  
  return this.save();
};

// Instance method to check if group is settled
groupSchema.methods.checkIfSettled = function() {
  const hasUnsettledBalances = this.balances.some(b => Math.abs(b.netBalance) > 0.01);
  
  if (!hasUnsettledBalances && !this.isSettled) {
    this.isSettled = true;
    this.settledAt = new Date();
  } else if (hasUnsettledBalances && this.isSettled) {
    this.isSettled = false;
    this.settledAt = undefined;
  }
  
  return this.save();
};

// Static method to get groups for a user
groupSchema.statics.getForUser = function(userId, filters = {}) {
  const query = {
    'members.user': userId,
    'members.isActive': true
  };
  
  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  }
  
  if (filters.isSettled !== undefined) {
    query.isSettled = filters.isSettled;
  }
  
  if (filters.type) {
    query.type = filters.type;
  }
  
  return this.find(query)
    .populate('createdBy', 'uid name email profilePicture')
    .populate('members.user', 'uid name email profilePicture')
    .populate('balances.user', 'uid name email profilePicture')
    .sort({ createdAt: -1 });
};

// Static method to get group by ID with full details
groupSchema.statics.getDetailedById = function(groupId) {
  return this.findById(groupId)
    .populate('createdBy', 'uid name email profilePicture')
    .populate('members.user', 'uid name email profilePicture')
    .populate('balances.user', 'uid name email profilePicture');
};

// Static method to get active groups for a user
groupSchema.statics.getActiveForUser = function(userId) {
  return this.getForUser(userId, { isActive: true });
};

// Static method to get unsettled groups for a user
groupSchema.statics.getUnsettledForUser = function(userId) {
  return this.getForUser(userId, { isActive: true, isSettled: false });
};

module.exports = mongoose.model('Group', groupSchema);
