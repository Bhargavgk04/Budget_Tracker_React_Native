import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
import { useTheme } from '@/hooks/useTheme';

const { width } = Dimensions.get('window');

export default function DetailedAnalyticsScreen({ navigation }: any) {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState<'expense' | 'income'>('expense');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  // Mock data
  const expenseData = {
    labels: ['Food', 'Transport', 'Entertainment', 'Bills', 'Shopping'],
    datasets: [{ data: [4500, 2300, 1800, 3200, 2800] }]
  };

  const incomeData = {
    labels: ['Salary', 'Freelance', 'Investments', 'Other'],
    datasets: [{ data: [45000, 8500, 3200, 1500] }]
  };

  const trendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      data: selectedTab === 'expense' 
        ? [12500, 14300, 13800, 15200, 14800, 16200]
        : [48000, 52000, 49500, 51000, 53500, 58200],
      color: () => selectedTab === 'expense' ? '#EF4444' : '#10B981',
    }]
  };

  const pieData = [
    { name: 'Food & Dining', amount: 4500, color: '#EF4444', percentage: 31 },
    { name: 'Transport', amount: 2300, color: '#F59E0B', percentage: 16 },
    { name: 'Entertainment', amount: 1800, color: '#8B5CF6', percentage: 12 },
    { name: 'Bills', amount: 3200, color: '#3B82F6', percentage: 22 },
    { name: 'Shopping', amount: 2800, color: '#10B981', percentage: 19 },
  ];

  const stats = [
    { label: 'Average/Day', value: '₹542', icon: 'today', color: '#3B82F6' },
    { label: 'Highest Expense', value: '₹2,450', icon: 'trending-up', color: '#EF4444' },
    { label: 'Most Frequent', value: 'Food', icon: 'restaurant', color: '#F59E0B' },
    { label: 'Categories', value: '12', icon: 'category', color: '#8B5CF6' },
  ];

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
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.xs,
      marginHorizontal: theme.spacing.lg,
    },
    tab: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.sm,
      alignItems: 'center',
    },
    tabActive: {
      backgroundColor: '#FFFFFF',
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#FFFFFF',
    },
    tabTextActive: {
      color: theme.colors.primary,
      fontWeight: '600',
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
      marginTop: theme.spacing.lg,
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
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    statCard: {
      width: '48%',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    statIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    statValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.xs,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.onSurface + '80',
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
    legendContainer: {
      marginTop: theme.spacing.md,
    },
    legendItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    legendLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    legendColor: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: theme.spacing.sm,
    },
    legendName: {
      fontSize: 14,
      color: theme.colors.onSurface,
      flex: 1,
    },
    legendAmount: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginRight: theme.spacing.sm,
    },
    legendPercentage: {
      fontSize: 12,
      color: theme.colors.onSurface + '80',
    },
  }), [theme]);

  const periods: { value: 'week' | 'month' | 'year'; label: string }[] = [
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryVariant || theme.colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Detailed Analytics</Text>
        </View>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'expense' && styles.tabActive]}
            onPress={() => setSelectedTab('expense')}
          >
            <Text style={[styles.tabText, selectedTab === 'expense' && styles.tabTextActive]}>
              Expenses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'income' && styles.tabActive]}
            onPress={() => setSelectedTab('income')}
          >
            <Text style={[styles.tabText, selectedTab === 'income' && styles.tabTextActive]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>
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

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <Animated.View key={stat.label} entering={FadeInDown.delay(100 + index * 50)} style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: stat.color + '20' }]}>
                <MaterialIcons name={stat.icon as any} size={20} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Animated.View>
          ))}
        </View>

        {/* Category Distribution */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.chartCard}>
          <Text style={styles.chartTitle}>Category Distribution</Text>
          <BarChart
            data={selectedTab === 'expense' ? expenseData : incomeData}
            width={width - 72}
            height={220}
            yAxisLabel="₹"
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: theme.colors.surface,
              backgroundGradientFrom: theme.colors.surface,
              backgroundGradientTo: theme.colors.surface,
              decimalPlaces: 0,
              color: () => selectedTab === 'expense' ? '#EF4444' : '#10B981',
              labelColor: () => theme.colors.onSurface,
              style: { borderRadius: 16 },
            }}
            style={{ borderRadius: 16 }}
          />
          {selectedTab === 'expense' && (
            <View style={styles.legendContainer}>
              {pieData.map((item) => (
                <View key={item.name} style={styles.legendItem}>
                  <View style={styles.legendLeft}>
                    <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                    <Text style={styles.legendName}>{item.name}</Text>
                  </View>
                  <Text style={styles.legendAmount}>₹{item.amount.toLocaleString()}</Text>
                  <Text style={styles.legendPercentage}>{item.percentage}%</Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Trend Chart */}
        <Animated.View entering={FadeInDown.delay(350)} style={styles.chartCard}>
          <Text style={styles.chartTitle}>6 Month Trend</Text>
          <LineChart
            data={trendData}
            width={width - 72}
            height={220}
            yAxisLabel="₹"
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: theme.colors.surface,
              backgroundGradientFrom: theme.colors.surface,
              backgroundGradientTo: theme.colors.surface,
              decimalPlaces: 0,
              color: () => selectedTab === 'expense' ? '#EF4444' : '#10B981',
              labelColor: () => theme.colors.onSurface,
              style: { borderRadius: 16 },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: selectedTab === 'expense' ? '#EF4444' : '#10B981',
              },
            }}
            bezier
            style={{ borderRadius: 16 }}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}