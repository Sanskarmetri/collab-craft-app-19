-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE exam_type AS ENUM ('upsc', 'state_psc');
CREATE TYPE subscription_status AS ENUM ('free', 'premium');
CREATE TYPE session_status AS ENUM ('planned', 'in_progress', 'completed', 'missed');
CREATE TYPE quiz_type AS ENUM ('topic_wise', 'full_length', 'daily');
CREATE TYPE subject_type AS ENUM ('history', 'geography', 'polity', 'economics', 'science_tech', 'ethics', 'current_affairs');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'hi')),
  exam_type exam_type NOT NULL,
  exam_date DATE,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  streak INTEGER DEFAULT 0 CHECK (streak >= 0),
  subscription_status subscription_status DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_preferences table
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  daily_hours INTEGER NOT NULL DEFAULT 6 CHECK (daily_hours > 0 AND daily_hours <= 24),
  preferred_slots JSONB DEFAULT '{"morning": false, "afternoon": false, "evening": false}'::jsonb,
  focus_duration INTEGER NOT NULL DEFAULT 45 CHECK (focus_duration IN (25, 45, 60)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create sessions table
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject subject_type NOT NULL,
  topic TEXT NOT NULL,
  start_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_ts TIMESTAMPTZ,
  duration INTEGER, -- in minutes, calculated
  focus_time INTEGER DEFAULT 0, -- in minutes
  notes TEXT,
  device TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type quiz_type NOT NULL,
  subject subject_type NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  questions_meta JSONB NOT NULL, -- stores question IDs, answers, etc.
  duration INTEGER NOT NULL, -- in minutes
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create timetable_items table
CREATE TABLE public.timetable_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  subject subject_type NOT NULL,
  topic TEXT NOT NULL,
  planned_duration INTEGER NOT NULL CHECK (planned_duration > 0), -- in minutes
  status session_status DEFAULT 'planned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create analytics table (aggregated metrics)
CREATE TABLE public.analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_study_minutes INTEGER DEFAULT 0 CHECK (total_study_minutes >= 0),
  total_focus_minutes INTEGER DEFAULT 0 CHECK (total_focus_minutes >= 0),
  quizzes_taken INTEGER DEFAULT 0 CHECK (quizzes_taken >= 0),
  average_score DECIMAL(5,2) DEFAULT 0 CHECK (average_score >= 0 AND average_score <= 100),
  sessions_completed INTEGER DEFAULT 0 CHECK (sessions_completed >= 0),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create uploads table (for PDFs, notes, etc.)
CREATE TABLE public.uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_start_ts ON public.sessions(start_ts);
CREATE INDEX idx_quizzes_user_id ON public.quizzes(user_id);
CREATE INDEX idx_quizzes_created_at ON public.quizzes(created_at);
CREATE INDEX idx_timetable_items_user_id ON public.timetable_items(user_id);
CREATE INDEX idx_timetable_items_date ON public.timetable_items(date);
CREATE INDEX idx_analytics_user_id ON public.analytics(user_id);
CREATE INDEX idx_analytics_date ON public.analytics(date);
CREATE INDEX idx_uploads_user_id ON public.uploads(user_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_preferences table
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for sessions table
CREATE POLICY "Users can view their own sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.sessions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for quizzes table
CREATE POLICY "Users can view their own quizzes"
  ON public.quizzes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quizzes"
  ON public.quizzes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for timetable_items table
CREATE POLICY "Users can view their own timetable items"
  ON public.timetable_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own timetable items"
  ON public.timetable_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timetable items"
  ON public.timetable_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own timetable items"
  ON public.timetable_items FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for analytics table
CREATE POLICY "Users can view their own analytics"
  ON public.analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics"
  ON public.analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics"
  ON public.analytics FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for uploads table
CREATE POLICY "Users can view their own uploads"
  ON public.uploads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own uploads"
  ON public.uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own uploads"
  ON public.uploads FOR DELETE
  USING (auth.uid() = user_id);

-- Function to handle profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, language, exam_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Student'),
    COALESCE(NEW.raw_user_meta_data->>'language', 'en'),
    COALESCE((NEW.raw_user_meta_data->>'exam_type')::exam_type, 'upsc')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_timetable_items_updated_at
  BEFORE UPDATE ON public.timetable_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to calculate session duration
CREATE OR REPLACE FUNCTION public.calculate_session_duration()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.end_ts IS NOT NULL THEN
    NEW.duration = EXTRACT(EPOCH FROM (NEW.end_ts - NEW.start_ts)) / 60;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-calculate session duration
CREATE TRIGGER calculate_session_duration_trigger
  BEFORE INSERT OR UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_session_duration();