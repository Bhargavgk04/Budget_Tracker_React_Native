import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
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
import { validateEmail } from '../utils/validation';
import SlideInAnimation from '../components/animations/SlideInAnimation';
import PulseAnimation from '../components/animations/PulseAnimation';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { login, isLoading } = useAuth();

  // Animation values
  const headerOpacity = useSharedValue(0);
  const formScale = useSharedValue(0.9);

  useEffect(() => {
    // Animate entrance
    headerOpacity.value = withTiming(1, { duration: 600 });
    formScale.value = withDelay(300, withSpring(1, {
      damping: 15,
      stiffness: 150
    }));
  }, []);

  const handleLogin = async () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      const result = await login(email, password);
      if (!result.success) {
        Alert.alert('Login Failed', result.error);
      }
    }
  };

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: formScale.value }],
  }));

  return (
    <SafeAreaView className="flex-1">
      <LinearGradient
        colors={['#F8FAFC', '#E2E8F0']}
        className="flex-1 px-6 pt-12"
      >
        <Animated.View style={headerAnimatedStyle}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mb-8"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <PulseAnimation duration={3000}>
              <MaterialIcons name="arrow-back" size={24} color="#1E293B" />
            </PulseAnimation>
          </TouchableOpacity>
        </Animated.View>
        
        <SlideInAnimation direction="left" delay={400}>
          <Text className="text-3xl font-bold text-textPrimary mb-2">
            Welcome Back
          </Text>
        </SlideInAnimation>
        
        <SlideInAnimation direction="right" delay={500}>
          <Text className="text-lg text-textSecondary mb-8">
            Sign in to continue managing your budget
          </Text>
        </SlideInAnimation>
        
        <Animated.View style={formAnimatedStyle}>
          <SlideInAnimation direction="up" delay={600}>
            <View className="mb-6">
              <Text className="text-base font-medium text-textPrimary mb-2">
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                className={`bg-white border rounded-2xl px-4 py-4 text-base ${
                  errors.email ? 'border-error' : 'border-gray-200'
                }`}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              />
              {errors.email && (
                <Text className="text-error text-sm mt-1">{errors.email}</Text>
              )}
            </View>
          </SlideInAnimation>

          <SlideInAnimation direction="up" delay={700}>
            <View className="mb-6">
              <Text className="text-base font-medium text-textPrimary mb-2">
                Password
              </Text>
              <View className="relative">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  className={`bg-white border rounded-2xl px-4 py-4 pr-12 text-base ${
                    errors.password ? 'border-error' : 'border-gray-200'
                  }`}
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-4"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <PulseAnimation duration={2000}>
                    <MaterialIcons
                      name={showPassword ? 'visibility-off' : 'visibility'}
                      size={24}
                      color="#64748B"
                    />
                  </PulseAnimation>
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text className="text-error text-sm mt-1">{errors.password}</Text>
              )}
            </View>
          </SlideInAnimation>

          <SlideInAnimation direction="up" delay={800}>
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className="rounded-2xl overflow-hidden mb-6"
            >
              <LinearGradient
                colors={isLoading ? ['#9CA3AF', '#6B7280'] : ['#6366F1', '#8B5CF6']}
                className="py-4"
              >
                <Text className="text-white text-center font-semibold text-lg">
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </SlideInAnimation>
        </Animated.View>
        
        <SlideInAnimation direction="up" delay={900}>
          <View className="flex-row justify-center">
            <Text className="text-textSecondary">
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text className="text-primary font-semibold">
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </SlideInAnimation>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default LoginScreen;