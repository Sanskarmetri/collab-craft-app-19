import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type TimePeriod = 'weekly' | 'monthly';

export interface DailyAnalytic {
  date: string;
  total_study_minutes: number;
  total_focus_minutes: number;
  sessions_completed: number;
  quizzes_taken: number;
  average_score: number;
}

export interface SubjectPerformance {
  subject: string;
  score: number;
}

export interface ScoreTrend {
  week: string;
  score: number;
}

export interface AnalyticsSummary {
  totalStudyHours: number;
  streak: number;
  avgScore: number;
  quizzesTaken: number;
}

export interface AnalyticsData {
  dailyAnalytics: DailyAnalytic[];
  subjectPerformance: SubjectPerformance[];
  scoresTrend: ScoreTrend[];
  summary: AnalyticsSummary;
}

export function useAnalytics(period: TimePeriod = 'weekly') {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchAnalytics = useCallback(async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      const requestId = ++requestIdRef.current;
      const isStale = () => !mountedRef.current || requestId !== requestIdRef.current;

      try {
        setLoading(true);
        setError(null);

        const { data: analyticsData, error: functionError } = await supabase.functions.invoke('get-analytics', {
          body: { period }
        });

        if (isStale()) return;
        if (functionError) throw functionError;
        setData(analyticsData);
      } catch (err) {
        if (isStale()) return;
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      } finally {
        if (!isStale()) setLoading(false);
      }
    }, [user, period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { data, loading, error, refetch: fetchAnalytics };
}
