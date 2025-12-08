// This hook now uses the TransactionContext for unified state management
import { useTransactions as useTransactionContext } from '../context/TransactionContext';

export function useTransactions() {
  return useTransactionContext();
}

export default useTransactions;
