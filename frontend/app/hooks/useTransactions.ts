import { useState, useEffect } from 'react';
import { Transaction } from '@/types';
import TransactionService from '@/services/TransactionService';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await TransactionService.getTransactions();
      setTransactions(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const addTransaction = async (transactionData: any) => {
    try {
      const newTransaction = await TransactionService.createTransaction(transactionData);
      setTransactions(prev => [newTransaction, ...prev]);
      return newTransaction;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add transaction');
      throw err;
    }
  };

  const updateTransaction = async (id: string, updates: any) => {
    try {
      const updatedTransaction = await TransactionService.updateTransaction(id, updates);
      setTransactions(prev => 
        prev.map(t => t.id === id ? updatedTransaction : t)
      );
      return updatedTransaction;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update transaction');
      throw err;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await TransactionService.deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete transaction');
      throw err;
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  return {
    transactions,
    isLoading,
    error,
    loadTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
export default useTransactions;
