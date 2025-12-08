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
      return { ...state, transactions: action.payload, isLoading: false };
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
      };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
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
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await transactionAPI.getAll(user.id || user._id);
      dispatch({ type: 'SET_TRANSACTIONS', payload: response.data });
    } catch (error) {
      console.error('Error loading transactions:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user?._id]);

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
    // Prevent excessive refresh calls (minimum 2 seconds between calls)
    if (!force && now - lastRefreshTime.current < 2000) {
      console.log('[TransactionContext] Refresh throttled, skipping...');
      return;
    }
    
    lastRefreshTime.current = now;
    console.log('[TransactionContext] Refreshing data...');
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await Promise.all([
        loadTransactions(),
        loadSummary(),
        loadCategoryBreakdown()
      ]);
      console.log('[TransactionContext] Data refreshed successfully, transactions:', state.transactions.length);
    } catch (error) {
      console.error('[TransactionContext] Error refreshing data:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user?._id, loadTransactions, loadSummary, loadCategoryBreakdown]);

  // Enhanced transaction operations with auto-refresh
  const addTransaction = useCallback(async (transactionData) => {
    console.log('[TransactionContext] Adding transaction with data:', transactionData);
    if (!user?._id) return { success: false, error: 'User not authenticated' };
    try {
      const response = await transactionAPI.create({
        ...transactionData,
        userId: user.id || user._id
      });
      
      console.log('[TransactionContext] Transaction API response:', response);
      // Handle both response formats
      const transaction = response.data || response;
      dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
      
      // Auto-refresh summary and breakdown
      await Promise.all([
        loadSummary(),
        loadCategoryBreakdown()
      ]);
      
      // Trigger full refresh after a short delay to ensure backend consistency
      setTimeout(() => refreshData(true), 500);
      
      return { success: true, data: transaction };
    } catch (error) {
      console.error('[TransactionContext] Error adding transaction:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to add transaction';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [user?._id, loadSummary, loadCategoryBreakdown, refreshData]);

  const updateTransaction = useCallback(async (id, transactionData) => {
    try {
      const response = await transactionAPI.update(id, transactionData);
      dispatch({ type: 'UPDATE_TRANSACTION', payload: response.data });
      
      // Auto-refresh summary and breakdown
      await Promise.all([
        loadSummary(),
        loadCategoryBreakdown()
      ]);
      
      // Trigger full refresh after a short delay to ensure backend consistency
      setTimeout(() => refreshData(true), 500);
      
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  }, [loadSummary, loadCategoryBreakdown, refreshData]);

  const deleteTransaction = useCallback(async (id) => {
    try {
      await transactionAPI.delete(id);
      dispatch({ type: 'DELETE_TRANSACTION', payload: id });
      
      // Auto-refresh summary and breakdown
      await Promise.all([
        loadSummary(),
        loadCategoryBreakdown()
      ]);
      
      // Trigger full refresh after a short delay to ensure backend consistency
      setTimeout(() => refreshData(true), 500);
      
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  }, [loadSummary, loadCategoryBreakdown, refreshData]);

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
      if (syncData.transactions) {
        dispatch({ type: 'SET_TRANSACTIONS', payload: syncData.transactions });
      }
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

  // Periodic refresh when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user?._id) return;

    // Set up periodic refresh every 30 seconds
    const intervalId = setInterval(() => {
      refreshData(false); // Non-forced refresh
    }, 30000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAuthenticated, user?._id, refreshData]);

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