REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (name, language, exam_type, exam_date, timezone) ON public.profiles TO authenticated;
REVOKE INSERT ON public.profiles FROM authenticated;
GRANT INSERT (id, name, language, exam_type, exam_date, timezone) ON public.profiles TO authenticated;
DROP POLICY IF EXISTS "Questions are readable by authenticated users" ON public.questions;
REVOKE SELECT ON public.questions FROM authenticated;