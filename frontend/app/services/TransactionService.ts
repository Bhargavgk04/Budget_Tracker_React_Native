import { Transaction, TransactionFormData, ApiResponse, PaginatedResponse } from '@/types';
import { API_ENDPOINTS } from '@/utils/constants';
import { ValidationUtils, transactionValidationSchemas } from '@/utils/validation';
import { apiService } from './ApiService';

export class TransactionService {
  // Cache configuration
  private static cacheConfig = {
    list: { key: 'transactions_list', ttl: 300000 }, // 5 minutes
    details: { key: 'transaction_details', ttl: 600000 }, // 10 minutes
  };

  // Get all transactions with pagination and filtering
  static async getTransactions(
    page: number = 1,
    limit: number = 20,
    filters?: {
      type?: 'income' | 'expense';
      category?: string;
      startDate?: Date;
      endDate?: Date;
      paymentMode?: string;
    }
  ): Promise<PaginatedResponse<Transaction>> {
    try {
      let endpoint = API_ENDPOINTS.TRANSACTIONS.LIST;
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      // Add filters to query params
      if (filters) {
        if (filters.type) params.append('type', filters.type);
        if (filters.category) params.append('category', filters.category);
        if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
        if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
        if (filters.paymentMode) params.append('paymentMode', filters.paymentMode);
      }

      endpoint += `?${params.toString()}`;

      const cacheKey = `${this.cacheConfig.list.key}_${params.toString()}`;
      const response = await apiService.get<PaginatedResponse<Transaction>>(
        endpoint,
        { ...this.cacheConfig.list, key: cacheKey }
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch transactions');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch transactions');
    }
  }

  // Get transaction by ID
  static async getTransactionById(id: string): Promise<Transaction> {
    try {
      const endpoint = API_ENDPOINTS.TRANSACTIONS.LIST + `/${id}`;
      const cacheKey = `${this.cacheConfig.details.key}_${id}`;
      
      const response = await apiService.get<Transaction>(
        endpoint,
        { ...this.cacheConfig.details, key: cacheKey }
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Transaction not found');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch transaction');
    }
  }

  // Create new transaction
  static async createTransaction(transactionData: TransactionFormData): Promise<Transaction> {
    try {
      // Validate data
      const validation = ValidationUtils.validateData(
        transactionValidationSchemas.create,
        {
          ...transactionData,
          amount: parseFloat(transactionData.amount),
        }
      );

      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid transaction data');
      }

      const response = await apiService.post<Transaction>(
        API_ENDPOINTS.TRANSACTIONS.CREATE,
        validation.value
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create transaction');
      }

      // Clear relevant caches
      await this.clearTransactionCaches();

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create transaction');
    }
  }

  // Update transaction
  static async updateTransaction(id: string, updates: Partial<TransactionFormData>): Promise<Transaction> {
    try {
      // Validate updates
      const validation = ValidationUtils.validateData(
        transactionValidationSchemas.update,
        updates.amount ? { ...updates, amount: parseFloat(updates.amount) } : updates
      );

      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid update data');
      }

      const endpoint = API_ENDPOINTS.TRANSACTIONS.UPDATE.replace(':id', id);
      const response = await apiService.put<Transaction>(endpoint, validation.value);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update transaction');
      }

      // Clear relevant caches
      await this.clearTransactionCaches();

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update transaction');
    }
  }

  // Delete transaction
  static async deleteTransaction(id: string): Promise<void> {
    try {
      const endpoint = API_ENDPOINTS.TRANSACTIONS.DELETE.replace(':id', id);
      const response = await apiService.delete(endpoint);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete transaction');
      }

      // Clear relevant caches
      await this.clearTransactionCaches();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete transaction');
    }
  }

  // Search transactions
  static async searchTransactions(
    query: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<Transaction>> {
    try {
      const endpoint = `${API_ENDPOINTS.TRANSACTIONS.SEARCH}?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
      
      const response = await apiService.get<PaginatedResponse<Transaction>>(endpoint);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Search failed');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Search failed');
    }
  }

  // Analytics removed - calculate client-side from transactions if needed

  // Export transactions
  static async exportTransactions(
    format: 'pdf' | 'excel',
    filters?: {
      startDate?: Date;
      endDate?: Date;
      category?: string;
      type?: 'income' | 'expense';
    }
  ): Promise<{ downloadUrl: string; fileName: string }> {
    try {
      const params = new URLSearchParams({ format });

      if (filters) {
        if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
        if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
        if (filters.category) params.append('category', filters.category);
        if (filters.type) params.append('type', filters.type);
      }

      const endpoint = `${API_ENDPOINTS.TRANSACTIONS.EXPORT}?${params.toString()}`;
      const response = await apiService.get<{ downloadUrl: string; fileName: string }>(endpoint);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Export failed');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Export failed');
    }
  }

  // Bulk create transactions
  static async bulkCreateTransactions(transactions: TransactionFormData[]): Promise<Transaction[]> {
    try {
      // Validate all transactions
      const validatedTransactions = transactions.map(transaction => {
        const validation = ValidationUtils.validateData(
          transactionValidationSchemas.create,
          {
            ...transaction,
            amount: parseFloat(transaction.amount),
          }
        );

        if (!validation.isValid) {
          throw new Error(`Invalid transaction: ${validation.error}`);
        }

        return validation.value;
      });

      const response = await apiService.post<Transaction[]>(
        `${API_ENDPOINTS.TRANSACTIONS.CREATE}/bulk`,
        { transactions: validatedTransactions }
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Bulk create failed');
      }

      // Clear relevant caches
      await this.clearTransactionCaches();

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Bulk create failed');
    }
  }

  // Get recent transactions (cached for quick access)
  static async getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
    try {
      const cacheKey = `recent_transactions_${limit}`;
      const response = await apiService.get<any>(
        `${API_ENDPOINTS.TRANSACTIONS.LIST}?limit=${limit}&sort=date&order=desc`,
        { key: cacheKey, ttl: 60000 } // 1 minute cache
      );

      if (!response.success) {
        console.warn('Failed to fetch recent transactions:', response.error);
        return [];
      }

      // Handle different response structures
      let transactions: Transaction[] = [];
      
      if (Array.isArray(response.data)) {
        transactions = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        // Paginated response
        transactions = response.data.data;
      } else if (response.data && Array.isArray(response.data.transactions)) {
        // Alternative structure
        transactions = response.data.transactions;
      }

      return transactions.map((t: any) => ({
        ...t,
        id: t.id || t._id,
      }));
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      return []; // Return empty array instead of throwing
    }
  }

  // Get transactions by category
  static async getTransactionsByCategory(
    category: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Transaction[]> {
    try {
      const params = new URLSearchParams({ category });
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const endpoint = `${API_ENDPOINTS.TRANSACTIONS.LIST}?${params.toString()}`;
      const response = await apiService.get<PaginatedResponse<Transaction>>(endpoint);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch transactions');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch transactions');
    }
  }

  // Clear transaction-related caches
  private static async clearTransactionCaches(): Promise<void> {
    try {
      const cacheStatus = await apiService.getCacheStatus();
      const transactionCacheKeys = cacheStatus.keys.filter(key => 
        key.includes('transactions') || key.includes('recent')
      );

      // Clear specific caches (this would need to be implemented in ApiService)
      // For now, we'll clear all caches
      await apiService.clearCache();
    } catch (error) {
      console.warn('Failed to clear transaction caches:', error);
    }
  }

  // Sync offline transactions
  static async syncOfflineTransactions(): Promise<void> {
    try {
      await apiService.retryFailedRequests();
    } catch (error) {
      throw new Error('Failed to sync offline transactions');
    }
  }
}

export default TransactionService;
