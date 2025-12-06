    import { Dimensions, PixelRatio } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Base dimensions (iPhone 12/13)
const baseWidth = 390;
const baseHeight = 844;

// Scale factor for responsive design
const widthScale = (size: number) => (screenWidth / baseWidth) * size;
const heightScale = (size: number) => (screenHeight / baseHeight) * size;

// For consistent scaling, use the smaller scale factor
const moderateScale = (size: number, factor: number = 0.5) => {
  const scaleFactor = Math.min(screenWidth / baseWidth, screenHeight / baseHeight);
  return size + (scaleFactor - 1) * size * factor;
};

// Font scaling
const scaleFont = (size: number) => {
  const scaleFactor = Math.min(screenWidth / baseWidth, screenHeight / baseHeight);
  return Math.round(size * scaleFactor);
};

// Responsive dimensions
export const responsive = {
  width: widthScale,
  height: heightScale,
  moderateScale,
  scaleFont,
  
  // Common responsive values
  padding: {
    xs: moderateScale(4),
    sm: moderateScale(8),
    md: moderateScale(16),
    lg: moderateScale(24),
    xl: moderateScale(32),
    xxl: moderateScale(48),
  },
  
  margins: {
    xs: moderateScale(4),
    sm: moderateScale(8),
    md: moderateScale(16),
    lg: moderateScale(24),
    xl: moderateScale(32),
    xxl: moderateScale(48),
  },
  
  borderRadius: {
    sm: moderateScale(8),
    md: moderateScale(12),
    lg: moderateScale(16),
    xl: moderateScale(24),
    full: 9999,
  },
  
  fontSizes: {
    xs: scaleFont(12),
    sm: scaleFont(14),
    base: scaleFont(16),
    lg: scaleFont(18),
    xl: scaleFont(20),
    '2xl': scaleFont(24),
    '3xl': scaleFont(30),
    '4xl': scaleFont(36),
  },
  
  // Breakpoints
  breakpoints: {
    small: 320,
    medium: 768,
    large: 1024,
    xlarge: 1280,
  },
  
  // Device specific helpers
  isSmallScreen: screenWidth < 380,
  isMediumScreen: screenWidth >= 380 && screenWidth < 768,
  isLargeScreen: screenWidth >= 768,
  
  // Get screen dimensions
  screen: {
    width: screenWidth,
    height: screenHeight,
  },
};

// Hook for responsive updates
export const useResponsive = () => {
  return responsive;
};

// Utility for creating responsive styles
export const createResponsiveStyle = (baseStyles: any) => {
  const responsiveStyles: any = {};
  
  Object.keys(baseStyles).forEach((key) => {
    const value = baseStyles[key];
    responsiveStyles[key] = value;
    
    // Apply responsive scaling to numeric values
    if (typeof value === 'number') {
      if (key.includes('width') || key.includes('height') || key.includes('margin') || key.includes('padding')) {
        responsiveStyles[key] = moderateScale(value);
      } else if (key.includes('fontSize') || key.includes('fontSize')) {
        responsiveStyles[key] = scaleFont(value);
      } else if (key.includes('borderRadius')) {
        responsiveStyles[key] = moderateScale(value);
      }
    }
  });
  
  return responsiveStyles;
};
