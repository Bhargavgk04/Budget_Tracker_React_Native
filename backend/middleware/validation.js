const Joi = require('joi');

// Validation schemas
const schemas = {
  // User schemas
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required()
      .messages({
        'string.pattern.base': 'Password must contain uppercase, lowercase, number and special character'
      }),
    rememberMe: Joi.boolean().optional(),
    platform: Joi.string().optional(),
    appVersion: Joi.string().optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    rememberMe: Joi.boolean().optional(),
    platform: Joi.string().optional(),
    appVersion: Joi.string().optional()
  }),

  // Transaction schemas
  createTransaction: Joi.object({
    amount: Joi.number().positive().max(999999999).precision(2).required(),
    category: Joi.string().required(),
    type: Joi.string().valid('income', 'expense').required(),
    paymentMode: Joi.string().valid('cash', 'upi', 'card', 'bank_transfer', 'other').required(),
    notes: Joi.string().max(500).allow('').optional(),
    date: Joi.date().max('now').required(),
    friendUid: Joi.string().optional(),
    friendId: Joi.string().optional(),
    splitInfo: Joi.object({
      isShared: Joi.boolean().required(),
      paidBy: Joi.string().required(),
      splitType: Joi.string().valid('equal', 'percentage', 'custom').required(),
      participants: Joi.array().items(
        Joi.object({
          _id: Joi.string().required(),
          uid: Joi.string().optional(),
          name: Joi.string().required(),
          amount: Joi.number().optional(),
          percentage: Joi.number().optional()
        })
      ).optional()
    }).optional(),
    recurring: Joi.object({
      frequency: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly').required(),
      interval: Joi.number().integer().min(1).max(365).required(),
      nextDue: Joi.date().min('now').required(),
      endDate: Joi.date().min(Joi.ref('nextDue')).optional(),
      isActive: Joi.boolean().default(true)
    }).optional()
  }),

  updateTransaction: Joi.object({
    amount: Joi.number().positive().max(999999999).precision(2).optional(),
    category: Joi.string().optional(),
    type: Joi.string().valid('income', 'expense').optional(),
    paymentMode: Joi.string().valid('cash', 'upi', 'card', 'bank_transfer', 'other').optional(),
    notes: Joi.string().max(500).optional(),
    date: Joi.date().max('now').optional()
  }),

  // Category schemas
  createCategory: Joi.object({
    name: Joi.string().min(2).max(30).required(),
    icon: Joi.string().required(),
    color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).required(),
    budget: Joi.object({
      limit: Joi.number().positive().required(),
      period: Joi.string().valid('weekly', 'monthly', 'yearly').required(),
      alertThreshold: Joi.number().min(1).max(100).default(80)
    }).optional()
  }),

  // Budget schemas
  createBudget: Joi.object({
    category: Joi.string().required(),
    limit: Joi.number().positive().max(999999999).required(),
    period: Joi.string().valid('weekly', 'monthly', 'yearly').required()
  }),

  // Query parameter schemas
  transactionQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    type: Joi.string().valid('income', 'expense').optional(),
    category: Joi.string().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    paymentMode: Joi.string().valid('cash', 'upi', 'card', 'bank_transfer', 'other').optional(),
    sort: Joi.string().valid('date', 'amount', 'category').default('date'),
    order: Joi.string().valid('asc', 'desc').default('desc')
  }),

  analyticsQuery: Joi.object({
    startDate: Joi.date().required(),
    endDate: Joi.date().min(Joi.ref('startDate')).required(),
    groupBy: Joi.string().valid('day', 'week', 'month').default('day')
  })
};

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        error: errorMessage,
        details: error.details
      });
    }

    // Replace the original data with validated data
    req[property] = value;
    next();
  };
};

// Export validation middleware functions
module.exports = {
  validateRegister: validate(schemas.register),
  validateLogin: validate(schemas.login),
  validateCreateTransaction: validate(schemas.createTransaction),
  validateUpdateTransaction: validate(schemas.updateTransaction),
  validateCreateCategory: validate(schemas.createCategory),
  validateCreateBudget: validate(schemas.createBudget),
  validateTransactionQuery: validate(schemas.transactionQuery, 'query'),
  validateAnalyticsQuery: validate(schemas.analyticsQuery, 'query'),
  
  // Custom validation functions
  validateObjectId: (req, res, next) => {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format'
      });
    }
    next();
  },

  validateDateRange: (req, res, next) => {
    const { startDate, endDate } = req.query;
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start > end) {
        return res.status(400).json({
          success: false,
          error: 'Start date must be before end date'
        });
      }
      
      // Limit date range to 1 year for performance
      const oneYear = 365 * 24 * 60 * 60 * 1000;
      if (end - start > oneYear) {
        return res.status(400).json({
          success: false,
          error: 'Date range cannot exceed 1 year'
        });
      }
    }
    
    next();
  }
};

// Export schemas for testing
module.exports.schemas = schemas;