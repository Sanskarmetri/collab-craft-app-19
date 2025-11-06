import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

    // Validate input
    if (!quizType || !subject) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: quizType, subject' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine question selection strategy
    let questions: any[] = [];
    
    if (quizType === 'daily') {
      // Daily quiz: 10 mixed difficulty questions
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('subject', subject)
        .eq('question_type', 'mcq')
        .limit(numberOfQuestions);
      
      if (error) throw error;
      questions = data;
    } else if (quizType === 'topic') {
      // Topic quiz: focused on specific difficulty
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('subject', subject)
        .eq('difficulty', difficulty)
        .limit(numberOfQuestions);
      
      if (error) throw error;
      questions = data;
    } else if (quizType === 'full_mock') {
      // Full mock: comprehensive selection across all subjects
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('question_type', 'mcq')
        .limit(100);
      
      if (error) throw error;
      questions = data;
    }

    // If we don't have enough questions, generate more with AI
    if (!questions || questions.length < numberOfQuestions) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'AI generation not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate questions using AI
      const prompt = `Generate ${numberOfQuestions - (questions?.length || 0)} multiple choice questions for UPSC ${subject} exam at ${difficulty} difficulty level. 
      
      Format each question as JSON with this structure:
      {
        "question_text": "The question",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct_answer": "0",
        "explanation": "Detailed explanation",
        "topic": "Specific topic",
        "difficulty": "${difficulty}"
      }
      
      Return as a JSON array of questions. Focus on current affairs, standard reference materials, and previous year patterns.`;

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are an expert UPSC question setter. Generate high-quality exam questions.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        }),
      });

      if (!aiResponse.ok) {
        console.error('AI generation failed:', await aiResponse.text());
        // Continue with existing questions if AI fails
      } else {
        const aiData = await aiResponse.json();
        const content = aiData.choices[0]?.message?.content;
        
        try {
          const generatedQuestions = JSON.parse(content);
          
          // Insert generated questions into database
          const questionsToInsert = generatedQuestions.map((q: any) => ({
            subject,
            topic: q.topic,
            question_type: 'mcq',
            question_text: q.question_text,
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            difficulty: q.difficulty,
            metadata: { generated: true, generated_at: new Date().toISOString() }
          }));

          const { data: newQuestions, error: insertError } = await supabase
            .from('questions')
            .insert(questionsToInsert)
            .select();

          if (!insertError && newQuestions) {
            questions = [...(questions || []), ...newQuestions];
          }
        } catch (e) {
          console.error('Failed to parse AI response:', e);
        }
      }
    }

    // Shuffle questions
    const shuffledQuestions = questions?.sort(() => Math.random() - 0.5) || [];

    // Calculate time limit (2 minutes per question)
    const timeLimit = numberOfQuestions * 120;

    // Create quiz attempt
    const questionsForAttempt = shuffledQuestions.slice(0, numberOfQuestions).map((q: any) => ({
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options,
      user_answer: null,
      is_correct: null,
    }));

    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert({
        user_id: user.id,
        quiz_type: quizType,
        subject,
        questions: questionsForAttempt,
        total_questions: numberOfQuestions,
        time_limit: timeLimit,
        status: 'in_progress'
      })
      .select()
      .single();

    if (attemptError) throw attemptError;

    return new Response(
      JSON.stringify({ 
        attemptId: attempt.id,
        questions: questionsForAttempt,
        timeLimit,
        totalQuestions: numberOfQuestions
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating quiz:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});