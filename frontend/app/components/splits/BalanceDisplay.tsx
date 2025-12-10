import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { SplitService } from '@/services/SplitService';
import { formatCurrency } from '@/utils/formatting';

interface BalanceDisplayProps {
  friendId: string;
  friendName: string;
  onSettlePress?: (amount: number) => void;
}

interface BalanceDetails {
  totalBalance: number;
  unsettledAmount: number;
  transactionCount: number;
  transactionBreakdown: Array<{
    transactionId: string;
    amount: number;
    category: string;
    date: string;
    paidBy: string;
    user1Share: number;
    user2Share: number;
    balance: number;
    settled: boolean;
    description?: string;
  }>;
  summary: {
    user1Owes: number;
    user2Owes: number;
    isSettled: boolean;
  };
}

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  friendId,
  friendName,
  onSettlePress,
}) => {
  const theme = useTheme();
  const [balanceDetails, setBalanceDetails] = useState<BalanceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);

  const loadBalanceDetails = async () => {
    try {
      const details = await SplitService.getDetailedBalance(friendId);
      setBalanceDetails(details);
    } catch (error) {
      console.error('Failed to load balance details:', error);
      Alert.alert('Error', 'Failed to load balance details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBalanceDetails();
  }, [friendId]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadBalanceDetails();
  };

  const handleSettlePress = () => {
    if (balanceDetails && onSettlePress) {
      const amount = Math.abs(balanceDetails.totalBalance);
      if (amount > 0) {
        onSettlePress(amount);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getBalanceColor = (balance: number) => {
    if (Math.abs(balance) < 0.01) return theme.colors.textSecondary;
    return balance > 0 ? theme.colors.success : theme.colors.error;
  };

  const getBalanceText = (balance: number) => {
    if (Math.abs(balance) < 0.01) return 'Settled';
    if (balance > 0) return `${friendName} owes you`;
    return `You owe ${friendName}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading balance details...
          </Text>
        </View>
      </View>
    );
  }

  if (!balanceDetails) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Failed to load balance details
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Balance Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.summaryHeader}>
          <Text style={[styles.summaryTitle, { color: theme.colors.textPrimary }]}>
            Balance Summary
          </Text>
          <MaterialIcons
            name="account-balance-wallet"
            size={24}
            color={theme.colors.primary}
          />
        </View>

        <View style={styles.balanceContainer}>
          <Text style={[styles.balanceAmount, { color: getBalanceColor(balanceDetails.totalBalance) }]}>
            {formatCurrency(Math.abs(balanceDetails.totalBalance))}
          </Text>
          <Text style={[styles.balanceDescription, { color: theme.colors.textSecondary }]}>
            {getBalanceText(balanceDetails.totalBalance)}
          </Text>
        </View>

        {balanceDetails.unsettledAmount > 0 && (
          <View style={styles.unsettledContainer}>
            <MaterialIcons name="schedule" size={16} color={theme.colors.warning} />
            <Text style={[styles.unsettledText, { color: theme.colors.warning }]}>
              {formatCurrency(balanceDetails.unsettledAmount)} unsettled
            </Text>
          </View>
        )}

        {Math.abs(balanceDetails.totalBalance) > 0.01 && (
          <TouchableOpacity
            style={[styles.settleButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSettlePress}
          >
            <MaterialIcons name="payment" size={20} color={theme.colors.onPrimary} />
            <Text style={[styles.settleButtonText, { color: theme.colors.onPrimary }]}>
              Settle Up
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Transaction Stats */}
      <View style={[styles.statsCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.statsTitle, { color: theme.colors.textPrimary }]}>
          Transaction Statistics
        </Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {balanceDetails.transactionCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Total Transactions
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.success }]}>
              {formatCurrency(balanceDetails.summary.user2Owes)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              {friendName} Owes
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.error }]}>
              {formatCurrency(balanceDetails.summary.user1Owes)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              You Owe
            </Text>
          </View>
        </View>
      </View>

      {/* Transaction History Toggle */}
      <TouchableOpacity
        style={[styles.toggleButton, { backgroundColor: theme.colors.surface }]}
        onPress={() => setShowTransactions(!showTransactions)}
      >
        <Text style={[styles.toggleButtonText, { color: theme.colors.textPrimary }]}>
          Transaction History ({balanceDetails.transactionBreakdown.length})
        </Text>
        <MaterialIcons
          name={showTransactions ? 'expand-less' : 'expand-more'}
          size={24}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Transaction History */}
      {showTransactions && (
        <View style={[styles.transactionsCard, { backgroundColor: theme.colors.surface }]}>
          {balanceDetails.transactionBreakdown.length === 0 ? (
            <Text style={[styles.noTransactionsText, { color: theme.colors.textSecondary }]}>
              No shared transactions found
            </Text>
          ) : (
            balanceDetails.transactionBreakdown.map((transaction, index) => (
              <View
                key={transaction.transactionId}
                style={[
                  styles.transactionItem,
                  {
                    borderBottomColor: theme.colors.border,
                    borderBottomWidth: index < balanceDetails.transactionBreakdown.length - 1 ? 1 : 0,
                  },
                ]}
              >
                <View style={styles.transactionHeader}>
                  <View style={styles.transactionInfo}>
                    <Text style={[styles.transactionCategory, { color: theme.colors.textPrimary }]}>
                      {transaction.category}
                    </Text>
                    <Text style={[styles.transactionDate, { color: theme.colors.textSecondary }]}>
                      {formatDate(transaction.date)}
                    </Text>
                  </View>
                  <View style={styles.transactionAmount}>
                    <Text style={[styles.transactionTotal, { color: theme.colors.textPrimary }]}>
                      {formatCurrency(transaction.amount)}
                    </Text>
                    <View style={styles.settlementStatus}>
                      <MaterialIcons
                        name={transaction.settled ? 'check-circle' : 'schedule'}
                        size={16}
                        color={transaction.settled ? theme.colors.success : theme.colors.warning}
                      />
                      <Text
                        style={[
                          styles.settlementText,
                          {
                            color: transaction.settled ? theme.colors.success : theme.colors.warning,
                          },
                        ]}
                      >
                        {transaction.settled ? 'Settled' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.transactionShares}>
                  <Text style={[styles.shareText, { color: theme.colors.textSecondary }]}>
                    Your share: {formatCurrency(transaction.user1Share)} • 
                    {friendName}'s share: {formatCurrency(transaction.user2Share)}
                  </Text>
                  {transaction.balance !== 0 && (
                    <Text style={[styles.balanceText, { color: getBalanceColor(transaction.balance) }]}>
                      {transaction.balance > 0 
                        ? `${friendName} owes ${formatCurrency(transaction.balance)}`
                        : `You owe ${formatCurrency(Math.abs(transaction.balance))}`
                      }
                    </Text>
                  )}
                </View>

                {transaction.description && (
                  <Text style={[styles.transactionDescription, { color: theme.colors.textSecondary }]}>
                    {transaction.description}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  summaryCard: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  balanceDescription: {
    fontSize: 16,
  },
  unsettledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  unsettledText: {
    fontSize: 14,
    marginLeft: 4,
  },
  settleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  settleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  toggleButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  transactionsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  noTransactionsText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
  },
  transactionItem: {
    padding: 16,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 14,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionTotal: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settlementStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settlementText: {
    fontSize: 12,
    marginLeft: 4,
  },
  transactionShares: {
    marginBottom: 8,
  },
  shareText: {
    fontSize: 14,
    marginBottom: 2,
  },
  balanceText: {
    fontSize: 14,
    fontWeight: '500',
  },
  transactionDescription: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default BalanceDisplay;