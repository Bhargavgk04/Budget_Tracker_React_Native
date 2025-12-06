import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import ResponsiveContainer from '@/components/layout/ResponsiveContainer';
import Button from '@/components/common/Button';

const { width: screenWidth } = Dimensions.get('window');

interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'yearly';
  icon: string;
  color: string;
}

export default function BudgetScreen({ navigation }: any) {
  const theme = useTheme();
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      setIsLoading(true);
      // Mock data for demonstration
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockBudgets: Budget[] = [
        {
          id: '1',
          category: 'Food & Dining',
          limit: 15000,
          spent: 8500,
          period: 'monthly',
          icon: 'restaurant',
          color: '#FF6B6B',
        },
        {
          id: '2',
          category: 'Transportation',
          limit: 5000,
          spent: 3200,
          period: 'monthly',
          icon: 'directions-car',
          color: '#4ECDC4',
        },
        {
          id: '3',
          category: 'Shopping',
          limit: 10000,
          spent: 12500,
          period: 'monthly',
          icon: 'shopping-bag',
          color: '#95E1D3',
        },
        {
          id: '4',
          category: 'Entertainment',
          limit: 3000,
          spent: 1800,
          period: 'monthly',
          icon: 'movie',
          color: '#F38181',
        },
        {
          id: '5',
          category: 'Utilities',
          limit: 4000,
          spent: 3500,
          period: 'monthly',
          icon: 'flash-on',
          color: '#AA96DA',
        },
      ];
      setBudgets(mockBudgets);
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadBudgets();
  };

  const calculatePercentage = (spent: number, limit: number): number => {
    return Math.min((spent / limit) * 100, 100);
  };

  const getStatusColor = (spent: number, limit: number): string => {
    const percentage = (spent / limit) * 100;
    if (percentage >= 100) return theme.colors.error || '#EF4444';
    if (percentage >= 80) return theme.colors.warning || '#F59E0B';
    return theme.colors.success || '#10B981';
  };

  const getStatusText = (spent: number, limit: number): string => {
    const percentage = (spent / limit) * 100;
    if (percentage >= 100) return 'Over Budget';
    if (percentage >= 80) return 'Near Limit';
    return 'On Track';
  };

  const renderBudgetCard = (budget: Budget, index: number) => {
    const percentage = calculatePercentage(budget.spent, budget.limit);
    const remaining = budget.limit - budget.spent;
    const statusColor = getStatusColor(budget.spent, budget.limit);
    const statusText = getStatusText(budget.spent, budget.limit);

    return (
      <Animated.View
        key={budget.id}
        entering={FadeInDown.delay(100 + index * 50)}
        style={styles.budgetCard}
      >
        <View style={styles.budgetHeader}>
          <View style={styles.budgetIconContainer}>
            <View style={[styles.budgetIcon, { backgroundColor: budget.color + '20' }]}>
              <MaterialIcons name={budget.icon as any} size={24} color={budget.color} />
            </View>
            <View style={styles.budgetInfo}>
              <Text style={styles.budgetCategory}>{budget.category}</Text>
              <Text style={styles.budgetPeriod}>{budget.period}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>

        <View style={styles.budgetAmounts}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Spent</Text>
            <Text style={[styles.amountValue, { color: statusColor }]}>₹{budget.spent.toLocaleString()}</Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Limit</Text>
            <Text style={styles.amountValue}>₹{budget.limit.toLocaleString()}</Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Remaining</Text>
            <Text style={[styles.amountValue, { color: remaining >= 0 ? theme.colors.success : theme.colors.error }]}>
              ₹{Math.abs(remaining).toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={[
                percentage >= 100 ? theme.colors.error || '#EF4444' : 
                percentage >= 80 ? theme.colors.warning || '#F59E0B' : 
                theme.colors.success || '#10B981',
                percentage >= 100 ? '#F87171' : 
                percentage >= 80 ? '#FBBF24' : 
                '#34D399'
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${percentage}%` }]}
            />
          </View>
          <Text style={styles.progressText}>{percentage.toFixed(0)}%</Text>
        </View>
      </Animated.View>
    );
  };

  const renderSummaryCard = () => {
    const totalLimit = budgets.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const totalRemaining = totalLimit - totalSpent;

    return (
      <Animated.View entering={FadeInUp.delay(50)} style={styles.summaryCard}>
        <LinearGradient
          colors={[theme.colors.gradientStart || theme.colors.primary, theme.colors.gradientEnd || theme.colors.primaryVariant]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryGradient}
        >
          <Text style={styles.summaryTitle}>Overall Budget</Text>
          <Text style={styles.summaryAmount}>₹{totalLimit.toLocaleString()}</Text>
          
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>Spent</Text>
              <Text style={styles.summaryStatValue}>₹{totalSpent.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>Remaining</Text>
              <Text style={styles.summaryStatValue}>₹{Math.abs(totalRemaining).toLocaleString()}</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      ...(theme.shadows?.sm || {}),
    },
    headerTitle: {
      ...theme.typography.h5,
      color: theme.colors.textPrimary || theme.colors.onBackground,
      fontWeight: '700',
    },
    scrollContainer: {
      padding: theme.spacing.md,
      paddingBottom: theme.spacing.xl,
    },
    summaryCard: {
      marginBottom: theme.spacing.lg,
      borderRadius: theme.borderRadius?.xl || theme.borderRadius.lg,
      overflow: 'hidden',
      ...(theme.shadows?.lg || {}),
    },
    summaryGradient: {
      padding: theme.spacing.xl,
    },
    summaryTitle: {
      ...theme.typography.body1,
      color: 'rgba(255, 255, 255, 0.9)',
      marginBottom: theme.spacing.sm,
    },
    summaryAmount: {
      ...theme.typography.h2,
      color: '#FFFFFF',
      fontWeight: '700',
      marginBottom: theme.spacing.lg,
    },
    summaryStats: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: theme.borderRadius?.md || theme.borderRadius.sm,
      padding: theme.spacing.md,
    },
    summaryStatItem: {
      flex: 1,
      alignItems: 'center',
    },
    summaryStatLabel: {
      ...theme.typography.caption,
      color: 'rgba(255, 255, 255, 0.8)',
      marginBottom: 4,
    },
    summaryStatValue: {
      ...theme.typography.h6,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    summaryDivider: {
      width: 1,
      height: 40,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      marginHorizontal: theme.spacing.md,
    },
    budgetCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius?.lg || theme.borderRadius.md,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      ...(theme.shadows?.md || {}),
    },
    budgetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
    },
    budgetIconContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    budgetIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    budgetInfo: {
      flex: 1,
    },
    budgetCategory: {
      ...theme.typography.body1,
      color: theme.colors.textPrimary || theme.colors.onSurface,
      fontWeight: '600',
    },
    budgetPeriod: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary || theme.colors.onSurface + '60',
      textTransform: 'capitalize',
    },
    statusBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      borderRadius: theme.borderRadius?.sm || 8,
    },
    statusText: {
      ...theme.typography.caption,
      fontWeight: '600',
      fontSize: 11,
    },
    budgetAmounts: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
    },
    amountRow: {
      alignItems: 'center',
    },
    amountLabel: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary || theme.colors.onSurface + '60',
      marginBottom: 4,
    },
    amountValue: {
      ...theme.typography.body1,
      color: theme.colors.textPrimary || theme.colors.onSurface,
      fontWeight: '600',
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    progressBar: {
      flex: 1,
      height: 8,
      backgroundColor: theme.colors.border || theme.colors.onSurface + '10',
      borderRadius: 4,
      overflow: 'hidden',
      marginRight: theme.spacing.sm,
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    progressText: {
      ...theme.typography.caption,
      color: theme.colors.textPrimary || theme.colors.onSurface,
      fontWeight: '600',
      minWidth: 45,
      textAlign: 'right',
    },
    emptyState: {
      alignItems: 'center',
      padding: theme.spacing.xl * 2,
    },
    emptyText: {
      ...theme.typography.h6,
      color: theme.colors.textSecondary || theme.colors.onSurface + '60',
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
    },
    emptySubtext: {
      ...theme.typography.body2,
      color: theme.colors.textTertiary || theme.colors.onSurface + '40',
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    addButton: {
      marginTop: theme.spacing.lg,
    },
  }), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <ResponsiveContainer paddingHorizontal={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Budgets</Text>
          <TouchableOpacity onPress={() => {}}>
            <MaterialIcons name="add-circle" size={28} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        >
          {budgets.length > 0 && renderSummaryCard()}
          
          {budgets.map((budget, index) => renderBudgetCard(budget, index))}

          {budgets.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="account-balance-wallet" size={64} color={theme.colors.primary + '40'} />
              <Text style={styles.emptyText}>No Budgets Set</Text>
              <Text style={styles.emptySubtext}>
                Create your first budget to track and manage your spending
              </Text>
              <Button
                title="Create Budget"
                onPress={() => {}}
                variant="gradient"
                style={styles.addButton}
              />
            </View>
          )}
        </ScrollView>
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
