import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { transactionAPI, analyticsAPI } from '../services/api';
import { useAuth } from './AuthContext';

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

  const addTransaction = useCallback(async (transactionData) => {
    console.log('Adding transaction with data:', transactionData);
    if (!user?._id) return { success: false, error: 'User not authenticated' };
    try {
      const response = await transactionAPI.create({
        ...transactionData,
        userId: user.id || user._id
      });
      
      console.log('Transaction API response:', response);
      // Handle both response formats
      const transaction = response.data || response;
      dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
      
      // Refresh summary and breakdown
      await Promise.all([
        loadSummary(),
        loadCategoryBreakdown()
      ]);
      
      return { success: true, data: transaction };
    } catch (error) {
      console.error('Error adding transaction:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to add transaction';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [user?._id]); // Simplified dependencies to prevent infinite loops

  const updateTransaction = useCallback(async (id, transactionData) => {
    try {
      const response = await transactionAPI.update(id, transactionData);
      dispatch({ type: 'UPDATE_TRANSACTION', payload: response.data });
      
      // Refresh summary and breakdown
      await Promise.all([
        loadSummary(),
        loadCategoryBreakdown()
      ]);
      
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  }, [loadSummary, loadCategoryBreakdown]);

  const deleteTransaction = useCallback(async (id) => {
    try {
      await transactionAPI.delete(id);
      dispatch({ type: 'DELETE_TRANSACTION', payload: id });
      
      // Refresh summary and breakdown
      await Promise.all([
        loadSummary(),
        loadCategoryBreakdown()
      ]);
      
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  }, [loadSummary, loadCategoryBreakdown]);

  const refreshData = useCallback(() => {
    if (!user?._id) return;
    loadTransactions();
    loadSummary();
    loadCategoryBreakdown();
  }, [user?._id, loadTransactions, loadSummary, loadCategoryBreakdown]);

  // Load transactions when user is authenticated (only once on mount)
  useEffect(() => {
    if (isAuthenticated && user?._id && isInitialMount.current) {
      isInitialMount.current = false;
      loadTransactions();
      loadSummary();
      loadCategoryBreakdown();
    }
  }, [isAuthenticated, user?._id, loadTransactions, loadSummary, loadCategoryBreakdown]); // Fixed: Added missing dependencies

  const value = {
    ...state,
    dispatch,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refreshData,
    loadTransactions,
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