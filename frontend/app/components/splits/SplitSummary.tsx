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

interface SplitSummaryProps {
  onViewDetails?: () => void;
  onSettleUp?: () => void;
}

interface SplitSummaryData {
  totalOwed: number;
  totalOwing: number;
  netBalance: number;
  unsettledTransactions: number;
  totalTransactions: number;
  friendBalances: Record<string, number>;
}

export const SplitSummary: React.FC<SplitSummaryProps> = ({
  onViewDetails,
  onSettleUp,
}) => {
  const theme = useTheme();
  const [summaryData, setSummaryData] = useState<SplitSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSummaryData = async () => {
    try {
      const data = await SplitService.getSplitSummary();
      setSummaryData(data);
    } catch (error) {
      console.error('Failed to load split summary:', error);
      Alert.alert('Error', 'Failed to load split summary');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSummaryData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadSummaryData();
  };

  const getNetBalanceColor = (balance: number) => {
    if (Math.abs(balance) < 0.01) return theme.colors.textSecondary;
    return balance > 0 ? theme.colors.success : theme.colors.error;
  };

  const getNetBalanceText = (balance: number) => {
    if (Math.abs(balance) < 0.01) return 'All settled up!';
    if (balance > 0) return 'You are owed';
    return 'You owe';
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.header}>
          <MaterialIcons name="account-balance" size={24} color={theme.colors.primary} />
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            Split Summary
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading...
          </Text>
        </View>
      </View>
    );
  }

  if (!summaryData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.header}>
          <MaterialIcons name="account-balance" size={24} color={theme.colors.primary} />
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            Split Summary
          </Text>
        </View>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Failed to load data
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="account-balance" size={24} color={theme.colors.primary} />
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            Split Summary
          </Text>
        </View>
        {onViewDetails && (
          <TouchableOpacity onPress={onViewDetails}>
            <Text style={[styles.viewDetailsText, { color: theme.colors.primary }]}>
              View All
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Net Balance */}
      <View style={styles.netBalanceContainer}>
        <Text style={[styles.netBalanceAmount, { color: getNetBalanceColor(summaryData.netBalance) }]}>
          {formatCurrency(Math.abs(summaryData.netBalance))}
        </Text>
        <Text style={[styles.netBalanceDescription, { color: theme.colors.textSecondary }]}>
          {getNetBalanceText(summaryData.netBalance)}
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: theme.colors.success + '20' }]}>
            <MaterialIcons name="trending-up" size={20} color={theme.colors.success} />
          </View>
          <Text style={[styles.statValue, { color: theme.colors.success }]}>
            {formatCurrency(summaryData.totalOwed)}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            You're owed
          </Text>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: theme.colors.error + '20' }]}>
            <MaterialIcons name="trending-down" size={20} color={theme.colors.error} />
          </View>
          <Text style={[styles.statValue, { color: theme.colors.error }]}>
            {formatCurrency(summaryData.totalOwing)}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            You owe
          </Text>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: theme.colors.warning + '20' }]}>
            <MaterialIcons name="schedule" size={20} color={theme.colors.warning} />
          </View>
          <Text style={[styles.statValue, { color: theme.colors.warning }]}>
            {summaryData.unsettledTransactions}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Unsettled
          </Text>
        </View>
      </View>

      {/* Transaction Summary */}
      <View style={styles.transactionSummary}>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
            Total Transactions
          </Text>
          <Text style={[styles.summaryValue, { color: theme.colors.textPrimary }]}>
            {summaryData.totalTransactions}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
            Pending Settlements
          </Text>
          <Text style={[styles.summaryValue, { color: theme.colors.warning }]}>
            {summaryData.unsettledTransactions}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      {(summaryData.totalOwed > 0 || summaryData.totalOwing > 0) && (
        <View style={styles.actionContainer}>
          {summaryData.totalOwing > 0 && onSettleUp && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              onPress={onSettleUp}
            >
              <MaterialIcons name="payment" size={20} color={theme.colors.onPrimary} />
              <Text style={[styles.actionButtonText, { color: theme.colors.onPrimary }]}>
                Settle Up
              </Text>
            </TouchableOpacity>
          )}
          
          {onViewDetails && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.secondaryButton,
                { borderColor: theme.colors.primary }
              ]}
              onPress={onViewDetails}
            >
              <MaterialIcons name="list" size={20} color={theme.colors.primary} />
              <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
                View Details
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Empty State */}
      {summaryData.totalTransactions === 0 && (
        <View style={styles.emptyState}>
          <MaterialIcons name="account-balance-wallet" size={48} color={theme.colors.textTertiary} />
          <Text style={[styles.emptyStateTitle, { color: theme.colors.textSecondary }]}>
            No Split Transactions
          </Text>
          <Text style={[styles.emptyStateDescription, { color: theme.colors.textTertiary }]}>
            Start splitting expenses with friends to see your balance summary here.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    margin: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  netBalanceContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  netBalanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  netBalanceDescription: {
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  transactionSummary: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SplitSummary;