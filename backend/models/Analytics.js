const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  // Category-based metrics for Donut/Pie charts
  categoryMetrics: [{
    category: String,
    value: Number,
    percentage: Number,
    color: String
  }],
  // Time-series data for Bar charts
  timeSeriesData: [{
    label: String,
    value: Number,
    date: Date
  }],
  // Multi-dimensional data for Bubble charts
  bubbleData: [{
    label: String,
    x: Number,  // e.g., spending amount
    y: Number,  // e.g., transaction count
    radius: Number,  // e.g., average transaction size
    color: String
  }],
  // Performance metrics for Bullet graphs
  performanceMetrics: [{
    label: String,
    value: Number,  // actual value
    target: Number,  // target/goal
    ranges: {
      poor: Number,
      satisfactory: Number,
      good: Number
    },
    marker: Number  // comparison marker
  }],
  // Multi-axis data for Radar charts
  radarData: [{
    axis: String,
    value: Number,
    maxValue: Number
  }],
  // Summary statistics
  summary: {
    totalIncome: { type: Number, default: 0 },
    totalExpense: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
    avgTransactionSize: { type: Number, default: 0 },
    topCategory: String,
    savingsRate: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Compound indexes
analyticsSchema.index({ userId: 1, period: 1, date: -1 });
analyticsSchema.index({ userId: 1, createdAt: -1 });

// Static method to generate analytics from transactions
analyticsSchema.statics.generateFromTransactions = async function(userId, startDate, endDate, period = 'monthly') {
  const Transaction = mongoose.model('Transaction');
  
  // Get all transactions in period
  const transactions = await Transaction.find({
    userId,
    date: { $gte: startDate, $lte: endDate },
    isDeleted: { $ne: true }
  }).sort({ date: 1 });
  
  if (transactions.length === 0) {
    return null;
  }
  
  // Calculate summary
  const summary = {
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactionCount: transactions.length,
    avgTransactionSize: 0,
    topCategory: '',
    savingsRate: 0
  };
  
  const categoryMap = new Map();
  const timeSeriesMap = new Map();
  const bubbleMap = new Map();
  
  transactions.forEach(t => {
    if (t.type === 'income') {
      summary.totalIncome += t.amount;
    } else {
      summary.totalExpense += t.amount;
      
      // Category metrics
      if (!categoryMap.has(t.category)) {
        categoryMap.set(t.category, { value: 0, count: 0 });
      }
      const cat = categoryMap.get(t.category);
      cat.value += t.amount;
      cat.count += 1;
    }
    
    // Time series data (group by day/week/month)
    const dateKey = t.date.toISOString().split('T')[0];
    if (!timeSeriesMap.has(dateKey)) {
      timeSeriesMap.set(dateKey, 0);
    }
    timeSeriesMap.set(dateKey, timeSeriesMap.get(dateKey) + (t.type === 'expense' ? t.amount : 0));
    
    // Bubble data (category-based)
    if (t.type === 'expense') {
      if (!bubbleMap.has(t.category)) {
        bubbleMap.set(t.category, { totalAmount: 0, count: 0, amounts: [] });
      }
      const bubble = bubbleMap.get(t.category);
      bubble.totalAmount += t.amount;
      bubble.count += 1;
      bubble.amounts.push(t.amount);
    }
  });
  
  summary.balance = summary.totalIncome - summary.totalExpense;
  summary.avgTransactionSize = summary.transactionCount > 0 
    ? (summary.totalIncome + summary.totalExpense) / summary.transactionCount 
    : 0;
  summary.savingsRate = summary.totalIncome > 0 
    ? ((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100 
    : 0;
  
  // Category metrics with colors
  const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#F43F5E', '#84CC16'];
  const categoryMetrics = Array.from(categoryMap.entries())
    .map(([category, data], index) => ({
      category,
      value: data.value,
      percentage: (data.value / summary.totalExpense) * 100,
      color: colors[index % colors.length]
    }))
    .sort((a, b) => b.value - a.value);
  
  if (categoryMetrics.length > 0) {
    summary.topCategory = categoryMetrics[0].category;
  }
  
  // Time series data
  const timeSeriesData = Array.from(timeSeriesMap.entries())
    .map(([dateStr, value]) => ({
      label: new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value,
      date: new Date(dateStr)
    }))
    .sort((a, b) => a.date - b.date);
  
  // Bubble data
  const bubbleData = Array.from(bubbleMap.entries())
    .map(([category, data], index) => {
      const avgAmount = data.totalAmount / data.count;
      return {
        label: category,
        x: data.totalAmount,  // total spending
        y: data.count,  // transaction count
        radius: avgAmount,  // average transaction size
        color: colors[index % colors.length]
      };
    })
    .sort((a, b) => b.x - a.x);
  
  // Performance metrics (budget vs actual)
  const performanceMetrics = categoryMetrics.slice(0, 5).map(cat => {
    const target = cat.value * 0.8;  // Target is 80% of current spending
    return {
      label: cat.category,
      value: cat.value,
      target: target,
      ranges: {
        poor: target * 1.5,
        satisfactory: target * 1.2,
        good: target
      },
      marker: target * 0.9
    };
  });
  
  // Radar data (spending distribution across categories)
  const topCategories = categoryMetrics.slice(0, 6);
  const maxCategoryValue = topCategories.length > 0 ? topCategories[0].value : 1;
  const radarData = topCategories.map(cat => ({
    axis: cat.category,
    value: cat.value,
    maxValue: maxCategoryValue
  }));
  
  // Create or update analytics record
  const analytics = await this.findOneAndUpdate(
    { userId, period, date: startDate },
    {
      userId,
      period,
      date: startDate,
      categoryMetrics,
      timeSeriesData,
      bubbleData,
      performanceMetrics,
      radarData,
      summary
    },
    { upsert: true, new: true }
  );
  
  return analytics;
};

module.exports = mongoose.model('Analytics', analyticsSchema);
