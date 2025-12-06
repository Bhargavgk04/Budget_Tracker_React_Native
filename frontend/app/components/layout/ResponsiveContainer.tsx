import React from 'react';
import { View, StyleSheet, Dimensions, Platform, useWindowDimensions } from 'react-native';

const isWeb = Platform.OS === 'web';
const MAX_CONTENT_WIDTH = 1200;
const TABLET_BREAKPOINT = 768;
const DESKTOP_BREAKPOINT = 1024;

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: any;
  maxWidth?: number;
  paddingHorizontal?: boolean;
}

/**
 * Responsive container that adapts to different screen sizes
 * - Mobile: Full width with padding
 * - Tablet: Centered with moderate max-width
 * - Desktop: Centered with max-width constraint
 */
export default function ResponsiveContainer({
  children,
  style,
  maxWidth = MAX_CONTENT_WIDTH,
  paddingHorizontal = true,
}: ResponsiveContainerProps) {
  const { width } = useWindowDimensions();
  
  // Determine device type
  const isMobile = width < TABLET_BREAKPOINT;
  const isTablet = width >= TABLET_BREAKPOINT && width < DESKTOP_BREAKPOINT;
  const isDesktop = width >= DESKTOP_BREAKPOINT;
  
  // Calculate responsive padding
  const getHorizontalPadding = () => {
    if (!paddingHorizontal) return 0;
    if (isMobile) return 16;
    if (isTablet) return 24;
    return 32;
  };
  
  // Calculate max width based on device
  const getMaxWidth = () => {
    if (isMobile) return '100%';
    if (isTablet) return Math.min(maxWidth * 0.8, width - 64);
    return maxWidth;
  };

  const shouldCenter = !isMobile;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      width: '100%',
      maxWidth: getMaxWidth(),
      alignSelf: shouldCenter ? 'center' : 'auto',
      paddingHorizontal: getHorizontalPadding(),
    },
  });

  return <View style={[styles.container, style]}>{children}</View>;
}

// Export responsive utilities for use in other components
export const useResponsive = () => {
  const { width, height } = useWindowDimensions();
  
  return {
    width,
    height,
    isMobile: width < TABLET_BREAKPOINT,
    isTablet: width >= TABLET_BREAKPOINT && width < DESKTOP_BREAKPOINT,
    isDesktop: width >= DESKTOP_BREAKPOINT,
    isLandscape: width > height,
    isPortrait: height > width,
    // Responsive values
    spacing: {
      xs: width < TABLET_BREAKPOINT ? 4 : 6,
      sm: width < TABLET_BREAKPOINT ? 8 : 12,
      md: width < TABLET_BREAKPOINT ? 16 : 20,
      lg: width < TABLET_BREAKPOINT ? 24 : 32,
      xl: width < TABLET_BREAKPOINT ? 32 : 48,
    },
    fontSize: {
      xs: width < TABLET_BREAKPOINT ? 10 : 11,
      sm: width < TABLET_BREAKPOINT ? 12 : 13,
      md: width < TABLET_BREAKPOINT ? 14 : 15,
      lg: width < TABLET_BREAKPOINT ? 16 : 18,
      xl: width < TABLET_BREAKPOINT ? 20 : 24,
      xxl: width < TABLET_BREAKPOINT ? 24 : 32,
    },
  };
};
