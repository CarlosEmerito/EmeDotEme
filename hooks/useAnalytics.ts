"use client";

import { useEffect, useCallback } from 'react';
import {
  trackShare,
  initializeAnalytics,
  stopReadingTimeTracker,
} from '@/lib/analytics';

/**
 * Hook for tracking social shares.
 * Also initializes page-level analytics tracking as a side effect on mount.
 */
export function useShareTracking() {
  useEffect(() => {
    initializeAnalytics();

    return () => {
      stopReadingTimeTracker();
    };
  }, []);

  const trackShareAction = useCallback((platform: string, url: string, title?: string) => {
    trackShare(platform, url, title);
  }, []);

  return {
    trackShare: trackShareAction
  };
}
