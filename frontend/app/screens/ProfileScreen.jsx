import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, RefreshControl, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../context/TransactionContext';
import AnimatedCard from '../components/animations/AnimatedCard';
import SlideInAnimation from '../components/animations/SlideInAnimation';
import PulseAnimation from '../components/animations/PulseAnimation';
import CountUpAnimation from '../components/animations/CountUpAnimation';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, updateProfilePicture } = useAuth();
  const { summary, refreshData } = useTransactions();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData(true);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Animation values
  const headerOpacity = useSharedValue(0);
  const profileCardScale = useSharedValue(0.8);

  useEffect(() => {
    // Animate entrance
    headerOpacity.value = withTiming(1, { duration: 600 });
    profileCardScale.value = withDelay(300, withSpring(1, {
      damping: 15,
      stiffness: 150
    }));
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout }
      ]
    );
  };

  const menuItems = [
    { icon: 'account-circle', title: 'Personal Information', subtitle: 'Update your details' },
    { icon: 'security', title: 'Security', subtitle: 'Password and privacy settings' },
    { icon: 'notifications', title: 'Notifications', subtitle: 'Manage your notifications' },
    { icon: 'help', title: 'Help & Support', subtitle: 'Get help and contact support' },
    { icon: 'info', title: 'About', subtitle: 'App version and information' },
  ];

  const MenuItem = ({ icon, title, subtitle, onPress, showArrow = true, index = 0 }) => (
    <SlideInAnimation direction="right" delay={1000 + index * 100}>
      <TouchableOpacity
        onPress={onPress}
        className="bg-white rounded-2xl p-4 mb-3 flex-row items-center"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }}
        activeOpacity={0.7}
      >
        <PulseAnimation duration={2000 + index * 200}>
          <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-4">
            <MaterialIcons name={icon} size={24} color="#6366F1" />
          </View>
        </PulseAnimation>
        <View className="flex-1">
          <Text className="text-textPrimary font-semibold text-base">{title}</Text>
          <Text className="text-textSecondary text-sm mt-1">{subtitle}</Text>
        </View>
        {showArrow && (
          <PulseAnimation duration={3000}>
            <MaterialIcons name="keyboard-arrow-right" size={24} color="#64748B" />
          </PulseAnimation>
        )}
      </TouchableOpacity>
    </SlideInAnimation>
  );

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const profileCardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: profileCardScale.value }],
  }));

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <Animated.View className="px-6 pt-4 pb-2" style={headerAnimatedStyle}>
        <SlideInAnimation direction="down" delay={200}>
          <Text className="text-2xl font-bold text-textPrimary">Profile</Text>
        </SlideInAnimation>
      </Animated.View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#6366F1']}
            tintColor="#6366F1"
          />
        }
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <Animated.View className="mx-6 mb-6" style={profileCardAnimatedStyle}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            className="rounded-2xl p-6"
            style={{
              shadowColor: '#6366F1',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <View className="items-center">
              <SlideInAnimation direction="down" delay={600}>
                <PulseAnimation duration={3000}>
                  <View className="w-20 h-20 bg-white bg-opacity-20 rounded-full items-center justify-center mb-4">
                    <Text className="text-white text-2xl font-bold">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </Text>
                  </View>
                </PulseAnimation>
              </SlideInAnimation>
              <SlideInAnimation direction="left" delay={700}>
                <Text className="text-white text-xl font-bold mb-1">
                  {user?.name}
                </Text>
              </SlideInAnimation>
              <SlideInAnimation direction="right" delay={800}>
                <Text className="text-white text-base opacity-80 mb-2">
                  {user?.email}
                </Text>
              </SlideInAnimation>
              <SlideInAnimation direction="up" delay={900}>
                <TouchableOpacity 
                  className="bg-white bg-opacity-20 rounded-full px-3 py-1 flex-row items-center"
                  onPress={() => {
                    Clipboard.setString(user?.uid || '');
                    Alert.alert('Copied!', 'Your UID has been copied to clipboard');
                  }}
                  activeOpacity={0.8}
                >
                  <Text className="text-white text-sm font-medium">
                    UID: {user?.uid || 'Generating...'}
                  </Text>
                  <MaterialIcons name="content-copy" size={14} color="white" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
                <Text className="text-white text-xs mt-2 text-center opacity-70">
                  Tap to copy UID for split payments
                </Text>
              </SlideInAnimation>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Stats Cards */}
        <View className="flex-row px-6 mb-6">
          <AnimatedCard delay={1000} style={{ flex: 1, marginRight: 8 }}>
            <View className="bg-white rounded-2xl p-4" style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}>
              <SlideInAnimation direction="left" delay={1200}>
                <Text className="text-textSecondary text-sm mb-1">Total Balance</Text>
              </SlideInAnimation>
              <CountUpAnimation
                endValue={(summary.income - summary.expense) / 1000}
                formatter={(value) => `₹${value.toFixed(1)}K`}
                style={{
                  color: '#1E293B',
                  fontSize: 18,
                  fontWeight: 'bold'
                }}
                delay={1400}
              />
            </View>
          </AnimatedCard>
          
          <AnimatedCard delay={1100} style={{ flex: 1, marginLeft: 8 }}>
            <View className="bg-white rounded-2xl p-4" style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}>
              <SlideInAnimation direction="right" delay={1300}>
                <Text className="text-textSecondary text-sm mb-1">Transactions</Text>
              </SlideInAnimation>
              <CountUpAnimation
                endValue={summary.totalTransactions || 0}
                formatter={(value) => value.toFixed(0)}
                style={{
                  color: '#1E293B',
                  fontSize: 18,
                  fontWeight: 'bold'
                }}
                delay={1500}
              />
            </View>
          </AnimatedCard>
        </View>

        {/* Menu Items */}
        <View className="px-6 mb-6">
          {menuItems.map((item, index) => (
            <MenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              subtitle={item.subtitle}
              index={index}
              onPress={() => {
                // Handle menu item press based on type
                switch(item.icon) {
                  case 'account-circle':
                    Alert.alert('Personal Information', 'Edit your profile details here.');
                    break;
                  case 'security':
                    Alert.alert('Security', 'Security settings will be available soon.');
                    break;
                  case 'notifications':
                    Alert.alert('Notification Settings', 'Customize your notification preferences.');
                    break;
                  case 'help':
                    Alert.alert('Help & Support', 'Contact us at support@budgettracker.com or call +91-1234567890');
                    break;
                  case 'info':
                    Alert.alert('About Budget Tracker', 'Version 1.0.0\nBuilt with React Native\n\nA comprehensive budget tracking solution for managing your finances.');
                    break;
                  default:
                    Alert.alert(item.title, 'Feature accessed successfully!');
                }
              }}
            />
          ))}
        </View>

        {/* Account Actions */}
        <View className="px-6 mb-8">
          <SlideInAnimation direction="up" delay={1600}>
            <TouchableOpacity
              className="bg-white rounded-2xl p-4 mb-3 flex-row items-center justify-center"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}
              activeOpacity={0.7}
              onPress={() => {
                Alert.alert(
                  'Export Data', 
                  'Your transaction data will be exported as CSV file. This includes all your income, expenses, and analytics data.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Export', onPress: () => {
                      Alert.alert('Success', 'Data exported successfully! Check your downloads folder.');
                    }}
                  ]
                );
              }}
            >
              <PulseAnimation duration={2000}>
                <MaterialIcons name="backup" size={20} color="#6366F1" />
              </PulseAnimation>
              <Text className="text-primary font-semibold text-base ml-2">
                Export Data
              </Text>
            </TouchableOpacity>
          </SlideInAnimation>

          <SlideInAnimation direction="up" delay={1700}>
            <TouchableOpacity
              onPress={handleLogout}
              className="bg-white rounded-2xl p-4 flex-row items-center justify-center"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}
              activeOpacity={0.7}
            >
              <PulseAnimation duration={2500}>
                <MaterialIcons name="logout" size={20} color="#EF4444" />
              </PulseAnimation>
              <Text className="text-error font-semibold text-base ml-2">
                Sign Out
              </Text>
            </TouchableOpacity>
          </SlideInAnimation>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;