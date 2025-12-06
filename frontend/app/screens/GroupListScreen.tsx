import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Group } from '@/types';
import { GroupService } from '@/services/GroupService';
import CreateGroupForm from '@/components/groups/CreateGroupForm';

const GroupListScreen = ({ navigation }: any) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setIsLoading(true);
      const groupList = await GroupService.getUserGroups();
      setGroups(groupList);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadGroups();
    setIsRefreshing(false);
  }, []);

  const handleCreateGroup = async (groupData: any) => {
    try {
      await GroupService.createGroup(groupData);
      setShowCreateForm(false);
      await loadGroups();
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const getGroupIcon = (type: string) => {
    switch (type) {
      case 'trip':
        return 'flight';
      case 'rent':
        return 'home';
      case 'office_lunch':
        return 'restaurant';
      default:
        return 'group';
    }
  };

  const getGroupColor = (type: string) => {
    switch (type) {
      case 'trip':
        return '#3B82F6';
      case 'rent':
        return '#8B5CF6';
      case 'office_lunch':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const renderGroupItem = ({ item }: { item: Group }) => {
    const totalBalance = item.balances.reduce((sum, b) => sum + Math.abs(b.netBalance), 0);
    const isSettled = item.isSettled || totalBalance === 0;

    return (
      <TouchableOpacity
        style={styles.groupCard}
        onPress={() => navigation.navigate('GroupDetail', { groupId: item._id })}
      >
        <View style={styles.groupHeader}>
          <View style={[styles.groupIcon, { backgroundColor: getGroupColor(item.type) }]}>
            <MaterialIcons name={getGroupIcon(item.type) as any} size={24} color="#fff" />
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.name}</Text>
            <Text style={styles.groupMembers}>
              {item.members.filter(m => m.isActive).length} members
            </Text>
          </View>
          {isSettled && (
            <View style={styles.settledBadge}>
              <MaterialIcons name="check-circle" size={20} color="#10B981" />
            </View>
          )}
        </View>

        <View style={styles.groupFooter}>
          <View style={styles.groupStat}>
            <Text style={styles.groupStatLabel}>Total Expenses</Text>
            <Text style={styles.groupStatValue}>₹{item.totalExpenses.toFixed(2)}</Text>
          </View>
          {!isSettled && (
            <View style={styles.groupStat}>
              <Text style={styles.groupStatLabel}>Outstanding</Text>
              <Text style={[styles.groupStatValue, { color: '#EF4444' }]}>
                ₹{totalBalance.toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Groups</Text>
        <TouchableOpacity onPress={() => setShowCreateForm(true)}>
          <MaterialIcons name="add-circle" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Groups List */}
      <FlatList
        data={groups}
        renderItem={renderGroupItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.groupsList}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="group-add" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No groups yet</Text>
            <Text style={styles.emptySubtext}>
              Create a group to split expenses with multiple friends
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateForm(true)}
            >
              <Text style={styles.createButtonText}>Create Your First Group</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Create Group Modal */}
      <Modal
        visible={showCreateForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateForm(false)}
      >
        <CreateGroupForm
          onSubmit={handleCreateGroup}
          onCancel={() => setShowCreateForm(false)}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  groupsList: {
    paddingHorizontal: 20,
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  groupMembers: {
    fontSize: 14,
    color: '#64748B',
  },
  settledBadge: {
    marginLeft: 8,
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  groupStat: {
    flex: 1,
  },
  groupStatLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  groupStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 24,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GroupListScreen;
