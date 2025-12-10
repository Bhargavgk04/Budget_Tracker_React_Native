const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be positive'],
    max: [999999999, 'Amount too large'],
    validate: {
      validator: function(value) {
        return Number.isFinite(value) && value > 0;
      },
      message: 'Amount must be a valid positive number'
    }
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [50, 'Category name too long']
  },
  type: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: {
      values: ['income', 'expense'],
      message: 'Type must be either income or expense'
    },
    index: true
  },
  paymentMode: {
    type: String,
    required: [true, 'Payment mode is required'],
    enum: {
      values: ['cash', 'upi', 'card', 'bank_transfer', 'other'],
      message: 'Invalid payment mode'
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  date: {
    type: Date,
    required: [true, 'Transaction date is required'],
    index: true,
    validate: {
      validator: function(value) {
        return value <= new Date();
      },
      message: 'Transaction date cannot be in the future'
    }
  },
  recurring: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    interval: {
      type: Number,
      min: 1,
      max: 365
    },
    nextDue: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    parentTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 20
  }],
  location: {
    name: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    mimeType: String
  }],
  isRecurring: {
    type: Boolean,
    default: false,
    index: true
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: Date,
  // Friend and expense splitting fields
  friendUid: {
    type: String,
    index: true,
    sparse: true
  },
  friendId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    sparse: true
  },
  splitInfo: {
    isShared: {
      type: Boolean,
      default: false,
      index: true
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: function() { return this.splitInfo && this.splitInfo.isShared; }
    },
    splitType: {
      type: String,
      enum: ['equal', 'percentage', 'custom'],
      required: function() { return this.splitInfo && this.splitInfo.isShared; }
    },
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: false
        },
        // For non-app users
        nonAppUser: {
          name: { type: String },
          uid: { type: String }
        },
        share: {
          type: Number,
          required: true,
          min: 0
        },
        percentage: {
          type: Number,
          min: 0,
          max: 100
        },
        settled: {
          type: Boolean,
          default: false
        },
        settledAt: Date
      }
    ],
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      sparse: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

transactionSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Compound indexes for efficient queries
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1, date: -1 });
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ userId: 1, isDeleted: 1, date: -1 });
transactionSchema.index({ friendId: 1, date: -1 });
transactionSchema.index({ 'splitInfo.isShared': 1, date: -1 });
transactionSchema.index({ 'splitInfo.groupId': 1, date: -1 });
transactionSchema.index({ 'splitInfo.participants.user': 1, date: -1 });

// Text index for search functionality
transactionSchema.index({
  category: 'text',
  notes: 'text',
  'tags': 'text'
}, {
  weights: {
    category: 10,
    notes: 5,
    tags: 3
  }
});

// TTL index for soft-deleted transactions (delete after 30 days)
transactionSchema.index(
  { deletedAt: 1 },
  { 
    expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days
    partialFilterExpression: { isDeleted: true }
  }
);

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(this.amount);
});

// Virtual for age in days
transactionSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.date) / (1000 * 60 * 60 * 24));
});

// Virtual to check if transaction is shared
transactionSchema.virtual('isShared').get(function() {
  return !!(this.splitInfo && this.splitInfo.isShared);
});

// Virtual to get number of participants
transactionSchema.virtual('participantCount').get(function() {
  return this.splitInfo && this.splitInfo.participants ? this.splitInfo.participants.length : 0;
});

// Pre-save middleware
transactionSchema.pre('save', function(next) {
  // Set isRecurring flag
  this.isRecurring = !!(this.recurring && this.recurring.frequency);
  
  // Validate recurring configuration
  if (this.isRecurring) {
    if (!this.recurring.nextDue) {
      this.recurring.nextDue = new Date(this.date);
    }
    
    if (this.recurring.endDate && this.recurring.endDate <= this.recurring.nextDue) {
      return next(new Error('Recurring end date must be after next due date'));
    }
  }
  
  // Validate split configuration
  if (this.splitInfo && this.splitInfo.isShared) {
    // Ensure paidBy is set
    if (!this.splitInfo.paidBy) {
      return next(new Error('paidBy is required for shared transactions'));
    }
    
    // Ensure splitType is set
    if (!this.splitInfo.splitType) {
      return next(new Error('splitType is required for shared transactions'));
    }
    
    // Ensure participants exist
    if (!this.splitInfo.participants || this.splitInfo.participants.length === 0) {
      return next(new Error('At least one participant is required for shared transactions'));
    }
    
    // Validate split amounts sum to total
    const totalShares = this.splitInfo.participants.reduce((sum, p) => sum + p.share, 0);
    const difference = Math.abs(totalShares - this.amount);
    
    if (difference > 0.01) { // Allow for small rounding errors
      return next(new Error(`Split amounts (${totalShares}) must sum to transaction amount (${this.amount})`));
    }
    
    // Validate percentage splits sum to 100
    if (this.splitInfo.splitType === 'percentage') {
      const totalPercentage = this.splitInfo.participants.reduce((sum, p) => sum + (p.percentage || 0), 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return next(new Error(`Percentages must sum to 100, got ${totalPercentage}`));
      }
    }
  }
  
  next();
});

// Pre-find middleware to exclude soft-deleted transactions
transactionSchema.pre(/^find/, function(next) {
  // Only exclude deleted transactions if not explicitly querying for them
  if (!this.getQuery().isDeleted) {
    this.find({ isDeleted: { $ne: true } });
  }
  next();
});

// Instance methods
transactionSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

transactionSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = undefined;
  return this.save();
};

// Instance method to get user's share in split
transactionSchema.methods.getUserShare = function(userId) {
  if (!this.splitInfo || !this.splitInfo.isShared) {
    return null;
  }
  
  const participant = this.splitInfo.participants.find(
    p => p.user && p.user.toString() === userId.toString()
  );
  
  return participant || null;
};

// Instance method to mark participant as settled
transactionSchema.methods.markParticipantSettled = function(userId) {
  if (!this.splitInfo || !this.splitInfo.isShared) {
    throw new Error('Transaction is not shared');
  }
  
  const participant = this.splitInfo.participants.find(
    p => p.user && p.user.toString() === userId.toString()
  );
  
  if (!participant) {
    throw new Error('User is not a participant in this transaction');
  }
  
  participant.settled = true;
  participant.settledAt = new Date();
  
  return this.save();
};

// Instance method to check if all participants are settled
transactionSchema.methods.isFullySettled = function() {
  if (!this.splitInfo || !this.splitInfo.isShared) {
    return true;
  }
  
  return this.splitInfo.participants.every(p => p.settled);
};

// Instance method to check if user is a participant
transactionSchema.methods.isParticipant = function(userId) {
  if (!this.splitInfo || !this.splitInfo.isShared) {
    return false;
  }
  
  return this.splitInfo.participants.some(
    p => p.user && p.user.toString() === userId.toString()
  );
};

// Static methods
transactionSchema.statics.getMonthlyTotal = function(userId, year, month, type) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        type: type,
        date: { $gte: startDate, $lte: endDate },
        isDeleted: { $ne: true }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
};

transactionSchema.statics.getCategoryBreakdown = function(userId, startDate, endDate, type = 'expense') {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        type: type,
        date: { $gte: startDate, $lte: endDate },
        isDeleted: { $ne: true }
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    {
      $sort: { total: -1 }
    },
    {
      $project: {
        category: '$_id',
        total: 1,
        count: 1,
        avgAmount: { $round: ['$avgAmount', 2] },
        _id: 0
      }
    }
  ]);
};

transactionSchema.statics.getSpendingTrends = function(userId, startDate, endDate, groupBy = 'day') {
  let dateFormat;
  let groupId;
  
  switch (groupBy) {
    case 'day':
      dateFormat = '%Y-%m-%d';
      groupId = { $dateToString: { format: dateFormat, date: '$date' } };
      break;
    case 'week':
      groupId = { 
        year: { $year: '$date' },
        week: { $week: '$date' }
      };
      break;
    case 'month':
      groupId = {
        year: { $year: '$date' },
        month: { $month: '$date' }
      };
      break;
    default:
      dateFormat = '%Y-%m-%d';
      groupId = { $dateToString: { format: dateFormat, date: '$date' } };
  }
  
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
        isDeleted: { $ne: true }
      }
    },
    {
      $group: {
        _id: groupId,
        income: {
          $sum: {
            $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
          }
        },
        expenses: {
          $sum: {
            $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
          }
        },
        transactionCount: { $sum: 1 }
      }
    },
    {
      $addFields: {
        balance: { $subtract: ['$income', '$expenses'] }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);
};

// Clean up expired recurring transactions
transactionSchema.statics.cleanupExpiredRecurring = function() {
  return this.updateMany(
    {
      'recurring.endDate': { $lt: new Date() },
      'recurring.isActive': true
    },
    {
      $set: { 'recurring.isActive': false }
    }
  );
};

// Get shared transactions between two users
transactionSchema.statics.getSharedBetweenUsers = function(userId1, userId2, filters = {}) {
  const query = {
    'splitInfo.isShared': true,
    $or: [
      {
        userId: userId1,
        'splitInfo.participants.user': userId2
      },
      {
        userId: userId2,
        'splitInfo.participants.user': userId1
      }
    ],
    isDeleted: { $ne: true }
  };
  
  // Apply filters
  if (filters.startDate || filters.endDate) {
    query.date = {};
    if (filters.startDate) query.date.$gte = filters.startDate;
    if (filters.endDate) query.date.$lte = filters.endDate;
  }
  
  if (filters.category) {
    query.category = filters.category;
  }
  
  if (filters.settled !== undefined) {
    if (filters.settled) {
      query['splitInfo.participants'] = {
        $not: {
          $elemMatch: {
            user: new mongoose.Types.ObjectId(userId1),
            settled: false
          }
        }
      };
    } else {
      query['splitInfo.participants'] = {
        $elemMatch: {
          user: new mongoose.Types.ObjectId(userId1),
          settled: false
        }
      };
    }
  }
  
  return this.find(query)
    .populate('userId', 'uid name email profilePicture')
    .populate('friendId', 'uid name email profilePicture')
    .populate('splitInfo.paidBy', 'uid name email profilePicture')
    .populate('splitInfo.participants.user', 'uid name email profilePicture')
    .sort({ date: -1 });
};

// Get shared transactions for a user
transactionSchema.statics.getSharedForUser = function(userId, filters = {}) {
  const query = {
    'splitInfo.isShared': true,
    $or: [
      { userId: userId },
      { 'splitInfo.participants.user': userId }
    ],
    isDeleted: { $ne: true }
  };
  
  // Apply filters
  if (filters.startDate || filters.endDate) {
    query.date = {};
    if (filters.startDate) query.date.$gte = filters.startDate;
    if (filters.endDate) query.date.$lte = filters.endDate;
  }
  
  if (filters.groupId) {
    query['splitInfo.groupId'] = filters.groupId;
  }
  
  return this.find(query)
    .populate('userId', 'uid name email profilePicture')
    .populate('friendId', 'uid name email profilePicture')
    .populate('splitInfo.paidBy', 'uid name email profilePicture')
    .populate('splitInfo.participants.user', 'uid name email profilePicture')
    .populate('splitInfo.groupId', 'name type')
    .sort({ date: -1 });
};

// Get group transactions
transactionSchema.statics.getGroupTransactions = function(groupId, filters = {}) {
  const query = {
    'splitInfo.groupId': groupId,
    'splitInfo.isShared': true,
    isDeleted: { $ne: true }
  };
  
  // Apply filters
  if (filters.startDate || filters.endDate) {
    query.date = {};
    if (filters.startDate) query.date.$gte = filters.startDate;
    if (filters.endDate) query.date.$lte = filters.endDate;
  }
  
  if (filters.category) {
    query.category = filters.category;
  }
  
  return this.find(query)
    .populate('userId', 'uid name email profilePicture')
    .populate('splitInfo.paidBy', 'uid name email profilePicture')
    .populate('splitInfo.participants.user', 'uid name email profilePicture')
    .sort({ date: -1 });
};

// Calculate balance between two users from shared transactions
transactionSchema.statics.calculateBalanceBetweenUsers = async function(userId1, userId2) {
  const transactions = await this.getSharedBetweenUsers(userId1, userId2);
  
  let balance = 0;
  
  transactions.forEach(transaction => {
    const user1Share = transaction.getUserShare(userId1);
    const user2Share = transaction.getUserShare(userId2);
    
    // Skip if either user is not a participant
    if (!user1Share || !user2Share) return;
    
    const paidByUser1 = transaction.splitInfo.paidBy.toString() === userId1.toString();
    const paidByUser2 = transaction.splitInfo.paidBy.toString() === userId2.toString();
    
    if (paidByUser1) {
      // User1 paid, so User2 owes User1 their share
      // But User1 also owes for their own share, so net effect is User2's share
      balance += user2Share.share;
    } else if (paidByUser2) {
      // User2 paid, so User1 owes User2 their share
      // But User2 also owes for their own share, so net effect is User1's share (negative)
      balance -= user1Share.share;
    } else {
      // Third party paid - both users owe their respective shares to the payer
      // In terms of balance between user1 and user2, this doesn't affect their mutual balance
      // unless they settle with each other instead of the payer
      // For now, we don't include third-party payments in bilateral balance
      // This could be enhanced later to support complex settlement scenarios
    }
  });
  
  return balance; // Positive: user2 owes user1, Negative: user1 owes user2
};

module.exports = mongoose.model('Transaction', transactionSchema);
