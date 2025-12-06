// Custom hooks for the Budget Tracker App
export { useAuth } from './useAuth';
export { useTransactions } from './useTransactions';
export { useCategories } from './useCategories';
export { useBudget } from './useBudget';
export { useAnalytics } from './useAnalytics';
export { useTheme } from './useTheme';
export { usePerformance } from './usePerformance';

// Re-export animation hooks
export {
  useFadeAnimation,
  useScaleAnimation,
  useSlideAnimation,
  useFABAnimation,
  useChartAnimation,
  useListItemAnimation,
  useSwipeAnimation,
  useLoadingAnimation,
} from '@/utils/animations';