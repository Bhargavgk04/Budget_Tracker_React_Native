import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

interface RecurringPaymentScreenProps {
  navigation: any;
}

interface RecurringPayment {
  id: string;
  name: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  category: string;
  icon: string;
  color: string;
  nextDate: Date;
  isActive: boolean;
}

export default function RecurringPaymentScreen({ navigation }: RecurringPaymentScreenProps) {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState<'active' | 'paused'>('active');

  const mockRecurringPayments: RecurringPayment[] = [
    {
      id: '1',
      name: 'Netflix Subscription',
      amount: 649,
      frequency: 'monthly',
      category: 'Entertainment',
      icon: 'movie',
      color: '#E50914',
      nextDate: new Date('2024-12-15'),
      isActive: true,
    },
    {
      id: '2',
      name: 'Rent Payment',
      amount: 15000,
      frequency: 'monthly',
      category: 'Housing',
      icon: 'home',
      color: '#8B5CF6',
      nextDate: new Date('2024-12-01'),
      isActive: true,
    },
    {
      id: '3',
      name: 'Gym Membership',
      amount: 2000,
      frequency: 'monthly',
      category: 'Health',
      icon: 'fitness-center',
      color: '#10B981',
      nextDate: new Date('2024-12-10'),
      isActive: true,
    },
    {
      id: '4',
      name: 'Amazon Prime',
      amount: 1499,
      frequency: 'yearly',
      category: 'Entertainment',
      icon: 'shopping-cart',
      color: '#FF9900',
      nextDate: new Date('2025-03-15'),
      isActive: false,
    },
  ];

  const filteredPayments = mockRecurringPayments.filter(
    (payment) => payment.isActive === (selectedTab === 'active')
  );

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
    };
    return labels[frequency] || frequency;
  };

  const getDaysUntil = (date: Date) => {
    const today = new Date();
    const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 3600 * 24));
    if (diff < 0) return 'Overdue';
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `in ${diff} days`;
  };

  const renderPaymentCard = ({ item, index }: { item: RecurringPayment; index: number }) => (
    <Animated.View entering={FadeInDown.delay(50 + index * 30)}>
      <TouchableOpacity style={styles.paymentCard} activeOpacity={0.7}>
        <View style={[styles.paymentIcon, { backgroundColor: item.color + '20' }]}>
          <MaterialIcons name={item.icon as any} size={28} color={item.color} />
        </View>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentName}>{item.name}</Text>
          <View style={styles.paymentMeta}>
            <Text style={styles.paymentFrequency}>{getFrequencyLabel(item.frequency)}</Text>
            <Text style={styles.paymentDivider}>•</Text>
            <Text style={styles.paymentCategory}>{item.category}</Text>
          </View>
          <Text style={styles.nextPayment}>Next: {getDaysUntil(item.nextDate)}</Text>
        </View>
        <View style={styles.paymentAmount}>
          <Text style={styles.amountText}>₹{item.amount.toLocaleString()}</Text>
          <MaterialIcons name="chevron-right" size={20} color={theme.colors.onSurface + '40'} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const totalMonthly = mockRecurringPayments
    .filter((p) => p.isActive)
    .reduce((sum, p) => {
      if (p.frequency === 'monthly') return sum + p.amount;
      if (p.frequency === 'yearly') return sum + p.amount / 12;
      if (p.frequency === 'weekly') return sum + (p.amount * 4);
      if (p.frequency === 'daily') return sum + (p.amount * 30);
      return sum;
    }, 0);

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    gradientHeader: {
      paddingBottom: theme.spacing.lg,
    },
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    backButton: {
      padding: theme.spacing.sm,
      marginRight: theme.spacing.md,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
      flex: 1,
    },
    addButton: {
      padding: theme.spacing.sm,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.xs,
    },
    tab: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.sm,
      alignItems: 'center',
    },
    tabActive: {
      backgroundColor: '#FFFFFF',
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    tabTextActive: {
      color: theme.colors.primary,
    },
    summaryCard: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    summaryTitle: {
      fontSize: 12,
      color: theme.colors.onSurface + '80',
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    summaryAmount: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    summarySubtitle: {
      fontSize: 12,
      color: theme.colors.onSurface + '60',
    },
    listContainer: {
      padding: theme.spacing.md,
    },
    paymentCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
    },
    paymentIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    paymentInfo: {
      flex: 1,
    },
    paymentName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    paymentMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    paymentFrequency: {
      fontSize: 12,
      color: theme.colors.onSurface + '80',
    },
    paymentDivider: {
      fontSize: 12,
      color: theme.colors.onSurface + '40',
      marginHorizontal: 6,
    },
    paymentCategory: {
      fontSize: 12,
      color: theme.colors.onSurface + '80',
    },
    nextPayment: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    paymentAmount: {
      alignItems: 'flex-end',
    },
    amountText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.xl * 3,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginTop: theme.spacing.md,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.onSurface + '60',
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
  }), [theme, selectedTab]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryVariant || theme.colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Recurring Payments</Text>
            <TouchableOpacity style={styles.addButton}>
              <MaterialIcons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'active' && styles.tabActive]}
              onPress={() => setSelectedTab('active')}
            >
              <Text style={[styles.tabText, selectedTab === 'active' && styles.tabTextActive]}>
                Active ({mockRecurringPayments.filter(p => p.isActive).length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'paused' && styles.tabActive]}
              onPress={() => setSelectedTab('paused')}
            >
              <Text style={[styles.tabText, selectedTab === 'paused' && styles.tabTextActive]}>
                Paused ({mockRecurringPayments.filter(p => !p.isActive).length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {selectedTab === 'active' && (
        <Animated.View entering={FadeInDown.delay(100)} style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Monthly Estimate</Text>
          <Text style={styles.summaryAmount}>₹{totalMonthly.toLocaleString()}</Text>
          <Text style={styles.summarySubtitle}>Total recurring payments per month</Text>
        </Animated.View>
      )}

      <FlatList
        data={filteredPayments}
        renderItem={renderPaymentCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="repeat" size={64} color={theme.colors.onSurface + '40'} />
            <Text style={styles.emptyText}>
              {selectedTab === 'active' ? 'No active payments' : 'No paused payments'}
            </Text>
            <Text style={styles.emptySubtext}>
              {selectedTab === 'active'
                ? 'Add your first recurring payment'
                : 'All your payments are active'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}