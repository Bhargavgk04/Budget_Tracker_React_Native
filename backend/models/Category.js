const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    minlength: [2, 'Category name must be at least 2 characters'],
    maxlength: [30, 'Category name cannot exceed 30 characters']
  },
  icon: {
    type: String,
    required: [true, 'Category icon is required'],
    trim: true
  },
  color: {
    type: String,
    required: [true, 'Category color is required'],
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color']
  },
  type: {
    type: String,
    enum: ['income', 'expense', 'both'],
    default: 'expense'
  },
  budget: {
    limit: {
      type: Number,
      min: [0, 'Budget limit cannot be negative'],
      max: [999999999, 'Budget limit too large']
    },
    period: {
      type: String,
      enum: ['weekly', 'monthly', 'yearly'],
      default: 'monthly'
    },
    alertThreshold: {
      type: Number,
      min: [1, 'Alert threshold must be at least 1%'],
      max: [100, 'Alert threshold cannot exceed 100%'],
      default: 80
    },
    spent: {
      type: Number,
      default: 0,
      min: [0, 'Spent amount cannot be negative']
    },
    lastReset: {
      type: Date,
      default: Date.now
    }
  },
  isDefault: {
    type: Boolean,
    default: false,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  subcategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: 20
  }],
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUsed: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes
categorySchema.index({ userId: 1, name: 1 }, { unique: true });
categorySchema.index({ userId: 1, type: 1, isActive: 1 });
categorySchema.index({ userId: 1, isDefault: 1 });
categorySchema.index({ userId: 1, sortOrder: 1 });
categorySchema.index({ userId: 1, usageCount: -1 });

// Virtual for budget utilization percentage
categorySchema.virtual('budgetUtilization').get(function() {
  if (!this.budget || !this.budget.limit) return 0;
  return Math.round((this.budget.spent / this.budget.limit) * 100);
});

// Virtual for budget status
categorySchema.virtual('budgetStatus').get(function() {
  if (!this.budget || !this.budget.limit) return 'none';
  
  const utilization = this.budgetUtilization;
  
  if (utilization >= 100) return 'exceeded';
  if (utilization >= this.budget.alertThreshold) return 'warning';
  return 'good';
});

// Virtual for remaining budget
categorySchema.virtual('budgetRemaining').get(function() {
  if (!this.budget || !this.budget.limit) return 0;
  return Math.max(0, this.budget.limit - this.budget.spent);
});

// Pre-save middleware
categorySchema.pre('save', function(next) {
  // Ensure default categories cannot be deleted
  if (this.isDefault && !this.isActive) {
    return next(new Error('Default categories cannot be deactivated'));
  }
  
  // Update last used timestamp if usage count increased
  if (this.isModified('usageCount') && this.usageCount > 0) {
    this.lastUsed = new Date();
  }
  
  next();
});

// Pre-validate middleware
categorySchema.pre('validate', function(next) {
  // Ensure category name is unique per user
  if (this.isModified('name')) {
    this.constructor.findOne({
      userId: this.userId,
      name: this.name,
      _id: { $ne: this._id }
    }).then(existingCategory => {
      if (existingCategory) {
        this.invalidate('name', 'Category name must be unique');
      }
      next();
    }).catch(next);
  } else {
    next();
  }
});

// Instance methods
categorySchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

categorySchema.methods.updateBudgetSpent = async function(amount) {
  if (!this.budget) return this;
  
  this.budget.spent += amount;
  
  // Check if budget period has reset
  const now = new Date();
  const lastReset = this.budget.lastReset;
  let shouldReset = false;
  
  switch (this.budget.period) {
    case 'weekly':
      const weeksDiff = Math.floor((now - lastReset) / (7 * 24 * 60 * 60 * 1000));
      shouldReset = weeksDiff >= 1;
      break;
    case 'monthly':
      shouldReset = now.getMonth() !== lastReset.getMonth() || 
                   now.getFullYear() !== lastReset.getFullYear();
      break;
    case 'yearly':
      shouldReset = now.getFullYear() !== lastReset.getFullYear();
      break;
  }
  
  if (shouldReset) {
    this.budget.spent = Math.max(0, amount); // Reset and add current amount
    this.budget.lastReset = now;
  }
  
  return this.save();
};

categorySchema.methods.resetBudget = function() {
  if (this.budget) {
    this.budget.spent = 0;
    this.budget.lastReset = new Date();
  }
  return this.save();
};

// Static methods
categorySchema.statics.getDefaultCategories = function() {
  return [
    // Expense categories
    { name: 'Food & Dining', icon: 'restaurant', color: '#FF6B6B', type: 'expense', isDefault: true },
    { name: 'Transportation', icon: 'directions-car', color: '#4ECDC4', type: 'expense', isDefault: true },
    { name: 'Shopping', icon: 'shopping-cart', color: '#45B7D1', type: 'expense', isDefault: true },
    { name: 'Entertainment', icon: 'movie', color: '#96CEB4', type: 'expense', isDefault: true },
    { name: 'Bills & Utilities', icon: 'receipt', color: '#FFEAA7', type: 'expense', isDefault: true },
    { name: 'Healthcare', icon: 'local-hospital', color: '#DDA0DD', type: 'expense', isDefault: true },
    { name: 'Education', icon: 'school', color: '#98D8C8', type: 'expense', isDefault: true },
    { name: 'Travel', icon: 'flight', color: '#F7DC6F', type: 'expense', isDefault: true },
    { name: 'Groceries', icon: 'local-grocery-store', color: '#BB8FCE', type: 'expense', isDefault: true },
    { name: 'Fuel', icon: 'local-gas-station', color: '#85C1E9', type: 'expense', isDefault: true },
    
    // Income categories
    { name: 'Salary', icon: 'work', color: '#2ECC71', type: 'income', isDefault: true },
    { name: 'Business', icon: 'business', color: '#3498DB', type: 'income', isDefault: true },
    { name: 'Investment', icon: 'trending-up', color: '#9B59B6', type: 'income', isDefault: true },
    { name: 'Freelance', icon: 'computer', color: '#E67E22', type: 'income', isDefault: true },
    { name: 'Gift', icon: 'card-giftcard', color: '#E74C3C', type: 'income', isDefault: true },
    { name: 'Other Income', icon: 'attach-money', color: '#95A5A6', type: 'income', isDefault: true }
  ];
};

categorySchema.statics.createDefaultCategories = async function(userId) {
  const defaultCategories = this.getDefaultCategories();
  const categories = defaultCategories.map((cat, index) => ({
    ...cat,
    userId,
    sortOrder: index
  }));
  
  return this.insertMany(categories);
};

categorySchema.statics.getMostUsed = function(userId, limit = 10) {
  return this.find({
    userId,
    isActive: true,
    usageCount: { $gt: 0 }
  })
  .sort({ usageCount: -1, lastUsed: -1 })
  .limit(limit);
};

categorySchema.statics.getBudgetAlerts = function(userId) {
  return this.find({
    userId,
    isActive: true,
    'budget.limit': { $exists: true, $gt: 0 }
  }).then(categories => {
    return categories.filter(category => {
      const utilization = category.budgetUtilization;
      return utilization >= category.budget.alertThreshold;
    });
  });
};

// Reset all budgets for a specific period
categorySchema.statics.resetBudgetsByPeriod = function(period) {
  const now = new Date();
  let query = {};
  
  switch (period) {
    case 'weekly':
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      query = {
        'budget.period': 'weekly',
        'budget.lastReset': { $lt: weekStart }
      };
      break;
    case 'monthly':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      query = {
        'budget.period': 'monthly',
        'budget.lastReset': { $lt: monthStart }
      };
      break;
    case 'yearly':
      const yearStart = new Date(now.getFullYear(), 0, 1);
      query = {
        'budget.period': 'yearly',
        'budget.lastReset': { $lt: yearStart }
      };
      break;
  }
  
  return this.updateMany(query, {
    $set: {
      'budget.spent': 0,
      'budget.lastReset': new Date()
    }
  });
};

module.exports = mongoose.model('Category', categorySchema);