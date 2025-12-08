import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import UserService from '@/services/UserService';
import { STORAGE_KEYS } from '@/utils/constants';
import ResponsiveContainer from '@/components/layout/ResponsiveContainer';

// Helper to format currency as Indian Rupees
const formatCurrency = (amount: number) => {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(amount || 0)
      .replace('₹', '₹');
  } catch (e) {
    return `₹${(amount || 0).toLocaleString('en-IN')}`;
  }
};

interface UserStats {
  transactions: number;
  totalExpense: number;
  totalIncome: number;
}

export default function ProfileScreen({ navigation }: any) {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { transactions, loadTransactions } = useTransactions();

  const [userStats, setUserStats] = useState<UserStats>({
    transactions: 0,
    totalExpense: 0,
    totalIncome: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    loadUserStats();
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  // Recalculate stats when transactions change
  useEffect(() => {
    console.log('[ProfileScreen] Transactions changed, recalculating stats...');
    console.log('[ProfileScreen] Current transactions count:', transactions.length);
    
    if (transactions.length > 0) {
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      console.log('[ProfileScreen] Recalculated - Income:', totalIncome, 'Expense:', totalExpense);

      setUserStats(prev => ({
        ...prev,
        totalExpense: totalExpense,
        totalIncome: totalIncome,
        transactions: transactions.length,
      }));
    } else {
      console.log('[ProfileScreen] No transactions available, setting totals to 0');
      setUserStats(prev => ({
        ...prev,
        totalExpense: 0,
        totalIncome: 0,
        transactions: 0,
      }));
    }
  }, [transactions]);

  const handleEditProfile = () => {
    setEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      // TODO: Implement profile update API call
      console.log('Saving profile:', formData);
      setEditingProfile(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleCancelEdit = () => {
    setEditingProfile(false);
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  };



  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Data export feature will be available soon.',
      [{ text: 'OK' }]
    );
  };

  const loadUserStats = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load transactions to get real income and expense data
      console.log('[ProfileScreen] Loading transactions...');
      await loadTransactions();
      console.log('[ProfileScreen] Transactions loaded:', transactions.length);
      
      const statsResponse = await UserService.getUserStats();
      console.log('[ProfileScreen] getUserStats response:', statsResponse);

      // Calculate real income and expense from ALL transactions
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => {
          console.log('[ProfileScreen] Income transaction:', t.amount, t.type);
          return sum + t.amount;
        }, 0);
      
      const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => {
          console.log('[ProfileScreen] Expense transaction:', t.amount, t.type);
          return sum + t.amount;
        }, 0);

      console.log('[ProfileScreen] Calculated totals - Income:', totalIncome, 'Expense:', totalExpense);

      if (statsResponse && statsResponse.success && statsResponse.data) {
        setUserStats({
          transactions: statsResponse.data.transactions || 0,
          totalExpense: totalExpense,
          totalIncome: totalIncome,
        });
      } else {
        // Fallback to transaction-based stats if API fails
        setUserStats({
          transactions: transactions.length,
          totalExpense: totalExpense,
          totalIncome: totalIncome,
        });
      }
    } catch (err: any) {
      console.error('[ProfileScreen] Error loading user stats:', err?.response?.data || err?.message || err);
      
      // Fallback to transaction-based stats even if API fails
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      setUserStats({
        transactions: transactions.length,
        totalExpense: totalExpense,
        totalIncome: totalIncome,
      });
      
      if (err?.response?.status === 401) {
        setError('Unauthorized. Please login again.');
      } else {
        setError('Using offline data. Some features may be limited.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ResponsiveContainer>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={[styles.headerCard, { backgroundColor: theme.colors.surface }]}>    
            {editingProfile ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={[styles.editInput, { color: theme.colors.onSurface, borderColor: theme.colors.border }]}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Name"
                  placeholderTextColor={theme.colors.onSurface + '66'}
                />
                <TextInput
                  style={[styles.editInput, { color: theme.colors.onSurface, borderColor: theme.colors.border }]}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="Email"
                  placeholderTextColor={theme.colors.onSurface + '66'}
                  keyboardType="email-address"
                  editable={false} // Email typically not editable
                />
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                    onPress={handleSaveProfile}
                  >
                    <MaterialIcons name="check" size={20} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.cancelButton, { backgroundColor: theme.colors.error }]}
                    onPress={handleCancelEdit}
                  >
                    <MaterialIcons name="close" size={20} color="#FFFFFF" />
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                <Text style={[styles.userName, { color: theme.colors.onSurface }]}>
                  {user?.name || 'User'}
                </Text>
                <Text style={[styles.userEmail, { color: theme.colors.onSurface + '99' }]}>
                  {user?.email || 'user@example.com'}
                </Text>
                <TouchableOpacity
                  style={[styles.editButton, { backgroundColor: theme.colors.primary + '20' }]}
                  onPress={handleEditProfile}
                >
                  <MaterialIcons name="edit" size={16} color={theme.colors.primary} />
                  <Text style={[styles.editButtonText, { color: theme.colors.primary }]}>Edit Profile</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={[styles.statsCard, { backgroundColor: theme.colors.surface }]}> 
            <View style={styles.statsHeaderRow}>
              <Text style={[styles.statsTitle, { color: theme.colors.onSurface }]}>Your Statistics</Text>
              <TouchableOpacity onPress={loadUserStats}>
                <MaterialIcons name="refresh" size={22} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.centered}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : error ? (
              <View style={styles.centered}>
                <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
              </View>
            ) : (
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                    {userStats.transactions.toLocaleString('en-IN')}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.onSurface + '99' }]}>Transactions</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#F44336' }]}>
                    {formatCurrency(userStats.totalExpense)}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.onSurface + '99' }]}>Expense (Total Ever)</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                    {formatCurrency(userStats.totalIncome)}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.onSurface + '99' }]}>Income (Total Ever)</Text>
                </View>
              </View>
            )}
          </View>

          <View style={[styles.actionsCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Account Settings</Text>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primary + '10' }]}
              onPress={handleExportData}
            >
              <MaterialIcons name="download" size={20} color={theme.colors.primary} />
              <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>Export Data</Text>
              <MaterialIcons name="chevron-right" size={20} color={theme.colors.primary + '66'} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: '#F44336' }]}
            onPress={logout}
          >
            <MaterialIcons name="logout" size={20} color="#FFFFFF" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </ResponsiveContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 12,
  },
  userEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  statsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  statsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  editContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 16,
  },
  editInput: {
    width: '100%',
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 12,
  },
  editButtonText: {
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  actionsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
  },
});
