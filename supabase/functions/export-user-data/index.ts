import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    console.log(`[EXPORT-USER-DATA] Exporting data for user: ${user.id}`);

    // Fetch all user data from various tables
    const [profile, preferences, sessions, quizzes, timetable, analytics, achievements] = await Promise.all([
      supabaseClient.from('profiles').select('*').eq('id', user.id).single(),
      supabaseClient.from('user_preferences').select('*').eq('user_id', user.id).single(),
      supabaseClient.from('sessions').select('*').eq('user_id', user.id),
      supabaseClient.from('quizzes').select('*').eq('user_id', user.id),
      supabaseClient.from('timetable_items').select('*').eq('user_id', user.id),
      supabaseClient.from('analytics').select('*').eq('user_id', user.id),
      supabaseClient.from('user_achievements').select('*, achievements(*)').eq('user_id', user.id),
    ]);

    const exportData = {
      export_date: new Date().toISOString(),
      user_id: user.id,
      email: user.email,
      profile: profile.data,
      preferences: preferences.data,
      sessions: sessions.data || [],
      quizzes: quizzes.data || [],
      timetable: timetable.data || [],
      analytics: analytics.data || [],
      achievements: achievements.data || [],
      metadata: {
        total_sessions: sessions.data?.length || 0,
        total_quizzes: quizzes.data?.length || 0,
        total_study_minutes: analytics.data?.reduce((sum: number, a: any) => sum + (a.total_study_minutes || 0), 0) || 0,
      }
    };

    console.log(`[EXPORT-USER-DATA] Export completed for user: ${user.id}`);

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="studybyself-data-export-${user.id}-${Date.now()}.json"`
      },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[EXPORT-USER-DATA] ERROR:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
