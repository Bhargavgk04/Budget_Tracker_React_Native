import { Transaction, Category, Budget, FinancialSummary, CategoryBreakdown, TimePeriod, ChartData, PieChartData } from '@/types';
import { ValidationUtils } from './validation';
import { CHART_COLORS } from './constants';

export class DataTransformUtils {
  // Transform raw transaction data for display
  static transformTransactionForDisplay(transaction: Transaction): Transaction & {
    formattedAmount: string;
    formattedDate: string;
    categoryColor: string;
  } {
    return {
      ...transaction,
      formattedAmount: ValidationUtils.formatCurrency(transaction.amount),
      formattedDate: ValidationUtils.formatDate(new Date(transaction.date)),
      categoryColor: this.getCategoryColor(transaction.category),
    };
  }

  // Transform transactions list for virtualized rendering
  static transformTransactionsForList(
    transactions: Transaction[],
    categories: Category[]
  ): Array<Transaction & { 
    formattedAmount: string; 
    formattedDate: string; 
    categoryIcon: string;
    categoryColor: string;
  }> {
    const categoryMap = new Map(categories.map(cat => [cat.name, cat]));
    
    return transactions.map(transaction => {
      const category = categoryMap.get(transaction.category);
      return {
        ...transaction,
        formattedAmount: ValidationUtils.formatCurrency(transaction.amount),
        formattedDate: ValidationUtils.formatDate(new Date(transaction.date)),
        categoryIcon: category?.icon || 'help',
        categoryColor: category?.color || CHART_COLORS[0],
      };
    });
  }

  // Calculate financial summary from transactions
  static calculateFinancialSummary(
    transactions: Transaction[],
    period: TimePeriod,
    categories: Category[]
  ): FinancialSummary {
    const filteredTransactions = this.filterTransactionsByPeriod(transactions, period);
    
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpenses;
    
    const categoryBreakdown = this.calculateCategoryBreakdown(
      filteredTransactions.filter(t => t.type === 'expense'),
      categories
    );

    return {
      totalIncome,
      totalExpenses,
      balance,
      period,
      categoryBreakdown,
    };
  }

  // Calculate category-wise breakdown
  static calculateCategoryBreakdown(
    expenseTransactions: Transaction[],
    categories: Category[]
  ): CategoryBreakdown[] {
    const categoryMap = new Map(categories.map(cat => [cat.name, cat]));
    const categoryTotals = new Map<string, number>();
    
    // Calculate totals for each category
    expenseTransactions.forEach(transaction => {
      const current = categoryTotals.get(transaction.category) || 0;
      categoryTotals.set(transaction.category, current + transaction.amount);
    });
    
    const totalExpenses = Array.from(categoryTotals.values()).reduce((sum, amount) => sum + amount, 0);
    
    // Transform to CategoryBreakdown format
    return Array.from(categoryTotals.entries())
      .map(([categoryName, amount]) => {
        const category = categoryMap.get(categoryName);
        return {
          category: categoryName,
          amount,
          percentage: ValidationUtils.calculatePercentage(amount, totalExpenses),
          color: category?.color || CHART_COLORS[0],
          icon: category?.icon || 'help',
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }

  // Transform data for pie chart
  static transformToPieChartData(categoryBreakdown: CategoryBreakdown[]): PieChartData[] {
    return categoryBreakdown.map((item, index) => ({
      name: item.category,
      amount: item.amount,
      color: item.color,
      legendFontColor: '#333333',
      legendFontSize: 12,
    }));
  }

  // Transform data for line chart (spending trends)
  static transformToLineChartData(
    transactions: Transaction[],
    period: TimePeriod
  ): ChartData {
    const filteredTransactions = this.filterTransactionsByPeriod(transactions, period);
    const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');
    
    // Group by date
    const dailyTotals = new Map<string, number>();
    
    expenseTransactions.forEach(transaction => {
      const dateKey = ValidationUtils.formatDate(new Date(transaction.date), 'YYYY-MM-DD');
      const current = dailyTotals.get(dateKey) || 0;
      dailyTotals.set(dateKey, current + transaction.amount);
    });
    
    // Generate labels and data arrays
    const sortedDates = Array.from(dailyTotals.keys()).sort();
    const labels = sortedDates.map(date => {
      const d = new Date(date);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    });
    
    const data = sortedDates.map(date => dailyTotals.get(date) || 0);
    
    return {
      labels,
      datasets: [{
        data,
        color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  }

  // Filter transactions by time period
  static filterTransactionsByPeriod(transactions: Transaction[], period: TimePeriod): Transaction[] {
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= period.startDate && transactionDate <= period.endDate;
    });
  }

  // Generate time period from type
  static generateTimePeriod(type: 'today' | 'week' | 'month' | 'year' | 'custom', customStart?: Date, customEnd?: Date): TimePeriod {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);
    
    switch (type) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      
      case 'week':
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
      
      case 'custom':
        startDate = customStart || new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = customEnd || new Date(now);
        break;
      
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now);
    }
    
    return { type, startDate, endDate };
  }

  // Calculate budget progress
  static calculateBudgetProgress(
    budget: Budget,
    transactions: Transaction[]
  ): {
    spent: number;
    remaining: number;
    percentage: number;
    isOverBudget: boolean;
    daysRemaining: number;
  } {
    const period = this.getBudgetPeriod(budget);
    const relevantTransactions = this.filterTransactionsByPeriod(transactions, period)
      .filter(t => t.type === 'expense' && t.category === budget.category);
    
    const spent = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);
    const remaining = Math.max(0, budget.limit - spent);
    const percentage = ValidationUtils.calculatePercentage(spent, budget.limit);
    const isOverBudget = spent > budget.limit;
    
    // Calculate days remaining in budget period
    const now = new Date();
    const daysRemaining = Math.ceil((period.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      spent,
      remaining,
      percentage,
      isOverBudget,
      daysRemaining: Math.max(0, daysRemaining),
    };
  }

  // Get budget period dates
  private static getBudgetPeriod(budget: Budget): TimePeriod {
    const now = new Date();
    
    switch (budget.period) {
      case 'weekly':
        return this.generateTimePeriod('week');
      case 'monthly':
        return this.generateTimePeriod('month');
      case 'yearly':
        return this.generateTimePeriod('year');
      default:
        return this.generateTimePeriod('month');
    }
  }

  // Get category color by name
  private static getCategoryColor(categoryName: string): string {
    // This would typically look up from categories data
    // For now, return a default color based on hash
    const hash = categoryName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return CHART_COLORS[Math.abs(hash) % CHART_COLORS.length];
  }

  // Sort transactions by various criteria
  static sortTransactions(
    transactions: Transaction[],
    sortBy: 'date' | 'amount' | 'category',
    order: 'asc' | 'desc' = 'desc'
  ): Transaction[] {
    return [...transactions].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }
      
      return order === 'asc' ? comparison : -comparison;
    });
  }

  // Search transactions
  static searchTransactions(
    transactions: Transaction[],
    query: string,
    searchFields: ('notes' | 'category' | 'paymentMode')[] = ['notes', 'category']
  ): Transaction[] {
    if (!query.trim()) return transactions;
    
    const lowercaseQuery = query.toLowerCase();
    
    return transactions.filter(transaction => {
      return searchFields.some(field => {
        const value = transaction[field];
        return value && value.toLowerCase().includes(lowercaseQuery);
      });
    });
  }

  // Group transactions by date
  static groupTransactionsByDate(transactions: Transaction[]): Map<string, Transaction[]> {
    const grouped = new Map<string, Transaction[]>();
    
    transactions.forEach(transaction => {
      const dateKey = ValidationUtils.formatDate(new Date(transaction.date));
      const existing = grouped.get(dateKey) || [];
      grouped.set(dateKey, [...existing, transaction]);
    });
    
    return grouped;
  }

  // Calculate monthly trends
  static calculateMonthlyTrends(transactions: Transaction[], months: number = 6): {
    month: string;
    income: number;
    expenses: number;
    balance: number;
  }[] {
    const now = new Date();
    const trends = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= monthDate && tDate <= monthEnd;
      });
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      trends.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        income,
        expenses,
        balance: income - expenses,
      });
    }
    
    return trends;
  }
}