const express = require('express');
const Category = require('../models/Category');

const router = express.Router();

// @desc    Get budget overview
// @route   GET /api/budgets
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const categories = await Category.find({
      userId: req.user._id,
      'budget.limit': { $exists: true, $gt: 0 },
      isActive: true
    }).lean();

    const budgets = categories.map(category => ({
      categoryId: category._id,
      categoryName: category.name,
      limit: category.budget.limit,
      spent: category.budget.spent,
      remaining: Math.max(0, category.budget.limit - category.budget.spent),
      utilization: Math.round((category.budget.spent / category.budget.limit) * 100),
      period: category.budget.period,
      alertThreshold: category.budget.alertThreshold,
      status: category.budget.spent >= category.budget.limit ? 'exceeded' :
              category.budget.spent >= (category.budget.limit * category.budget.alertThreshold / 100) ? 'warning' : 'good'
    }));

    res.status(200).json({
      success: true,
      data: budgets
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;