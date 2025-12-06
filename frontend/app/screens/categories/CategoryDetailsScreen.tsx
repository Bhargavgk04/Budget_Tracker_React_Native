import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { PieChart, BarChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
}

export default function CategoryDetailsScreen({ route, navigation }: any) {
  const theme = useTheme();
  const { categoryName, categoryIcon, categoryColor, type } = route?.params || {
    categoryName: 'Food & Dining',
    categoryIcon: 'restaurant',
    categoryColor: '#EF4444',
    type: 'expense'
  };

  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  // Mock data
  const mockTransactions: Transaction[] = [
    { id: '1', description: 'Dinner at Restaurant', amount: 1250, date: new Date('2024-12-01') },
    { id: '2', description: 'Groceries', amount: 3500, date: new Date('2024-12-03') },
    { id: '3', description: 'Coffee Shop', amount: 450, date: new Date('2024-12-05') },
    { id: '4', description: 'Lunch', amount: 850, date: new Date('2024-12-07') },
    { id: '5', description: 'Food Delivery', amount: 650, date: new Date('2024-12-10') },
  ];

  const totalSpent = mockTransactions.reduce((sum, t) => sum + t.amount, 0);
  const avgPerTransaction = totalSpent / mockTransactions.length;
  const budgetLimit = 15000;
  const budgetUsed = (totalSpent / budgetLimit) * 100;

  const chartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      data: [2500, 3200, 2800, 3200]
    }]
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    gradientHeader: {
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      flex: 1,
      textAlign: 'center',
      marginRight: 24,
    },
    categoryIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginBottom: theme.spacing.md,
    },
    categoryName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: theme.spacing.xs,
    },
    categoryType: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
    },
    scrollContainer: {
      paddingBottom: theme.spacing.xl,
    },
    periodSelector: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.xs,
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    periodButton: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.sm,
      alignItems: 'center',
    },
    periodButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    periodButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface + '80',
    },
    periodButtonTextActive: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    statsContainer: {
      flexDirection: 'row',
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.xs,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.onSurface + '80',
    },
    budgetCard: {
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
    budgetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    budgetTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    budgetAmount: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    progressBar: {
      height: 8,
      backgroundColor: theme.colors.onSurface + '20',
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: theme.spacing.sm,
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    progressText: {
      fontSize: 12,
      color: theme.colors.onSurface + '80',
      textAlign: 'center',
    },
    chartCard: {
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
    chartTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.onBackground,
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.md,
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
    transactionInfo: {
      flex: 1,
    },
    transactionDescription: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.xs,
    },
    transactionDate: {
      fontSize: 12,
      color: theme.colors.onSurface + '80',
    },
    transactionAmount: {
      fontSize: 16,
      fontWeight: 'bold',
      color: type === 'expense' ? '#EF4444' : '#10B981',
    },
  }), [theme, type]);

  const periods: { value: 'week' | 'month' | 'year'; label: string }[] = [
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[categoryColor, categoryColor + 'CC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Category Details</Text>
        </View>
        <View style={styles.categoryIcon}>
          <MaterialIcons name={categoryIcon as any} size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.categoryName}>{categoryName}</Text>
        <Text style={styles.categoryType}>{type === 'expense' ? 'Expense Category' : 'Income Category'}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.value}
              style={[
                styles.periodButton,
                selectedPeriod === period.value && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period.value)}
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

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Animated.View entering={FadeInDown.delay(100)} style={styles.statCard}>
            <Text style={styles.statValue}>₹{totalSpent.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(150)} style={styles.statCard}>
            <Text style={styles.statValue}>{mockTransactions.length}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(200)} style={styles.statCard}>
            <Text style={styles.statValue}>₹{Math.round(avgPerTransaction)}</Text>
            <Text style={styles.statLabel}>Avg/Trans</Text>
          </Animated.View>
        </View>

        {/* Budget Progress */}
        <Animated.View entering={FadeInDown.delay(250)} style={styles.budgetCard}>
          <View style={styles.budgetHeader}>
            <Text style={styles.budgetTitle}>Budget Progress</Text>
            <Text style={styles.budgetAmount}>₹{budgetLimit.toLocaleString()}</Text>
          </View>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={[categoryColor, categoryColor + '80']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${Math.min(budgetUsed, 100)}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            {budgetUsed.toFixed(1)}% used • ₹{(budgetLimit - totalSpent).toLocaleString()} remaining
          </Text>
        </Animated.View>

        {/* Spending Trend Chart */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.chartCard}>
          <Text style={styles.chartTitle}>Spending Trend</Text>
          <BarChart
            data={chartData}
            width={width - 72}
            height={200}
            yAxisLabel="₹"
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: theme.colors.surface,
              backgroundGradientFrom: theme.colors.surface,
              backgroundGradientTo: theme.colors.surface,
              decimalPlaces: 0,
              color: () => categoryColor,
              labelColor: () => theme.colors.onSurface,
              style: { borderRadius: 16 },
            }}
            style={{ borderRadius: 16 }}
          />
        </Animated.View>

        {/* Recent Transactions */}
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {mockTransactions.map((transaction, index) => (
          <Animated.View
            key={transaction.id}
            entering={FadeInDown.delay(350 + index * 50)}
            style={styles.transactionCard}
          >
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionDescription}>{transaction.description}</Text>
              <Text style={styles.transactionDate}>
                {transaction.date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
            <Text style={styles.transactionAmount}>
              {type === 'expense' ? '-' : '+'}₹{transaction.amount.toLocaleString()}
            </Text>
          </Animated.View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}