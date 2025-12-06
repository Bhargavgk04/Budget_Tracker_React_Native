import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

const CountUpAnimation = ({ 
  endValue, 
  duration = 800, 
  formatter = (value) => value.toFixed(0),
  style,
  delay = 0,
  disabled = false
}) => {
  const [displayValue, setDisplayValue] = useState(disabled ? endValue : 0);
  const opacity = useSharedValue(disabled ? 1 : 0);

  useEffect(() => {
    if (disabled) {
      setDisplayValue(endValue);
      return;
    }

    const timer = setTimeout(() => {
      opacity.value = withTiming(1, { 
        duration: 200,
        easing: Easing.out(Easing.quad)
      });

      // Simplified counting animation
      const steps = 30;
      const stepValue = endValue / steps;
      const stepDuration = duration / steps;

      for (let i = 0; i <= steps; i++) {
        setTimeout(() => {
          runOnJS(setDisplayValue)(Math.min(stepValue * i, endValue));
        }, stepDuration * i);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [endValue, disabled, duration, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }), []);

  if (disabled) {
    return <Text style={style}>{formatter(displayValue)}</Text>;
  }

  return (
    <Animated.View style={animatedStyle}>
      <Text style={style}>
        {formatter(displayValue)}
      </Text>
    </Animated.View>
  );
};

export default CountUpAnimation;