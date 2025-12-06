import { apiService } from './ApiService';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export interface Notification {
  _id: string;
  userId: string;
  type: 'friend_request' | 'shared_expense' | 'settlement' | 'settlement_reminder' | 'group_activity';
  title: string;
  message: string;
  data: any;
  actionUrl?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export class NotificationService {
  /**
   * Configure notification handler
   */
  static configureNotifications() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  /**
   * Register for push notifications
   */
  static async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('Must use physical device for Push Notifications');
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      
      // Register token with backend
      await this.registerPushToken(token);

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Register push token with backend
   */
  static async registerPushToken(pushToken: string): Promise<void> {
    try {
      await apiService.post('/notifications/register-push-token', { pushToken });
    } catch (error) {
      console.error('Error registering push token:', error);
    }
  }

  /**
   * Get user notifications
   */
  static async getNotifications(filters?: {
    isRead?: boolean;
    type?: string;
    limit?: number;
  }): Promise<Notification[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.isRead !== undefined) params.append('isRead', filters.isRead.toString());
      if (filters?.type) params.append('type', filters.type);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const endpoint = `/notifications${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiService.get<Notification[]>(endpoint);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get notifications');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get notifications');
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(): Promise<number> {
    try {
      const response = await apiService.get<{ count: number }>('/notifications/unread-count');

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get unread count');
      }

      return response.data.count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<Notification> {
    try {
      const response = await apiService.put<Notification>(
        `/notifications/${notificationId}/read`,
        {}
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to mark as read');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to mark as read');
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(): Promise<void> {
    try {
      const response = await apiService.put('/notifications/read-all', {});

      if (!response.success) {
        throw new Error(response.error || 'Failed to mark all as read');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to mark all as read');
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      const response = await apiService.delete(`/notifications/${notificationId}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete notification');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete notification');
    }
  }

  /**
   * Handle notification tap
   */
  static handleNotificationTap(notification: Notification, navigation: any) {
    // Mark as read
    this.markAsRead(notification._id).catch(console.error);

    // Navigate based on notification type
    if (notification.actionUrl) {
      const url = notification.actionUrl;

      if (url.includes('/friends/requests')) {
        navigation.navigate('FriendList');
      } else if (url.includes('/friends/')) {
        const friendId = url.split('/friends/')[1];
        navigation.navigate('FriendDetail', { friendId });
      } else if (url.includes('/groups/')) {
        const groupId = url.split('/groups/')[1];
        navigation.navigate('GroupDetail', { groupId });
      } else if (url.includes('/transactions/')) {
        const transactionId = url.split('/transactions/')[1];
        navigation.navigate('TransactionDetail', { transactionId });
      } else if (url.includes('/settlements/')) {
        const settlementId = url.split('/settlements/')[1];
        // Navigate to settlement detail or friend detail
        if (notification.data?.friendId) {
          navigation.navigate('FriendDetail', { friendId: notification.data.friendId });
        }
      }
    }
  }
}

export default NotificationService;
