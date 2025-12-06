import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import SlideInAnimation from '../animations/SlideInAnimation';
import PulseAnimation from '../animations/PulseAnimation';

const MenuModal = ({ visible, onClose, navigation }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { icon: 'dashboard', title: 'Dashboard', screen: 'Dashboard' },
    { icon: 'list', title: 'Transactions', screen: 'Transactions' },
    { icon: 'analytics', title: 'Analytics', screen: 'Analytics' },
    { icon: 'person', title: 'Profile', screen: 'Profile' },
    { icon: 'settings', title: 'Settings', action: 'settings' },
    { icon: 'help', title: 'Help & Support', action: 'help' },
    { icon: 'logout', title: 'Sign Out', action: 'logout' },
  ];

  const handleMenuPress = (item) => {
    onClose();
    
    if (item.action === 'logout') {
      logout();
    } else if (item.action === 'settings') {
      // Handle settings
      console.log('Settings pressed');
    } else if (item.action === 'help') {
      // Handle help
      console.log('Help pressed');
    } else if (item.screen) {
      navigation.navigate(item.screen);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#F8FAFC' }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
          <Text className="text-xl font-bold text-textPrimary">Menu</Text>
          <TouchableOpacity 
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="close" size={24} color="#1E293B" />
          </TouchableOpacity>
        </View>

        {/* User Profile Section */}
        <SlideInAnimation direction="right" delay={200}>
          <View className="mx-6 mb-6">
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              className="rounded-2xl p-6"
            >
              <View className="flex-row items-center">
                <PulseAnimation duration={3000}>
                  <View className="w-16 h-16 bg-white bg-opacity-20 rounded-full items-center justify-center mr-4">
                    <Text className="text-white text-xl font-bold">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </Text>
                  </View>
                </PulseAnimation>
                <View className="flex-1">
                  <Text className="text-white text-lg font-bold">
                    {user?.name}
                  </Text>
                  <Text className="text-white text-sm opacity-80">
                    {user?.email}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </SlideInAnimation>

        {/* Menu Items */}
        <View className="flex-1 px-6">
          {menuItems.map((item, index) => (
            <SlideInAnimation key={index} direction="left" delay={300 + index * 50}>
              <TouchableOpacity
                onPress={() => handleMenuPress(item)}
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
                  <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
                    item.action === 'logout' ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    <MaterialIcons 
                      name={item.icon} 
                      size={24} 
                      color={item.action === 'logout' ? '#EF4444' : '#6366F1'} 
                    />
                  </View>
                </PulseAnimation>
                <Text className={`text-base font-medium ${
                  item.action === 'logout' ? 'text-error' : 'text-textPrimary'
                }`}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            </SlideInAnimation>
          ))}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default MenuModal;