import React, { createContext, useContext, ReactNode, useState } from 'react';
import { transactionAPI } from '../services/api';

interface TransactionContextType {
  addTransaction: (data: any) => Promise<{ success: boolean; error?: string }>;
  transactions: any[];
  refreshTransactions: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

interface TransactionProviderProps {
  children: ReactNode;
}

export function TransactionProvider({ children }: TransactionProviderProps) {
  const [transactions, setTransactions] = useState<any[]>([]);

  const addTransaction = async (data: any) => {
    try {
      const response = await transactionAPI.create(data);
      if (response && response.data) {
        setTransactions(prev => [response.data, ...prev]);
        return { success: true };
      }
      return { success: false, error: 'Failed to add transaction' };
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      return { success: false, error: error.message || 'Failed to add transaction' };
    }
  };

  const refreshTransactions = async () => {
    try {
      const response = await transactionAPI.getAll();
      if (response && response.data) {
        setTransactions(response.data || []);
      }
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    }
  };

  const contextValue: TransactionContextType = {
    addTransaction,
    transactions,
    refreshTransactions,
  };

  return (
    <TransactionContext.Provider value={contextValue}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransaction(): TransactionContextType {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransaction must be used within a TransactionProvider');
  }
  return context;
}

export function useTransactions(): TransactionContextType {
  return useTransaction();
}

export default TransactionContext;