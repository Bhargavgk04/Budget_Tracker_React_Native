import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NotificationService, Notification } from '@/services/NotificationService';

const NotificationsScreen = ({ navigation }: any) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const filters = filter === 'unread' ? { isRead: false } : {};
      const data = await NotificationService.getNotifications(filters);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadNotifications();
    setIsRefreshing(false);
  }, [filter]);

  const handleNotificationTap = async (notification: Notification) => {
    NotificationService.handleNotificationTap(notification, navigation);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      await loadNotifications();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      Alert.alert('Error', 'Failed to delete notification');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
        return 'person-add';
      case 'shared_expense':
        return 'receipt';
      case 'settlement':
        return 'payment';
      case 'settlement_reminder':
        return 'alarm';
      case 'group_activity':
        return 'group';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'friend_request':
        return '#3B82F6';
      case 'shared_expense':
        return '#F59E0B';
      case 'settlement':
        return '#10B981';
      case 'settlement_reminder':
        return '#EF4444';
      case 'group_activity':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
      onPress={() => handleNotificationTap(item)}
    >
      <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.type) }]}>
        <MaterialIcons name={getNotificationIcon(item.type) as any} size={24} color="#fff" />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteNotification(item._id)}
      >
        <MaterialIcons name="close" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.some(n => !n.isRead) && (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllButton}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'unread' && styles.filterButtonActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterButtonText, filter === 'unread' && styles.filterButtonTextActive]}>
            Unread
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.notificationsList}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="notifications-none" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'unread' ? 'All caught up!' : 'You have no notifications yet'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1E293B' },
  markAllButton: { fontSize: 14, color: '#007AFF', fontWeight: '600' },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 8 },
  filterButton: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  filterButtonActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  filterButtonText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  filterButtonTextActive: { color: '#fff' },
  notificationsList: { paddingHorizontal: 20 },
  notificationCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  unreadCard: { borderLeftWidth: 4, borderLeftColor: '#007AFF' },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notificationContent: { flex: 1 },
  notificationTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 4 },
  notificationMessage: { fontSize: 14, color: '#64748B', marginBottom: 4 },
  notificationTime: { fontSize: 12, color: '#9CA3AF' },
  deleteButton: { padding: 4 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#64748B', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 8, textAlign: 'center' },
});

export default NotificationsScreen;
