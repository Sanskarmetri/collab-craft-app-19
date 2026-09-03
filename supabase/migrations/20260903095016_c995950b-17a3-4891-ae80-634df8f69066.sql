CREATE TABLE public.resource_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  resource_type text NOT NULL CHECK (resource_type IN ('pyq','ncert','improve')),
  subject text NOT NULL,
  title text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, resource_type, subject, title)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.resource_progress TO authenticated;
GRANT ALL ON public.resource_progress TO service_role;

ALTER TABLE public.resource_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own resource progress"
ON public.resource_progress FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_resource_progress_user ON public.resource_progress (user_id, resource_type);