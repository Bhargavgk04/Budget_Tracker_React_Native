import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Friend, SharedTransaction, Settlement } from '@/types';
import { FriendService } from '@/services/FriendService';
import { SplitService } from '@/services/SplitService';
import { SettlementService } from '@/services/SettlementService';
import SettlementForm from '@/components/settlements/SettlementForm';

const FriendDetailScreen = ({ route, navigation }: any) => {
  const { friendId } = route.params;
  const [friend, setFriend] = useState<Friend | null>(null);
  const [sharedExpenses, setSharedExpenses] = useState<SharedTransaction[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettlementForm, setShowSettlementForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unsettled' | 'settled'>('all');

  useEffect(() => {
    loadFriendData();
  }, [friendId]);

  const loadFriendData = async () => {
    try {
      setIsLoading(true);
      const [friendData, expenses, settlementHistory] = await Promise.all([
        FriendService.getFriendDetails(friendId),
        SplitService.getSharedTransactions({ friendId }),
        SettlementService.getSettlements({ friendId })
      ]);
      const fr = { ...friendData.friend, balance: friendData.balance } as Friend;
      setFriend(fr);
      setSharedExpenses(expenses);
      setSettlements(settlementHistory);
    } catch (error) {
      console.error('Error loading friend data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettlementSubmit = async (settlementData: any) => {
    try {
      await SettlementService.createSettlement({
        recipientId: friendId,
        amount: settlementData.amount,
        paymentMethod: settlementData.paymentMethod,
        notes: settlementData.notes,
        date: settlementData.date,
      });
      setShowSettlementForm(false);
      await loadFriendData();
    } catch (error) {
      console.error('Error creating settlement:', error);
    }
  };

  const filteredExpenses = sharedExpenses.filter(expense => {
    if (filter === 'all') return true;
    if (filter === 'unsettled') return !expense.splitInfo?.participants.every(p => p.settled);
    if (filter === 'settled') return expense.splitInfo?.participants.every(p => p.settled);
    return true;
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!friend) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Friend not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const balanceColor = 
    friend.balance.direction === 'owes_you' ? '#10B981' :
    friend.balance.direction === 'you_owe' ? '#EF4444' :
    '#6B7280';

  const balanceText =
    friend.balance.direction === 'settled' ? 'All settled up!' :
    friend.balance.direction === 'owes_you' ? `${friend.name} owes you` :
    `You owe ${friend.name}`;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Friend Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        {/* Balance Summary Card */}
        <View style={styles.balanceCard}>
          <View style={styles.friendHeader}>
            {friend.profilePicture ? (
              <Image source={{ uri: friend.profilePicture }} style={styles.largeAvatar} />
            ) : (
              <View style={[styles.largeAvatar, styles.avatarPlaceholder]}>
                <Text style={styles.largeAvatarText}>{friend.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.friendName}>{friend.name}</Text>
            <Text style={styles.friendUid}>UID: {friend.uid}</Text>
          </View>

          <View style={styles.balanceSummary}>
            <Text style={styles.balanceLabel}>{balanceText}</Text>
            {friend.balance.direction !== 'settled' && (
              <Text style={[styles.balanceAmount, { color: balanceColor }]}>
                ₹{friend.balance.amount.toFixed(2)}
              </Text>
            )}
          </View>

          {friend.balance.direction !== 'settled' && (
            <TouchableOpacity
              style={styles.settleButton}
              onPress={() => setShowSettlementForm(true)}
            >
              <Text style={styles.settleButtonText}>Settle Up</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'unsettled' && styles.filterTabActive]}
            onPress={() => setFilter('unsettled')}
          >
            <Text style={[styles.filterTabText, filter === 'unsettled' && styles.filterTabTextActive]}>
              Unsettled
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'settled' && styles.filterTabActive]}
            onPress={() => setFilter('settled')}
          >
            <Text style={[styles.filterTabText, filter === 'settled' && styles.filterTabTextActive]}>
              Settled
            </Text>
          </TouchableOpacity>
        </View>

        {/* Shared Expenses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shared Expenses</Text>
          {filteredExpenses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="receipt-long" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No expenses found</Text>
            </View>
          ) : (
            filteredExpenses.map((expense) => (
              <TouchableOpacity
                key={expense.id}
                style={styles.expenseCard}
                onPress={() => navigation.navigate('TransactionDetails', { transactionId: expense.id })}
              >
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseCategory}>{expense.category}</Text>
                  <Text style={styles.expenseDescription}>{expense.notes || 'No description'}</Text>
                  <Text style={styles.expenseDate}>
                    {new Date(expense.date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.expenseAmount}>
                  <Text style={styles.expenseTotal}>₹{expense.amount.toFixed(2)}</Text>
                  <Text style={styles.expenseShare}>
                    Your share: ₹{(expense.splitInfo?.participants.find(p => p.user === friendId)?.share || 0).toFixed(2)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Settlement History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settlement History</Text>
          {settlements.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="history" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No settlements yet</Text>
            </View>
          ) : (
            settlements.map((settlement) => (
              <View key={settlement._id} style={styles.settlementCard}>
                <View style={styles.settlementInfo}>
                  <Text style={styles.settlementAmount}>₹{settlement.amount.toFixed(2)}</Text>
                  <Text style={styles.settlementMethod}>{settlement.paymentMethod}</Text>
                  <Text style={styles.settlementDate}>
                    {new Date(settlement.date).toLocaleDateString()}
                  </Text>
                  {settlement.notes && (
                    <Text style={styles.settlementNotes}>{settlement.notes}</Text>
                  )}
                </View>
                <View style={[
                  styles.settlementStatus,
                  settlement.status === 'confirmed' && styles.settlementStatusConfirmed,
                  settlement.status === 'pending' && styles.settlementStatusPending
                ]}>
                  <Text style={styles.settlementStatusText}>
                    {settlement.status.charAt(0).toUpperCase() + settlement.status.slice(1)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Settlement Form Modal */}
      <Modal
        visible={showSettlementForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSettlementForm(false)}
      >
        <SettlementForm
          friendId={friendId}
          suggestedAmount={friend.balance.amount}
          onSubmit={handleSettlementSubmit}
          onCancel={() => setShowSettlementForm(false)}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  balanceCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  friendHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  largeAvatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  friendName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  friendUid: {
    fontSize: 14,
    color: '#64748B',
  },
  balanceSummary: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  settleButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 20,
    alignItems: 'center',
  },
  settleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#007AFF',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  expenseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  expenseDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  expenseTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  expenseShare: {
    fontSize: 12,
    color: '#007AFF',
  },
  settlementCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settlementInfo: {
    flex: 1,
  },
  settlementAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 4,
  },
  settlementMethod: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  settlementDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  settlementNotes: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  settlementStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  settlementStatusConfirmed: {
    backgroundColor: '#D1FAE5',
  },
  settlementStatusPending: {
    backgroundColor: '#FEF3C7',
  },
  settlementStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
});

export default FriendDetailScreen;
