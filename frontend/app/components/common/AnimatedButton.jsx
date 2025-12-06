import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PulseAnimation from '../animations/PulseAnimation';

const AnimatedButton = ({ 
  onPress, 
  title, 
  disabled = false, 
  loading = false,
  variant = 'primary', // 'primary', 'secondary', 'outline'
  size = 'large', // 'small', 'medium', 'large'
  style,
  ...props 
}) => {
  const getColors = () => {
    if (disabled || loading) return ['#9CA3AF', '#6B7280'];
    
    switch (variant) {
      case 'secondary':
        return ['#10B981', '#059669'];
      case 'outline':
        return ['transparent', 'transparent'];
      default:
        return ['#6366F1', '#8B5CF6'];
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') return '#6366F1';
    return 'white';
  };

  const getPadding = () => {
    switch (size) {
      case 'small':
        return 'py-2 px-4';
      case 'medium':
        return 'py-3 px-6';
      default:
        return 'py-4 px-6';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`rounded-2xl overflow-hidden ${variant === 'outline' ? 'border-2 border-primary' : ''}`}
      style={style}
      activeOpacity={0.8}
      {...props}
    >
      <PulseAnimation duration={2000} scale={1.02}>
        <LinearGradient
          colors={getColors()}
          className={getPadding()}
        >
          <Text 
            className={`text-center font-semibold ${
              size === 'small' ? 'text-sm' : size === 'medium' ? 'text-base' : 'text-lg'
            }`}
            style={{ color: getTextColor() }}
          >
            {loading ? 'Loading...' : title}
          </Text>
        </LinearGradient>
      </PulseAnimation>
    </TouchableOpacity>
  );
};

export default AnimatedButton;