import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const PulseAnimation = ({ 
  children, 
  duration = 3000, 
  scale = 1.02, 
  disabled = false 
}) => {
  const scaleValue = useSharedValue(1);

  useEffect(() => {
    if (!disabled) {
      scaleValue.value = withRepeat(
        withSequence(
          withTiming(scale, { 
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease)
          }),
          withTiming(1, { 
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease)
          })
        ),
        -1,
        false
      );
    }
  }, [disabled, scale, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }), []);

  if (disabled) {
    return children;
  }

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
};

export default PulseAnimation;