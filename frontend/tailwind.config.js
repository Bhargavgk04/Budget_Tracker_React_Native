/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: '#6366F1',
        'primary-light': '#818CF8',
        'primary-dark': '#4F46E5',
        
        // Secondary colors
        secondary: '#10B981',
        'secondary-light': '#34D399',
        'secondary-dark': '#059669',
        
        // Accent
        accent: '#F59E0B',
        'accent-light': '#FBBF24',
        
        // Semantic colors
        error: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B',
        info: '#3B82F6',
        
        // Background colors
        background: '#F8FAFC',
        'background-dark': '#F1F5F9',
        surface: '#FFFFFF',
        'surface-variant': '#F8FAFC',
        
        // Text colors
        'text-primary': '#1E293B',
        'text-secondary': '#64748B',
        'text-tertiary': '#94A3B8',
        'text-disabled': '#CBD5E1',
        
        // Border colors
        border: '#E2E8F0',
        'border-light': '#F1F5F9',
        'border-dark': '#CBD5E1',
        
        // Income/Expense
        income: '#10B981',
        expense: '#EF4444',
      },
      fontFamily: {
        'system': ['System'],
        'inter': ['Inter'],
      },
      fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '28px',
        '4xl': '34px',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        'full': '9999px',
      },
      // Note: boxShadow doesn't work with React Native
      // Use shadowColor, shadowOffset, shadowOpacity, shadowRadius, and elevation instead
    },
  },
  plugins: [],
}