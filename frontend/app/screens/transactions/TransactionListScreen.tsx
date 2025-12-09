import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { usePerformance } from '@/hooks/usePerformance';
import { useTransactions } from '@/hooks/useTransactions';
import { Transaction } from '@/types';
import { withPerformanceTracking, performanceUtils } from '@/utils/performance';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo } from 'react';
import TransactionService from '@/services/TransactionService';

function TransactionListScreen({ navigation }: any) {
  const theme = useTheme();
  const { user } = useAuth();
  const { trackCustom } = usePerformance('TransactionListScreen');
  const { transactions: allTransactions, isLoading, loadTransactions } = useTransactions();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  // Filter transactions based on type
  const transactions = useMemo(() => {
    if (filterType === 'all') return allTransactions;
    return allTransactions.filter(t => t.type === filterType);
  }, [allTransactions, filterType]);

  // Reload on screen focus
  useFocusEffect(
    useCallback(() => {
      console.log('[TransactionListScreen] Screen focused, reloading...');
      loadTransactions();
    }, [loadTransactions])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTransactions();
    setIsRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const isDemoUser = user?.id === 'demo-user-123';
              if (isDemoUser) {
                const { MockDataService } = await import('@/services/MockDataService');
                await MockDataService.deleteTransaction(id);
              } else {
                await TransactionService.deleteTransaction(id);
              }
              loadTransactions();
              trackCustom('transaction_deleted');
              performanceUtils.notifySuccess('Transaction deleted');
            } catch (error) {
              performanceUtils.notifyError('Failed to delete transaction');
            }
          },
        },
      ]
    );
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={() => {
        console.log('[TransactionListScreen] Navigating to details with transaction:', {
          id: item.id,
          type: item.type,
          amount: item.amount,
          category: item.category,
        });
        navigation.navigate('TransactionDetails', { transaction: item });
      }}
    >
      <View style={[
        styles.iconContainer,
        { backgroundColor: item.type === 'income' ? '#10B98120' : '#EF444420' }
      ]}>
        <MaterialIcons
          name={item.type === 'income' ? 'trending-up' : 'trending-down'}
          size={24}
          color={item.type === 'income' ? '#10B981' : '#EF4444'}
        />
      </View>
      
      <View style={styles.transactionContent}>
        <Text style={styles.categoryText}>{item.category}</Text>
        <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString()}</Text>
        {item.notes && <Text style={styles.notesText}>{item.notes}</Text>}
      </View>
      
      <View style={styles.amountContainer}>
        <Text style={[
          styles.amountText,
          { color: item.type === 'income' ? '#10B981' : '#EF4444' }
        ]}>
          {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
        </Text>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <MaterialIcons name="delete" size={20} color={theme.colors.onSurface + '60'} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.onBackground,
    },
    filterContainer: {
      flexDirection: 'row',
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    filterButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    filterButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    filterButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    filterButtonTextActive: {
      color: theme.colors.onPrimary,
    },
    transactionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      marginHorizontal: theme.spacing.lg,
      marginVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    transactionContent: {
      flex: 1,
    },
    categoryText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    dateText: {
      fontSize: 12,
      color: theme.colors.onSurface + '80',
      marginTop: 2,
    },
    notesText: {
      fontSize: 12,
      color: theme.colors.onSurface + '60',
      marginTop: 2,
    },
    amountContainer: {
      alignItems: 'flex-end',
      gap: theme.spacing.sm,
    },
    amountText: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.onSurface + '60',
      marginTop: theme.spacing.md,
    },
  }), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.onBackground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transactions</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddTransaction')}>
          <MaterialIcons name="add" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[
            styles.filterButtonText,
            filterType === 'all' && styles.filterButtonTextActive
          ]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'income' && styles.filterButtonActive]}
          onPress={() => setFilterType('income')}
        >
          <Text style={[
            styles.filterButtonText,
            filterType === 'income' && styles.filterButtonTextActive
          ]}>
            Income
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'expense' && styles.filterButtonActive]}
          onPress={() => setFilterType('expense')}
        >
          <Text style={[
            styles.filterButtonText,
            filterType === 'expense' && styles.filterButtonTextActive
          ]}>
            Expense
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="receipt-long" size={64} color={theme.colors.onSurface + '40'} />
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

export default withPerformanceTracking(TransactionListScreen, 'TransactionListScreen');
