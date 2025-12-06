import { useEffect, useCallback } from "react";
import { performanceMonitor } from "@/utils/performance";
import {
  trackScreenPerformance,
  trackAnimationPerformance,
  trackCustomEvent,
} from "@/utils/flipper";

export function usePerformance(componentName: string) {
  useEffect(() => {
    const startTime = Date.now();

    return () => {
      const renderTime = Date.now() - startTime;
      if (renderTime > 16) {
        // More than one frame at 60fps
        console.warn(
          `Component ${componentName} took ${renderTime}ms to render`
        );
        trackCustomEvent("slow_render", {
          component: componentName,
          renderTime,
        });
      }
    };
  }, [componentName]);

  const trackScreenLoad = useCallback((screenName: string) => {
    performanceMonitor.startScreenLoad(screenName);

    return () => {
      const loadTime = performanceMonitor.endScreenLoad(screenName);
      trackScreenPerformance(screenName, loadTime);
    };
  }, []);

  const trackAnimation = useCallback((animationName: string, fps: number) => {
    trackAnimationPerformance(animationName, fps);
  }, []);

  const trackCustom = useCallback(
    (eventName: string, data?: Record<string, any>) => {
      trackCustomEvent(eventName, data);
    },
    []
  );

  return {
    trackScreenLoad,
    trackAnimation,
    trackCustom,
  };
}
export default usePerformance;
