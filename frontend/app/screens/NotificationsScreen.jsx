import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AnimatedCard from '../components/animations/AnimatedCard';
import SlideInAnimation from '../components/animations/SlideInAnimation';

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Budget Alert',
      message: 'You have exceeded 80% of your monthly budget',
      type: 'warning',
      time: '2 hours ago',
      read: false,
    },
    {
      id: '2',
      title: 'Transaction Added',
      message: 'New expense: Groceries - $45.50',
      type: 'info',
      time: '5 hours ago',
      read: false,
    },
    {
      id: '3',
      title: 'Weekly Report',
      message: 'Your weekly spending report is ready',
      type: 'success',
      time: '1 day ago',
      read: true,
    },
    {
      id: '4',
      title: 'Payment Reminder',
      message: 'Rent payment due in 3 days',
      type: 'warning',
      time: '2 days ago',
      read: true,
    },
  ]);

  const [settings, setSettings] = useState({
    budgetAlerts: true,
    transactionNotifications: true,
    weeklyReports: true,
    paymentReminders: true,
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning':
        return 'warning';
      case 'success':
        return 'check-circle';
      case 'info':
        return 'info';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'warning':
        return '#F59E0B';
      case 'success':
        return '#10B981';
      case 'info':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const deleteNotification = (id) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setNotifications(prev =>
              prev.filter(notification => notification.id !== id)
            );
          },
        },
      ]
    );
  };

  const clearAllNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => setNotifications([]),
        },
      ]
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <SlideInAnimation delay={0}>
        <View className="flex-row items-center justify-between px-6 py-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-textPrimary">Notifications</Text>
          <TouchableOpacity
            onPress={clearAllNotifications}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="clear-all" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </SlideInAnimation>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        {unreadCount > 0 && (
          <AnimatedCard delay={100} style={{ marginHorizontal: 24, marginBottom: 16 }}>
            <View className="bg-white rounded-2xl p-4" style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}>
              <View className="flex-row items-center justify-between">
                <Text className="text-textPrimary font-semibold">
                  {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                </Text>
                <TouchableOpacity
                  onPress={markAllAsRead}
                  className="bg-primary px-4 py-2 rounded-lg"
                  activeOpacity={0.8}
                >
                  <Text className="text-white font-medium text-sm">Mark All Read</Text>
                </TouchableOpacity>
              </View>
            </View>
          </AnimatedCard>
        )}

        {/* Notifications List */}
        <View className="px-6">
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <AnimatedCard key={notification.id} delay={200 + index * 50} style={{ marginBottom: 12 }}>
                <TouchableOpacity
                  onPress={() => markAsRead(notification.id)}
                  onLongPress={() => deleteNotification(notification.id)}
                  className={`bg-white rounded-2xl p-4 ${!notification.read ? 'border-l-4 border-primary' : ''}`}
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-start">
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: `${getNotificationColor(notification.type)}20` }}
                    >
                      <MaterialIcons
                        name={getNotificationIcon(notification.type)}
                        size={20}
                        color={getNotificationColor(notification.type)}
                      />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className={`font-semibold ${!notification.read ? 'text-textPrimary' : 'text-textSecondary'}`}>
                          {notification.title}
                        </Text>
                        {!notification.read && (
                          <View className="w-2 h-2 bg-primary rounded-full" />
                        )}
                      </View>
                      <Text className="text-textSecondary text-sm mb-2">
                        {notification.message}
                      </Text>
                      <Text className="text-textSecondary text-xs">
                        {notification.time}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </AnimatedCard>
            ))
          ) : (
            <AnimatedCard delay={200} style={{ marginTop: 40 }}>
              <View className="items-center py-12">
                <MaterialIcons name="notifications-none" size={64} color="#CBD5E1" />
                <Text className="text-textSecondary text-lg font-medium mt-4">No notifications</Text>
                <Text className="text-textSecondary text-sm text-center mt-2">
                  You're all caught up! New notifications will appear here.
                </Text>
              </View>
            </AnimatedCard>
          )}
        </View>

        {/* Notification Settings */}
        <AnimatedCard delay={400} style={{ margin: 24 }}>
          <View className="bg-white rounded-2xl p-6" style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <Text className="text-textPrimary text-lg font-bold mb-4">Notification Settings</Text>
            
            <View className="space-y-4">
              <View className="flex-row items-center justify-between py-2">
                <View className="flex-1">
                  <Text className="text-textPrimary font-medium">Budget Alerts</Text>
                  <Text className="text-textSecondary text-sm">Get notified when you exceed budget limits</Text>
                </View>
                <Switch
                  value={settings.budgetAlerts}
                  onValueChange={(value) => updateSetting('budgetAlerts', value)}
                  trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
                  thumbColor={settings.budgetAlerts ? '#FFFFFF' : '#F3F4F6'}
                />
              </View>

              <View className="flex-row items-center justify-between py-2">
                <View className="flex-1">
                  <Text className="text-textPrimary font-medium">Transaction Notifications</Text>
                  <Text className="text-textSecondary text-sm">Get notified for new transactions</Text>
                </View>
                <Switch
                  value={settings.transactionNotifications}
                  onValueChange={(value) => updateSetting('transactionNotifications', value)}
                  trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
                  thumbColor={settings.transactionNotifications ? '#FFFFFF' : '#F3F4F6'}
                />
              </View>

              <View className="flex-row items-center justify-between py-2">
                <View className="flex-1">
                  <Text className="text-textPrimary font-medium">Weekly Reports</Text>
                  <Text className="text-textSecondary text-sm">Receive weekly spending summaries</Text>
                </View>
                <Switch
                  value={settings.weeklyReports}
                  onValueChange={(value) => updateSetting('weeklyReports', value)}
                  trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
                  thumbColor={settings.weeklyReports ? '#FFFFFF' : '#F3F4F6'}
                />
              </View>

              <View className="flex-row items-center justify-between py-2">
                <View className="flex-1">
                  <Text className="text-textPrimary font-medium">Payment Reminders</Text>
                  <Text className="text-textSecondary text-sm">Get reminded about upcoming payments</Text>
                </View>
                <Switch
                  value={settings.paymentReminders}
                  onValueChange={(value) => updateSetting('paymentReminders', value)}
                  trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
                  thumbColor={settings.paymentReminders ? '#FFFFFF' : '#F3F4F6'}
                />
              </View>
            </View>
          </View>
        </AnimatedCard>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationsScreen;