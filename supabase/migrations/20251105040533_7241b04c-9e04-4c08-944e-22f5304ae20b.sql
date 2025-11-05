-- Add metadata column to timetable_items table for storing additional session information
-- This supports AI-generated schedules with priority, session type, and scheduling metadata

ALTER TABLE public.timetable_items 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Add comment
COMMENT ON COLUMN public.timetable_items.metadata IS 
  'Stores additional session metadata including start_time, priority (low/medium/high), session_type (new_topic/revision/practice/mock_test), and rescheduling information';