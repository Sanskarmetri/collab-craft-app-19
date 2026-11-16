ALTER TABLE public.sessions ADD COLUMN planned_duration integer NOT NULL DEFAULT 45 CHECK (planned_duration IN (25, 45, 60));

REVOKE INSERT ON public.sessions FROM authenticated;
GRANT INSERT (user_id, subject, topic, notes, planned_duration) ON public.sessions TO authenticated;
REVOKE UPDATE ON public.sessions FROM authenticated;
GRANT UPDATE (notes) ON public.sessions TO authenticated;

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (name, language, exam_type, exam_date, timezone) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.complete_focus_session(_session_id uuid, _user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_row public.sessions%ROWTYPE;
  completed_minutes integer;
  completion_day date;
BEGIN
  SELECT * INTO session_row
  FROM public.sessions
  WHERE id = _session_id AND user_id = _user_id
  FOR UPDATE;

  IF NOT FOUND OR session_row.end_ts IS NOT NULL THEN
    RAISE EXCEPTION 'Focus session is unavailable or already completed';
  END IF;

  IF clock_timestamp() < session_row.start_ts + make_interval(mins => session_row.planned_duration) THEN
    RAISE EXCEPTION 'The selected focus timer has not elapsed';
  END IF;

  UPDATE public.sessions
  SET end_ts = clock_timestamp()
  WHERE id = _session_id AND user_id = _user_id;

  SELECT duration INTO completed_minutes
  FROM public.sessions
  WHERE id = _session_id AND user_id = _user_id;

  completed_minutes := GREATEST(COALESCE(completed_minutes, 0), 0);
  UPDATE public.sessions SET focus_time = completed_minutes WHERE id = _session_id AND user_id = _user_id;
  completion_day := timezone('UTC', clock_timestamp())::date;

  INSERT INTO public.analytics (user_id, date, total_study_minutes, total_focus_minutes, sessions_completed)
  VALUES (_user_id, completion_day, completed_minutes, completed_minutes, 1)
  ON CONFLICT (user_id, date) DO UPDATE SET
    total_study_minutes = COALESCE(public.analytics.total_study_minutes, 0) + EXCLUDED.total_study_minutes,
    total_focus_minutes = COALESCE(public.analytics.total_focus_minutes, 0) + EXCLUDED.total_focus_minutes,
    sessions_completed = COALESCE(public.analytics.sessions_completed, 0) + EXCLUDED.sessions_completed;

  RETURN completed_minutes;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.complete_focus_session(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_focus_session(uuid, uuid) TO service_role;