import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    const tokenMatch = authHeader?.match(/^Bearer\s+(\S+)$/);
    if (!tokenMatch) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(tokenMatch[1]);
    if (authError || !user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { articles, numberOfQuestions = 10 } = await req.json();

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No articles provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const articlesSummary = articles.map((a: any, i: number) =>
      `${i + 1}. [${a.category}] ${a.headline}: ${a.summary} (Key terms: ${a.keyTerms?.join(', ')})`
    ).join('\n');

    const numQ = Math.min(Math.max(numberOfQuestions, 5), 20);

    const prompt = `Based on these UPSC-relevant news articles from today, generate exactly ${numQ} MCQ questions that test understanding of current affairs:

${articlesSummary}

RULES:
- Questions must be based ONLY on the news articles above
- Each question must have exactly 4 options
- correct_answer must be the index (0-3) as a string
- Cover different articles and categories
- Questions should be UPSC Prelims level
- Include factual, analytical, and application-based questions

Return ONLY a JSON array:
[{"question_text":"...","options":["A","B","C","D"],"correct_answer":"0","explanation":"...","topic":"..."}]`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are a UPSC current affairs question setter. Return ONLY valid JSON arrays.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: 'Rate limited. Try again shortly.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (status === 402) return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ error: 'Failed to generate quiz' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const aiData = await aiResponse.json();
    let rawContent = aiData.choices?.[0]?.message?.content || '';
    rawContent = rawContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    const arrStart = rawContent.indexOf('[');
    const arrEnd = rawContent.lastIndexOf(']');
    if (arrStart === -1 || arrEnd === -1) {
      return new Response(JSON.stringify({ error: 'AI returned invalid format' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let generated: any[];
    const jsonStr = rawContent.substring(arrStart, arrEnd + 1);
    try {
      generated = JSON.parse(jsonStr);
    } catch {
      generated = JSON.parse(jsonStr.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}'));
    }

    const validQuestions = generated
      .filter((q: any) => q.question_text && Array.isArray(q.options) && q.options.length === 4 && q.correct_answer !== undefined)
      .map((q: any) => ({
        id: crypto.randomUUID(),
        question_text: q.question_text,
        question_type: 'mcq' as const,
        options: q.options,
        correct_answer: String(q.correct_answer),
        explanation: q.explanation || '',
        topic: q.topic || 'Current Affairs',
        difficulty: 'medium',
      }));

    if (validQuestions.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid questions generated' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Store questions
    const questionsToInsert = validQuestions.map((q: any) => ({
      subject: 'current_affairs',
      topic: q.topic,
      question_type: 'mcq',
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      metadata: { from_news: true, generated: true },
    }));

    const { data: inserted } = await supabase.from('questions').insert(questionsToInsert).select('id');

    const finalQuestions = validQuestions.map((q: any, i: number) => ({
      id: inserted?.[i]?.id || q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options,
      user_answer: null,
      is_correct: null,
    }));

    const timeLimit = finalQuestions.length * 120;

    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert({
        user_id: user.id,
        quiz_type: 'daily',
        subject: 'current_affairs',
        questions: finalQuestions,
        total_questions: finalQuestions.length,
        time_limit: timeLimit,
        status: 'in_progress',
      })
      .select()
      .single();

    if (attemptError) throw attemptError;

    return new Response(
      JSON.stringify({
        attemptId: attempt.id,
        questions: finalQuestions,
        timeLimit,
        totalQuestions: finalQuestions.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate quiz' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
