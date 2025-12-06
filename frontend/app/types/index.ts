import { TextStyle } from 'react-native';

// Core data types for the Budget Tracker App
export interface User {
  id: string;
  email: string;
  name: string;
  currency: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
  uid?: string;
  profilePicture?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'amoled';
  notifications: boolean;
  biometric: boolean;
  language: string;
  dateFormat: string;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  paymentMode: PaymentMode;
  notes?: string;
  date: Date;
  recurring?: RecurringConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  budget?: CategoryBudget;
  isDefault: boolean;
  createdAt: Date;
}

export interface CategoryBudget {
  limit: number;
  period: 'weekly' | 'monthly' | 'yearly';
  spent: number;
  alertThreshold: number; // Percentage (e.g., 80 for 80%)
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  limit: number;
  period: 'weekly' | 'monthly' | 'yearly';
  spent: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every X days/weeks/months/years
  nextDue: Date;
  endDate?: Date;
  isActive: boolean;
}

export type PaymentMode = 'cash' | 'upi' | 'card' | 'bank_transfer' | 'other';

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  period: TimePeriod;
  categoryBreakdown: CategoryBreakdown[];
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
}

export interface TimePeriod {
  type: 'today' | 'week' | 'month' | 'year' | 'custom';
  startDate: Date;
  endDate: Date;
}

export interface Insight {
  id: string;
  type: 'spending_trend' | 'budget_alert' | 'saving_opportunity' | 'category_analysis';
  title: string;
  description: string;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'budget_alert' | 'payment_reminder' | 'daily_summary' | 'insight';
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Chart data types
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  data: number[];
  color?: (opacity: number) => string;
  strokeWidth?: number;
}

export interface PieChartData {
  name: string;
  amount: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  OTPVerification: { email: string };
};

export type MainTabParamList = {
  Home: undefined;
  Add: undefined;
  Analytics: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  Dashboard: undefined;
  TransactionDetails: { transactionId: string };
  CategoryDetails: { categoryId: string };
};

export type AddStackParamList = {
  AddTransaction: undefined;
  CategoryPicker: undefined;
  RecurringPayment: undefined;
};

export type AnalyticsStackParamList = {
  Analytics: undefined;
  DetailedAnalytics: { period: TimePeriod };
  Insights: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  Categories: undefined;
  Budget: undefined;
  Export: undefined;
};

// Form types
export interface TransactionFormData {
  amount: string;
  category: string;
  type: 'income' | 'expense';
  paymentMode: PaymentMode;
  notes?: string;
  date: Date;
  isRecurring: boolean;
  recurringConfig?: Partial<RecurringConfig>;
}

export interface CategoryFormData {
  name: string;
  icon: string;
  color: string;
  budgetLimit?: number;
  budgetPeriod?: 'weekly' | 'monthly' | 'yearly';
}

export interface BudgetFormData {
  category: string;
  limit: number;
  period: 'weekly' | 'monthly' | 'yearly';
  alertThreshold: number;
}

// Performance monitoring types
export interface PerformanceMetrics {
  screenLoadTime: number;
  apiResponseTime: number;
  animationFrameRate: number;
  memoryUsage: number;
  crashCount: number;
}

// Theme types
export interface Theme {
  colors: {
    // Primary colors
    primary: string;
    primaryVariant: string;
    primaryLight?: string;
    primaryDark?: string;
    
    // Secondary colors
    secondary: string;
    secondaryVariant: string;
    secondaryLight?: string;
    secondaryDark?: string;
    
    // Accent colors
    accent?: string;
    accentLight?: string;
    
    // Background colors
    background: string;
    backgroundDark?: string;
    surface: string;
    surfaceVariant?: string;
    
    // Semantic colors
    error: string;
    warning?: string;
    success?: string;
    info?: string;
    
    // Text colors on backgrounds
    onPrimary: string;
    onSecondary: string;
    onBackground: string;
    onSurface: string;
    onError: string;
    
    // Additional text colors
    textPrimary?: string;
    textSecondary?: string;
    textTertiary?: string;
    textDisabled?: string;
    
    // Border colors
    border?: string;
    borderLight?: string;
    borderDark?: string;
    
    // Income/Expense colors
    income?: string;
    expense?: string;
    
    // Chart colors
    chartColors?: string[];
    
    // Gradient colors
    gradientStart?: string;
    gradientEnd?: string;
    gradientIncome?: string[];
    gradientExpense?: string[];
  };
  typography: {
    h1: TextStyle;
    h2: TextStyle;
    h3: TextStyle;
    h4: TextStyle;
    h5: TextStyle;
    h6: TextStyle;
    body1: TextStyle;
    body2: TextStyle;
    button: TextStyle;
    caption: TextStyle;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl?: number;
  };
  borderRadius: {
    xs?: number;
    sm: number;
    md: number;
    lg: number;
    xl?: number;
    full?: number;
  };
  shadows?: {
    sm: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    md: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    lg: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    xl: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
}

// Re-export React Native types we'll use
export type { TextStyle, ViewStyle, ImageStyle } from 'react-native';

// Friend & Expense Splitting Types

export interface Friend {
  _id: string;
  uid: string;
  name: string;
  email: string;
  profilePicture?: string;
  balance: FriendBalance;
  friendshipStatus: 'pending' | 'accepted' | 'declined' | 'blocked' | 'archived';
  friendshipId: string;
}

export interface FriendBalance {
  amount: number;
  direction: 'you_owe' | 'owes_you' | 'settled';
  lastUpdated?: Date;
}

export interface Friendship {
  _id: string;
  requester: User;
  recipient: User;
  status: 'pending' | 'accepted' | 'declined' | 'blocked' | 'archived';
  requestedAt: Date;
  respondedAt?: Date;
  archivedAt?: Date;
  balance: {
    amount: number;
    direction: 'requester_owes' | 'recipient_owes' | 'settled';
    lastUpdated?: Date;
  };
}

export interface FriendRequest {
  friendshipId: string;
  user: {
    _id: string;
    uid: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  requestedAt: Date;
}

export interface PendingRequests {
  incoming: FriendRequest[]; 
  outgoing: FriendRequest[];
}

export interface SplitConfig {
  isShared: boolean;
  paidBy: string;
  splitType: 'equal' | 'percentage' | 'custom';
  participants: SplitParticipant[];
  groupId?: string;
}

export interface SplitParticipant {
  user: string;
  share: number;
  percentage?: number;
  settled: boolean;
  settledAt?: Date;
}

export interface SharedTransaction extends Transaction {
  friendUid?: string;
  friendId?: string;
  splitInfo?: SplitConfig;
}

export interface Settlement {
  _id: string;
  payer: User;
  recipient: User;
  amount: number;
  paymentMethod: PaymentMode;
  notes?: string;
  status: 'pending' | 'confirmed' | 'disputed';
  date: Date;
  confirmedAt?: Date;
  confirmedBy?: User;
  disputeReason?: string;
  disputedAt?: Date;
  groupId?: string;
  relatedTransactions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Group {
  _id: string;
  name: string;
  type: 'trip' | 'rent' | 'office_lunch' | 'custom';
  description?: string;
  createdBy: User;
  members: GroupMember[];
  balances: GroupBalance[];
  totalExpenses: number;
  isActive: boolean;
  isSettled: boolean;
  settledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMember {
  user: User;
  role: 'admin' | 'member';
  joinedAt: Date;
  leftAt?: Date;
  isActive: boolean;
}

export interface GroupBalance {
  user: User;
  netBalance: number;
  lastUpdated: Date;
}

export interface SimplifiedSettlement {
  from: {
    _id: string;
    name: string;
    uid: string;
  };
  to: {
    _id: string;
    name: string;
    uid: string;
  };
  amount: number;
}

export interface DebtSimplification {
  originalDebts: SimplifiedSettlement[];
  simplifiedSettlements: SimplifiedSettlement[];
  savingsCount: number;
  balances: Record<string, number>;
  stats?: SimplificationStats;
}

export interface SimplificationStats {
  originalTransactionCount: number;
  simplifiedTransactionCount: number;
  transactionsSaved: number;
  savingsPercentage: number;
  originalTotalAmount: number;
  simplifiedTotalAmount: number;
  amountDifference: number;
}

export interface FriendDetails {
  friend: {
    _id: string;
    uid: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  friendshipId: string;
  balance: FriendBalance;
  stats: {
    totalSharedTransactions: number;
    totalSettlements: number;
    confirmedSettlements: number;
  };
}

export interface GroupDetails extends Group {
  stats: {
    totalExpenses: number;
    expenseCount: number;
    activeMembersCount: number;
    isSettled: boolean;
  };
}

// Form types for friend & expense splitting
export interface SplitFormData {
  splitType: 'equal' | 'percentage' | 'custom';
  participants: {
    userId: string;
    share?: number;
    percentage?: number;
  }[];
  paidBy: string;
  groupId?: string;
}

export interface SettlementFormData {
  recipientId: string;
  amount: number;
  paymentMethod: PaymentMode;
  notes?: string;
  date?: Date;
  groupId?: string;
  relatedTransactions?: string[];
}

export interface GroupFormData {
  name: string;
  type: 'trip' | 'rent' | 'office_lunch' | 'custom';
  description?: string;
  memberIds: string[];
}

// Navigation types for friend & expense splitting
export type FriendStackParamList = {
  FriendList: undefined;
  FriendDetail: { friendId: string };
  FriendSearch: undefined;
  PendingRequests: undefined;
};

export type GroupStackParamList = {
  GroupList: undefined;
  GroupDetail: { groupId: string };
  CreateGroup: undefined;
  GroupExpenses: { groupId: string };
};

export type SettlementStackParamList = {
  SettlementList: undefined;
  SettlementDetail: { settlementId: string };
  CreateSettlement: { friendId?: string; groupId?: string; suggestedAmount?: number };
};


