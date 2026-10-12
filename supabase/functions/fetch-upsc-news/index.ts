import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const unauthorized = () => new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
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

    const { newspaper } = await req.json();

    if (!newspaper || !['the_hindu', 'indian_express'].includes(newspaper)) {
      return new Response(
        JSON.stringify({ error: 'Invalid newspaper. Use "the_hindu" or "indian_express".' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const today = new Date().toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    const paperName = newspaper === 'the_hindu' ? 'The Hindu' : 'The Indian Express';

    const prompt = `You are a UPSC current affairs expert. Generate today's (${today}) most important UPSC-relevant news items that would typically appear in ${paperName}. 

Create exactly 8 news articles covering these categories relevant to UPSC preparation:
1. National/Polity (2 articles)
2. International Relations (1 article)
3. Economy (1 article)
4. Science & Technology (1 article)
5. Environment & Ecology (1 article)
6. Government Schemes/Social Issues (1 article)
7. Security/Defence (1 article)

For each article provide:
- A realistic headline
- A 3-4 sentence summary focusing on UPSC-relevant aspects
- The UPSC subject category (Polity, IR, Economy, Science, Environment, Social, Security)
- Key terms for revision
- Which UPSC paper it's relevant to (GS1, GS2, GS3, GS4, Essay, Prelims)

IMPORTANT: Make headlines realistic and contemporary. Focus on topics that are actually trending in Indian governance, policy, and current affairs as of ${today}. Use real institutional names, policy names, and geopolitical contexts.

Return ONLY a valid JSON array with this structure:
[{
  "headline": "...",
  "summary": "...",
  "category": "...",
  "keyTerms": ["term1", "term2"],
  "relevantPaper": "GS2",
  "importance": "high" | "medium"
}]`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        temperature: 0.7,
        messages: [
          { role: 'system', content: 'You are a UPSC current affairs specialist. Always return valid JSON arrays only. No markdown fences.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI API error:', errText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch news' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await response.json();
    let content = aiData.choices?.[0]?.message?.content || '[]';
    
    // Clean markdown fences
    content = content.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

    let articles;
    try {
      articles = JSON.parse(content);
    } catch {
      console.error('Failed to parse AI response:', content);
      articles = [];
    }

    return new Response(
      JSON.stringify({ newspaper: paperName, date: today, articles }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to fetch news' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
