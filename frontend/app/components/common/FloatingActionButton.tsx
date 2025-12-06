import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import { useFABAnimation } from '@/utils/animations';
import { ELEVATION_LEVELS } from '@/utils/constants';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isWeb = screenWidth > 768; // Consider as web if width > 768px

interface FABAction {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  actions?: FABAction[];
  mainIcon?: keyof typeof MaterialIcons.glyphMap;
  onMainPress?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  size?: 'small' | 'large';
  backgroundColor?: string;
  iconColor?: string;
  style?: any;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function FloatingActionButton({
  actions = [],
  mainIcon = 'add',
  onMainPress,
  position = 'bottom-right',
  size = 'large',
  backgroundColor,
  iconColor,
  style,
}: FloatingActionButtonProps) {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const { pressIn, pressOut, rotate, animatedStyle } = useFABAnimation();
  
  const expandAnimation = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);

  const fabSize = size === 'large' ? 56 : 40;
  const iconSize = size === 'large' ? 24 : 20;

  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    
    expandAnimation.value = withSpring(newExpanded ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
    
    overlayOpacity.value = withTiming(newExpanded ? 1 : 0, {
      duration: 200,
    });

    if (newExpanded) {
      rotate();
    }
  };

  const handleMainPress = () => {
    if (actions.length > 0) {
      toggleExpanded();
    } else {
      onMainPress?.();
    }
  };

  const handleActionPress = (action: FABAction) => {
    runOnJS(() => {
      setIsExpanded(false);
      expandAnimation.value = withSpring(0);
      overlayOpacity.value = withTiming(0);
      action.onPress();
    })();
  };

  const getPositionStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      bottom: isWeb ? 24 : 80, // Add more space on mobile for tab bar
    };

    switch (position) {
      case 'bottom-right':
        return { ...baseStyle, right: isWeb ? 24 : 16 };
      case 'bottom-left':
        return { ...baseStyle, left: isWeb ? 24 : 16 };
      case 'bottom-center':
        return { ...baseStyle, alignSelf: 'center' as const };
      default:
        return { ...baseStyle, right: isWeb ? 24 : 16 };
    }
  };

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    pointerEvents: isExpanded ? 'auto' : 'none',
  }));

  const mainFabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: expandAnimation.value === 0 ? 1 : 0.9 },
      { rotate: `${interpolate(expandAnimation.value, [0, 1], [0, 45])}deg` },
    ],
  }));

  const renderActionButton = (action: FABAction, index: number) => {
    const actionAnimatedStyle = useAnimatedStyle(() => {
      const translateY = interpolate(
        expandAnimation.value,
        [0, 1],
        [0, -(fabSize + 16) * (index + 1)]
      );
      
      const scale = interpolate(
        expandAnimation.value,
        [0, 0.5, 1],
        [0, 0.5, 1]
      );

      const opacity = interpolate(
        expandAnimation.value,
        [0, 0.5, 1],
        [0, 0.5, 1]
      );

      return {
        transform: [{ translateY }, { scale }],
        opacity,
      };
    });

    return (
      <Animated.View key={index} style={[styles.actionContainer, actionAnimatedStyle]}>
        <View style={styles.actionLabelContainer}>
          <Text style={[styles.actionLabel, { color: theme.colors.onSurface }]}>
            {action.label}
          </Text>
        </View>
        <AnimatedTouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: action.color || theme.colors.surface,
              width: fabSize * 0.8,
              height: fabSize * 0.8,
              borderRadius: (fabSize * 0.8) / 2,
            },
          ]}
          onPress={() => handleActionPress(action)}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name={action.icon}
            size={iconSize * 0.8}
            color={theme.colors.onSurface}
          />
        </AnimatedTouchableOpacity>
      </Animated.View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      ...getPositionStyle(),
      alignItems: 'center',
    },
    overlay: {
      position: 'absolute',
      top: -screenHeight,
      left: -screenWidth,
      width: screenWidth * 2,
      height: screenHeight * 2,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    mainFab: {
      width: fabSize,
      height: fabSize,
      borderRadius: fabSize / 2,
      backgroundColor: backgroundColor || theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: ELEVATION_LEVELS.FAB,
      shadowColor: theme.colors.onSurface,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    actionContainer: {
      position: 'absolute',
      alignItems: 'center',
      flexDirection: 'row',
    },
    actionLabelContainer: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 16,
      elevation: 2,
      shadowColor: theme.colors.onSurface,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    actionLabel: {
      ...theme.typography.body2,
      fontWeight: '500',
    },
    actionButton: {
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: theme.colors.onSurface,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
  });

  return (
    <View style={[styles.container, style]}>
      {/* Overlay */}
      <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={toggleExpanded}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Action Buttons */}
      {actions.map((action, index) => renderActionButton(action, index))}

      {/* Main FAB */}
      <AnimatedTouchableOpacity
        style={[styles.mainFab, animatedStyle, mainFabAnimatedStyle]}
        onPress={handleMainPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={0.8}
      >
        <MaterialIcons
          name={mainIcon}
          size={iconSize}
          color={iconColor || theme.colors.onPrimary}
        />
      </AnimatedTouchableOpacity>
    </View>
  );
}