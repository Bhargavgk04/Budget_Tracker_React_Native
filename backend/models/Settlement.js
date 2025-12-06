const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
  payer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Payer is required'],
    index: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required'],
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be at least 0.01'],
    validate: {
      validator: function(value) {
        return Number.isFinite(value) && value > 0;
      },
      message: 'Amount must be a valid positive number'
    }
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: {
      values: ['cash', 'upi', 'card', 'bank_transfer', 'other'],
      message: 'Payment method must be one of: cash, upi, card, bank_transfer, other'
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'confirmed', 'disputed'],
      message: 'Status must be one of: pending, confirmed, disputed'
    },
    default: 'pending',
    index: true
  },
  date: {
    type: Date,
    default: Date.now,
    index: true,
    validate: {
      validator: function(value) {
        return value <= new Date();
      },
      message: 'Settlement date cannot be in the future'
    }
  },
  confirmedAt: Date,
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  disputeReason: {
    type: String,
    maxlength: 500
  },
  disputedAt: Date,
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    index: true,
    sparse: true
  },
  // Reference to transactions being settled
  relatedTransactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
settlementSchema.index({ payer: 1, recipient: 1, date: -1 });
settlementSchema.index({ payer: 1, status: 1 });
settlementSchema.index({ recipient: 1, status: 1 });
settlementSchema.index({ createdAt: -1 });

// Virtual for formatted amount
settlementSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(this.amount);
});

// Virtual to check if settlement is pending
settlementSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

// Virtual to check if settlement is confirmed
settlementSchema.virtual('isConfirmed').get(function() {
  return this.status === 'confirmed';
});

// Pre-save validation
settlementSchema.pre('save', function(next) {
  // Ensure payer and recipient are different
  if (this.payer.toString() === this.recipient.toString()) {
    return next(new Error('Payer and recipient cannot be the same user'));
  }
  
  // Update confirmedAt when status changes to confirmed
  if (this.isModified('status') && this.status === 'confirmed' && !this.confirmedAt) {
    this.confirmedAt = new Date();
  }
  
  // Update disputedAt when status changes to disputed
  if (this.isModified('status') && this.status === 'disputed' && !this.disputedAt) {
    this.disputedAt = new Date();
  }
  
  next();
});

// Instance method to confirm settlement
settlementSchema.methods.confirm = function(userId) {
  // Only recipient can confirm
  if (this.recipient.toString() !== userId.toString()) {
    throw new Error('Only the recipient can confirm this settlement');
  }
  
  this.status = 'confirmed';
  this.confirmedAt = new Date();
  this.confirmedBy = userId;
  return this.save();
};

// Instance method to dispute settlement
settlementSchema.methods.dispute = function(userId, reason) {
  // Either party can dispute
  const userIdStr = userId.toString();
  if (userIdStr !== this.payer.toString() && userIdStr !== this.recipient.toString()) {
    throw new Error('Only involved parties can dispute this settlement');
  }
  
  this.status = 'disputed';
  this.disputeReason = reason;
  this.disputedAt = new Date();
  return this.save();
};

// Instance method to check if user is involved
settlementSchema.methods.involvesUser = function(userId) {
  const userIdStr = userId.toString();
  return userIdStr === this.payer.toString() || userIdStr === this.recipient.toString();
};

// Static method to get settlements between two users
settlementSchema.statics.getBetweenUsers = function(userId1, userId2, filters = {}) {
  const query = {
    $or: [
      { payer: userId1, recipient: userId2 },
      { payer: userId2, recipient: userId1 }
    ]
  };
  
  // Apply filters
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.startDate || filters.endDate) {
    query.date = {};
    if (filters.startDate) query.date.$gte = filters.startDate;
    if (filters.endDate) query.date.$lte = filters.endDate;
  }
  
  return this.find(query)
    .populate('payer', 'uid name email profilePicture')
    .populate('recipient', 'uid name email profilePicture')
    .populate('confirmedBy', 'uid name')
    .sort({ date: -1 });
};

// Static method to get pending settlements for a user
settlementSchema.statics.getPendingForUser = function(userId) {
  return this.find({
    $or: [
      { payer: userId, status: 'pending' },
      { recipient: userId, status: 'pending' }
    ]
  })
  .populate('payer', 'uid name email profilePicture')
  .populate('recipient', 'uid name email profilePicture')
  .sort({ date: -1 });
};

// Static method to get settlements for a user
settlementSchema.statics.getForUser = function(userId, filters = {}) {
  const query = {
    $or: [
      { payer: userId },
      { recipient: userId }
    ]
  };
  
  // Apply filters
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.startDate || filters.endDate) {
    query.date = {};
    if (filters.startDate) query.date.$gte = filters.startDate;
    if (filters.endDate) query.date.$lte = filters.endDate;
  }
  
  if (filters.groupId) {
    query.groupId = filters.groupId;
  }
  
  return this.find(query)
    .populate('payer', 'uid name email profilePicture')
    .populate('recipient', 'uid name email profilePicture')
    .populate('confirmedBy', 'uid name')
    .sort({ date: -1 });
};

// Static method to calculate total settled amount between users
settlementSchema.statics.getTotalSettled = async function(userId1, userId2) {
  const result = await this.aggregate([
    {
      $match: {
        $or: [
          { payer: new mongoose.Types.ObjectId(userId1), recipient: new mongoose.Types.ObjectId(userId2) },
          { payer: new mongoose.Types.ObjectId(userId2), recipient: new mongoose.Types.ObjectId(userId1) }
        ],
        status: 'confirmed'
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
  
  return result.length > 0 ? result[0] : { total: 0, count: 0 };
};

module.exports = mongoose.model('Settlement', settlementSchema);
