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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { triggerType } = await req.json();
    console.log(`Checking achievements for user ${user.id}, trigger: ${triggerType}`);

    // Fetch user stats
    const { data: profile } = await supabase
      .from('profiles')
      .select('streak')
      .eq('id', user.id)
      .single();

    const { count: sessionsCount } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { count: quizzesCount } = await supabase
      .from('quizzes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { data: analyticsData } = await supabase
      .from('analytics')
      .select('total_focus_minutes, total_study_minutes')
      .eq('user_id', user.id);

    const totalFocusMinutes = analyticsData?.reduce((sum, row) => sum + (row.total_focus_minutes || 0), 0) || 0;
    const totalStudyMinutes = analyticsData?.reduce((sum, row) => sum + (row.total_study_minutes || 0), 0) || 0;

    const { data: todayAnalytics } = await supabase
      .from('analytics')
      .select('total_study_minutes')
      .eq('user_id', user.id)
      .eq('date', new Date().toISOString().split('T')[0])
      .single();

    const { data: morningSessionsData } = await supabase
      .from('sessions')
      .select('start_ts')
      .eq('user_id', user.id);

    const morningSessions = morningSessionsData?.filter(s => {
      const hour = new Date(s.start_ts).getHours();
      return hour >= 5 && hour < 12;
    }).length || 0;

    const { data: highestQuiz } = await supabase
      .from('quizzes')
      .select('score')
      .eq('user_id', user.id)
      .order('score', { ascending: false })
      .limit(1)
      .single();

    const userStats = {
      sessions_count: sessionsCount || 0,
      quizzes_count: quizzesCount || 0,
      focus_minutes: totalFocusMinutes,
      study_minutes: totalStudyMinutes,
      streak_days: profile?.streak || 0,
      quiz_score: highestQuiz?.score || 0,
      daily_study_minutes: todayAnalytics?.total_study_minutes || 0,
      morning_sessions: morningSessions,
    };

    console.log('User stats:', userStats);

    // Fetch all achievements
    const { data: achievements } = await supabase
      .from('achievements')
      .select('*');

    // Fetch already unlocked achievements
    const { data: unlockedAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', user.id);

    const unlockedIds = new Set(unlockedAchievements?.map(a => a.achievement_id) || []);
    const newAchievements = [];

    // Check each achievement
    for (const achievement of achievements || []) {
      if (unlockedIds.has(achievement.id)) continue;

      const criteria = achievement.criteria as Record<string, number>;
      let isUnlocked = true;

      for (const [key, value] of Object.entries(criteria)) {
        if (userStats[key as keyof typeof userStats] < value) {
          isUnlocked = false;
          break;
        }
      }

      if (isUnlocked) {
        // Award achievement
        const { error: insertError } = await supabase
          .from('user_achievements')
          .insert({
            user_id: user.id,
            achievement_id: achievement.id,
          });

        if (!insertError) {
          // Award XP
          const { data: currentProfile } = await supabase
            .from('profiles')
            .select('xp, level')
            .eq('id', user.id)
            .single();

          const newXp = (currentProfile?.xp || 0) + achievement.xp_reward;
          const newLevel = Math.floor(newXp / 1000) + 1;

          await supabase
            .from('profiles')
            .update({ xp: newXp, level: newLevel })
            .eq('id', user.id);

          // Create notification
          await supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              type: 'achievement',
              title: '🎉 Achievement Unlocked!',
              message: `${achievement.icon} ${achievement.name} - You earned ${achievement.xp_reward} XP!`,
              metadata: { achievement_id: achievement.id },
            });

          newAchievements.push(achievement);
          console.log(`Awarded achievement: ${achievement.name}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        newAchievements,
        totalUnlocked: unlockedIds.size + newAchievements.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking achievements:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});