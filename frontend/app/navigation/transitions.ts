import { TransitionPresets, StackNavigationOptions } from '@react-navigation/stack';
import { Easing } from 'react-native';
import type { StackCardInterpolationProps } from '@react-navigation/stack';

// Custom transition configurations for optimal performance
export const customTransitions = {
  // Fast slide transition for frequent navigation
  fastSlide: {
    gestureEnabled: true,
    gestureDirection: 'horizontal' as const,
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: 150,
          easing: Easing.in(Easing.cubic),
        },
      },
    },
    cardStyleInterpolator: ({ current, layouts }: StackCardInterpolationProps) => {
      return {
        cardStyle: {
          transform: [
            {
              translateX: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.width, 0],
              }),
            },
          ],
        },
      };
    },
  },

  // Modal transition for add screens
  modalSlide: {
    gestureEnabled: true,
    gestureDirection: 'vertical' as const,
    transitionSpec: {
      open: {
        animation: 'spring',
        config: {
          stiffness: 150,
          damping: 15,
          mass: 1,
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: 200,
          easing: Easing.in(Easing.cubic),
        },
      },
    },
    cardStyleInterpolator: ({ current, layouts }: StackCardInterpolationProps) => {
      return {
        cardStyle: {
          transform: [
            {
              translateY: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.height, 0],
              }),
            },
          ],
        },
        overlayStyle: {
          opacity: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.5],
          }),
        },
      };
    },
  },

  // Fade transition for analytics screens
  fadeTransition: {
    gestureEnabled: true,
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: 200,
          easing: Easing.in(Easing.cubic),
        },
      },
    },
    cardStyleInterpolator: ({ current }: StackCardInterpolationProps) => {
      return {
        cardStyle: {
          opacity: current.progress,
        },
      };
    },
  },

  // Scale transition for detail screens
  scaleTransition: {
    gestureEnabled: true,
    transitionSpec: {
      open: {
        animation: 'spring',
        config: {
          stiffness: 150,
          damping: 15,
          mass: 1,
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: 200,
          easing: Easing.in(Easing.cubic),
        },
      },
    },
    cardStyleInterpolator: ({ current }: StackCardInterpolationProps) => {
      return {
        cardStyle: {
          transform: [
            {
              scale: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1],
              }),
            },
          ],
          opacity: current.progress,
        },
      };
    },
  },
};

// Screen-specific transition configurations
export const screenTransitions: Record<string, StackNavigationOptions> = {
  // Auth screens
  Login: {
    ...TransitionPresets.SlideFromRightIOS,
    gestureEnabled: true,
  },
  Signup: {
    ...customTransitions.fastSlide,
  },
  ForgotPassword: {
    ...customTransitions.fastSlide,
  },
  OTPVerification: {
    ...customTransitions.scaleTransition,
  },
  ResetPassword: {
    ...customTransitions.fastSlide,
  },

  // Main screens
  Dashboard: {
    ...customTransitions.fadeTransition,
  },
  AddTransaction: {
    ...customTransitions.modalSlide,
  },
  Analytics: {
    ...customTransitions.fadeTransition,
  },
  Profile: {
    ...customTransitions.fadeTransition,
  },

  // Detail screens
  TransactionDetails: {
    ...customTransitions.scaleTransition,
  },
  CategoryDetails: {
    ...customTransitions.scaleTransition,
  },
  DetailedAnalytics: {
    ...customTransitions.fastSlide,
  },
  Insights: {
    ...customTransitions.fastSlide,
  },

  // Settings screens
  Settings: {
    ...customTransitions.fastSlide,
  },
  Categories: {
    ...customTransitions.fastSlide,
  },
  Budget: {
    ...customTransitions.fastSlide,
  },
  Export: {
    ...customTransitions.fastSlide,
  },
};

// Performance optimized default options
export const defaultScreenOptions: StackNavigationOptions = {
  headerShown: false,
  gestureEnabled: true,
  gestureResponseDistance: 100,
  cardOverlayEnabled: true,
  cardShadowEnabled: true,
  cardStyle: {
    backgroundColor: 'transparent',
  },
};