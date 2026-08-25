CREATE TABLE IF NOT EXISTS public.country_news_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country text NOT NULL,
  country_code text,
  news_date date NOT NULL,
  news_hour smallint NOT NULL DEFAULT 0,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.country_news_cache TO anon, authenticated;
GRANT ALL ON public.country_news_cache TO service_role;

ALTER TABLE public.country_news_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read cached country news" ON public.country_news_cache;
CREATE POLICY "Anyone can read cached country news"
ON public.country_news_cache FOR SELECT
USING (true);

CREATE UNIQUE INDEX IF NOT EXISTS country_news_cache_country_date_hour_key
ON public.country_news_cache (country, news_date, news_hour);