import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const AnimatedCard = ({ 
  children, 
  delay = 0, 
  duration = 400,
  style,
  disabled = false
}) => {
  const opacity = useSharedValue(disabled ? 1 : 0);
  const translateY = useSharedValue(disabled ? 0 : 20);

  useEffect(() => {
    if (!disabled) {
      opacity.value = withDelay(delay, withTiming(1, { 
        duration,
        easing: Easing.out(Easing.quad)
      }));
      translateY.value = withDelay(delay, withTiming(0, { 
        duration,
        easing: Easing.out(Easing.quad)
      }));
    }
  }, [disabled, delay, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }), []);

  if (disabled) {
    return <View style={style}>{children}</View>;
  }

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

export default AnimatedCard;