import { useState, useCallback } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { useAuth } from '../context/AuthContext';

export const useRefreshControl = () => {
  const [refreshing, setRefreshing] = useState(false);
  const { refreshData } = useTransactions();
  const { user } = useAuth();

  const handleRefresh = useCallback(async (force = true) => {
    if (!user?._id) return;
    
    setRefreshing(true);
    try {
      await refreshData(force);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshData, user?._id]);

  return {
    refreshing,
    handleRefresh,
    setRefreshing
  };
};

export default useRefreshControl;
