import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/hooks/useTheme';
import { useTransactions } from '@/hooks/useTransactions';

const { width } = Dimensions.get('window');

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  color: string;
  route: string;
}

interface RecentTransaction {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: Date;
  type: 'expense' | 'income';
}

export default function HomeScreen({ navigation }: any) {
  const theme = useTheme();
  const { transactions, refreshData, isLoading: transactionsLoading } = useTransactions();
  
  const [refreshing, setRefreshing] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState({
    income: 0,
    expense: 0,
    balance: 0,
    savingsRate: 0,
  });

  // Calculate real data from transactions
  const recentTransactions = useMemo(() => {
    return transactions
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        description: t.notes || 'No description',
        category: t.category,
        amount: t.amount,
        date: new Date(t.date),
        type: t.type,
      }));
  }, [transactions]);

  // Calculate monthly stats
  const calculateMonthlyStats = async () => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const balance = income - expense;
      const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;

      setMonthlyStats({ income, expense, balance, savingsRate });
    } catch (error) {
      console.error('[HomeScreen] Error calculating stats:', error);
    }
  };

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('[HomeScreen] Screen focused, reloading transactions...');
      refreshData(true);
    }, [refreshData])
  );

  // Recalculate stats when transactions change
  useEffect(() => {
    console.log('[HomeScreen] Transactions changed, count:', transactions.length);
    calculateMonthlyStats();
  }, [transactions]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData(true);
    } catch (error) {
      console.error('[HomeScreen] Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);

  const quickActions: QuickAction[] = [
    { id: '1', icon: 'add-circle', label: 'Add Transaction', color: '#3B82F6', route: 'AddTransaction' },
    { id: '2', icon: 'analytics', label: 'Analytics', color: '#8B5CF6', route: 'Analytics' },
    { id: '3', icon: 'category', label: 'Categories', color: '#F59E0B', route: 'Categories' },
    { id: '4', icon: 'account-balance-wallet', label: 'Budget', color: '#10B981', route: 'Budget' },
  ];

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    gradientHeader: {
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
    },
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    greeting: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: theme.spacing.xs,
    },
    subGreeting: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.9)',
    },
    balanceCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginHorizontal: theme.spacing.lg,
    },
    balanceLabel: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.9)',
      marginBottom: theme.spacing.xs,
    },
    balanceAmount: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: theme.spacing.sm,
    },
    balanceStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    balanceStat: {
      flex: 1,
    },
    balanceStatLabel: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
      marginBottom: theme.spacing.xs,
    },
    balanceStatValue: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    scrollContainer: {
      paddingBottom: theme.spacing.xl,
    },
    quickActionsContainer: {
      marginTop: -theme.spacing.xl,
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    quickActionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
    },
    quickActionCard: {
      width: (width - theme.spacing.lg * 2 - theme.spacing.md) / 2,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    quickActionIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    quickActionLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface,
      textAlign: 'center',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.onBackground,
    },
    seeAllButton: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    transactionCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    transactionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    transactionIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    transactionInfo: {
      flex: 1,
    },
    transactionDescription: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.xs,
    },
    transactionCategory: {
      fontSize: 12,
      color: theme.colors.onSurface + '80',
    },
    transactionAmount: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    statsCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    statsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.md,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    statsLabel: {
      fontSize: 14,
      color: theme.colors.onSurface + '80',
    },
    statsValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    progressBar: {
      height: 8,
      backgroundColor: theme.colors.onSurface + '20',
      borderRadius: 4,
      overflow: 'hidden',
      marginTop: theme.spacing.md,
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
  }), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      {transactionsLoading && transactions.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 16, color: theme.colors.textSecondary }}>Loading your data...</Text>
        </View>
      ) : (
        <>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryVariant || theme.colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientHeader}
          >
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, User!</Text>
          <Text style={styles.subGreeting}>Welcome back to your budget tracker</Text>
        </View>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>₹{monthlyStats.balance.toLocaleString()}</Text>
          <View style={styles.balanceStats}>
            <View style={styles.balanceStat}>
              <Text style={styles.balanceStatLabel}>Income</Text>
              <Text style={[styles.balanceStatValue, { color: '#10B981' }]}>
                ₹{monthlyStats.income.toLocaleString()}
              </Text>
            </View>
            <View style={styles.balanceStat}>
              <Text style={styles.balanceStatLabel}>Expense</Text>
              <Text style={[styles.balanceStatValue, { color: '#EF4444' }]}>
                ₹{monthlyStats.expense.toLocaleString()}
              </Text>
            </View>
            <View style={styles.balanceStat}>
              <Text style={styles.balanceStatLabel}>Savings</Text>
              <Text style={styles.balanceStatValue}>{monthlyStats.savingsRate}%</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <Animated.View key={action.id} entering={FadeInDown.delay(100 + index * 50)}>
                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => navigation.navigate(action.route)}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                    <MaterialIcons name={action.icon as any} size={28} color={action.color} />
                  </View>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Monthly Overview */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.statsCard}>
          <Text style={styles.statsTitle}>This Month</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Budget Used</Text>
            <Text style={styles.statsValue}>
              ₹{monthlyStats.expense.toLocaleString()} / ₹45,000
            </Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Remaining</Text>
            <Text style={[styles.statsValue, { color: '#10B981' }]}>
              ₹{(45000 - monthlyStats.expense).toLocaleString()}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primary + '80']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${(monthlyStats.expense / 45000) * 100}%` }]}
            />
          </View>
        </Animated.View>

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.seeAllButton}>See All</Text>
          </TouchableOpacity>
        </View>
        {recentTransactions.length === 0 ? (
          <Animated.View 
            entering={FadeInDown.delay(350)}
            style={[styles.transactionCard, { justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl }]}
          >
            <MaterialIcons name="receipt-long" size={48} color={theme.colors.onSurface + '40'} />
            <Text style={{ marginTop: theme.spacing.md, color: theme.colors.onSurface + '80', textAlign: 'center' }}>
              No transactions yet
            </Text>
            <Text style={{ marginTop: theme.spacing.xs, color: theme.colors.onSurface + '60', fontSize: 12, textAlign: 'center' }}>
              Add your first transaction to get started
            </Text>
          </Animated.View>
        ) : (
          recentTransactions.map((transaction, index) => (
            <Animated.View
              key={transaction.id}
              entering={FadeInDown.delay(350 + index * 50)}
              style={styles.transactionCard}
            >
              <View style={styles.transactionLeft}>
                <View
                  style={[
                    styles.transactionIconContainer,
                    {
                      backgroundColor:
                        transaction.type === 'expense'
                          ? '#EF4444' + '20'
                          : '#10B981' + '20',
                    },
                  ]}
                >
                  <MaterialIcons
                    name={transaction.type === 'expense' ? 'arrow-upward' : 'arrow-downward'}
                    size={20}
                    color={transaction.type === 'expense' ? '#EF4444' : '#10B981'}
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDescription}>{transaction.description}</Text>
                  <Text style={styles.transactionCategory}>{transaction.category}</Text>
                </View>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  { color: transaction.type === 'expense' ? '#EF4444' : '#10B981' },
                ]}
              >
                {transaction.type === 'expense' ? '-' : '+'}₹{transaction.amount.toLocaleString()}
              </Text>
            </Animated.View>
          ))
        )}
      </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}
