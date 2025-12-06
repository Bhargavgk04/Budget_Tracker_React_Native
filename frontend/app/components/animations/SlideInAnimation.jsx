import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const SlideInAnimation = ({ 
  children, 
  direction = 'left',
  delay = 0,
  duration = 300,
  distance = 30,
  style,
  disabled = false
}) => {
  const opacity = useSharedValue(disabled ? 1 : 0);
  const translateX = useSharedValue(disabled ? 0 : (direction === 'left' ? -distance : direction === 'right' ? distance : 0));
  const translateY = useSharedValue(disabled ? 0 : (direction === 'up' ? -distance : direction === 'down' ? distance : 0));

  useEffect(() => {
    if (!disabled) {
      opacity.value = withDelay(delay, withTiming(1, { 
        duration,
        easing: Easing.out(Easing.quad)
      }));
      translateX.value = withDelay(delay, withTiming(0, {
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
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value }
    ],
  }), []);

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

export default SlideInAnimation;