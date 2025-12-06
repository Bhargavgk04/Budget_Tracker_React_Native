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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';

import ResponsiveContainer from '@/components/layout/ResponsiveContainer';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { usePerformance } from '@/hooks/usePerformance';
import TransactionService from '@/services/TransactionService';
import { DataTransformUtils } from '@/utils/dataTransform';
import { ValidationUtils } from '@/utils/validation';
import { TIME_PERIODS, CHART_COLORS } from '@/utils/constants';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = Math.min(screenWidth - 32, 600); // Max width for web

export default function AnalyticsScreen({ navigation }: any) {
  const theme = useTheme();
  const { user } = useAuth();
  const { trackCustom } = usePerformance('AnalyticsScreen');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      trackCustom('analytics_load_start', { period: selectedPeriod });

      const period = DataTransformUtils.generateTimePeriod(selectedPeriod);
      const data = await TransactionService.getTransactionAnalytics(
        period.startDate,
        period.endDate
      );
      
      setAnalyticsData(data);
      trackCustom('analytics_load_success', { period: selectedPeriod });
    } catch (error) {
      trackCustom('analytics_load_error', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      console.error('Analytics load error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAnalytics();
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {TIME_PERIODS.slice(1, 4).map((period) => (
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
  );

  const renderCategoryChart = () => {
    if (!analyticsData?.categoryBreakdown?.length) return null;

    const pieData = analyticsData.categoryBreakdown.map((item: any, index: number) => ({
      name: item.category.length > 15 ? item.category.substring(0, 12) + '...' : item.category,
      amount: (item.total ?? item.amount ?? 0),
      color: CHART_COLORS[index % CHART_COLORS.length],
      legendFontColor: theme.colors.onSurface,
      legendFontSize: 12,
    }));

    return (
      <Animated.View entering={FadeInDown.delay(100)} style={styles.chartCard}>
        <Text style={styles.chartTitle}>Expense by Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <PieChart
            data={pieData}
            width={Math.max(chartWidth, 350)}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              backgroundColor: theme.colors.surface,
              propsForLabels: {
                fontSize: 10,
                fontWeight: 'bold',
              },
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </ScrollView>
      </Animated.View>
    );
  };

  const renderMonthlyTrend = () => {
    if (!analyticsData?.monthlyTrend?.length) return null;

    const chartData = {
      labels: analyticsData.monthlyTrend.map((item: any) => {
        const month = item.month.substring(0, 3);
        return month.length > 4 ? month.substring(0, 3) : month;
      }),
      datasets: [
        {
          data: analyticsData.monthlyTrend.map((item: any) => item.expenses),
          color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
          strokeWidth: 2,
        },
        {
          data: analyticsData.monthlyTrend.map((item: any) => item.income),
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          strokeWidth: 2,
        },
      ],
      legend: ['Expenses', 'Income'],
    };

    return (
      <Animated.View entering={FadeInDown.delay(200)} style={styles.chartCard}>
        <Text style={styles.chartTitle}>Monthly Trend</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={chartData}
            width={Math.max(chartWidth, 400)}
            height={220}
            chartConfig={{
              backgroundColor: theme.colors.surface,
              backgroundGradientFrom: theme.colors.surface,
              backgroundGradientTo: theme.colors.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => theme.colors.primary + Math.round(opacity * 255).toString(16),
              labelColor: (opacity = 1) => theme.colors.onSurface + Math.round(opacity * 255).toString(16),
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
              },
              propsForLabels: {
                fontSize: 10,
                fontWeight: 'bold',
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </ScrollView>
      </Animated.View>
    );
  };

  const renderSummaryCards = () => (
    <View style={styles.summaryContainer}>
      <Animated.View entering={FadeInDown.delay(50)} style={styles.summaryCard}>
        <MaterialIcons name="trending-up" size={32} color={theme.colors.success} />
        <Text style={styles.summaryLabel} numberOfLines={1}>Total Income</Text>
        <Text style={[styles.summaryValue, { color: theme.colors.success }]} numberOfLines={1}>
          {ValidationUtils.formatCurrency(analyticsData?.totalIncome || 0)}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100)} style={styles.summaryCard}>
        <MaterialIcons name="trending-down" size={32} color={theme.colors.expense} />
        <Text style={styles.summaryLabel} numberOfLines={1}>Total Expenses</Text>
        <Text style={[styles.summaryValue, { color: theme.colors.expense }]} numberOfLines={1}>
          {ValidationUtils.formatCurrency(analyticsData?.totalExpenses || 0)}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150)} style={styles.summaryCard}>
        <MaterialIcons name="account-balance-wallet" size={32} color={theme.colors.primary} />
        <Text style={styles.summaryLabel} numberOfLines={1}>Net Balance</Text>
        <Text
          style={[
            styles.summaryValue,
            {
              color: (analyticsData?.balance || 0) >= 0 ? theme.colors.success : theme.colors.expense,
            },
          ]}
          numberOfLines={1}
        >
          {ValidationUtils.formatCurrency(analyticsData?.balance || 0)}
        </Text>
      </Animated.View>
    </View>
  );

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.lg,
    },
    gradientHeader: {
      paddingBottom: theme.spacing.lg,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: theme.spacing.md,
    },
    periodSelector: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.xs,
    },
    periodButton: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.sm,
      alignItems: 'center',
    },
    periodButtonActive: {
      backgroundColor: '#FFFFFF',
    },
    periodButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#FFFFFF',
    },
    periodButtonTextActive: {
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    scrollContainer: {
      padding: theme.spacing.md,
    },
    summaryContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    summaryCard: {
      flex: 1,
      minWidth: screenWidth > 600 ? 180 : '100%',
      maxWidth: screenWidth > 600 ? 200 : '100%',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    summaryLabel: {
      fontSize: 14,
      color: theme.colors.onSurface + '80',
      marginTop: theme.spacing.sm,
      textAlign: 'center',
      width: '100%',
    },
    summaryValue: {
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: theme.spacing.xs,
      textAlign: 'center',
      width: '100%',
    },
    chartCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      alignItems: 'center',
      width: '100%',
    },
    chartTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.md,
      alignSelf: 'flex-start',
      width: '100%',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xl * 2,
    },
    emptyStateText: {
      fontSize: 16,
      color: theme.colors.onSurface + '60',
      marginTop: theme.spacing.md,
    },
  }), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <ResponsiveContainer>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryVariant || theme.colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientHeader}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Analytics</Text>
            {renderPeriodSelector()}
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {analyticsData ? (
            <>
              {renderSummaryCards()}
              {renderCategoryChart()}
              {renderMonthlyTrend()}
            </>
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="analytics" size={64} color={theme.colors.onSurface + '40'} />
              <Text style={styles.emptyStateText}>No data available</Text>
            </View>
          )}
        </ScrollView>
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
