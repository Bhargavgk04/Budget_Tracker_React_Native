import { Platform } from 'react-native';

// Performance monitoring without Flipper dependency
let isFlipperAvailable = false;

// Check if Flipper is available (always false now since we removed the dependency)
function checkFlipperAvailability() {
  isFlipperAvailable = false;
  if (__DEV__) {
    console.log('Performance monitoring enabled - logging to console');
  }
}

// Initialize performance monitoring (console-based)
export function initializeFlipperPerformance() {
  checkFlipperAvailability();
  
  if (__DEV__) {
    console.log('Performance monitoring initialized - metrics will be logged to console');
  }
}

// Send performance metrics to console
export function sendPerformanceMetric(
  metricName: string,
  value: number,
  metadata?: Record<string, any>
) {
  if (__DEV__) {
    console.log(`Performance metric: ${metricName} = ${value}`, metadata);
  }
}

// Performance monitoring wrapper for API calls
export function withPerformanceMonitoring<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  operationName: string
): T {
  return (async (...args: Parameters<T>) => {
    const startTime = Date.now();
    
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      
      sendPerformanceMetric(`api_${operationName}`, duration, {
        success: true,
        args: args.length,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      sendPerformanceMetric(`api_${operationName}`, duration, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  }) as T;
}

// Screen performance monitoring
export function trackScreenPerformance(screenName: string, loadTime: number) {
  sendPerformanceMetric(`screen_${screenName}`, loadTime, {
    type: 'screen_load',
    screen: screenName,
  });
}

// Memory usage tracking
export function trackMemoryUsage() {
  if (__DEV__) {
    try {
      // This is a simplified version - in production you'd use more sophisticated tools
      const memoryInfo = (performance as any).memory;
      if (memoryInfo) {
        const usedMemory = memoryInfo.usedJSHeapSize / 1024 / 1024; // MB
        sendPerformanceMetric('memory_usage', usedMemory, {
          type: 'memory',
          totalHeapSize: memoryInfo.totalJSHeapSize / 1024 / 1024,
          heapSizeLimit: memoryInfo.jsHeapSizeLimit / 1024 / 1024,
        });
      }
    } catch (error) {
      console.warn('Memory tracking not available:', error);
    }
  }
}

// Animation performance tracking
export function trackAnimationPerformance(animationName: string, fps: number) {
  sendPerformanceMetric(`animation_${animationName}`, fps, {
    type: 'animation',
    animation: animationName,
    target_fps: 60,
  });
}

// Bundle size tracking
export function trackBundleSize() {
  if (__DEV__) {
    // This would typically be integrated with your build process
    sendPerformanceMetric('bundle_size', 0, {
      type: 'bundle',
      platform: Platform.OS,
    });
  }
}

// Network performance tracking
export function trackNetworkPerformance(
  url: string,
  method: string,
  responseTime: number,
  success: boolean
) {
  sendPerformanceMetric('network_request', responseTime, {
    type: 'network',
    url,
    method,
    success,
  });
}

// Custom performance events
export function trackCustomEvent(eventName: string, data?: Record<string, any>) {
  sendPerformanceMetric(`custom_${eventName}`, Date.now(), {
    type: 'custom_event',
    event: eventName,
    ...data,
  });
}

// Performance monitoring hooks
export function usePerformanceMonitoring() {
  return {
    trackScreenLoad: trackScreenPerformance,
    trackMemory: trackMemoryUsage,
    trackAnimation: trackAnimationPerformance,
    trackNetwork: trackNetworkPerformance,
    trackCustom: trackCustomEvent,
  };
}