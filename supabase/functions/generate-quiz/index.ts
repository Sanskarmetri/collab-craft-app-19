import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quizType, subject, numberOfQuestions = 10, difficulty = 'medium' } = await req.json();

    const validQuizTypes = ['daily', 'topic', 'full_mock', 'topic_wise', 'full_length'];
    const validSubjects = ['history', 'geography', 'polity', 'economics', 'science_tech', 'science', 'ethics', 'current_affairs'];
    const validDifficulties = ['easy', 'medium', 'hard'];

    if (!quizType || !validQuizTypes.includes(quizType)) {
      return new Response(JSON.stringify({ error: 'Invalid quizType' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!subject || !validSubjects.includes(subject)) {
      return new Response(JSON.stringify({ error: 'Invalid subject' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const numQuestions = Math.min(Math.max(parseInt(String(numberOfQuestions)) || 10, 1), 100);
    const normalizedSubject = subject === 'science' ? 'science_tech' : subject;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Always generate fresh questions with AI for variety
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const subjectNames: Record<string, string> = {
      polity: 'Indian Polity & Governance',
      history: 'Indian & World History',
      geography: 'Indian & World Geography',
      economics: 'Indian Economy',
      science_tech: 'Science & Technology',
      current_affairs: 'Current Affairs',
      ethics: 'Ethics, Integrity & Aptitude',
    };

    const subjectLabel = subjectNames[normalizedSubject] || normalizedSubject;
    const seed = Date.now();

    const prompt = `Generate exactly ${numQuestions} unique UPSC-level multiple choice questions on "${subjectLabel}" at ${difficulty} difficulty.

IMPORTANT RULES:
- Each question MUST have exactly 4 options
- correct_answer MUST be the index (0, 1, 2, or 3) as a string
- Cover diverse topics within the subject
- Questions should be exam-quality, not trivial
- Use seed ${seed} - vary topics widely

Return ONLY a JSON array, no markdown, no explanation:
[
  {
    "question_text": "...",
    "options": ["A", "B", "C", "D"],
    "correct_answer": "0",
    "explanation": "...",
    "topic": "..."
  }
]`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are an expert UPSC question paper setter. Return ONLY valid JSON arrays. No markdown fences, no extra text.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.95,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('AI error:', aiResponse.status, errText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limited. Please try again in a moment.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ error: 'Failed to generate questions' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const aiData = await aiResponse.json();
    let rawContent = aiData.choices?.[0]?.message?.content || '';
    
    // Clean markdown fences
    rawContent = rawContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    
    // Extract JSON array
    const arrStart = rawContent.indexOf('[');
    const arrEnd = rawContent.lastIndexOf(']');
    if (arrStart === -1 || arrEnd === -1) {
      console.error('No JSON array found in AI response:', rawContent.substring(0, 200));
      return new Response(JSON.stringify({ error: 'AI returned invalid format' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    const jsonStr = rawContent.substring(arrStart, arrEnd + 1);
    let generatedQuestions: any[];
    
    try {
      generatedQuestions = JSON.parse(jsonStr);
    } catch (parseErr) {
      // Try fixing trailing commas
      const fixed = jsonStr.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}');
      generatedQuestions = JSON.parse(fixed);
    }

    // Validate and normalize each question
    const validQuestions = generatedQuestions
      .filter((q: any) => q.question_text && Array.isArray(q.options) && q.options.length === 4 && q.correct_answer !== undefined)
      .map((q: any, idx: number) => ({
        id: crypto.randomUUID(),
        question_text: q.question_text,
        question_type: 'mcq' as const,
        options: q.options,
        correct_answer: String(q.correct_answer),
        explanation: q.explanation || '',
        topic: q.topic || 'General',
        difficulty: difficulty,
      }));

    if (validQuestions.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid questions generated. Please try again.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Store questions in DB for future use (fire and forget)
    const questionsToInsert = validQuestions.map((q: any) => ({
      subject: normalizedSubject,
      topic: q.topic,
      question_type: 'mcq',
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      metadata: { generated: true, seed }
    }));

    const { data: insertedQuestions } = await supabase
      .from('questions')
      .insert(questionsToInsert)
      .select('id');

    // Use DB IDs if available, otherwise keep generated UUIDs
    const finalQuestions = validQuestions.map((q: any, i: number) => ({
      id: insertedQuestions?.[i]?.id || q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options,
      user_answer: null,
      is_correct: null,
    }));

    const timeLimit = numQuestions * 120;

    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert({
        user_id: user.id,
        quiz_type: quizType === 'topic' ? 'topic_wise' : quizType === 'full_mock' ? 'full_length' : quizType,
        subject: normalizedSubject,
        questions: finalQuestions,
        total_questions: finalQuestions.length,
        time_limit: timeLimit,
        status: 'in_progress'
      })
      .select()
      .single();

    if (attemptError) throw attemptError;

    return new Response(
      JSON.stringify({
        attemptId: attempt.id,
        questions: finalQuestions,
        timeLimit,
        totalQuestions: finalQuestions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating quiz:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate quiz' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
