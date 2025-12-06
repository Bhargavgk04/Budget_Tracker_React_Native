import { lightTheme } from '@/theme';

export const useTheme = () => {
  // Always return light theme to prevent dark mode
  return lightTheme;
};
