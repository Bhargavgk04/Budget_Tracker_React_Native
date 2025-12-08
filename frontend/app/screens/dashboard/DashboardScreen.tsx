import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';

import FloatingActionButton from '@/components/common/FloatingActionButton';
import ResponsiveContainer from '@/components/layout/ResponsiveContainer';

import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import TransactionService from '@/services/TransactionService';
import { FinancialSummary, Transaction, TimePeriod } from '@/types';
import { DataTransformUtils } from '@/utils/dataTransform';
import { ValidationUtils } from '@/utils/validation';
import { TIME_PERIODS, CHART_COLORS } from '@/utils/constants';

// Defensive check for ValidationUtils
if (!ValidationUtils || typeof ValidationUtils.formatCurrency !== 'function') {
  console.error('ValidationUtils is not properly imported!', ValidationUtils);
}

const { width: screenWidth } = Dimensions.get('window');

// Fallback formatter in case ValidationUtils is undefined
const formatCurrency = (value: number, currency: string = '₹'): string => {
  if (typeof value !== 'number' || isNaN(value)) return `${currency}0.00`;
  return `${currency}${Math.abs(value).toFixed(2)}`;
};

const formatDate = (date: Date): string => {
  if (!date || !(date instanceof Date)) return '';
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
};

function DashboardScreen({ navigation }: any) {
  const theme = useTheme();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Check if user is demo user
      const isDemoUser = user?.id === 'demo-user-123';
      
      if (isDemoUser) {
        // Use mock data service for demo users
        const { MockDataService } = await import('@/services/MockDataService');
        const summaryData = await MockDataService.getFinancialSummary(selectedPeriod);
        const transactionsData = await MockDataService.getTransactions();
        
        setSummary(summaryData);
        setRecentTransactions(transactionsData.slice(0, 5));
      } else {
        // Use real API for actual users
        const period = DataTransformUtils.generateTimePeriod(selectedPeriod);
        
        // Get transactions
        const transactionsData = await TransactionService.getRecentTransactions(5);
        
        // Get all transactions for the period (using pagination with high limit)
        const allTransactionsResponse = await TransactionService.getTransactions(1, 1000, {
          startDate: period.startDate,
          endDate: period.endDate,
        });
        
        const allTransactions = allTransactionsResponse.data || [];
        
        // Calculate summary from transactions
        const totalIncome = allTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const totalExpenses = allTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        // Calculate category breakdown
        const categoryMap = new Map<string, number>();
        allTransactions
          .filter(t => t.type === 'expense')
          .forEach(t => {
            const current = categoryMap.get(t.category) || 0;
            categoryMap.set(t.category, current + (t.amount || 0));
          });
        
        const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, amount]) => ({
          category,
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
          color: CHART_COLORS[Math.abs(category.length) % CHART_COLORS.length],
          icon: 'help' as any,
        }));

        const summaryData: FinancialSummary = {
          totalIncome,
          totalExpenses,
          balance: totalIncome - totalExpenses,
          period,
          categoryBreakdown,
        };

        setSummary(summaryData);
        setRecentTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData();
  };

  const navigateToAddTransaction = (type?: 'income' | 'expense') => {
    navigation.navigate('Add', { 
      screen: 'AddTransaction',
      params: { type }
    });
  };

  const navigateToTransactions = () => {
    navigation.navigate('Transactions');
  };



  const renderSummaryCard = () => (
    <Animated.View entering={FadeInUp.delay(100)} style={styles.summaryCard}>
      <LinearGradient
        colors={[theme.colors.gradientStart || theme.colors.primary, theme.colors.gradientEnd || theme.colors.primaryVariant]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.summaryGradient}
      >
        <View style={styles.summaryHeader}>
          <View>
            <Text style={styles.summaryGreeting}>Total Balance</Text>
            <Text style={styles.summaryBalance}>
              {formatCurrency(summary?.balance || 0)}
            </Text>
          </View>
          <TouchableOpacity style={styles.periodSelectorCompact}>
            <Text style={styles.periodTextCompact}>{TIME_PERIODS.find(p => p.value === selectedPeriod)?.label || 'Month'}</Text>
            <MaterialIcons name="arrow-drop-down" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <MaterialIcons name="arrow-downward" size={20} color={theme.colors.success || '#10B981'} />
            </View>
            <View>
              <Text style={styles.statLabel}>Income</Text>
              <Text style={styles.statValue}>{formatCurrency(summary?.totalIncome || 0)}</Text>
            </View>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <MaterialIcons name="arrow-upward" size={20} color={theme.colors.error || '#EF4444'} />
            </View>
            <View>
              <Text style={styles.statLabel}>Expenses</Text>
              <Text style={styles.statValue}>{formatCurrency(summary?.totalExpenses || 0)}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Period selector tabs below the card */}
      <View style={styles.periodSelector}>
        {TIME_PERIODS.slice(0, 4).map((period) => (
          <TouchableOpacity
            key={period.value}
            style={[
              styles.periodButton,
              selectedPeriod === period.value && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period.value as any)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period.value && styles.periodButtonTextActive,
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  const renderCategoryChart = () => {
    if (!summary?.categoryBreakdown.length) return null;

    const pieData = DataTransformUtils.transformToPieChartData(summary.categoryBreakdown);

    return (
      <Animated.View entering={FadeInDown.delay(200)} style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Expense Categories</Text>

        </View>
        
        <PieChart
          data={pieData}
          width={screenWidth - 32}
          height={200}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </Animated.View>
    );
  };

  const renderRecentTransactions = () => (
    <Animated.View entering={FadeInDown.delay(300)} style={styles.transactionsCard}>
      <View style={styles.transactionsHeader}>
        <Text style={styles.transactionsTitle}>Recent Transactions</Text>
        <TouchableOpacity onPress={navigateToTransactions}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {Array.isArray(recentTransactions) && recentTransactions.map((transaction, index) => (
        <View key={(transaction as any).id || (transaction as any)._id || index} style={styles.transactionItem}>
          <View style={styles.transactionIcon}>
            <MaterialIcons
              name={transaction.type === 'income' ? 'trending-up' : 'trending-down'}
              size={24}
              color={transaction.type === 'income' ? '#4CAF50' : '#F44336'}
            />
          </View>
          <View style={styles.transactionContent}>
            <Text style={styles.transactionCategory}>{transaction.category}</Text>
            <Text style={styles.transactionDate}>
              {formatDate(new Date(transaction.date))}
            </Text>
          </View>
          <Text
            style={[
              styles.transactionAmount,
              {
                color: transaction.type === 'income' ? '#4CAF50' : '#F44336',
              },
            ]}
          >
            {transaction.type === 'income' ? '+' : '-'}
            {formatCurrency(transaction.amount)}
          </Text>
        </View>
      ))}

      {recentTransactions.length === 0 && (
        <View style={styles.emptyState}>
          <MaterialIcons name="receipt" size={48} color={theme.colors.onSurface + '40'} />
          <Text style={styles.emptyStateText}>No transactions yet</Text>
          <Text style={styles.emptyStateSubtext}>Add your first transaction to get started</Text>
        </View>
      )}
    </Animated.View>
  );

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors?.background || '#F8FAFC',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
    },
    greeting: {
      ...theme.typography.body1,
      color: theme.colors.textSecondary || theme.colors.onBackground + '70',
      fontSize: 14,
    },
    userName: {
      ...theme.typography.h4,
      color: theme.colors.textPrimary || theme.colors.onBackground,
      fontWeight: '700',
      marginTop: 4,
    },
    addButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      ...(theme.shadows?.md || {}),
    },
    addButtonGradient: {
      width: '100%',
      height: '100%',
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.xl,
    },
    summaryCard: {
      marginBottom: theme.spacing.lg,
      borderRadius: theme.borderRadius?.xl || theme.borderRadius.lg,
      overflow: 'hidden',
      ...(theme.shadows?.lg || {}),
      shadowColor: theme.colors.primary,
    },
    summaryGradient: {
      padding: theme.spacing.xl,
      borderRadius: theme.borderRadius?.xl || theme.borderRadius.lg,
    },
    summaryHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.xl,
    },
    summaryGreeting: {
      ...theme.typography.body2,
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: 14,
      marginBottom: 8,
    },
    summaryBalance: {
      ...theme.typography.h1,
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 36,
    },
    periodSelectorCompact: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    periodTextCompact: {
      ...theme.typography.caption,
      color: '#FFFFFF',
      fontWeight: '600',
      marginRight: 4,
    },
    summaryStats: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: theme.borderRadius?.lg || theme.borderRadius.md,
      padding: theme.spacing.md,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    statIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    statLabel: {
      ...theme.typography.caption,
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: 12,
      marginBottom: 2,
    },
    statValue: {
      ...theme.typography.h6,
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 16,
    },
    statDivider: {
      width: 1,
      height: 40,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      marginHorizontal: 12,
    },
    periodSelector: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius?.md || theme.borderRadius.sm,
      padding: 4,
      marginTop: theme.spacing.md,
    },
    periodButton: {
      flex: 1,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius?.sm || 8,
      alignItems: 'center',
    },
    periodButtonActive: {
      backgroundColor: theme.colors.primary,
      ...(theme.shadows?.sm || {}),
    },
    periodButtonText: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary || theme.colors.onSurface,
      fontSize: 12,
      fontWeight: '600',
    },
    periodButtonTextActive: {
      color: theme.colors.onPrimary,
    },
    chartCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      elevation: 2,
      shadowColor: theme.colors.onSurface,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    chartHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
    },
    chartTitle: {
      ...theme.typography.h6,
      color: theme.colors.onSurface,
    },
    transactionsCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      elevation: 2,
      shadowColor: theme.colors.onSurface,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    transactionsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.lg,
    },
    transactionsTitle: {
      ...theme.typography.h6,
      color: theme.colors.onSurface,
    },
    viewAllText: {
      ...theme.typography.body2,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    transactionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.onSurface + '10',
    },
    transactionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    transactionContent: {
      flex: 1,
    },
    transactionCategory: {
      ...theme.typography.body1,
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
    transactionDate: {
      ...theme.typography.caption,
      color: theme.colors.onSurface + '60',
    },
    transactionAmount: {
      ...theme.typography.body1,
      fontWeight: 'bold',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
    },
    emptyStateText: {
      ...theme.typography.body1,
      color: theme.colors.onSurface + '60',
      marginTop: theme.spacing.md,
    },
    emptyStateSubtext: {
      ...theme.typography.caption,
      color: theme.colors.onSurface + '40',
      marginTop: theme.spacing.xs,
    },
  }), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <ResponsiveContainer paddingHorizontal={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {getTimeGreeting()},</Text>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => navigateToAddTransaction()}>
            <LinearGradient
              colors={[theme.colors.gradientStart || theme.colors.primary, theme.colors.gradientEnd || theme.colors.primaryVariant]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addButtonGradient}
            >
              <MaterialIcons name="add" size={24} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {renderSummaryCard()}
          {renderCategoryChart()}
          {renderRecentTransactions()}
        </ScrollView>

              </ResponsiveContainer>
    </SafeAreaView>
  );
}

// Helper function to get time-based greeting
function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export default DashboardScreen;
