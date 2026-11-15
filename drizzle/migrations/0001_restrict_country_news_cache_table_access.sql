DROP POLICY IF EXISTS "Anyone can read cached country news" ON public.country_news_cache;
REVOKE SELECT ON public.country_news_cache FROM anon, authenticated;