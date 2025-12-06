const express = require('express');
const Transaction = require('../models/Transaction');
const { validateAnalyticsQuery } = require('../middleware/validation');

const router = express.Router();

// @desc    Get analytics summary
// @route   GET /api/analytics/summary
// @access  Private
router.get('/summary', validateAnalyticsQuery, async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy } = req.query;
    
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get basic totals
    const totals = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    let totalIncome = 0;
    let totalExpenses = 0;

    totals.forEach(item => {
      if (item._id === 'income') totalIncome = item.total;
      if (item._id === 'expense') totalExpenses = item.total;
    });

    // Get category breakdown for expenses
    const categoryBreakdown = await Transaction.getCategoryBreakdown(
      req.user._id, 
      start, 
      end, 
      'expense'
    );

    // Get spending trends
    const trends = await Transaction.getSpendingTrends(
      req.user._id,
      start,
      end,
      groupBy
    );

    res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        categoryBreakdown,
        trends
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;