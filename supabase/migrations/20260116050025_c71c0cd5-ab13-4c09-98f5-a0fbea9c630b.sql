-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create a restrictive policy that only allows service role to insert notifications
-- This ensures only backend/edge functions can create notifications, not regular users
CREATE POLICY "Only service role can insert notifications"
  ON public.notifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Also add a policy so authenticated users can insert notifications for themselves only
-- (useful for marking notifications as read, etc. - but this is for INSERT, so probably not needed)
-- Actually, let's keep it service_role only for inserts since notifications should come from system