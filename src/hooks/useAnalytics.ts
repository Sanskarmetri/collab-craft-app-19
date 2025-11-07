import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!user) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: analyticsData, error: functionError } = await supabase.functions.invoke('get-analytics', {
          body: { period }
        });

        if (functionError) throw functionError;
        setData(analyticsData);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, period]);

  return { data, loading, error };
}