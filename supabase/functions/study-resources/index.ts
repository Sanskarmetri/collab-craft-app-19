import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUBJECTS = [
  'History', 'Geography', 'Polity', 'Economics', 'Science & Technology',
  'Environment', 'Ethics', 'Current Affairs',
];

function buildPrompt(type: string, subject: string, extra: string) {
  if (type === 'pyq') {
    return `You are a UPSC examiner. Provide 8 authentic-style Previous Year Questions (PYQ) for UPSC Civil Services on the subject "${subject}"${extra ? ` focused on: ${extra}` : ''}.
Mix Prelims MCQs and Mains descriptive questions from the last 12 years.

Return ONLY valid JSON:
{
  "items": [
    {
      "title": "the exact question text",
      "meta": "UPSC Prelims 2019 | Paper I",
      "body": "Model answer / correct option with a crisp 3-4 sentence explanation",
      "tags": ["topic", "sub-topic"]
    }
  ]
}`;
  }
  if (type === 'ncert') {
    return `You are a UPSC mentor. Give an NCERT study guide for "${subject}"${extra ? ` focused on: ${extra}` : ''}.
List 8 must-read NCERT chapters (class 6-12) in the correct reading order.

Return ONLY valid JSON:
{
  "items": [
    {
      "title": "Class 11 - Indian Physical Environment, Ch 2: Structure and Physiography",
      "meta": "Priority: High | 45 min read",
      "body": "4-5 sentence summary of the key concepts of this chapter and exactly why it matters for UPSC",
      "tags": ["key term 1", "key term 2", "key term 3"]
    }
  ]
}`;
  }
  return `You are a UPSC mentor. Give a concrete, actionable improvement method for a serious aspirant in "${subject}"${extra ? ` who says: ${extra}` : ''}.
Give 6 techniques, each specific and measurable (no generic motivation).

Return ONLY valid JSON:
{
  "items": [
    {
      "title": "Name of the technique",
      "meta": "Daily | 30 min",
      "body": "4-5 sentences: exactly what to do, how to schedule it, and how to measure progress",
      "tags": ["revision", "answer writing"]
    }
  ]
}`;
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

    const { type, subject, extra } = await req.json();
    if (!['pyq', 'ncert', 'improve'].includes(type)) {
      return new Response(JSON.stringify({ error: 'type must be pyq | ncert | improve' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const subj = SUBJECTS.includes(subject) ? subject : 'General Studies';
    const extraText = typeof extra === 'string' ? extra.slice(0, 300) : '';

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        temperature: 0.8,
        messages: [
          { role: 'system', content: 'You are a UPSC preparation expert. Always return valid JSON only, no markdown fences.' },
          { role: 'user', content: buildPrompt(type, subj, extraText) },
        ],
      }),
    });

    if (response.status === 429 || response.status === 402) {
      return new Response(
        JSON.stringify({ error: response.status === 429 ? 'Rate limit reached, try again shortly.' : 'AI credits exhausted.' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (!response.ok) {
      console.error('AI error', await response.text());
      return new Response(JSON.stringify({ error: 'Failed to generate resources' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await response.json();
    let content: string = aiData.choices?.[0]?.message?.content ?? '{}';
    content = content.replace(/```json/gi, '').replace(/```/g, '').trim();
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start > 0 || end < content.length - 1) content = content.slice(start, end + 1);

    let parsed: { items?: unknown[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { items: [] };
    }

    return new Response(JSON.stringify({ type, subject: subj, items: parsed.items ?? [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
