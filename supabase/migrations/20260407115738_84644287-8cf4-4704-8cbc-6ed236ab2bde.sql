
DROP POLICY IF EXISTS "Service role can manage API usage" ON public.api_usage;

CREATE POLICY "Service role can manage API usage"
  ON public.api_usage
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
