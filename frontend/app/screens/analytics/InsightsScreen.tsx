import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'tip';
  icon: string;
  title: string;
  description: string;
  color: string;
}

export default function InsightsScreen({ navigation }: any) {
  const theme = useTheme();

  const insights: Insight[] = [
    {
      id: '1',
      type: 'success',
      icon: 'trending-down',
      title: 'Great Job!',
      description: 'Your spending decreased by 15% this month compared to last month.',
      color: '#10B981',
    },
    {
      id: '2',
      type: 'warning',
      icon: 'warning',
      title: 'Budget Alert',
      description: 'You\'ve spent 85% of your Food & Dining budget. Consider reducing expenses.',
      color: '#F59E0B',
    },
    {
      id: '3',
      type: 'info',
      icon: 'info',
      title: 'Top Spending Category',
      description: 'Food & Dining is your highest expense category at ₹4,500 this month.',
      color: '#3B82F6',
    },
    {
      id: '4',
      type: 'tip',
      icon: 'lightbulb',
      title: 'Savings Opportunity',
      description: 'You could save ₹1,200 monthly by reducing dining out by 2 times per week.',
      color: '#8B5CF6',
    },
    {
      id: '5',
      type: 'success',
      icon: 'check-circle',
      title: 'Budget on Track',
      description: 'Your overall budget is 62% utilized with 10 days remaining this month.',
      color: '#10B981',
    },
    {
      id: '6',
      type: 'info',
      icon: 'calendar-today',
      title: 'Recurring Payments',
      description: 'You have 3 upcoming recurring payments totaling ₹5,149 in the next week.',
      color: '#3B82F6',
    },
    {
      id: '7',
      type: 'tip',
      icon: 'account-balance',
      title: 'Investment Suggestion',
      description: 'Based on your income, you can invest ₹5,000 more monthly towards savings.',
      color: '#8B5CF6',
    },
    {
      id: '8',
      type: 'warning',
      icon: 'trending-up',
      title: 'Unusual Activity',
      description: 'Your entertainment expenses increased by 40% this month. Review transactions.',
      color: '#EF4444',
    },
  ];

  const summary = {
    totalInsights: insights.length,
    successCount: insights.filter(i => i.type === 'success').length,
    warningCount: insights.filter(i => i.type === 'warning').length,
    tipsCount: insights.filter(i => i.type === 'tip').length,
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return 'check-circle';
      case 'warning': return 'warning';
      case 'info': return 'info';
      case 'tip': return 'lightbulb';
      default: return 'info';
    }
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
    subtitle: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      paddingHorizontal: theme.spacing.lg,
    },
    scrollContainer: {
      paddingBottom: theme.spacing.xl,
    },
    summaryContainer: {
      flexDirection: 'row',
      marginHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    summaryCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    summaryValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.xs,
    },
    summaryLabel: {
      fontSize: 11,
      color: theme.colors.onSurface + '80',
      textAlign: 'center',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onBackground,
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    insightCard: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    insightContent: {
      flex: 1,
    },
    insightTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.xs,
    },
    insightDescription: {
      fontSize: 14,
      color: theme.colors.onSurface + 'CC',
      lineHeight: 20,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xxl,
    },
    emptyIcon: {
      marginBottom: theme.spacing.md,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface + '80',
      marginBottom: theme.spacing.xs,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.onSurface + '60',
      textAlign: 'center',
    },
  }), [theme]);

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
          <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Smart Insights</Text>
        </View>
        <Text style={styles.subtitle}>AI-powered spending insights and recommendations</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <Animated.View entering={FadeInDown.delay(100)} style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{summary.totalInsights}</Text>
            <Text style={styles.summaryLabel}>Total Insights</Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(150)} style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>{summary.successCount}</Text>
            <Text style={styles.summaryLabel}>Achievements</Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(200)} style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>{summary.warningCount}</Text>
            <Text style={styles.summaryLabel}>Alerts</Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(250)} style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: '#8B5CF6' }]}>{summary.tipsCount}</Text>
            <Text style={styles.summaryLabel}>Tips</Text>
          </Animated.View>
        </View>

        {/* Insights List */}
        <Text style={styles.sectionTitle}>Your Insights</Text>
        {insights.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="insights" size={64} color={theme.colors.onSurface + '40'} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No Insights Yet</Text>
            <Text style={styles.emptySubtext}>Start tracking your expenses to get personalized insights</Text>
          </View>
        ) : (
          insights.map((insight, index) => (
            <Animated.View
              key={insight.id}
              entering={FadeInDown.delay(300 + index * 50)}
              style={styles.insightCard}
            >
              <View style={[styles.iconContainer, { backgroundColor: insight.color + '20' }]}>
                <MaterialIcons name={insight.icon as any} size={24} color={insight.color} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightDescription}>{insight.description}</Text>
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}