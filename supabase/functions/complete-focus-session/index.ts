import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getBearerToken } from "./auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonResponse = (body: Record<string, unknown>, status = 200) => new Response(
  JSON.stringify(body),
  { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const token = getBearerToken(req.headers.get('Authorization'));
  if (!token) return jsonResponse({ error: 'Unauthorized' }, 401);

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const payload = await req.json().catch(() => null);
    if (typeof payload?.sessionId !== 'string') {
      return jsonResponse({ error: 'A focus session is required' }, 400);
    }

    const { data: creditedMinutes, error } = await supabase.rpc('complete_focus_session', {
      _session_id: payload.sessionId,
      _user_id: user.id,
    });

    if (error) {
      return jsonResponse({ error: 'The selected focus timer has not elapsed or this session is unavailable' }, 409);
    }

    return jsonResponse({ success: true, focusMinutes: creditedMinutes });
  } catch {
    return jsonResponse({ error: 'Unable to complete the focus session' }, 500);
  }
});