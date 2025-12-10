-- Create API usage tracking table for rate limiting
CREATE TABLE public.api_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT NULL
);

-- Enable Row Level Security
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- Users can only view their own usage
CREATE POLICY "Users can view their own API usage"
  ON public.api_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own usage records
CREATE POLICY "Users can log their own API usage"
  ON public.api_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role can manage API usage"
  ON public.api_usage FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for efficient rate limit queries
CREATE INDEX idx_api_usage_user_endpoint_time 
  ON public.api_usage (user_id, endpoint, created_at DESC);

-- Create feedback table for user support
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'support', 'general')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  metadata JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
  ON public.feedback FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create feedback
CREATE POLICY "Users can create feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own open feedback
CREATE POLICY "Users can update their own open feedback"
  ON public.feedback FOR UPDATE
  USING (auth.uid() = user_id AND status = 'open');

-- Create trigger for updated_at
CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for querying feedback
CREATE INDEX idx_feedback_user_status ON public.feedback (user_id, status);
CREATE INDEX idx_feedback_type_priority ON public.feedback (type, priority);