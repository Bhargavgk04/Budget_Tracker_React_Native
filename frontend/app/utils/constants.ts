import { Dimensions, Platform } from 'react-native';
import Constants from 'expo-constants';

// Dynamic base URL function
const getApiBaseUrl = (): string => {
  const FALLBACK_LOCAL_IP = '192.168.1.7';
  
  // Get the local network IP from Expo or use fallback
  const getLocalNetworkIP = (): string => {
    const debuggerHost = Constants.expoConfig?.hostUri;
    
    if (debuggerHost) {
      const ip = debuggerHost.split(':')[0];
      return ip;
    }
    
    return FALLBACK_LOCAL_IP;
  };

  // Detect if running in Expo Go on physical device
  const isExpoGo = (): boolean => {
    return Constants.appOwnership === 'expo';
  };

  // Auto-detect if running on physical device vs emulator
  const isPhysicalDevice = (): boolean => {
    if (Platform.OS === 'web') return false;
    
    if (isExpoGo()) {
      return true;
    }
    
    if (process.env.USE_PHYSICAL_DEVICE === 'true') {
      return true;
    }
    
    return Platform.OS === 'ios';
  };

  if (Platform.OS === 'android') {
    if (isPhysicalDevice()) {
      const ip = getLocalNetworkIP();
      return `http://${ip}:3000/api`;
    }
    return 'http://10.0.2.2:3000/api';
  }
  
  if (Platform.OS === 'ios') {
    if (isPhysicalDevice()) {
      const ip = getLocalNetworkIP();
      return `http://${ip}:3000/api`;
    }
    return 'https://budget-tracker-react-native-kjff.onrender.com/api';
  }
  
  return 'https://budget-tracker-react-native-kjff.onrender.com/api';
};

// Screen dimensions
export const SCREEN_DIMENSIONS = {
  width: Dimensions.get('window').width,
  height: Dimensions.get('window').height,
  scale: Dimensions.get('window').scale,
  fontScale: Dimensions.get('window').fontScale,
};

// Platform checks
export const IS_IOS = Platform.OS === 'ios';
export const IS_ANDROID = Platform.OS === 'android';

// Default categories with Material Design icons
export const DEFAULT_CATEGORIES = {
  EXPENSE: [
    { name: 'Food & Dining', icon: 'restaurant', color: '#FF6B6B' },
    { name: 'Transportation', icon: 'directions-car', color: '#4ECDC4' },
    { name: 'Shopping', icon: 'shopping-cart', color: '#45B7D1' },
    { name: 'Entertainment', icon: 'movie', color: '#96CEB4' },
    { name: 'Bills & Utilities', icon: 'receipt', color: '#FFEAA7' },
    { name: 'Healthcare', icon: 'local-hospital', color: '#DDA0DD' },
    { name: 'Education', icon: 'school', color: '#98D8C8' },
    { name: 'Travel', icon: 'flight', color: '#F7DC6F' },
    { name: 'Groceries', icon: 'local-grocery-store', color: '#BB8FCE' },
    { name: 'Fuel', icon: 'local-gas-station', color: '#85C1E9' },
  ],
  INCOME: [
    { name: 'Salary', icon: 'work', color: '#2ECC71' },
    { name: 'Business', icon: 'business', color: '#3498DB' },
    { name: 'Investment', icon: 'trending-up', color: '#9B59B6' },
    { name: 'Freelance', icon: 'computer', color: '#E67E22' },
    { name: 'Gift', icon: 'card-giftcard', color: '#E74C3C' },
    { name: 'Other', icon: 'attach-money', color: '#95A5A6' },
  ],
} as const;

// Payment modes
export const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash', icon: 'money' },
  { value: 'online', label: 'Online', icon: 'payment' },
] as const;

// Currencies
export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
] as const;

// Time periods for analytics
export const TIME_PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
] as const;

// Recurring frequencies
export const RECURRING_FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
] as const;

// Budget alert thresholds
export const BUDGET_ALERT_THRESHOLDS = [
  { value: 50, label: '50%' },
  { value: 75, label: '75%' },
  { value: 80, label: '80%' },
  { value: 90, label: '90%' },
  { value: 95, label: '95%' },
  { value: 100, label: '100%' },
] as const;

// API endpoints
export const API_ENDPOINTS = {
  BASE_URL: getApiBaseUrl(),
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY_EMAIL: '/auth/verify-email',
    VERIFY_OTP: '/auth/verify-otp',
    REFRESH_TOKEN: '/auth/refresh-token',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  TRANSACTIONS: {
    LIST: '/transactions',
    CREATE: '/transactions',
    UPDATE: '/transactions/:id',
    DELETE: '/transactions/:id',
    SEARCH: '/transactions/search',
    EXPORT: '/transactions/export',
  },
  CATEGORIES: {
    LIST: '/categories',
    CREATE: '/categories',
    UPDATE: '/categories/:id',
    DELETE: '/categories/:id',
  },
  BUDGET: {
    LIST: '/budgets',
    CREATE: '/budgets',
    UPDATE: '/budgets/:id',
    DELETE: '/budgets/:id',
    ANALYTICS: '/budgets/analytics',
  },
  ANALYTICS: {
    SUMMARY: '/analytics/summary',
    TRENDS: '/analytics/trends',
    INSIGHTS: '/analytics/insights',
    CATEGORY_BREAKDOWN: '/analytics/category-breakdown',
  },
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    PREFERENCES: '/user/preferences',
    DELETE_ACCOUNT: '/user/delete',
  },
} as const;

// Storage keys for AsyncStorage
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@budget_tracker_auth_token',
  REFRESH_TOKEN: '@budget_tracker_refresh_token',
  USER_DATA: '@budget_tracker_user_data',
  CURRENCY: '@budget_tracker_currency',
  BIOMETRIC_ENABLED: '@budget_tracker_biometric',
  NOTIFICATIONS_ENABLED: '@budget_tracker_notifications',
  ONBOARDING_COMPLETED: '@budget_tracker_onboarding',
  OFFLINE_TRANSACTIONS: '@budget_tracker_offline_transactions',
  LAST_SYNC: '@budget_tracker_last_sync',
} as const;

// Validation rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: {
    MIN_LENGTH: 8,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },
  AMOUNT: {
    MIN: 0.01,
    MAX: 999999999,
    DECIMAL_PLACES: 2,
  },
  CATEGORY_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 30,
  },
} as const;

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  SCREEN_LOAD_TIME: 300, // ms
  API_RESPONSE_TIME: 200, // ms
  ANIMATION_FPS: 55, // fps
  MEMORY_USAGE: 150, // MB
  BUNDLE_SIZE: 50, // MB
} as const;

// Chart colors for consistent theming - Professional color palette
export const CHART_COLORS = [
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#EAB308', // Yellow
  '#84CC16', // Lime
  '#22C55E', // Green
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#0EA5E9', // Sky
  '#3B82F6', // Blue
  '#6366F1', // Indigo (repeat for consistency)
] as const;

// Material Design elevation levels
export const ELEVATION_LEVELS = {
  CARD: 2,
  FAB: 6,
  MODAL: 8,
  DRAWER: 16,
  DIALOG: 24,
} as const;

// Animation durations (Material Design)
export const ANIMATION_DURATIONS = {
  FAST: 150,
  MEDIUM: 200,
  SLOW: 300,
  EXTRA_SLOW: 500,
} as const;

// Notification types
export const NOTIFICATION_TYPES = {
  BUDGET_ALERT: 'budget_alert',
  PAYMENT_REMINDER: 'payment_reminder',
  DAILY_SUMMARY: 'daily_summary',
  INSIGHT: 'insight',
  TRANSACTION_ADDED: 'transaction_added',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists.',
  WEAK_PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, number and special character.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  REQUIRED_FIELD: 'This field is required.',
  INVALID_AMOUNT: 'Please enter a valid amount.',
  CATEGORY_REQUIRED: 'Please select a category.',
  SERVER_ERROR: 'Something went wrong. Please try again later.',
  OFFLINE_MODE: 'You are offline. Changes will be synced when connection is restored.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  TRANSACTION_ADDED: 'Transaction added successfully!',
  TRANSACTION_UPDATED: 'Transaction updated successfully!',
  TRANSACTION_DELETED: 'Transaction deleted successfully!',
  CATEGORY_CREATED: 'Category created successfully!',
  BUDGET_SET: 'Budget set successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
  DATA_EXPORTED: 'Data exported successfully!',
  BACKUP_COMPLETED: 'Backup completed successfully!',
} as const;

// Feature flags for gradual rollout
export const FEATURE_FLAGS = {
  AI_CATEGORIZATION: true,
  BIOMETRIC_AUTH: true,
  DARK_MODE: true,
  EXPORT_FEATURE: true,
  RECURRING_PAYMENTS: true,
  BUDGET_INSIGHTS: true,
  PUSH_NOTIFICATIONS: true,
  QUICK_CATEGORY_SELECT: false,
} as const;

// Default user preferences
export const DEFAULT_USER_PREFERENCES = {
  currency: 'INR' as const,
  notifications: true,
  biometric: false,
  language: 'en' as const,
  dateFormat: 'DD/MM/YYYY' as const,
} as const;
