import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Category, Budget, FinancialSummary } from '@/types';

// Mock data service for demo mode
export class MockDataService {
  private static DEMO_TRANSACTIONS_KEY = 'demo_transactions';
  private static DEMO_CATEGORIES_KEY = 'demo_categories';
  private static DEMO_BUDGETS_KEY = 'demo_budgets';

  // Initialize demo data
  static async initializeDemoData(): Promise<void> {
    const existingTransactions = await this.getTransactions();
    if (existingTransactions.length === 0) {
      await this.seedDemoData();
    }
  }

  // Seed initial demo data
  private static async seedDemoData(): Promise<void> {
    const demoCategories: Category[] = [
      {
        id: '1',
        userId: 'demo-user-123',
        name: 'Shopping Mart',
        icon: 'shopping-cart',
        color: '#7C3AED',
        isDefault: true,
        createdAt: new Date(),
      },
      {
        id: '2',
        userId: 'demo-user-123',
        name: 'Food & Drinks',
        icon: 'restaurant',
        color: '#EF4444',
        isDefault: true,
        createdAt: new Date(),
      },
      {
        id: '3',
        userId: 'demo-user-123',
        name: 'Transport',
        icon: 'directions-car',
        color: '#F59E0B',
        isDefault: true,
        createdAt: new Date(),
      },
      {
        id: '4',
        userId: 'demo-user-123',
        name: 'Salary',
        icon: 'attach-money',
        color: '#10B981',
        isDefault: true,
        createdAt: new Date(),
      },
    ];

    const demoTransactions: Transaction[] = [
      {
        id: '1',
        userId: 'demo-user-123',
        amount: 250,
        category: 'Shopping Mart',
        type: 'expense',
        paymentMode: 'card',
        notes: 'Grocery Shopping',
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        userId: 'demo-user-123',
        amount: 250,
        category: 'Shopping Mart',
        type: 'income',
        paymentMode: 'upi',
        notes: 'Refund',
        date: new Date(Date.now() - 86400000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        userId: 'demo-user-123',
        amount: 250,
        category: 'Shopping Mart',
        type: 'expense',
        paymentMode: 'cash',
        notes: 'Weekly Shopping',
        date: new Date(Date.now() - 172800000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '4',
        userId: 'demo-user-123',
        amount: 250,
        category: 'Shopping Mart',
        type: 'expense',
        paymentMode: 'card',
        notes: 'Monthly Shopping',
        date: new Date(Date.now() - 259200000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '5',
        userId: 'demo-user-123',
        amount: 250,
        category: 'Shopping Mart',
        type: 'expense',
        paymentMode: 'upi',
        notes: 'Grocery Shopping',
        date: new Date(Date.now() - 345600000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await AsyncStorage.setItem(this.DEMO_CATEGORIES_KEY, JSON.stringify(demoCategories));
    await AsyncStorage.setItem(this.DEMO_TRANSACTIONS_KEY, JSON.stringify(demoTransactions));
  }

  // Get all transactions
  static async getTransactions(): Promise<Transaction[]> {
    try {
      const data = await AsyncStorage.getItem(this.DEMO_TRANSACTIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  // Get all categories
  static async getCategories(): Promise<Category[]> {
    try {
      const data = await AsyncStorage.getItem(this.DEMO_CATEGORIES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  // Get financial summary
  static async getFinancialSummary(period: 'today' | 'week' | 'month' | 'year' = 'month'): Promise<FinancialSummary> {
    const transactions = await this.getTransactions();
    const categories = await this.getCategories();
    
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const filteredTransactions = transactions.filter(t => new Date(t.date) >= startDate);
    
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const categoryBreakdown = categories.map(cat => {
      const amount = filteredTransactions
        .filter(t => t.category === cat.name && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        category: cat.name,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        color: cat.color,
        icon: cat.icon,
      };
    }).filter(cb => cb.amount > 0);

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      period: {
        type: period,
        startDate,
        endDate: now,
      },
      categoryBreakdown,
    };
  }

  // Add transaction
  static async addTransaction(transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const transactions = await this.getTransactions();
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      userId: 'demo-user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    transactions.unshift(newTransaction);
    await AsyncStorage.setItem(this.DEMO_TRANSACTIONS_KEY, JSON.stringify(transactions));
    return newTransaction;
  }

  // Update transaction
  static async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const transactions = await this.getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    
    if (index === -1) {
      throw new Error('Transaction not found');
    }
    
    transactions[index] = {
      ...transactions[index],
      ...updates,
      updatedAt: new Date(),
    };
    
    await AsyncStorage.setItem(this.DEMO_TRANSACTIONS_KEY, JSON.stringify(transactions));
    return transactions[index];
  }

  // Delete transaction
  static async deleteTransaction(id: string): Promise<void> {
    const transactions = await this.getTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    await AsyncStorage.setItem(this.DEMO_TRANSACTIONS_KEY, JSON.stringify(filtered));
  }

  // Add category
  static async addCategory(category: Omit<Category, 'id' | 'userId' | 'createdAt'>): Promise<Category> {
    const categories = await this.getCategories();
    const newCategory: Category = {
      ...category,
      id: Date.now().toString(),
      userId: 'demo-user-123',
      createdAt: new Date(),
    };
    
    categories.push(newCategory);
    await AsyncStorage.setItem(this.DEMO_CATEGORIES_KEY, JSON.stringify(categories));
    return newCategory;
  }

  // Clear all demo data
  static async clearDemoData(): Promise<void> {
    await AsyncStorage.multiRemove([
      this.DEMO_TRANSACTIONS_KEY,
      this.DEMO_CATEGORIES_KEY,
      this.DEMO_BUDGETS_KEY,
    ]);
  }
}
