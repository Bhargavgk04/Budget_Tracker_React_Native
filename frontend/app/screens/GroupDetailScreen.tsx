import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Group, SharedTransaction } from '@/types';
import { GroupService } from '@/services/GroupService';
import { DebtSimplificationService } from '@/services/DebtSimplificationService';
import DebtSimplificationView from '@/components/splits/DebtSimplificationView';

const GroupDetailScreen = ({ route, navigation }: any) => {
  const { groupId } = route.params;
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<SharedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSimplification, setShowSimplification] = useState(false);

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  const loadGroupData = async () => {
    try {
      setIsLoading(true);
      const [groupData, groupExpenses] = await Promise.all([
        GroupService.getGroupDetails(groupId),
        GroupService.getGroupExpenses(groupId)
      ]);
      setGroup(groupData);
      setExpenses(groupExpenses);
    } catch (error) {
      console.error('Error loading group data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  const activeMembers = group.members.filter(m => m.isActive);
  const totalBalance = group.balances.reduce((sum, b) => sum + Math.abs(b.netBalance), 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{group.name}</Text>
        <TouchableOpacity onPress={() => {}}>
          <MaterialIcons name="more-vert" size={24} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Group Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Members</Text>
            <Text style={styles.summaryValue}>{activeMembers.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Expenses</Text>
            <Text style={styles.summaryValue}>₹{group.totalExpenses.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Outstanding</Text>
            <Text style={[styles.summaryValue, { color: totalBalance > 0 ? '#EF4444' : '#10B981' }]}>
              ₹{totalBalance.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Balances</Text>
            <TouchableOpacity onPress={() => setShowSimplification(true)}>
              <Text style={styles.simplifyButton}>Simplify</Text>
            </TouchableOpacity>
          </View>
          {group.balances.map((balance) => (
            <View key={balance.user._id} style={styles.balanceRow}>
              <Text style={styles.balanceName}>{balance.user.name}</Text>
              <Text style={[
                styles.balanceAmount,
                { color: balance.netBalance > 0 ? '#10B981' : balance.netBalance < 0 ? '#EF4444' : '#6B7280' }
              ]}>
                {balance.netBalance > 0 ? '+' : ''}₹{balance.netBalance.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expenses</Text>
          {expenses.map((expense) => (
            <TouchableOpacity key={expense._id} style={styles.expenseCard}>
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseCategory}>{expense.category}</Text>
                <Text style={styles.expenseDescription}>{expense.description || 'No description'}</Text>
              </View>
              <Text style={styles.expenseAmount}>₹{expense.amount.toFixed(2)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal visible={showSimplification} animationType="slide" presentationStyle="pageSheet">
        <DebtSimplificationView
          groupId={groupId}
          onClose={() => setShowSimplification(false)}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  summaryCard: { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 20, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  summaryTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: '#64748B' },
  summaryValue: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  section: { marginBottom: 24, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  simplifyButton: { fontSize: 14, color: '#007AFF', fontWeight: '600' },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8 },
  balanceName: { fontSize: 16, color: '#1E293B' },
  balanceAmount: { fontSize: 16, fontWeight: '600' },
  expenseCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8 },
  expenseInfo: { flex: 1 },
  expenseCategory: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 4 },
  expenseDescription: { fontSize: 14, color: '#64748B' },
  expenseAmount: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
});

export default GroupDetailScreen;
