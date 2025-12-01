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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    const { confirmation } = await req.json();
    if (confirmation !== "DELETE_MY_DATA") {
      throw new Error("Invalid confirmation code");
    }

    console.log(`[DELETE-USER-DATA] Deleting all data for user: ${user.id}`);

    // Delete all user data from various tables (in reverse dependency order)
    await Promise.all([
      supabaseClient.from('notifications').delete().eq('user_id', user.id),
      supabaseClient.from('user_achievements').delete().eq('user_id', user.id),
      supabaseClient.from('analytics').delete().eq('user_id', user.id),
      supabaseClient.from('timetable_items').delete().eq('user_id', user.id),
      supabaseClient.from('quizzes').delete().eq('user_id', user.id),
      supabaseClient.from('sessions').delete().eq('user_id', user.id),
      supabaseClient.from('uploads').delete().eq('user_id', user.id),
      supabaseClient.from('user_preferences').delete().eq('user_id', user.id),
    ]);

    // Delete profile (this should cascade to auth.users if configured)
    await supabaseClient.from('profiles').delete().eq('id', user.id);

    // Delete auth user
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error("[DELETE-USER-DATA] Error deleting auth user:", deleteError);
      throw new Error("Failed to delete user account");
    }

    console.log(`[DELETE-USER-DATA] Successfully deleted all data for user: ${user.id}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: "All user data has been permanently deleted" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[DELETE-USER-DATA] ERROR:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
