-- Achievements definition table
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL,
  xp_reward integer NOT NULL DEFAULT 0,
  criteria jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User achievements tracking
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id uuid REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  progress jsonb DEFAULT '{}',
  UNIQUE(user_id, achievement_id)
);

-- Add XP and level to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level integer DEFAULT 1;

-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add notification preferences
ALTER TABLE public.user_preferences 
  ADD COLUMN IF NOT EXISTS notifications jsonb DEFAULT '{"study_reminders": true, "achievement_alerts": true, "streak_warnings": true, "daily_digest": false}'::jsonb;

-- RLS Policies for achievements
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Achievements are viewable by everyone" 
  ON public.achievements FOR SELECT 
  USING (true);

-- RLS Policies for user_achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own achievements" 
  ON public.user_achievements FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own achievements" 
  ON public.user_achievements FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" 
  ON public.notifications FOR UPDATE 
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" 
  ON public.notifications FOR DELETE 
  USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" 
  ON public.notifications FOR INSERT 
  WITH CHECK (true);

-- Insert sample achievements
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
  ('early_bird', 'Early Bird', 'Complete 10 morning study sessions', '🌅', 'study', 100, '{"morning_sessions": 10}'::jsonb);