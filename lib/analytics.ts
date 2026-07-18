/**
 * Advanced Analytics Service for EmeDotEme
 * Provides custom event tracking, user engagement metrics, and performance monitoring
 */

// Event types for better categorization in Vercel Analytics
export type AnalyticsEvent = 
  | 'page_view'
  | 'article_view'
  | 'article_read'
  | 'search_performed'
  | 'category_navigation'
  | 'tag_click'
  | 'share_attempt'
  | 'share_success'
  | 'newsletter_subscribe'
  | 'newsletter_unsubscribe'
  | 'contact_form_submit'
  | 'admin_login'
  | 'admin_action'
  | 'error_occurred'
  | 'performance_metric'
  | 'user_engagement'
  | 'reading_time'
  | 'scroll_depth'
  | 'click_tracking'
  | 'external_link_click';

export interface AnalyticsEventData {
  event: AnalyticsEvent;
  url?: string;
  path?: string;
  referrer?: string;
  article_id?: string;
  article_title?: string;
  article_category?: string;
  search_query?: string;
  search_results?: number;
  category_name?: string;
  tag_name?: string;
  share_platform?: string;
  error_message?: string;
  error_stack?: string;
  performance_metric?: string;
  metric_value?: number;
  engagement_type?: string;
  reading_time_seconds?: number;
  scroll_percentage?: number;
  element_id?: string;
  element_text?: string;
  external_url?: string;
  user_agent?: string;
  screen_resolution?: string;
  language?: string;
  timestamp?: string;
  session_id?: string;
  user_id?: string;
  source?: string;
}

export interface PageViewData {
  url: string;
  path: string;
  referrer: string;
  title: string;
  screen_width: number;
  screen_height: number;
  language: string;
  user_agent: string;
}

/**
 * Check if Vercel Analytics is available
 */
function isVercelAnalyticsAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof (window as Window & { va?: unknown }).va !== 'undefined';
}

/**
 * Track a custom event with Vercel Analytics
 */
export function trackEvent(eventName: AnalyticsEvent, data?: Partial<AnalyticsEventData>): void {
  try {
    if (typeof window === 'undefined') return;
    
    const eventData: AnalyticsEventData = {
      event: eventName,
      url: window.location.href,
      path: window.location.pathname,
      referrer: document.referrer || '',
      user_agent: navigator.userAgent,
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
      timestamp: new Date().toISOString(),
      session_id: getSessionId(),
      ...data
    };
    
    // Send to Vercel Analytics if available
    if (isVercelAnalyticsAvailable()) {
      (window as Window & { va?: (type: string, payload: Record<string, unknown>) => void }).va?.('event', {
        name: eventName,
        data: eventData
      });
    }
    
    // Also send to console in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics Event] ${eventName}:`, eventData);
    }
    
    // Optionally send to your own analytics backend here
    // sendToBackendAnalytics(eventData);
    
  } catch (error) {
    console.error('Error tracking analytics event:', error);
  }
}

/**
 * Track a page view with enhanced data
 */
export function trackPageView(data?: Partial<PageViewData>): void {
  try {
    if (typeof window === 'undefined') return;
    
    const pageData: PageViewData = {
      url: window.location.href,
      path: window.location.pathname,
      referrer: document.referrer || '',
      title: document.title,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      language: navigator.language,
      user_agent: navigator.userAgent,
      ...data
    };
    
    trackEvent('page_view', pageData);
    
    // Track initial performance metrics
    if ('performance' in window) {
      const perf = window.performance;
      if (perf?.timing) {
        const timing = perf.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        const domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart;
        
        trackEvent('performance_metric', {
          performance_metric: 'page_load_time',
          metric_value: loadTime
        });
        
        trackEvent('performance_metric', {
          performance_metric: 'dom_ready_time',
          metric_value: domReadyTime
        });
      }
    }
    
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
}

/**
 * Track social share attempts
 */
export function trackShare(platform: string, url: string, title?: string): void {
  trackEvent('share_attempt', {
    share_platform: platform,
    url: url,
    article_title: title
  });
}

/**
 * Generate a session ID for user session tracking
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return 'server-side';
  
  try {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  } catch {
    // sessionStorage not available (private browsing)
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Reading time tracker for articles
 */
let readingTimeInterval: NodeJS.Timeout | null = null;

export function stopReadingTimeTracker(): void {
  if (readingTimeInterval) {
    clearInterval(readingTimeInterval);
    readingTimeInterval = null;
  }
}

/**
 * Initialize analytics on page load
 */
export function initializeAnalytics(): void {
  if (typeof window === 'undefined') return;
  
  // Track initial page view
  setTimeout(() => {
    trackPageView();
  }, 100);
  
  // Track external link clicks
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    
    if (link && link.href && !link.href.includes(window.location.hostname)) {
      trackEvent('external_link_click', {
        external_url: link.href,
        element_text: link.textContent?.substring(0, 100) || ''
      });
    }
  });
  
  // Track visibility changes (tab switch)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      trackEvent('user_engagement', {
        engagement_type: 'tab_hidden',
        timestamp: new Date().toISOString()
      });
    } else if (document.visibilityState === 'visible') {
      trackEvent('user_engagement', {
        engagement_type: 'tab_visible',
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Track beforeunload (page exit)
  window.addEventListener('beforeunload', () => {
    trackEvent('user_engagement', {
      engagement_type: 'page_exit',
      timestamp: new Date().toISOString()
    });
    stopReadingTimeTracker();
  });
  
  console.log('[Analytics] Advanced analytics initialized');
}