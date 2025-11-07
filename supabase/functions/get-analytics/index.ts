import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { period = 'weekly' } = await req.json();
    const now = new Date();
    let startDate = new Date();

    if (period === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'monthly') {
      startDate.setMonth(now.getMonth() - 1);
    }

    // Fetch daily analytics
    const { data: dailyAnalytics } = await supabase
      .from('analytics')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    // Fetch quiz performance by subject
    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('subject, score, created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString());

    // Calculate subject performance
    const subjectScores: Record<string, number[]> = {};
    quizzes?.forEach(quiz => {
      if (!subjectScores[quiz.subject]) {
        subjectScores[quiz.subject] = [];
      }
      subjectScores[quiz.subject].push(quiz.score);
    });

    const subjectPerformance = Object.entries(subjectScores).map(([subject, scores]) => ({
      subject,
      score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }));

    // Calculate weekly score trend
    const weeklyScores: Record<string, number[]> = {};
    quizzes?.forEach(quiz => {
      const weekKey = `Week ${Math.ceil((now.getTime() - new Date(quiz.created_at).getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
      if (!weeklyScores[weekKey]) {
        weeklyScores[weekKey] = [];
      }
      weeklyScores[weekKey].push(quiz.score);
    });

    const scoresTrend = Object.entries(weeklyScores)
      .map(([week, scores]) => ({
        week,
        score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      }))
      .reverse()
      .slice(0, 4);

    // Calculate summary stats
    const totalStudyHours = Math.round(
      (dailyAnalytics?.reduce((sum, day) => sum + (day.total_study_minutes || 0), 0) || 0) / 60
    );

    const { data: profile } = await supabase
      .from('profiles')
      .select('streak')
      .eq('id', user.id)
      .single();

    const avgScore = quizzes && quizzes.length > 0
      ? Math.round(quizzes.reduce((sum, q) => sum + q.score, 0) / quizzes.length)
      : 0;

    return new Response(
      JSON.stringify({
        dailyAnalytics: dailyAnalytics || [],
        subjectPerformance,
        scoresTrend,
        summary: {
          totalStudyHours,
          streak: profile?.streak || 0,
          avgScore,
          quizzesTaken: quizzes?.length || 0,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});