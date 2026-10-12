import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory cache (per edge instance) — fastest layer, survives warm invocations
const memCache = new Map<string, { at: number; data: unknown }>();
const MEM_TTL_MS = 55 * 60 * 1000; // just under an hour — news rotates hourly

// Best-effort in-memory rate limit (per instance): N AI generations per caller per window
const RL_WINDOW_MS = 60 * 1000;
const RL_MAX = 6;
const rlHits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (rlHits.get(key) || []).filter((t) => now - t < RL_WINDOW_MS);
  if (hits.length >= RL_MAX) {
    rlHits.set(key, hits);
    return true;
  }
  hits.push(now);
  rlHits.set(key, hits);
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const unauthorized = () => new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    const authHeader = req.headers.get('Authorization');
    const tokenMatch = authHeader?.match(/^Bearer\s+(\S+)$/);
    if (!tokenMatch) return unauthorized();

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseAnonKey) throw new Error('Authentication service is not configured');

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser(tokenMatch[1]);
    if (authError || !user?.id) return unauthorized();

    const { country, countryCode } = await req.json();
    if (!country || typeof country !== 'string' || country.length > 100) {
      return new Response(JSON.stringify({ error: 'valid country required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date();
    // Bucket by IST hour so news visibly changes every hour and every day
    const istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    const todayIso = istNow.toISOString().slice(0, 10);
    const hourBucket = istNow.getUTCHours();
    const today = now.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata',
    });
    const timeLabel = now.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata',
    });
    const cacheKey = `${country.toLowerCase()}|${todayIso}|${hourBucket}`;

    // 1) Memory cache
    const hit = memCache.get(cacheKey);
    if (hit && Date.now() - hit.at < MEM_TTL_MS) {
      return new Response(JSON.stringify({ ...(hit.data as object), date: today, updatedAt: timeLabel, cached: 'memory' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service client for the shared DB cache
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );

    // 2) Shared DB cache (per country, per date, per hour)
    try {
      const { data: row } = await admin
        .from('country_news_cache')
        .select('payload')
        .eq('country', country)
        .eq('news_date', todayIso)
        .eq('news_hour', hourBucket)
        .maybeSingle();
      if (row?.payload) {
        memCache.set(cacheKey, { at: Date.now(), data: row.payload });
        return new Response(JSON.stringify({ ...row.payload, date: today, updatedAt: timeLabel, cached: 'db' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch (e) {
      console.error('cache read failed', e);
    }

    // 3) Rate limit before hitting the AI gateway
    if (rateLimited(user.id)) {
      return new Response(JSON.stringify({ error: 'Too many requests. Please wait a moment and try again.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `You are a UPSC current affairs expert. Generate the latest UPSC-relevant news about ${country}${countryCode ? ` (${countryCode})` : ''} as of ${today}, ${timeLabel} IST.

This is the ${hourBucket}:00 IST news bulletin for ${today}. Treat it as a fresh hourly update: the stories, angles and wording must differ from earlier bulletins today, reflecting developments that emerged in the last few hours.

Provide exactly 6 most important and recent news items (politics, economy, foreign relations with India, conflicts, science, environment). Make them realistic and contemporary as of ${today} ${timeLabel} IST.

Return ONLY a valid JSON object:
{
  "country": "${country}",
  "capital": "...",
  "summary": "2-3 sentence overview of what's happening in ${country} right now",
  "indiaRelation": "1-2 sentences about current India-${country} relations",
  "news": [
    { "headline": "...", "summary": "2-3 sentences", "category": "Polity|Economy|IR|Conflict|Science|Environment", "importance": "high"|"medium", "time": "approx time of day, e.g. 09:30 IST" }
  ]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        temperature: 0.9,
        messages: [
          { role: 'system', content: 'You are a geopolitics and current affairs expert. Always return valid JSON only, no markdown.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (response.status === 429 || response.status === 402) {
      return new Response(JSON.stringify({ error: response.status === 429 ? 'AI rate limit reached, try again shortly.' : 'AI credits exhausted.' }), {
        status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI error:', errText);
      return new Response(JSON.stringify({ error: 'Failed to fetch news' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await response.json();
    let content = aiData.choices?.[0]?.message?.content || '{}';
    content = content.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

    let data: any;
    try { data = JSON.parse(content); } catch { data = { country, news: [] }; }

    // Store in both cache layers
    memCache.set(cacheKey, { at: Date.now(), data });
    if (data?.news?.length) {
      try {
        await admin.from('country_news_cache').upsert(
          { country, country_code: countryCode ?? null, news_date: todayIso, news_hour: hourBucket, payload: data },
          { onConflict: 'country,news_date,news_hour' },
        );
      } catch (e) {
        console.error('cache write failed', e);
      }
    }

    return new Response(JSON.stringify({ ...data, date: today, updatedAt: timeLabel, cached: 'miss' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
