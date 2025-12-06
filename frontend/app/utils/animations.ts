import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Animation configurations for consistent timing
export const ANIMATION_CONFIGS = {
  // Material Design motion durations
  FAST: 150,
  MEDIUM: 200,
  SLOW: 300,
  
  // Spring configurations
  SPRING_CONFIG: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  
  // Timing configurations
  TIMING_CONFIG: {
    duration: 200,
  },
} as const;

// Common animation presets
export const animationPresets = {
  // Fade animations
  fadeIn: (duration = ANIMATION_CONFIGS.MEDIUM) => ({
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: { duration },
  }),
  
  fadeOut: (duration = ANIMATION_CONFIGS.FAST) => ({
    from: { opacity: 1 },
    to: { opacity: 0 },
    config: { duration },
  }),
  
  // Scale animations
  scaleIn: (duration = ANIMATION_CONFIGS.MEDIUM) => ({
    from: { transform: [{ scale: 0.8 }], opacity: 0 },
    to: { transform: [{ scale: 1 }], opacity: 1 },
    config: { duration },
  }),
  
  scaleOut: (duration = ANIMATION_CONFIGS.FAST) => ({
    from: { transform: [{ scale: 1 }], opacity: 1 },
    to: { transform: [{ scale: 0.8 }], opacity: 0 },
    config: { duration },
  }),
  
  // Slide animations
  slideInFromRight: (duration = ANIMATION_CONFIGS.MEDIUM) => ({
    from: { transform: [{ translateX: SCREEN_WIDTH }] },
    to: { transform: [{ translateX: 0 }] },
    config: { duration },
  }),
  
  slideInFromLeft: (duration = ANIMATION_CONFIGS.MEDIUM) => ({
    from: { transform: [{ translateX: -SCREEN_WIDTH }] },
    to: { transform: [{ translateX: 0 }] },
    config: { duration },
  }),
  
  slideInFromBottom: (duration = ANIMATION_CONFIGS.MEDIUM) => ({
    from: { transform: [{ translateY: SCREEN_HEIGHT }] },
    to: { transform: [{ translateY: 0 }] },
    config: { duration },
  }),
};

// Custom hooks for common animations
export function useFadeAnimation(initialValue = 0) {
  const opacity = useSharedValue(initialValue);
  
  const fadeIn = (duration = ANIMATION_CONFIGS.MEDIUM, callback?: () => void) => {
    opacity.value = withTiming(1, { duration }, callback ? runOnJS(callback) : undefined);
  };
  
  const fadeOut = (duration = ANIMATION_CONFIGS.FAST, callback?: () => void) => {
    opacity.value = withTiming(0, { duration }, callback ? runOnJS(callback) : undefined);
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
  
  return { fadeIn, fadeOut, animatedStyle, opacity };
}

export function useScaleAnimation(initialValue = 1) {
  const scale = useSharedValue(initialValue);
  
  const scaleIn = (duration = ANIMATION_CONFIGS.MEDIUM, callback?: () => void) => {
    scale.value = withSpring(1, ANIMATION_CONFIGS.SPRING_CONFIG, callback ? runOnJS(callback) : undefined);
  };
  
  const scaleOut = (duration = ANIMATION_CONFIGS.FAST, callback?: () => void) => {
    scale.value = withTiming(0.8, { duration }, callback ? runOnJS(callback) : undefined);
  };
  
  const pulse = () => {
    scale.value = withSequence(
      withTiming(1.1, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  return { scaleIn, scaleOut, pulse, animatedStyle, scale };
}

export function useSlideAnimation(direction: 'horizontal' | 'vertical' = 'horizontal') {
  const translateX = useSharedValue(direction === 'horizontal' ? SCREEN_WIDTH : 0);
  const translateY = useSharedValue(direction === 'vertical' ? SCREEN_HEIGHT : 0);
  
  const slideIn = (duration = ANIMATION_CONFIGS.MEDIUM, callback?: () => void) => {
    if (direction === 'horizontal') {
      translateX.value = withTiming(0, { duration }, callback ? runOnJS(callback) : undefined);
    } else {
      translateY.value = withTiming(0, { duration }, callback ? runOnJS(callback) : undefined);
    }
  };
  
  const slideOut = (duration = ANIMATION_CONFIGS.FAST, callback?: () => void) => {
    if (direction === 'horizontal') {
      translateX.value = withTiming(SCREEN_WIDTH, { duration }, callback ? runOnJS(callback) : undefined);
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration }, callback ? runOnJS(callback) : undefined);
    }
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));
  
  return { slideIn, slideOut, animatedStyle, translateX, translateY };
}

// Floating Action Button animation
export function useFABAnimation() {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  
  const pressIn = () => {
    scale.value = withSpring(0.95, ANIMATION_CONFIGS.SPRING_CONFIG);
  };
  
  const pressOut = () => {
    scale.value = withSpring(1, ANIMATION_CONFIGS.SPRING_CONFIG);
  };
  
  const rotate = () => {
    rotation.value = withSequence(
      withTiming(45, { duration: 200 }),
      withDelay(100, withTiming(0, { duration: 200 }))
    );
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));
  
  return { pressIn, pressOut, rotate, animatedStyle };
}

// Chart animation utilities
export function useChartAnimation() {
  const progress = useSharedValue(0);
  
  const animateChart = (duration = 800, callback?: () => void) => {
    progress.value = withTiming(1, { duration }, callback ? runOnJS(callback) : undefined);
  };
  
  const resetChart = () => {
    progress.value = 0;
  };
  
  // For pie chart segments
  const getPieSegmentStyle = (startAngle: number, endAngle: number) => {
    return useAnimatedStyle(() => {
      const animatedEndAngle = interpolate(
        progress.value,
        [0, 1],
        [startAngle, endAngle],
        Extrapolate.CLAMP
      );
      
      return {
        // This would be used with SVG path animations
        opacity: progress.value,
      };
    });
  };
  
  // For bar chart bars
  const getBarStyle = (targetHeight: number) => {
    return useAnimatedStyle(() => {
      const animatedHeight = interpolate(
        progress.value,
        [0, 1],
        [0, targetHeight],
        Extrapolate.CLAMP
      );
      
      return {
        height: animatedHeight,
      };
    });
  };
  
  return { animateChart, resetChart, getPieSegmentStyle, getBarStyle, progress };
}

// List item animations for transaction list
export function useListItemAnimation(index: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  
  const animateIn = () => {
    const delay = index * 50; // Stagger animation
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    translateY.value = withDelay(delay, withSpring(0, ANIMATION_CONFIGS.SPRING_CONFIG));
  };
  
  const animateOut = (callback?: () => void) => {
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(-50, { duration: 200 }, callback ? runOnJS(callback) : undefined);
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
  
  return { animateIn, animateOut, animatedStyle };
}

// Swipe gesture animation for transaction items
export function useSwipeAnimation() {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  
  const swipeLeft = (callback?: () => void) => {
    translateX.value = withTiming(-SCREEN_WIDTH, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 }, callback ? runOnJS(callback) : undefined);
  };
  
  const swipeRight = (callback?: () => void) => {
    translateX.value = withTiming(SCREEN_WIDTH, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 }, callback ? runOnJS(callback) : undefined);
  };
  
  const reset = () => {
    translateX.value = withSpring(0, ANIMATION_CONFIGS.SPRING_CONFIG);
    opacity.value = withTiming(1, { duration: 200 });
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));
  
  return { swipeLeft, swipeRight, reset, animatedStyle, translateX };
}

// Loading animation utilities
export function useLoadingAnimation() {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  
  const startLoading = () => {
    rotation.value = withSequence(
      withTiming(360, { duration: 1000 }),
      withTiming(720, { duration: 1000 })
    );
    scale.value = withSequence(
      withTiming(1.1, { duration: 500 }),
      withTiming(1, { duration: 500 })
    );
  };
  
  const stopLoading = () => {
    rotation.value = withTiming(0, { duration: 300 });
    scale.value = withTiming(1, { duration: 300 });
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));
  
  return { startLoading, stopLoading, animatedStyle };
}

// Utility function to create staggered animations
export function createStaggeredAnimation(
  items: any[],
  animationFunction: (index: number) => void,
  staggerDelay = 50
) {
  items.forEach((_, index) => {
    setTimeout(() => {
      animationFunction(index);
    }, index * staggerDelay);
  });
}