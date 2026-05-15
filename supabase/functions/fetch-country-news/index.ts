const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { country, countryCode } = await req.json();
    if (!country) {
      return new Response(JSON.stringify({ error: 'country required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const today = new Date().toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    });

    const prompt = `You are a UPSC current affairs expert. Generate today's (${today}) latest UPSC-relevant news about ${country}${countryCode ? ` (${countryCode})` : ''}.

Provide exactly 6 most important and recent news items (politics, economy, foreign relations with India, conflicts, science, environment). Make them realistic and contemporary as of ${today}.

Return ONLY a valid JSON object:
{
  "country": "${country}",
  "capital": "...",
  "summary": "2-3 sentence overview of what's happening in ${country} right now",
  "indiaRelation": "1-2 sentences about current India-${country} relations",
  "news": [
    { "headline": "...", "summary": "2-3 sentences", "category": "Polity|Economy|IR|Conflict|Science|Environment", "importance": "high"|"medium" }
  ]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        temperature: 0.7,
        messages: [
          { role: 'system', content: 'You are a geopolitics and current affairs expert. Always return valid JSON only, no markdown.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

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

    let data;
    try { data = JSON.parse(content); } catch { data = { country, news: [] }; }

    return new Response(JSON.stringify({ ...data, date: today }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
