const express = require('express');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { 
  validateCreateTransaction, 
  validateUpdateTransaction,
  validateTransactionQuery,
  validateObjectId 
} = require('../middleware/validation');

const router = express.Router();

// @desc    Get all transactions for user
// @route   GET /api/transactions
// @access  Private
router.get('/', validateTransactionQuery, async (req, res, next) => {
  try {
    const {
      page,
      limit,
      type,
      category,
      startDate,
      endDate,
      paymentMode,
      sort,
      order
    } = req.query;

    // Build query
    const query = { userId: req.user._id };
    
    if (type) query.type = type;
    if (category) query.category = category;
    if (paymentMode) query.paymentMode = paymentMode;
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
        console.log('[Backend] Start date filter:', startDate, '→', query.date.$gte);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
        console.log('[Backend] End date filter:', endDate, '→', query.date.$lte);
      }
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .lean({ virtuals: true }),
      Transaction.countDocuments(query)
    ]);

    console.log('[Backend] Query result:', {
      userId: req.user._id.toString(),
      dateFilter: query.date,
      found: transactions.length,
      total: total,
      sampleDates: transactions.slice(0, 3).map(t => t.date)
    });

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        data: transactions.map(t => ({ ...t, id: t.id || t._id?.toString?.() })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get transaction statistics
// @route   GET /api/transactions/stats
// @access  Private
router.get('/stats', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchQuery = { userId: req.user._id };
    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate);
    }

    const stats = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);

    const result = {
      income: { total: 0, count: 0, avgAmount: 0 },
      expense: { total: 0, count: 0, avgAmount: 0 }
    };

    stats.forEach(stat => {
      result[stat._id] = {
        total: stat.total,
        count: stat.count,
        avgAmount: Math.round(stat.avgAmount * 100) / 100
      };
    });

    result.balance = result.income.total - result.expense.total;
    result.totalTransactions = result.income.count + result.expense.count;

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
router.get('/:id', validateObjectId, async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
router.post('/', validateCreateTransaction, async (req, res, next) => {
  try {
    const User = require('../models/User');
    
    // Add user ID to transaction data
    const transactionData = {
      ...req.body,
      userId: req.user._id
    };

    // Handle friend UID if provided
    if (req.body.friendUid) {
      const friend = await User.findOne({ uid: req.body.friendUid });
      if (friend) {
        transactionData.friendId = friend._id;
        transactionData.friendUid = friend.uid;
      }
    }

    const transaction = await Transaction.create(transactionData);

    // Populate friend details if present
    if (transaction.friendId) {
      await transaction.populate('friendId', 'uid name email profilePicture');
    }

    // Update category usage count
    if (transaction.category) {
      await Category.findOneAndUpdate(
        { userId: req.user._id, name: transaction.category },
        { $inc: { usageCount: 1 }, lastUsed: new Date() }
      );
    }

    // Update category budget if it's an expense
    if (transaction.type === 'expense') {
      const category = await Category.findOne({
        userId: req.user._id,
        name: transaction.category,
        'budget.limit': { $exists: true }
      });

      if (category) {
        await category.updateBudgetSpent(transaction.amount);
      }
    }

    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Transaction created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
router.put('/:id', validateObjectId, validateUpdateTransaction, async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    // Store old values for budget adjustment
    const oldAmount = transaction.amount;
    const oldCategory = transaction.category;
    const oldType = transaction.type;

    // Update transaction
    Object.assign(transaction, req.body);
    await transaction.save();

    // Update category budgets if necessary
    if (oldType === 'expense' || transaction.type === 'expense') {
      // Handle old category budget adjustment
      if (oldType === 'expense' && oldCategory) {
        const oldCategoryDoc = await Category.findOne({
          userId: req.user._id,
          name: oldCategory,
          'budget.limit': { $exists: true }
        });
        if (oldCategoryDoc) {
          await oldCategoryDoc.updateBudgetSpent(-oldAmount);
        }
      }

      // Handle new category budget adjustment
      if (transaction.type === 'expense' && transaction.category) {
        const newCategoryDoc = await Category.findOne({
          userId: req.user._id,
          name: transaction.category,
          'budget.limit': { $exists: true }
        });
        if (newCategoryDoc) {
          await newCategoryDoc.updateBudgetSpent(transaction.amount);
        }
      }
    }

    res.status(200).json({
      success: true,
      data: transaction,
      message: 'Transaction updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
router.delete('/:id', validateObjectId, async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    // Adjust category budget if it's an expense
    if (transaction.type === 'expense') {
      const category = await Category.findOne({
        userId: req.user._id,
        name: transaction.category,
        'budget.limit': { $exists: true }
      });

      if (category) {
        await category.updateBudgetSpent(-transaction.amount);
      }
    }

    // Soft delete the transaction
    await transaction.softDelete();

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Search transactions
// @route   GET /api/transactions/search
// @access  Private
router.get('/search', async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const skip = (page - 1) * limit;

    // Use text search
    const [transactions, total] = await Promise.all([
      Transaction.find({
        userId: req.user._id,
        $text: { $search: q }
      })
      .sort({ score: { $meta: 'textScore' }, date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
      
      Transaction.countDocuments({
        userId: req.user._id,
        $text: { $search: q }
      })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        data: transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Bulk create transactions
// @route   POST /api/transactions/bulk
// @access  Private
router.post('/bulk', async (req, res, next) => {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Transactions array is required'
      });
    }

    if (transactions.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Cannot create more than 100 transactions at once'
      });
    }

    // Add user ID to all transactions
    const transactionsWithUserId = transactions.map(transaction => ({
      ...transaction,
      userId: req.user._id
    }));

    // Validate all transactions
    for (const transaction of transactionsWithUserId) {
      const { error } = require('../middleware/validation').schemas.createTransaction.validate(transaction);
      if (error) {
        return res.status(400).json({
          success: false,
          error: `Invalid transaction data: ${error.details[0].message}`
        });
      }
    }

    const createdTransactions = await Transaction.insertMany(transactionsWithUserId);

    // Update category usage counts
    const categoryUpdates = {};
    createdTransactions.forEach(transaction => {
      if (transaction.category) {
        categoryUpdates[transaction.category] = (categoryUpdates[transaction.category] || 0) + 1;
      }
    });

    // Bulk update category usage counts
    const categoryUpdatePromises = Object.entries(categoryUpdates).map(([categoryName, count]) =>
      Category.findOneAndUpdate(
        { userId: req.user._id, name: categoryName },
        { 
          $inc: { usageCount: count },
          lastUsed: new Date()
        }
      )
    );

    await Promise.all(categoryUpdatePromises);

    res.status(201).json({
      success: true,
      data: createdTransactions,
      message: `${createdTransactions.length} transactions created successfully`
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
