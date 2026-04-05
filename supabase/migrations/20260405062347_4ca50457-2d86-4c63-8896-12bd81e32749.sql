
-- Fix 1: api_usage - policy should target service_role, not public
DROP POLICY IF EXISTS "Service role can manage API usage" ON public.api_usage;

CREATE POLICY "Service role can manage API usage"
  ON public.api_usage
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix 2: user_achievements - remove direct INSERT to prevent self-awarding
DROP POLICY IF EXISTS "Users can insert their own achievements" ON public.user_achievements;

-- Fix 3: Fix function search paths
CREATE OR REPLACE FUNCTION public.handle_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_session_duration()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = public
AS $function$
BEGIN
  IF NEW.end_ts IS NOT NULL THEN
    NEW.duration = EXTRACT(EPOCH FROM (NEW.end_ts - NEW.start_ts)) / 60;
  END IF;
  RETURN NEW;
END;
$function$;
