import { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
}

// Analytics tracking hook for funnel tracking and user behavior
export function useAnalyticsTracking() {
  const { user } = useAuth();
  const location = useLocation();

  // Track page views
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  const trackPageView = useCallback((path: string) => {
    const event = {
      type: 'page_view',
      path,
      timestamp: new Date().toISOString(),
      userId: user?.id,
      referrer: document.referrer,
    };
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('[Analytics] Page View:', event);
    }
    
    // Store in sessionStorage for session analysis
    storeEvent('page_view', event);
  }, [user?.id]);

  const trackEvent = useCallback((event: AnalyticsEvent) => {
    const enrichedEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      userId: user?.id,
      path: location.pathname,
      sessionId: getSessionId(),
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Event:', enrichedEvent);
    }
    
    storeEvent(event.name, enrichedEvent);
  }, [user?.id, location.pathname]);

  // Track specific funnel events
  const trackFunnelEvent = useCallback((step: string, metadata?: Record<string, any>) => {
    trackEvent({
      name: 'funnel_step',
      properties: {
        step,
        ...metadata,
      },
    });
  }, [trackEvent]);

  // Track feature usage
  const trackFeatureUsage = useCallback((feature: string, action: string, metadata?: Record<string, any>) => {
    trackEvent({
      name: 'feature_usage',
      properties: {
        feature,
        action,
        ...metadata,
      },
    });
  }, [trackEvent]);

  // Track errors
  const trackError = useCallback((error: Error, context?: Record<string, any>) => {
    trackEvent({
      name: 'error',
      properties: {
        message: error.message,
        stack: error.stack,
        ...context,
      },
    });
  }, [trackEvent]);

  // Track performance metrics
  const trackPerformance = useCallback((metric: string, value: number, unit: string = 'ms') => {
    trackEvent({
      name: 'performance',
      properties: {
        metric,
        value,
        unit,
      },
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackFunnelEvent,
    trackFeatureUsage,
    trackError,
    trackPerformance,
  };
}

// Helper functions
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

function storeEvent(type: string, event: Record<string, any>) {
  try {
    const key = `analytics_${type}`;
    const events = JSON.parse(sessionStorage.getItem(key) || '[]');
    events.push(event);
    // Keep only last 100 events per type
    if (events.length > 100) events.shift();
    sessionStorage.setItem(key, JSON.stringify(events));
  } catch (e) {
    // Ignore storage errors
  }
}

// Export analytics summary for debugging
export function getAnalyticsSummary(): Record<string, any> {
  const summary: Record<string, any> = {
    sessionId: getSessionId(),
    pageViews: JSON.parse(sessionStorage.getItem('analytics_page_view') || '[]'),
    events: JSON.parse(sessionStorage.getItem('analytics_feature_usage') || '[]'),
    errors: JSON.parse(sessionStorage.getItem('analytics_error') || '[]'),
  };
  return summary;
}
