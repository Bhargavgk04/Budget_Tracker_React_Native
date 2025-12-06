import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import PulseAnimation from '../animations/PulseAnimation';
import SlideInAnimation from '../animations/SlideInAnimation';
import MenuModal from './MenuModal';

const AppHeader = ({ 
  title, 
  subtitle, 
  showMenu = true, 
  showProfile = true,
  rightComponent,
  style 
}) => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [showMenuModal, setShowMenuModal] = useState(false);

  const headerOpacity = useSharedValue(1);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  return (
    <>
      <Animated.View 
        className="flex-row items-center justify-between px-6 pt-4 pb-2"
        style={[headerAnimatedStyle, style]}
      >
        {/* Left Side - Menu */}
        {showMenu ? (
          <TouchableOpacity 
            onPress={() => setShowMenuModal(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <PulseAnimation duration={4000}>
              <MaterialIcons name="menu" size={24} color="#1E293B" />
            </PulseAnimation>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}

        {/* Center - Title */}
        <View className="flex-1 items-center">
          <SlideInAnimation direction="down" delay={200}>
            <Text className="text-lg font-bold text-textPrimary">{title}</Text>
            {subtitle && (
              <Text className="text-sm text-textSecondary">{subtitle}</Text>
            )}
          </SlideInAnimation>
        </View>

        {/* Right Side - Profile or Custom Component */}
        {rightComponent || (showProfile ? (
          <TouchableOpacity 
            onPress={() => navigation.navigate('Profile')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <PulseAnimation duration={3000} scale={1.2}>
              <View className="w-10 h-10 bg-primary rounded-full items-center justify-center">
                <Text className="text-white font-bold text-base">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </Text>
              </View>
            </PulseAnimation>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        ))}
      </Animated.View>

      {/* Menu Modal */}
      <MenuModal 
        visible={showMenuModal}
        onClose={() => setShowMenuModal(false)}
        navigation={navigation}
      />
    </>
  );
};

export default AppHeader;