import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { SimplifiedSettlement } from '@/types';
import { DebtSimplificationService } from '@/services/DebtSimplificationService';
import { SettlementService } from '@/services/SettlementService';

interface DebtSimplificationViewProps {
  groupId?: string;
  friendId?: string;
  onClose: () => void;
}

export const DebtSimplificationView: React.FC<DebtSimplificationViewProps> = ({
  groupId,
  friendId,
  onClose
}) => {
  const [originalDebts, setOriginalDebts] = useState<SimplifiedSettlement[]>([]);
  const [simplifiedDebts, setSimplifiedDebts] = useState<SimplifiedSettlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingSettlements, setIsCreatingSettlements] = useState(false);

  useEffect(() => {
    loadSimplification();
  }, [groupId, friendId]);

  const loadSimplification = async () => {
    try {
      setIsLoading(true);
      let result;
      if (groupId) {
        result = await DebtSimplificationService.getGroupSimplifiedSettlements(groupId);
      } else if (friendId) {
        result = await DebtSimplificationService.getSimplifiedSettlements(friendId);
      }
      
      if (result) {
        setOriginalDebts(result.original || []);
        setSimplifiedDebts(result.simplified || []);
      }
    } catch (error) {
      console.error('Error loading simplification:', error);
      Alert.alert('Error', 'Failed to load debt simplification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSettlements = async () => {
    Alert.alert(
      'Create Settlements',
      `This will create ${simplifiedDebts.length} settlement records. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            setIsCreatingSettlements(true);
            try {
              for (const debt of simplifiedDebts) {
                await SettlementService.createSettlement(debt.to._id, {
                  amount: debt.amount,
                  paymentMethod: 'other',
                  notes: 'Simplified settlement',
                  date: new Date()
                });
              }
              Alert.alert('Success', 'Settlements created successfully');
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to create settlements');
            } finally {
              setIsCreatingSettlements(false);
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  const transactionReduction = originalDebts.length - simplifiedDebts.length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <MaterialIcons name="close" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Debt Simplification</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Original</Text>
              <Text style={styles.summaryValue}>{originalDebts.length}</Text>
              <Text style={styles.summarySubtext}>transactions</Text>
            </View>
            <MaterialIcons name="arrow-forward" size={32} color="#64748B" />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Simplified</Text>
              <Text style={[styles.summaryValue, { color: '#10B981' }]}>{simplifiedDebts.length}</Text>
              <Text style={styles.summarySubtext}>transactions</Text>
            </View>
          </View>
          {transactionReduction > 0 && (
            <View style={styles.savingsCard}>
              <MaterialIcons name="check-circle" size={20} color="#10B981" />
              <Text style={styles.savingsText}>
                Saves {transactionReduction} transaction{transactionReduction > 1 ? 's' : ''}!
              </Text>
            </View>
          )}
        </View>

        {/* Original Debts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Original Debts</Text>
          {originalDebts.map((debt, index) => (
            <View key={index} style={styles.debtCard}>
              <View style={styles.debtInfo}>
                <Text style={styles.debtFrom}>{debt.from.name}</Text>
                <MaterialIcons name="arrow-forward" size={16} color="#64748B" />
                <Text style={styles.debtTo}>{debt.to.name}</Text>
              </View>
              <Text style={styles.debtAmount}>₹{debt.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Simplified Debts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Simplified Settlement Plan</Text>
          {simplifiedDebts.map((debt, index) => (
            <View key={index} style={[styles.debtCard, styles.simplifiedDebtCard]}>
              <View style={styles.debtInfo}>
                <Text style={styles.debtFrom}>{debt.from.name}</Text>
                <MaterialIcons name="arrow-forward" size={16} color="#007AFF" />
                <Text style={styles.debtTo}>{debt.to.name}</Text>
              </View>
              <Text style={[styles.debtAmount, { color: '#007AFF' }]}>₹{debt.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Create Settlements Button */}
        {simplifiedDebts.length > 0 && (
          <TouchableOpacity
            style={[styles.createButton, isCreatingSettlements && styles.createButtonDisabled]}
            onPress={handleCreateSettlements}
            disabled={isCreatingSettlements}
          >
            <Text style={styles.createButtonText}>
              {isCreatingSettlements ? 'Creating...' : 'Create All Settlements'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  summaryCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 16 },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { fontSize: 14, color: '#64748B', marginBottom: 8 },
  summaryValue: { fontSize: 32, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  summarySubtext: { fontSize: 12, color: '#9CA3AF' },
  savingsCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#D1FAE5', borderRadius: 12, padding: 12 },
  savingsText: { fontSize: 14, fontWeight: '600', color: '#10B981', marginLeft: 8 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B', marginBottom: 12 },
  debtCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  simplifiedDebtCard: { borderColor: '#007AFF', backgroundColor: '#EFF6FF' },
  debtInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 },
  debtFrom: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  debtTo: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  debtAmount: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  createButton: { backgroundColor: '#007AFF', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 20 },
  createButtonDisabled: { backgroundColor: '#9CA3AF' },
  createButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default DebtSimplificationView;
