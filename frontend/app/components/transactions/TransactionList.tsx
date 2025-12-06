import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import { usePerformance } from '@/hooks/usePerformance';
import { Transaction } from '@/types';
import { ValidationUtils } from '@/utils/validation';
import { DataTransformUtils } from '@/utils/dataTransform';
import TransactionService from '@/services/TransactionService';

interface TransactionListProps {
  transactions: Transaction[];
  onTransactionPress?: (transaction: Transaction) => void;
  onTransactionEdit?: (transaction: Transaction) => void;
  onTransactionDelete?: (transactionId: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  showGrouping?: boolean;
  emptyMessage?: string;
}

interface TransactionItemProps {
  transaction: Transaction & {
    formattedAmount: string;
    formattedDate: string;
    categoryIcon: string;
    categoryColor: string;
  };
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function TransactionItem({ transaction, onPress, onEdit, onDelete }: TransactionItemProps) {
  const theme = useTheme();
  const { trackCustom } = usePerformance('TransactionItem');
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const renderRightActions = () => (
    <View style={styles.rightActions}>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          trackCustom('transaction_edit', { transactionId: transaction.id });
          onEdit?.();
        }}
      >
        <MaterialIcons name="edit" size={20} color="white" />
        <Text style={styles.actionText}>Edit</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
        onPress={() => {
          trackCustom('transaction_delete_attempt', { transactionId: transaction.id });
          Alert.alert(
            'Delete Transaction',
            'Are you sure you want to delete this transaction?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  trackCustom('transaction_delete_confirm', { transactionId: transaction.id });
                  onDelete?.();
                },
              },
            ]
          );
        }}
      >
        <MaterialIcons name="delete" size={20} color="white" />
        <Text style={styles.actionText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: theme.spacing.md,
      marginVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.md,
      elevation: 1,
      shadowColor: theme.colors.onSurface,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
    },
    categoryIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    transactionInfo: {
      flex: 1,
    },
    category: {
      ...theme.typography.body1,
      color: theme.colors.onSurface,
      fontWeight: '600',
      marginBottom: theme.spacing.xs,
    },
    details: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    date: {
      ...theme.typography.caption,
      color: theme.colors.onSurface + '80',
    },
    paymentMode: {
      ...theme.typography.caption,
      color: theme.colors.onSurface + '60',
      marginLeft: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 2,
      backgroundColor: theme.colors.onSurface + '10',
      borderRadius: theme.borderRadius.sm,
    },
    notes: {
      ...theme.typography.caption,
      color: theme.colors.onSurface + '60',
      fontStyle: 'italic',
    },
    amountContainer: {
      alignItems: 'flex-end',
    },
    amount: {
      ...theme.typography.h6,
      fontWeight: 'bold',
    },
    incomeAmount: {
      color: '#4CAF50',
    },
    expenseAmount: {
      color: '#F44336',
    },
    rightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: theme.spacing.xs,
    },
    actionButton: {
      width: 80,
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: theme.spacing.xs,
      borderRadius: theme.borderRadius.md,
    },
    actionText: {
      ...theme.typography.caption,
      color: 'white',
      marginTop: theme.spacing.xs,
      fontWeight: '600',
    },
  });

  return (
    <GestureHandlerRootView>
      <Swipeable renderRightActions={renderRightActions}>
        <Animated.View style={[styles.container, animatedStyle]}>
          <TouchableOpacity
            style={styles.content}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.9}
          >
            <View
              style={[
                styles.categoryIcon,
                { backgroundColor: transaction.categoryColor + '20' },
              ]}
            >
              <MaterialIcons
                name={transaction.categoryIcon as any}
                size={24}
                color={transaction.categoryColor}
              />
            </View>

            <View style={styles.transactionInfo}>
              <Text style={styles.category}>{transaction.category}</Text>
              <View style={styles.details}>
                <Text style={styles.date}>{transaction.formattedDate}</Text>
                <Text style={styles.paymentMode}>{transaction.paymentMode.toUpperCase()}</Text>
              </View>
              {transaction.notes && (
                <Text style={styles.notes} numberOfLines={1}>
                  {transaction.notes}
                </Text>
              )}
            </View>

            <View style={styles.amountContainer}>
              <Text
                style={[
                  styles.amount,
                  transaction.type === 'income' ? styles.incomeAmount : styles.expenseAmount,
                ]}
              >
                {transaction.type === 'income' ? '+' : '-'}
                {transaction.formattedAmount}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Swipeable>
    </GestureHandlerRootView>
  );
}

export default function TransactionList({
  transactions,
  onTransactionPress,
  onTransactionEdit,
  onTransactionDelete,
  onRefresh,
  isRefreshing = false,
  showGrouping = true,
  emptyMessage = 'No transactions found',
}: TransactionListProps) {
  const theme = useTheme();
  const { trackCustom } = usePerformance('TransactionList');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Transform transactions for display
  const transformedTransactions = useMemo(() => {
    return DataTransformUtils.transformTransactionsForList(transactions, []);
  }, [transactions]);

  // Group transactions by date if grouping is enabled
  const groupedTransactions = useMemo(() => {
    if (!showGrouping) {
      return [{ title: '', data: transformedTransactions }];
    }

    const grouped = DataTransformUtils.groupTransactionsByDate(transformedTransactions);
    return Array.from(grouped.entries())
      .map(([date, transactions]) => ({
        title: date,
        data: transactions,
      }))
      .sort((a, b) => new Date(b.title).getTime() - new Date(a.title).getTime());
  }, [transformedTransactions, showGrouping]);

  const handleTransactionDelete = useCallback(async (transactionId: string) => {
    try {
      setIsDeleting(transactionId);
      trackCustom('transaction_delete_start', { transactionId });
      
      await TransactionService.deleteTransaction(transactionId);
      
      trackCustom('transaction_delete_success', { transactionId });
      onTransactionDelete?.(transactionId);
    } catch (error) {
      trackCustom('transaction_delete_error', { 
        transactionId,
        error: error instanceof Error ? error.message : 'Unknown' 
      });
      Alert.alert('Error', 'Failed to delete transaction. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  }, [onTransactionDelete, trackCustom]);

  const renderSectionHeader = ({ section }: any) => {
    if (!section.title) return null;

    const sectionTotal = section.data.reduce((sum: number, transaction: any) => {
      return sum + (transaction.type === 'income' ? transaction.amount : -transaction.amount);
    }, 0);

    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text
          style={[
            styles.sectionTotal,
            { color: sectionTotal >= 0 ? '#4CAF50' : '#F44336' },
          ]}
        >
          {sectionTotal >= 0 ? '+' : ''}
          {ValidationUtils.formatCurrency(Math.abs(sectionTotal))}
        </Text>
      </View>
    );
  };

  const renderTransaction = ({ item }: { item: any }) => (
    <TransactionItem
      transaction={item}
      onPress={() => onTransactionPress?.(item)}
      onEdit={() => onTransactionEdit?.(item)}
      onDelete={() => handleTransactionDelete(item.id)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="receipt-long" size={64} color={theme.colors.onSurface + '40'} />
      <Text style={styles.emptyStateTitle}>No Transactions</Text>
      <Text style={styles.emptyStateMessage}>{emptyMessage}</Text>
    </View>
  );

  const keyExtractor = useCallback((item: any) => item.id, []);

  const getItemLayout = useCallback(
    (data: any, index: number) => ({
      length: 80, // Approximate item height
      offset: 80 * index,
      index,
    }),
    []
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.background,
    },
    sectionTitle: {
      ...theme.typography.h6,
      color: theme.colors.onBackground,
      fontWeight: '600',
    },
    sectionTotal: {
      ...theme.typography.body1,
      fontWeight: 'bold',
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.xl * 2,
    },
    emptyStateTitle: {
      ...theme.typography.h6,
      color: theme.colors.onBackground + '60',
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
    },
    emptyStateMessage: {
      ...theme.typography.body2,
      color: theme.colors.onBackground + '40',
      textAlign: 'center',
    },
  });

  if (showGrouping) {
    return (
      <View style={styles.container}>
        <FlatList
          data={groupedTransactions}
          renderItem={({ item: section }) => (
            <View>
              {renderSectionHeader({ section })}
              {section.data.map((transaction: any) => (
                <View key={transaction.id}>
                  {renderTransaction({ item: transaction })}
                </View>
              ))}
            </View>
          )}
          keyExtractor={(item, index) => `section-${index}`}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
            ) : undefined
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={transformedTransactions}
        renderItem={renderTransaction}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          ) : undefined
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
      />
    </View>
  );
}