import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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
import { COLORS } from '../utils/constants';
import PulseAnimation from '../components/animations/PulseAnimation';

const OnboardingScreen = ({ navigation }) => {
  const iconScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(100);

  useEffect(() => {
    // Sequence of animations
    iconScale.value = withDelay(300, withSpring(1, {
      damping: 15,
      stiffness: 150
    }));
    
    titleOpacity.value = withDelay(800, withTiming(1, { duration: 600 }));
    subtitleOpacity.value = withDelay(1200, withTiming(1, { duration: 600 }));
    buttonsTranslateY.value = withDelay(1600, withSpring(0, {
      damping: 20,
      stiffness: 100
    }));
  }, []);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const buttonsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: buttonsTranslateY.value }],
  }));

  return (
    <SafeAreaView className="flex-1">
      <LinearGradient
        colors={['#F8FAFC', '#E2E8F0']}
        className="flex-1 justify-center items-center px-6"
      >
        <Animated.View style={iconAnimatedStyle}>
          <PulseAnimation duration={3000} scale={1.1}>
            <LinearGradient
              colors={['#8B5CF6', '#6366F1']}
              style={{
                width: 140,
                height: 140,
                borderRadius: 70,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#6366F1',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <MaterialIcons name="account-balance-wallet" size={80} color="white" />
            </LinearGradient>
          </PulseAnimation>
        </Animated.View>
        
        <Animated.Text 
          className="text-3xl font-bold text-textPrimary mt-8 text-center"
          style={titleAnimatedStyle}
        >
          Budget Tracker
        </Animated.Text>
        
        <Animated.Text 
          className="text-lg text-textSecondary mt-4 text-center"
          style={subtitleAnimatedStyle}
        >
          Take control of your finances with smart budgeting and expense tracking
        </Animated.Text>
        
        <Animated.View className="w-full mt-12" style={buttonsAnimatedStyle}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Signup')}
            className="rounded-2xl overflow-hidden mb-4"
          >
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              className="py-4"
            >
              <Text className="text-white text-center font-semibold text-lg">
                Get Started
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            className="border-2 border-primary py-4 rounded-2xl bg-white"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <Text className="text-primary text-center font-semibold text-lg">
              Sign In
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default OnboardingScreen;