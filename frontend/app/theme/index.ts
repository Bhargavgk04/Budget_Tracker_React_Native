import type { Theme } from '@/types';

// Modern Professional Color Palette - Budget Tracker
export const lightTheme: Theme = {
  colors: {
    // Primary gradient colors - Modern blue-indigo
    primary: '#6366F1',        // Vibrant indigo
    primaryVariant: '#4F46E5', // Deep indigo
    primaryLight: '#818CF8',   // Light indigo
    primaryDark: '#3730A3',    // Dark indigo
    
    // Secondary gradient colors - Success green
    secondary: '#10B981',      // Emerald green
    secondaryVariant: '#059669',
    secondaryLight: '#34D399',
    secondaryDark: '#047857',
    
    // Accent colors
    accent: '#F59E0B',         // Amber
    accentLight: '#FBBF24',
    
    // Background hierarchy
    background: '#F8FAFC',     // Cool gray 50
    backgroundDark: '#F1F5F9', // Cool gray 100
    surface: '#FFFFFF',        // White
    surfaceVariant: '#F8FAFC', // Light gray
    
    // Semantic colors
    error: '#EF4444',          // Red 500
    warning: '#F59E0B',        // Amber 500
    success: '#10B981',        // Emerald 500
    info: '#3B82F6',          // Blue 500
    
    // Text colors
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#1E293B',   // Slate 800
    onSurface: '#1E293B',      // Slate 800
    onError: '#FFFFFF',
    
    // Additional text colors
    textPrimary: '#1E293B',    // Slate 800
    textSecondary: '#64748B',  // Slate 500
    textTertiary: '#94A3B8',   // Slate 400
    textDisabled: '#CBD5E1',   // Slate 300
    
    // Border colors
    border: '#E2E8F0',         // Slate 200
    borderLight: '#F1F5F9',    // Slate 100
    borderDark: '#CBD5E1',     // Slate 300
    
    // Income/Expense colors
    income: '#10B981',         // Emerald 500
    expense: '#EF4444',        // Red 500
    
    // Chart colors
    chartColors: ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'],
    
    // Gradient colors
    gradientStart: '#6366F1',
    gradientEnd: '#8B5CF6',
    gradientIncome: ['#10B981', '#34D399'],
    gradientExpense: ['#EF4444', '#F87171'],
  },
  typography: {
    h1: {
      fontSize: 34,
      fontWeight: '700',
      letterSpacing: -1,
      fontFamily: 'System',
      lineHeight: 41,
    },
    h2: {
      fontSize: 28,
      fontWeight: '700',
      letterSpacing: -0.5,
      fontFamily: 'System',
      lineHeight: 34,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600',
      letterSpacing: 0,
      fontFamily: 'System',
      lineHeight: 29,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600',
      letterSpacing: 0.15,
      fontFamily: 'System',
      lineHeight: 24,
    },
    h5: {
      fontSize: 18,
      fontWeight: '600',
      letterSpacing: 0,
      fontFamily: 'System',
      lineHeight: 22,
    },
    h6: {
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.15,
      fontFamily: 'System',
      lineHeight: 20,
    },
    body1: {
      fontSize: 16,
      fontWeight: '400',
      letterSpacing: 0.5,
      fontFamily: 'System',
      lineHeight: 24,
    },
    body2: {
      fontSize: 14,
      fontWeight: '400',
      letterSpacing: 0.25,
      fontFamily: 'System',
      lineHeight: 20,
    },
    button: {
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'none',
      fontFamily: 'System',
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      letterSpacing: 0.4,
      fontFamily: 'System',
      lineHeight: 16,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 12,
    },
  },
};

export const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    // Primary colors for dark mode
    primary: '#818CF8',
    primaryVariant: '#6366F1',
    primaryLight: '#A5B4FC',
    primaryDark: '#4F46E5',
    
    // Secondary colors
    secondary: '#34D399',
    secondaryVariant: '#10B981',
    secondaryLight: '#6EE7B7',
    secondaryDark: '#059669',
    
    // Accent
    accent: '#FBBF24',
    accentLight: '#FCD34D',
    
    // Backgrounds
    background: '#0F172A',      // Slate 900
    backgroundDark: '#020617',  // Slate 950
    surface: '#1E293B',         // Slate 800
    surfaceVariant: '#334155',  // Slate 700
    
    // Semantic colors
    error: '#F87171',
    warning: '#FBBF24',
    success: '#34D399',
    info: '#60A5FA',
    
    // Text colors
    onPrimary: '#0F172A',
    onSecondary: '#0F172A',
    onBackground: '#F8FAFC',
    onSurface: '#F8FAFC',
    onError: '#0F172A',
    
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    textDisabled: '#475569',
    
    // Borders
    border: '#334155',
    borderLight: '#475569',
    borderDark: '#1E293B',
    
    // Income/Expense
    income: '#34D399',
    expense: '#F87171',
    
    // Chart colors
    chartColors: ['#818CF8', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#F472B6', '#2DD4BF', '#FB923C'],
    
    // Gradients
    gradientStart: '#818CF8',
    gradientEnd: '#A78BFA',
    gradientIncome: ['#34D399', '#6EE7B7'],
    gradientExpense: ['#F87171', '#FCA5A5'],
  },
};

export const amoledTheme: Theme = {
  ...darkTheme,
  colors: {
    ...darkTheme.colors,
    background: '#000000',
    surface: '#000000',
  },
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
  amoled: amoledTheme,
} as const;