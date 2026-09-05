-- 1) handle_new_user is a trigger-only SECURITY DEFINER function; nobody should execute it directly
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;

-- 2) Remove broad anon SELECT grants on all public tables (no anon policies exist; app uses authenticated)
REVOKE SELECT ON public.achievements FROM anon;
REVOKE SELECT ON public.analytics FROM anon;
REVOKE SELECT ON public.api_usage FROM anon;
REVOKE SELECT ON public.country_news_cache FROM anon;
REVOKE SELECT ON public.feedback FROM anon;
REVOKE SELECT ON public.notifications FROM anon;
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.questions FROM anon;
REVOKE SELECT ON public.quiz_attempts FROM anon;
REVOKE SELECT ON public.quizzes FROM anon;
REVOKE SELECT ON public.resource_progress FROM anon;
REVOKE SELECT ON public.sessions FROM anon;
REVOKE SELECT ON public.timetable_items FROM anon;
REVOKE SELECT ON public.uploads FROM anon;
REVOKE SELECT ON public.user_achievements FROM anon;
REVOKE SELECT ON public.user_preferences FROM anon;

-- 3) quizzes: allow owners to update/delete their own quiz records
CREATE POLICY "Users can update their own quizzes"
ON public.quizzes FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quizzes"
ON public.quizzes FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- 4) user_achievements: allow owners to delete their own records (inserts stay service-role only by design)
CREATE POLICY "Users can delete their own achievements"
ON public.user_achievements FOR DELETE TO authenticated
USING (auth.uid() = user_id);