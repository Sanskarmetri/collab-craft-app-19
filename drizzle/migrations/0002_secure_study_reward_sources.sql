DROP POLICY IF EXISTS "Users manage own analytics" ON public.analytics;
REVOKE INSERT, UPDATE, DELETE ON public.analytics FROM authenticated;
CREATE POLICY "Users view own analytics" ON public.analytics FOR SELECT TO authenticated USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE ON public.sessions FROM authenticated;
GRANT INSERT (user_id, subject, topic, notes) ON public.sessions TO authenticated;
GRANT UPDATE (notes) ON public.sessions TO authenticated;

DROP POLICY IF EXISTS "Users can insert their own quiz attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can update their own quiz attempts" ON public.quiz_attempts;
REVOKE INSERT, UPDATE ON public.quiz_attempts FROM authenticated;