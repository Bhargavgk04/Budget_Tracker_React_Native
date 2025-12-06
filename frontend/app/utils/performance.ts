import React from "react";
import { InteractionManager, PixelRatio, Platform, Alert } from "react-native";
// Lazy import to avoid web warnings
let ToastAndroid: any;
try {
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ToastAndroid = require('react-native').ToastAndroid;
} catch {}
import type { PerformanceMetrics } from "@/types";

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private startTimes: Map<string, number> = new Map();

  // Screen load time tracking
  startScreenLoad(screenName: string): void {
    this.startTimes.set(`screen_${screenName}`, Date.now());
  }

  endScreenLoad(screenName: string): number {
    const startTime = this.startTimes.get(`screen_${screenName}`);
    if (!startTime) return 0;

    const loadTime = Date.now() - startTime;
    this.metrics.screenLoadTime = loadTime;
    this.startTimes.delete(`screen_${screenName}`);

    // Log if screen takes too long to load
    if (loadTime > 300) {
      console.warn(
        `Screen ${screenName} took ${loadTime}ms to load (target: <300ms)`
      );
    }

    return loadTime;
  }

  // API response time tracking
  startApiCall(endpoint: string): void {
    this.startTimes.set(`api_${endpoint}`, Date.now());
  }

  endApiCall(endpoint: string): number {
    const startTime = this.startTimes.get(`api_${endpoint}`);
    if (!startTime) return 0;

    const responseTime = Date.now() - startTime;
    this.metrics.apiResponseTime = responseTime;
    this.startTimes.delete(`api_${endpoint}`);

    // Log if API call takes too long
    if (responseTime > 200) {
      console.warn(`API ${endpoint} took ${responseTime}ms (target: <200ms)`);
    }

    return responseTime;
  }

  // Animation performance tracking
  trackAnimationPerformance(animationName: string, callback: () => void): void {
    const startTime = Date.now();
    let frameCount = 0;

    const trackFrame = () => {
      frameCount++;
      requestAnimationFrame(trackFrame);
    };

    requestAnimationFrame(trackFrame);

    callback();

    // Stop tracking after animation completes
    setTimeout(() => {
      const duration = Date.now() - startTime;
      const fps = (frameCount / duration) * 1000;
      this.metrics.animationFrameRate = fps;

      if (fps < 55) {
        console.warn(
          `Animation ${animationName} running at ${fps.toFixed(
            1
          )}fps (target: 60fps)`
        );
      }
    }, 1000);
  }

  // Memory usage tracking (basic)
  trackMemoryUsage(): void {
    // This is a simplified version - in production, you'd use more sophisticated tools
    if (__DEV__) {
      const memoryInfo = (performance as any).memory;
      if (memoryInfo) {
        this.metrics.memoryUsage = memoryInfo.usedJSHeapSize / 1024 / 1024; // MB

        if (this.metrics.memoryUsage > 150) {
          console.warn(
            `High memory usage: ${this.metrics.memoryUsage.toFixed(
              1
            )}MB (target: <150MB)`
          );
        }
      }
    }
  }

  // Get current metrics
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  // Reset metrics
  reset(): void {
    this.metrics = {};
    this.startTimes.clear();
  }

  // Log performance summary
  logSummary(): void {
    console.log("Performance Summary:", this.metrics);
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Higher-order component for screen performance tracking
export function withPerformanceTracking<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  screenName: string
) {
  return function PerformanceTrackedComponent(props: T) {
    React.useEffect(() => {
      performanceMonitor.startScreenLoad(screenName);

      // Use InteractionManager to ensure we measure after all interactions complete
      const interaction = InteractionManager.runAfterInteractions(() => {
        performanceMonitor.endScreenLoad(screenName);
      });

      return () => interaction.cancel();
    }, []);

    return React.createElement(WrappedComponent, props);
  };
}

// Hook for component-level performance tracking
export function usePerformanceTracking(componentName: string) {
  React.useEffect(() => {
    const startTime = Date.now();

    return () => {
      const renderTime = Date.now() - startTime;
      if (renderTime > 16) {
        // More than one frame at 60fps
        console.warn(
          `Component ${componentName} took ${renderTime}ms to render`
        );
      }
    };
  }, [componentName]);
}

// Utility functions for performance optimization
export const performanceUtils = {
  // Debounce function for search inputs
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function for scroll events
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Optimize images for different screen densities
  getOptimizedImageUri(baseUri: string, width: number, height: number): string {
    const pixelRatio = PixelRatio.get();
    const scaledWidth = width * pixelRatio;
    const scaledHeight = height * pixelRatio;

    // This would typically integrate with your image optimization service
    return `${baseUri}?w=${scaledWidth}&h=${scaledHeight}&q=80`;
  },

  // Lazy loading utility
  createLazyComponent<T extends React.ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>
  ): React.LazyExoticComponent<T> {
    return React.lazy(importFunc);
  },

  // Memoization helper for expensive calculations
  memoize<T extends (...args: any[]) => any>(fn: T): T {
    const cache = new Map();
    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn(...args);
      cache.set(key, result);
      return result;
    }) as T;
  },

  // Toast-like notifications with platform fallback
  notifySuccess(message: string) {
    if (Platform.OS === 'android' && ToastAndroid) {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Success', message);
    }
  },
  notifyError(message: string) {
    if (Platform.OS === 'android' && ToastAndroid) {
      ToastAndroid.show(message, ToastAndroid.LONG);
    } else {
      Alert.alert('Error', message);
    }
  },
  notifyInfo(message: string) {
    if (Platform.OS === 'android' && ToastAndroid) {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Info', message);
    }
  },
};
