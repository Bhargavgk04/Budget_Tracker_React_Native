import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const LoadingSpinner = ({ size = 40, colors = ['#6366F1', '#8B5CF6'] }) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateZ: `${rotation.value}deg` },
      { scale: scale.value }
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <LinearGradient
        colors={colors}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity: 0.8,
        }}
      />
    </Animated.View>
  );
};

export default LoadingSpinner;