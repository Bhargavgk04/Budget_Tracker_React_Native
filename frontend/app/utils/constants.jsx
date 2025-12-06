// Using local storage instead of API for Expo Go compatibility

export const COLORS = {
  primary: '#6366F1',
  secondary: '#10B981',
  accent: '#F59E0B',
  error: '#EF4444',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const CATEGORIES = [
  { id: 'food', name: 'Food & Dining', icon: 'restaurant', color: '#F59E0B' },
  { id: 'transport', name: 'Transportation', icon: 'directions-car', color: '#3B82F6' },
  { id: 'shopping', name: 'Shopping', icon: 'shopping-bag', color: '#EC4899' },
  { id: 'entertainment', name: 'Entertainment', icon: 'movie', color: '#8B5CF6' },
  { id: 'bills', name: 'Bills & Utilities', icon: 'receipt', color: '#EF4444' },
  { id: 'healthcare', name: 'Healthcare', icon: 'local-hospital', color: '#10B981' },
  { id: 'education', name: 'Education', icon: 'school', color: '#F97316' },
  { id: 'salary', name: 'Salary', icon: 'account-balance-wallet', color: '#10B981' },
  { id: 'freelance', name: 'Freelance', icon: 'work', color: '#6366F1' },
  { id: 'investment', name: 'Investment', icon: 'trending-up', color: '#059669' },
];

export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@budget_tracker_auth_token',
  REFRESH_TOKEN: '@budget_tracker_refresh_token',
  USER_DATA: '@budget_tracker_user_data',
  OFFLINE_TRANSACTIONS: '@offline_transactions',
  APP_PREFERENCES: '@app_preferences',
};