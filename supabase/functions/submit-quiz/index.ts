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
    const { attemptId, answers, timeTaken } = await req.json();

    if (!attemptId || !answers) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
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

    // Get quiz attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .single();

    if (attemptError || !attempt) {
      return new Response(
        JSON.stringify({ error: 'Quiz attempt not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const questions = attempt.questions as any[];
    
    // Get full question details for grading
    const questionIds = questions.map((q: any) => q.id);
    const { data: fullQuestions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .in('id', questionIds);

    if (questionsError) throw questionsError;

    // Grade MCQs automatically
    const gradingResults: any[] = [];
    let correctCount = 0;
    let totalAnswered = 0;

    for (const question of questions) {
      const userAnswer = answers[question.id];
      const fullQuestion = fullQuestions?.find((q: any) => q.id === question.id);
      
      if (!fullQuestion) continue;

      if (userAnswer !== null && userAnswer !== undefined) {
        totalAnswered++;
      }

      if (fullQuestion.question_type === 'mcq') {
        const isCorrect = userAnswer?.toString() === fullQuestion.correct_answer?.toString();
        if (isCorrect) correctCount++;

        gradingResults.push({
          question_id: question.id,
          question_text: fullQuestion.question_text,
          question_type: 'mcq',
          user_answer: userAnswer,
          correct_answer: fullQuestion.correct_answer,
          is_correct: isCorrect,
          explanation: fullQuestion.explanation,
          options: fullQuestion.options
        });
      } else if (fullQuestion.question_type === 'short_answer' || fullQuestion.question_type === 'long_answer') {
        // For subjective questions, use AI to grade
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        
        if (LOVABLE_API_KEY && userAnswer) {
          const prompt = `Grade this ${fullQuestion.question_type} answer for a UPSC exam question.

Question: ${fullQuestion.question_text}
Student Answer: ${userAnswer}
Reference Answer: ${fullQuestion.correct_answer}

Provide:
1. Score out of 10
2. Feedback on content accuracy
3. Feedback on structure and presentation
4. Specific improvement suggestions

Format as JSON:
{
  "score": number (0-10),
  "content_feedback": "string",
  "structure_feedback": "string",
  "improvements": ["suggestion1", "suggestion2"]
}`;

          try {
            const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [
                  { role: 'system', content: 'You are an expert UPSC examiner. Grade answers fairly and provide constructive feedback.' },
                  { role: 'user', content: prompt }
                ],
                temperature: 0.3,
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              const content = aiData.choices[0]?.message?.content;
              const grading = JSON.parse(content);
              
              gradingResults.push({
                question_id: question.id,
                question_text: fullQuestion.question_text,
                question_type: fullQuestion.question_type,
                user_answer: userAnswer,
                reference_answer: fullQuestion.correct_answer,
                ai_grading: grading,
                score: grading.score
              });

              // Add to score (normalized to match MCQ scoring)
              correctCount += grading.score / 10;
            }
          } catch (e) {
            console.error('AI grading failed:', e);
            gradingResults.push({
              question_id: question.id,
              question_text: fullQuestion.question_text,
              question_type: fullQuestion.question_type,
              user_answer: userAnswer,
              reference_answer: fullQuestion.correct_answer,
              error: 'Grading failed'
            });
          }
        } else {
          gradingResults.push({
            question_id: question.id,
            question_text: fullQuestion.question_text,
            question_type: fullQuestion.question_type,
            user_answer: userAnswer,
            reference_answer: fullQuestion.correct_answer,
            pending_review: true
          });
        }
      }
    }

    // Calculate final score
    const scorePercentage = (correctCount / questions.length) * 100;

    // Generate personalized feedback using AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    let feedback = null;

    if (LOVABLE_API_KEY) {
      const weakAreas = gradingResults
        .filter((r: any) => !r.is_correct && r.question_type === 'mcq')
        .map((r: any) => fullQuestions?.find((q: any) => q.id === r.question_id)?.topic)
        .filter(Boolean);

      const feedbackPrompt = `Analyze this UPSC quiz performance and provide personalized recommendations.

Subject: ${attempt.subject}
Score: ${scorePercentage.toFixed(1)}%
Total Questions: ${questions.length}
Answered: ${totalAnswered}
Correct: ${correctCount}
Weak Topics: ${weakAreas.join(', ')}

Provide:
1. Overall performance summary
2. Specific weak areas to focus on
3. Study recommendations
4. Next steps for improvement

Format as JSON:
{
  "summary": "string",
  "weak_areas": ["area1", "area2"],
  "recommendations": ["rec1", "rec2"],
  "next_steps": ["step1", "step2"]
}`;

      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are an expert UPSC mentor. Provide encouraging but honest feedback.' },
              { role: 'user', content: feedbackPrompt }
            ],
            temperature: 0.5,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices[0]?.message?.content;
          feedback = JSON.parse(content);
        }
      } catch (e) {
        console.error('Feedback generation failed:', e);
      }
    }

    // Update quiz attempt
    const { error: updateError } = await supabase
      .from('quiz_attempts')
      .update({
        status: 'completed',
        score: scorePercentage,
        answered_questions: totalAnswered,
        time_taken: timeTaken,
        completed_at: new Date().toISOString(),
        grading_results: gradingResults,
        feedback
      })
      .eq('id', attemptId);

    if (updateError) throw updateError;

    // Update analytics
    const today = new Date().toISOString().split('T')[0];
    const { data: existingAnalytics } = await supabase
      .from('analytics')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (existingAnalytics) {
      await supabase
        .from('analytics')
        .update({
          quizzes_taken: (existingAnalytics.quizzes_taken || 0) + 1,
          average_score: ((existingAnalytics.average_score || 0) * (existingAnalytics.quizzes_taken || 0) + scorePercentage) / ((existingAnalytics.quizzes_taken || 0) + 1)
        })
        .eq('id', existingAnalytics.id);
    } else {
      await supabase
        .from('analytics')
        .insert({
          user_id: user.id,
          date: today,
          quizzes_taken: 1,
          average_score: scorePercentage
        });
    }

    return new Response(
      JSON.stringify({
        score: scorePercentage,
        correctCount,
        totalQuestions: questions.length,
        answeredQuestions: totalAnswered,
        gradingResults,
        feedback
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error submitting quiz:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});