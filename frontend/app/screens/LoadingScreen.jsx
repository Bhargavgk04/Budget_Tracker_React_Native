import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { COLORS } from '../utils/constants';
import LoadingSpinner from '../components/animations/LoadingSpinner';
import PulseAnimation from '../components/animations/PulseAnimation';

const LoadingScreen = () => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 800 });
    scale.value = withDelay(200, withTiming(1, { duration: 600 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <SafeAreaView className="flex-1">
      <LinearGradient
        colors={['#F8FAFC', '#E2E8F0']}
        className="flex-1 justify-center items-center"
      >
        <Animated.View style={animatedStyle} className="items-center">
          <PulseAnimation duration={2000} scale={1.1}>
            <View className="mb-8">
              <LoadingSpinner size={60} />
            </View>
          </PulseAnimation>
          
          <Text className="text-2xl font-bold text-textPrimary mb-2">
            Budget Tracker
          </Text>
          <Text className="text-base text-textSecondary">
            Loading your financial data...
          </Text>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default LoadingScreen;