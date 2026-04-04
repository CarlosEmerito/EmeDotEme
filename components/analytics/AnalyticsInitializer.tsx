"use client";

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAnalytics } from '@/hooks/useAnalytics';

/**
 * Component that initializes analytics and tracks page views automatically
 * Should be included in the root layout inside Providers
 */
export function AnalyticsInitializer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { trackPage } = useAnalytics();

  // Track page view when route changes
  useEffect(() => {
    // Small delay to ensure page is fully loaded
    const timer = setTimeout(() => {
      trackPage();
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, searchParams, trackPage]);

  // Track performance metrics after page load
  useEffect(() => {
    const handleLoad = () => {
      if ('performance' in window) {
        const perf = window.performance;
        if (perf?.timing) {
          const timing = perf.timing;
          const loadTime = timing.loadEventEnd - timing.navigationStart;
          
          // Track load time if it's reasonable (not 0)
          if (loadTime > 0 && loadTime < 60000) {
            // We could send this to a custom endpoint
            console.debug(`[Analytics] Page load time: ${loadTime}ms`);
          }
        }
      }
    };

    // If page is already loaded, run immediately
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  // Track visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Could track when user switches tabs
      if (document.visibilityState === 'hidden') {
        // Tab switched away
      } else if (document.visibilityState === 'visible') {
        // Tab switched back
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return null; // This component doesn't render anything
}