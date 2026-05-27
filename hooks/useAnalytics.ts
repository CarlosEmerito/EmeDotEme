"use client";

import { useEffect, useCallback } from 'react';
import { 
  trackEvent, 
  trackPageView, 
  trackArticleView, 
  trackSearch,
  trackShare,
  trackNewsletterSubscribe,
  trackError,
  startReadingTimeTracker,
  stopReadingTimeTracker,
  setupClickTracking,
  initializeAnalytics,
  type AnalyticsEvent,
  type AnalyticsEventData
} from '@/lib/analytics';

/**
 * React hook for advanced analytics tracking
 */
export function useAnalytics() {
  // Initialize analytics on mount
  useEffect(() => {
    initializeAnalytics();
    
    return () => {
      stopReadingTimeTracker();
    };
  }, []);

  const track = useCallback((eventName: AnalyticsEvent, data?: Partial<AnalyticsEventData>) => {
    trackEvent(eventName, data);
  }, []);

  const trackPage = useCallback((data?: Parameters<typeof trackPageView>[0]) => {
    trackPageView(data);
  }, []);

  const trackArticle = useCallback((
    articleId: string, 
    articleTitle: string, 
    category: string
  ) => {
    trackArticleView(articleId, articleTitle, category);
  }, []);

  const trackSearchAction = useCallback((query: string, resultsCount: number) => {
    trackSearch(query, resultsCount);
  }, []);

  const trackShareAction = useCallback((platform: string, url: string, title?: string) => {
    trackShare(platform, url, title);
  }, []);

  const trackNewsletter = useCallback((email: string, source?: string) => {
    trackNewsletterSubscribe(email, source);
  }, []);

  const trackErrorAction = useCallback((error: Error, context?: string) => {
    trackError(error, context);
  }, []);

  const startArticleReadingTracker = useCallback((articleId: string) => {
    startReadingTimeTracker(articleId);
  }, []);

  const setupClickTrackers = useCallback((elementIds: string[]) => {
    setupClickTracking(elementIds);
  }, []);

  return {
    track,
    trackPage,
    trackArticle,
    trackSearch: trackSearchAction,
    trackShare: trackShareAction,
    trackNewsletter,
    trackError: trackErrorAction,
    startArticleReadingTracker,
    setupClickTrackers
  };
}

/**
 * Hook for tracking social shares
 */
export function useShareTracking() {
  const { trackShare } = useAnalytics();

  const trackShareAction = useCallback((platform: string, url: string, title?: string) => {
    trackShare(platform, url, title);
  }, [trackShare]);

  return {
    trackShare: trackShareAction
  };
}

