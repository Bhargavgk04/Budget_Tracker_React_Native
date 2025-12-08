import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { transactionAPI, analyticsAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { AppState } from 'react-native';
import realtimeService from '../services/RealtimeService';

const TransactionContext = createContext();

const initialState = {
  transactions: [],
  isLoading: false,
  error: null,
  summary: {
    income: 0,
    expense: 0,
    savings: 0,
    totalTransactions: 0,
  },
  categoryBreakdown: [],
};

const transactionReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_TRANSACTIONS':
      console.log('[TransactionContext] SET_TRANSACTIONS:', action.payload.length, 'transactions');
      return { ...state, transactions: action.payload, isLoading: false };
    case 'ADD_TRANSACTION':
      // Optimistically update summary when adding transaction
      const newTransaction = action.payload;
      console.log('[TransactionContext] ADD_TRANSACTION:', newTransaction.id, 'isOptimistic:', newTransaction.isOptimistic);
      const updatedSummary = { ...state.summary };
      
      if (newTransaction.type === 'income') {
        updatedSummary.income += newTransaction.amount || 0;
      } else if (newTransaction.type === 'expense') {
        updatedSummary.expense += newTransaction.amount || 0;
      }
      updatedSummary.savings = updatedSummary.income - updatedSummary.expense;
      updatedSummary.totalTransactions = (updatedSummary.totalTransactions || 0) + 1;
      
      const newTransactions = [action.payload, ...state.transactions];
      console.log('[TransactionContext] Total transactions after ADD:', newTransactions.length);
      
      return {
        ...state,
        transactions: newTransactions,
        summary: updatedSummary,
      };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t => {
          // Handle both regular updates and optimistic update replacements
          if (t.id === action.payload.id || t._id === action.payload.id) {
            return { ...t, ...action.payload };
          }
          return t;
        }),
      };
    case 'DELETE_TRANSACTION':
      // Optimistically update summary when deleting transaction
      console.log('[TransactionContext] DELETE_TRANSACTION:', action.payload);
      const deletedTransaction = state.transactions.find(t => t.id === action.payload);
      const deletedSummary = { ...state.summary };
      
      if (deletedTransaction) {
        console.log('[TransactionContext] Found transaction to delete:', deletedTransaction.id);
        if (deletedTransaction.type === 'income') {
          deletedSummary.income -= deletedTransaction.amount || 0;
        } else if (deletedTransaction.type === 'expense') {
          deletedSummary.expense -= deletedTransaction.amount || 0;
        }
        deletedSummary.savings = deletedSummary.income - deletedSummary.expense;
        deletedSummary.totalTransactions = Math.max(0, (deletedSummary.totalTransactions || 0) - 1);
      } else {
        console.log('[TransactionContext] Transaction not found for deletion');
      }
      
      const remainingTransactions = state.transactions.filter(t => t.id !== action.payload);
      console.log('[TransactionContext] Total transactions after DELETE:', remainingTransactions.length);
      
      return {
        ...state,
        transactions: remainingTransactions,
        summary: deletedSummary,
      };
    case 'SET_SUMMARY':
      return { ...state, summary: action.payload };
    case 'SET_CATEGORY_BREAKDOWN':
      return { ...state, categoryBreakdown: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

export const TransactionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(transactionReducer, initialState);
  const { user, isAuthenticated } = useAuth();
  const isInitialMount = useRef(true);
  const appState = useRef(AppState.currentState);
  const refreshTimeoutRef = useRef(null);
  const lastRefreshTime = useRef(0);

  // Memoize load functions to prevent infinite loops
  const loadTransactions = useCallback(async () => {
    if (!user?._id) return;
    try {
      const response = await transactionAPI.getAll(user.id || user._id);
      dispatch({ type: 'SET_TRANSACTIONS', payload: response.data });
    } catch (error) {
      console.error('Error loading transactions:', error);
      // Don't set error state for background refreshes
      if (!state.transactions.length) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    }
  }, [user?._id, state.transactions.length]);

  const loadSummary = useCallback(async () => {
    if (!user?._id) return;
    try {
      const response = await analyticsAPI.getSummary(user.id || user._id);
      dispatch({ type: 'SET_SUMMARY', payload: response.data });
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  }, [user?._id]);

  const loadCategoryBreakdown = useCallback(async () => {
    if (!user?._id) return;
    try {
      const response = await analyticsAPI.getCategoryBreakdown(user.id || user._id);
      dispatch({ type: 'SET_CATEGORY_BREAKDOWN', payload: response.data });
    } catch (error) {
      console.error('Error loading category breakdown:', error);
    }
  }, [user?._id]);

  // Enhanced refresh function with debouncing - DEFINED FIRST
  const refreshData = useCallback(async (force = false) => {
    if (!user?._id) {
      console.log('[TransactionContext] No user, skipping refresh');
      return;
    }
    
    const now = Date.now();
    // Prevent excessive refresh calls (minimum 3 seconds between calls)
    if (!force && now - lastRefreshTime.current < 3000) {
      console.log('[TransactionContext] Refresh throttled, skipping...');
      return;
    }
    
    lastRefreshTime.current = now;
    console.log('[TransactionContext] Refreshing data...');
    
    try {
      // Don't show loading for background refreshes
      if (force) {
        dispatch({ type: 'SET_LOADING', payload: true });
      }
      
      // Run refreshes in parallel but catch individual errors
      const results = await Promise.allSettled([
        loadTransactions(),
        loadSummary(),
        loadCategoryBreakdown()
      ]);
      
      // Log any failures but don't throw
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const names = ['transactions', 'summary', 'categoryBreakdown'];
          console.warn(`[TransactionContext] Failed to refresh ${names[index]}:`, result.reason);
        }
      });
      
      console.log('[TransactionContext] Data refresh completed');
    } catch (error) {
      console.error('[TransactionContext] Error refreshing data:', error);
      // Only set error for forced refreshes
      if (force) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    } finally {
      if (force) {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  }, [user?._id, loadTransactions, loadSummary, loadCategoryBreakdown]);

  // Enhanced transaction operations with optimistic updates
  const addTransaction = useCallback(async (transactionData) => {
    console.log('[TransactionContext] Adding transaction with data:', transactionData);
    if (!user?._id) return { success: false, error: 'User not authenticated' };
    
    // Create optimistic transaction with temporary ID
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimisticTransaction = {
      ...transactionData,
      id: tempId,
      _id: tempId,
      userId: user.id || user._id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isOptimistic: true // Flag to identify optimistic updates
    };
    
    // Immediately update UI (optimistic update)
    console.log('[TransactionContext] Adding optimistic transaction:', tempId);
    dispatch({ type: 'ADD_TRANSACTION', payload: optimisticTransaction });
    
    try {
      // Send to server
      const response = await transactionAPI.create({
        ...transactionData,
        userId: user.id || user._id
      });
      
      console.log('[TransactionContext] Transaction API response:', response);
      // Handle both response formats
      const serverTransaction = response.data || response;
      
      // Remove optimistic transaction
      console.log('[TransactionContext] Removing optimistic transaction:', tempId);
      dispatch({ type: 'DELETE_TRANSACTION', payload: tempId });
      
      // Add real transaction from server
      console.log('[TransactionContext] Adding server transaction:', serverTransaction.id || serverTransaction._id);
      dispatch({ type: 'ADD_TRANSACTION', payload: {
        ...serverTransaction,
        id: serverTransaction.id || serverTransaction._id,
        isOptimistic: false
      }});
      
      // Trigger a delayed sync to get updated analytics
      setTimeout(() => {
        realtimeService.triggerMutationSync();
      }, 1000);
      
      return { success: true, data: serverTransaction };
    } catch (error) {
      console.error('[TransactionContext] Error adding transaction:', error);
      
      // Remove optimistic transaction on error
      dispatch({ type: 'DELETE_TRANSACTION', payload: tempId });
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to add transaction';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [user?._id]);

  const updateTransaction = useCallback(async (id, transactionData) => {
    try {
      const response = await transactionAPI.update(id, transactionData);
      dispatch({ type: 'UPDATE_TRANSACTION', payload: response.data });
      
      // Trigger a batched sync via RealtimeService
      realtimeService.triggerMutationSync();
      
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  }, []);

  const deleteTransaction = useCallback(async (id) => {
    try {
      await transactionAPI.delete(id);
      dispatch({ type: 'DELETE_TRANSACTION', payload: id });
      
      // Trigger a batched sync via RealtimeService
      realtimeService.triggerMutationSync();
      
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  }, []);

  // Enhanced app state monitoring for auto-refresh
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      console.log('App state changed:', nextAppState);
      
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground, refresh data
        console.log('App became active, refreshing data...');
        refreshData(true);
      }
      
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [refreshData]);

  // Real-time service integration
  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      realtimeService.stop();
      return;
    }

    // Subscribe to real-time updates
    const unsubscribe = realtimeService.subscribe((syncData) => {
      if (syncData.error) {
        console.error('Real-time sync error:', syncData.error);
        dispatch({ type: 'SET_ERROR', payload: syncData.error });
        return;
      }

      // Update state with synced data
      console.log('[TransactionContext] Real-time sync received:', {
        transactions: syncData.transactions?.length,
        hasSummary: !!syncData.summary,
        hasCategoryBreakdown: !!syncData.categoryBreakdown,
        currentTransactions: state.transactions.length
      });
      
      // Only update transactions if we don't have more locally (prevents overwriting optimistic updates)
      if (syncData.transactions) {
        if (syncData.transactions.length >= state.transactions.length) {
          console.log('[TransactionContext] Updating transactions from sync');
          dispatch({ type: 'SET_TRANSACTIONS', payload: syncData.transactions });
        } else {
          console.log('[TransactionContext] Skipping transaction update - local has more transactions');
        }
      }
      
      // Always update summary and breakdown (they're calculated server-side)
      if (syncData.summary) {
        dispatch({ type: 'SET_SUMMARY', payload: syncData.summary });
      }
      if (syncData.categoryBreakdown) {
        dispatch({ type: 'SET_CATEGORY_BREAKDOWN', payload: syncData.categoryBreakdown });
      }
    });

    // Start real-time service
    realtimeService.start();

    return () => {
      unsubscribe();
      realtimeService.stop();
    };
  }, [isAuthenticated, user?._id]);

  // Periodic refresh disabled - RealtimeService handles this
  // useEffect(() => {
  //   if (!isAuthenticated || !user?._id) return;
  //   const intervalId = setInterval(() => {
  //     refreshData(false);
  //   }, 30000);
  //   return () => {
  //     if (intervalId) clearInterval(intervalId);
  //   };
  // }, [isAuthenticated, user?._id, refreshData]);

  // Load transactions when user is authenticated (only once on mount)
  useEffect(() => {
    if (isAuthenticated && user?._id && isInitialMount.current) {
      isInitialMount.current = false;
      loadTransactions();
      loadSummary();
      loadCategoryBreakdown();
    }
  }, [isAuthenticated, user?._id, loadTransactions, loadSummary, loadCategoryBreakdown]);

  const value = {
    ...state,
    dispatch,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refreshData,
    loadTransactions,
    // Expose refresh control for manual refresh
    forceRefresh: () => refreshData(true),
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};