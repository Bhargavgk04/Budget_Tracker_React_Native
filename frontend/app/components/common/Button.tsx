import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, interpolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { ELEVATION_LEVELS } from '@/utils/constants';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'contained' | 'outlined' | 'text' | 'gradient';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  gradientColors?: [string, string];
}

export default function Button({
  title,
  onPress,
  variant = 'contained',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
  gradientColors,
}: ButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
    pressed.value = withSpring(1);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    pressed.value = withSpring(0);
  };

  const animatedStyle = useAnimatedStyle(() => {
    const elevation = interpolate(pressed.value, [0, 1], [4, 8]);
    
    return {
      transform: [{ scale: scale.value }],
      elevation: variant === 'contained' || variant === 'gradient' ? elevation : 0,
    };
  });

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius?.lg || theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      overflow: 'hidden',
    };

    // Size styles - More generous padding for modern look
    const sizeStyles = {
      small: { paddingHorizontal: 16, paddingVertical: 10, minHeight: 36 },
      medium: { paddingHorizontal: 24, paddingVertical: 14, minHeight: 48 },
      large: { paddingHorizontal: 32, paddingVertical: 18, minHeight: 56 },
    };

    // Variant styles with modern shadows
    const variantStyles = {
      contained: {
        backgroundColor: disabled ? theme.colors.border : theme.colors.primary,
        ...(theme.shadows?.md || {}),
        shadowColor: theme.colors.primary,
      },
      gradient: {
        backgroundColor: 'transparent',
        ...(theme.shadows?.lg || {}),
        shadowColor: theme.colors.primary,
      },
      outlined: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: disabled ? theme.colors.border : theme.colors.primary,
      },
      text: {
        backgroundColor: 'transparent',
        paddingHorizontal: 12,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      width: fullWidth ? '100%' : 'auto',
      opacity: disabled ? 0.5 : 1,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...theme.typography.button,
      textAlign: 'center',
      fontWeight: '600',
    };

    const variantTextStyles = {
      contained: { color: theme.colors.onPrimary },
      gradient: { color: '#FFFFFF' },
      outlined: { color: disabled ? theme.colors.textDisabled || theme.colors.onSurface : theme.colors.primary },
      text: { color: disabled ? theme.colors.textDisabled || theme.colors.onSurface : theme.colors.primary },
    };

    const sizeTextStyles = {
      small: { fontSize: 13 },
      medium: { fontSize: 15 },
      large: { fontSize: 17 },
    };

    return {
      ...baseStyle,
      ...variantTextStyles[variant],
      ...sizeTextStyles[size],
    };
  };

  const renderContent = () => (
    <>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'contained' || variant === 'gradient' ? '#FFFFFF' : theme.colors.primary}
        />
      ) : (
        <>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </>
  );

  if (variant === 'gradient') {
    const colors = gradientColors || [theme.colors.gradientStart || theme.colors.primary, theme.colors.gradientEnd || theme.colors.primaryVariant];
    
    return (
      <AnimatedTouchableOpacity
        style={[animatedStyle, getButtonStyle(), style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            borderRadius: theme.borderRadius?.lg || theme.borderRadius.md,
          }}
        />
        {renderContent()}
      </AnimatedTouchableOpacity>
    );
  }

  return (
    <AnimatedTouchableOpacity
      style={[animatedStyle, getButtonStyle(), style]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.9}
    >
      {renderContent()}
    </AnimatedTouchableOpacity>
  );
}