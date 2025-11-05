import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { sessionId, newDate, newTime } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "Session ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the session to reschedule
    const { data: session, error: fetchError } = await supabase
      .from("timetable_items")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !session) {
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for conflicts on the new date/time
    const { data: conflicts } = await supabase
      .from("timetable_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", newDate)
      .neq("id", sessionId)
      .neq("status", "completed");

    const hasConflict = conflicts?.some((item: any) => {
      const metadata = item.metadata || {};
      const existingTime = metadata.start_time;
      if (!existingTime || !newTime) return false;
      
      // Simple time overlap check (can be enhanced)
      return existingTime === newTime;
    });

    if (hasConflict) {
      return new Response(
        JSON.stringify({ 
          error: "Time slot conflict",
          message: "Another session is already scheduled at this time"
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the session
    const updatedMetadata = {
      ...(session.metadata || {}),
      start_time: newTime || (session.metadata as any)?.start_time,
      rescheduled: true,
      original_date: session.date,
    };

    const { data: updatedSession, error: updateError } = await supabase
      .from("timetable_items")
      .update({
        date: newDate || session.date,
        metadata: updatedMetadata,
        status: "planned",
      })
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to reschedule session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Session ${sessionId} rescheduled from ${session.date} to ${newDate || session.date}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        session: updatedSession,
        message: "Session rescheduled successfully"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Reschedule error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
