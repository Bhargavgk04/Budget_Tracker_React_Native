import React, { useState, forwardRef } from 'react';
import {
  TextInput as RNTextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps as RNTextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'outlined' | 'filled';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  innerContainerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  labelProps?: any;
}

const TextInput = forwardRef<RNTextInput, TextInputProps>(
  (
    {
      label,
      error,
      helperText,
      variant = 'outlined',
      leftIcon,
      rightIcon,
      containerStyle,
      innerContainerStyle,
      inputStyle,
      labelStyle,
      labelProps,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const theme = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const focusAnimation = useSharedValue(0);
    const labelAnimation = useSharedValue(props.value ? 1 : 0);

    const handleFocus = (e: any) => {
      setIsFocused(true);
      focusAnimation.value = withTiming(1, { duration: 200 });
      if (!props.value) {
        labelAnimation.value = withTiming(1, { duration: 200 });
      }
      onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      focusAnimation.value = withTiming(0, { duration: 200 });
      if (!props.value) {
        labelAnimation.value = withTiming(0, { duration: 200 });
      }
      onBlur?.(e);
    };

    const containerAnimatedStyle = useAnimatedStyle(() => {
      const borderColor = interpolateColor(
        focusAnimation.value,
        [0, 1],
        [error ? theme.colors.error : (theme.colors.border || theme.colors.onSurface + '20'), 
         error ? theme.colors.error : theme.colors.primary]
      );

      return {
        borderColor,
        borderWidth: withTiming(isFocused ? 2 : 1.5, { duration: 200 }),
      };
    });

    const labelAnimatedStyle = useAnimatedStyle(() => {
      const translateY = withTiming(labelAnimation.value ? -12 : 0, { duration: 200 });
      const scale = withTiming(labelAnimation.value ? 0.85 : 1, { duration: 200 });
      const color = interpolateColor(
        focusAnimation.value,
        [0, 1],
        [error ? theme.colors.error : (theme.colors.textSecondary || theme.colors.onSurface + '60'),
         error ? theme.colors.error : theme.colors.primary]
      );

      return {
        transform: [{ translateY }, { scale }],
        color,
      };
    });

    const getContainerStyle = (): ViewStyle => {
      const baseStyle: ViewStyle = {
        borderRadius: theme.borderRadius?.md || theme.borderRadius.sm,
        backgroundColor: variant === 'filled' 
          ? (theme.colors.surfaceVariant || theme.colors.surface) 
          : 'transparent',
        minHeight: 56,
        justifyContent: 'center',
      };

      if (variant === 'outlined') {
        return {
          ...baseStyle,
          borderWidth: 1.5,
          paddingHorizontal: theme.spacing.md,
          ...(isFocused && !error ? { ...(theme.shadows?.sm || {}) } : {}),
        };
      }

      return {
        ...baseStyle,
        borderBottomWidth: 2,
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.md,
      };
    };

    const getInputStyle = (): TextStyle => {
      return {
        ...theme.typography.body1,
        color: theme.colors.textPrimary || theme.colors.onSurface,
        flex: 1,
        paddingVertical: theme.spacing.sm,
        paddingTop: label ? theme.spacing.lg : theme.spacing.sm,
        fontSize: 15,
      };
    };

    const getLabelStyle = (): TextStyle => {
      return {
        ...theme.typography.body2,
        position: 'absolute',
        left: leftIcon ? 48 : theme.spacing.md,
        top: 18,
        backgroundColor: variant === 'outlined' ? theme.colors.background : 'transparent',
        paddingHorizontal: variant === 'outlined' ? 6 : 0,
        zIndex: 1,
        fontWeight: '500',
      };
    };

    return (
      <View style={[{ marginBottom: theme.spacing.md }, containerStyle]}>
        <Animated.View style={[getContainerStyle(), containerAnimatedStyle, (typeof innerContainerStyle !== 'undefined' ? innerContainerStyle : {})]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {leftIcon && (
              <View style={{ marginRight: theme.spacing.sm }}>{leftIcon}</View>
            )}
            
            <View style={{ flex: 1, position: 'relative' }}>
              {label && (
                <Animated.Text style={[getLabelStyle(), labelAnimatedStyle, labelStyle]}>
                  {label}
                </Animated.Text>
              )}
              
              <RNTextInput
                ref={ref}
                style={[getInputStyle(), inputStyle]}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholderTextColor={theme.colors.onSurface + '60'}
                {...props}
              />
            </View>
            
            {rightIcon && (
              <View style={{ marginLeft: theme.spacing.sm }}>{rightIcon}</View>
            )}
          </View>
        </Animated.View>
        
        {(error || helperText) && (
          <Text
            style={[
              {
                ...theme.typography.caption,
                color: error ? theme.colors.error : theme.colors.onSurface + '80',
                marginTop: theme.spacing.xs,
                marginLeft: theme.spacing.sm,
              },
            ]}
          >
            {error || helperText}
          </Text>
        )}
      </View>
    );
  }
);

TextInput.displayName = 'TextInput';

export default TextInput;
