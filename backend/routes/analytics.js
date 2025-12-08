const express = require('express');
const Transaction = require('../models/Transaction');
const Analytics = require('../models/Analytics');
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

// @desc    Get comprehensive analytics data for all chart types
// @route   GET /api/analytics/charts
// @access  Private
router.get('/charts', async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;
    
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 1);
    }
    
    // Generate or retrieve analytics
    let analytics = await Analytics.findOne({
      userId: req.user._id,
      period,
      date: { $gte: startDate }
    }).sort({ createdAt: -1 });
    
    // If no recent analytics or older than 1 hour, regenerate
    if (!analytics || (Date.now() - analytics.createdAt) > 3600000) {
      analytics = await Analytics.generateFromTransactions(
        req.user._id,
        startDate,
        endDate,
        period
      );
    }
    
    if (!analytics) {
      return res.status(200).json({
        success: true,
        data: {
          categoryMetrics: [],
          timeSeriesData: [],
          bubbleData: [],
          performanceMetrics: [],
          radarData: [],
          summary: {
            totalIncome: 0,
            totalExpense: 0,
            balance: 0,
            transactionCount: 0,
            avgTransactionSize: 0,
            topCategory: '',
            savingsRate: 0
          }
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        categoryMetrics: analytics.categoryMetrics,
        timeSeriesData: analytics.timeSeriesData,
        bubbleData: analytics.bubbleData,
        performanceMetrics: analytics.performanceMetrics,
        radarData: analytics.radarData,
        summary: analytics.summary
      }
    });
  } catch (error) {
    console.error('Analytics charts error:', error);
    next(error);
  }
});

// @desc    Get specific chart data
// @route   GET /api/analytics/chart/:type
// @access  Private
router.get('/chart/:type', async (req, res, next) => {
  try {
    const { type } = req.params;
    const { period = 'month' } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 1);
    }
    
    let analytics = await Analytics.findOne({
      userId: req.user._id,
      period,
      date: { $gte: startDate }
    }).sort({ createdAt: -1 });
    
    if (!analytics || (Date.now() - analytics.createdAt) > 3600000) {
      analytics = await Analytics.generateFromTransactions(
        req.user._id,
        startDate,
        endDate,
        period
      );
    }
    
    if (!analytics) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    let data;
    switch (type) {
      case 'donut':
      case 'pie':
        data = analytics.categoryMetrics;
        break;
      case 'bar':
        data = analytics.timeSeriesData;
        break;
      case 'bubble':
        data = analytics.bubbleData;
        break;
      case 'bullet':
        data = analytics.performanceMetrics;
        break;
      case 'radar':
        data = analytics.radarData;
        break;
      default:
        data = analytics.categoryMetrics;
    }
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Chart data error:', error);
    next(error);
  }
});

module.exports = router;