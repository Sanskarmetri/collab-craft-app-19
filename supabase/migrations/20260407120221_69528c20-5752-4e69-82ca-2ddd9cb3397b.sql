
-- Create questions table (question bank)
CREATE TABLE public.questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject text NOT NULL,
  topic text NOT NULL DEFAULT 'General',
  question_type text NOT NULL DEFAULT 'mcq',
  question_text text NOT NULL,
  options jsonb,
  correct_answer text,
  explanation text,
  difficulty text NOT NULL DEFAULT 'medium',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Everyone can read questions
CREATE POLICY "Questions are readable by authenticated users"
  ON public.questions FOR SELECT TO authenticated
  USING (true);

-- Only service role can insert/update/delete questions
CREATE POLICY "Service role can manage questions"
  ON public.questions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Create quiz_attempts table
CREATE TABLE public.quiz_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  quiz_type text NOT NULL,
  subject text NOT NULL,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_questions integer NOT NULL DEFAULT 0,
  answered_questions integer DEFAULT 0,
  score numeric,
  time_limit integer NOT NULL DEFAULT 600,
  time_taken integer,
  status text NOT NULL DEFAULT 'in_progress',
  grading_results jsonb,
  feedback jsonb,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quiz attempts"
  ON public.quiz_attempts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz attempts"
  ON public.quiz_attempts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz attempts"
  ON public.quiz_attempts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Service role needs full access for edge functions
CREATE POLICY "Service role can manage quiz attempts"
  ON public.quiz_attempts FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX idx_questions_subject ON public.questions (subject);
CREATE INDEX idx_questions_difficulty ON public.questions (subject, difficulty);
CREATE INDEX idx_quiz_attempts_user ON public.quiz_attempts (user_id, status);
