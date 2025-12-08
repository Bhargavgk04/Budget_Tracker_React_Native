import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { transactionAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { AppState } from 'react-native';
import realtimeService from '../services/RealtimeService';

const TransactionContext = createContext();

const initialState = {
  transactions: [],
  isLoading: false,
  error: null,
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
        transactions: state.transactions.map(t => {
          // Handle both regular updates and optimistic update replacements
          if (t.id === action.payload.id || t._id === action.payload.id) {
            return { ...t, ...action.payload };
          }
          return t;
        }),
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
      };
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
      
      // Refresh transactions
      await loadTransactions();
      
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

  // Simple transaction operations - wait for server response
  const addTransaction = useCallback(async (transactionData) => {
    console.log('[TransactionContext] Adding transaction with data:', transactionData);
    if (!user?._id) return { success: false, error: 'User not authenticated' };
    
    try {
      // Send to server and wait for response
      const response = await transactionAPI.create({
        ...transactionData,
        userId: user.id || user._id
      });
      
      console.log('[TransactionContext] Transaction created successfully');
      
      // Immediately refresh transactions from server
      await loadTransactions();
      
      return { success: true, data: response.data || response };
    } catch (error) {
      console.error('[TransactionContext] Error adding transaction:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to add transaction';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [user?._id, loadTransactions]);

  const updateTransaction = useCallback(async (id, transactionData) => {
    try {
      await transactionAPI.update(id, transactionData);
      
      // Refresh transactions from server
      await loadTransactions();
      
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  }, [loadTransactions]);

  const deleteTransaction = useCallback(async (id) => {
    try {
      await transactionAPI.delete(id);
      
      // Refresh transactions from server
      await loadTransactions();
      
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  }, [loadTransactions]);

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

      // Update state with synced data - always use server data as source of truth
      if (syncData.transactions) {
        dispatch({ type: 'SET_TRANSACTIONS', payload: syncData.transactions });
      }
    });

    // Start real-time service
    realtimeService.start();

    return () => {
      unsubscribe();
      realtimeService.stop();
    };
  }, [isAuthenticated, user?._id]);

  // RealtimeService handles periodic refresh every 10 seconds

  // Load transactions when user is authenticated (only once on mount)
  useEffect(() => {
    if (isAuthenticated && user?._id && isInitialMount.current) {
      isInitialMount.current = false;
      loadTransactions();
    }
  }, [isAuthenticated, user?._id, loadTransactions]);

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