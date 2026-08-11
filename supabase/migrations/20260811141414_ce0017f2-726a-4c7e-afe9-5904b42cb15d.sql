CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN CREATE TYPE exam_type AS ENUM ('upsc', 'state_psc'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE subscription_status AS ENUM ('free', 'premium'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE session_status AS ENUM ('planned', 'in_progress', 'completed', 'missed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE quiz_type AS ENUM ('topic_wise', 'full_length', 'daily'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE subject_type AS ENUM ('history', 'geography', 'polity', 'economics', 'science_tech', 'ethics', 'current_affairs'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en','hi')),
  exam_type exam_type NOT NULL DEFAULT 'upsc',
  exam_date DATE,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  streak INTEGER DEFAULT 0 CHECK (streak >= 0),
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  subscription_status subscription_status DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  daily_hours INTEGER NOT NULL DEFAULT 6 CHECK (daily_hours > 0 AND daily_hours <= 24),
  preferred_slots JSONB DEFAULT '{"morning": false, "afternoon": false, "evening": false}'::jsonb,
  focus_duration INTEGER NOT NULL DEFAULT 45 CHECK (focus_duration IN (25,45,60)),
  notifications JSONB DEFAULT '{"study_reminders": true, "achievement_alerts": true, "streak_warnings": true, "daily_digest": false}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own preferences" ON public.user_preferences FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject subject_type NOT NULL,
  topic TEXT NOT NULL,
  start_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_ts TIMESTAMPTZ,
  duration INTEGER,
  focus_time INTEGER DEFAULT 0,
  notes TEXT,
  device TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;
GRANT ALL ON public.sessions TO service_role;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions" ON public.sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type quiz_type NOT NULL,
  subject subject_type NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  questions_meta JSONB NOT NULL,
  duration INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own quizzes" ON public.quizzes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.timetable_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  subject subject_type NOT NULL,
  topic TEXT NOT NULL,
  planned_duration INTEGER NOT NULL CHECK (planned_duration > 0),
  status session_status DEFAULT 'planned',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_items TO authenticated;
GRANT ALL ON public.timetable_items TO service_role;
ALTER TABLE public.timetable_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own timetable" ON public.timetable_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_study_minutes INTEGER DEFAULT 0,
  total_focus_minutes INTEGER DEFAULT 0,
  quizzes_taken INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0,
  sessions_completed INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics TO authenticated;
GRANT ALL ON public.analytics TO service_role;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own analytics" ON public.analytics FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.uploads TO authenticated;
GRANT ALL ON public.uploads TO service_role;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own uploads" ON public.uploads FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  criteria JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Achievements are viewable by signed-in users" ON public.achievements FOR SELECT TO authenticated USING (true);

CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  progress JSONB DEFAULT '{}',
  UNIQUE(user_id, achievement_id)
);
GRANT SELECT ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Only service role can insert notifications" ON public.notifications FOR INSERT TO service_role WITH CHECK (true);

CREATE TABLE public.api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT NULL
);
GRANT SELECT, INSERT ON public.api_usage TO authenticated;
GRANT ALL ON public.api_usage TO service_role;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own API usage" ON public.api_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can log their own API usage" ON public.api_usage FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role can manage API usage" ON public.api_usage FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX idx_api_usage_user_endpoint_time ON public.api_usage (user_id, endpoint, created_at DESC);

CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bug','feature','support','general')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  metadata JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own feedback" ON public.feedback FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create feedback" ON public.feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own open feedback" ON public.feedback FOR UPDATE TO authenticated USING (auth.uid() = user_id AND status = 'open');

CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT 'General',
  question_type TEXT NOT NULL DEFAULT 'mcq',
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT,
  explanation TEXT,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questions are readable by authenticated users" ON public.questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role can manage questions" ON public.questions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX idx_questions_subject ON public.questions (subject);
CREATE INDEX idx_questions_difficulty ON public.questions (subject, difficulty);

CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quiz_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_questions INTEGER NOT NULL DEFAULT 0,
  answered_questions INTEGER DEFAULT 0,
  score NUMERIC,
  time_limit INTEGER NOT NULL DEFAULT 600,
  time_taken INTEGER,
  status TEXT NOT NULL DEFAULT 'in_progress',
  grading_results JSONB,
  feedback JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own quiz attempts" ON public.quiz_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own quiz attempts" ON public.quiz_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quiz attempts" ON public.quiz_attempts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage quiz attempts" ON public.quiz_attempts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX idx_quiz_attempts_user ON public.quiz_attempts (user_id, status);

CREATE TABLE public.country_news_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL,
  news_date DATE NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(country, news_date)
);
GRANT SELECT ON public.country_news_cache TO anon, authenticated;
GRANT ALL ON public.country_news_cache TO service_role;
ALTER TABLE public.country_news_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read cached country news" ON public.country_news_cache FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Service role manages country news cache" ON public.country_news_cache FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.calculate_session_duration()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.end_ts IS NOT NULL THEN
    NEW.duration = EXTRACT(EPOCH FROM (NEW.end_ts - NEW.start_ts)) / 60;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, language, exam_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Student'),
    COALESCE(NEW.raw_user_meta_data->>'language', 'en'),
    COALESCE((NEW.raw_user_meta_data->>'exam_type')::exam_type, 'upsc')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_timetable_items_updated_at BEFORE UPDATE ON public.timetable_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON public.feedback FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER calculate_session_duration_trigger BEFORE INSERT OR UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.calculate_session_duration();

CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_start_ts ON public.sessions(start_ts);
CREATE INDEX idx_quizzes_user_id ON public.quizzes(user_id);
CREATE INDEX idx_timetable_items_user_id ON public.timetable_items(user_id);
CREATE INDEX idx_timetable_items_date ON public.timetable_items(date);
CREATE INDEX idx_analytics_user_id ON public.analytics(user_id);
CREATE INDEX idx_uploads_user_id ON public.uploads(user_id);
CREATE INDEX idx_feedback_user_status ON public.feedback (user_id, status);

INSERT INTO public.achievements (code, name, description, icon, category, xp_reward, criteria) VALUES
  ('first_session', 'First Steps', 'Complete your first study session', '🎯', 'study', 50, '{"sessions_count": 1}'::jsonb),
  ('week_streak', 'Week Warrior', 'Maintain a 7-day study streak', '🔥', 'streak', 100, '{"streak_days": 7}'::jsonb),
  ('month_streak', 'Monthly Master', 'Maintain a 30-day study streak', '🏆', 'streak', 500, '{"streak_days": 30}'::jsonb),
  ('first_quiz', 'Quiz Beginner', 'Complete your first quiz', '📝', 'quiz', 50, '{"quizzes_count": 1}'::jsonb),
  ('quiz_master', 'Quiz Expert', 'Complete 50 quizzes', '🎓', 'quiz', 300, '{"quizzes_count": 50}'::jsonb),
  ('focus_hour', 'Focus Champion', 'Complete 1 hour of focused study', '⏰', 'focus', 75, '{"focus_minutes": 60}'::jsonb),
  ('focus_master', 'Focus Legend', 'Complete 100 hours of focused study', '⚡', 'focus', 1000, '{"focus_minutes": 6000}'::jsonb),
  ('high_scorer', 'High Achiever', 'Score 90% or above in a quiz', '⭐', 'quiz', 150, '{"quiz_score": 90}'::jsonb),
  ('study_marathon', 'Marathon Runner', 'Study for 10 hours in a single day', '🏃', 'study', 200, '{"daily_study_minutes": 600}'::jsonb),
  ('early_bird', 'Early Bird', 'Complete 10 morning study sessions', '🌅', 'study', 100, '{"morning_sessions": 10}'::jsonb)
ON CONFLICT (code) DO NOTHING;