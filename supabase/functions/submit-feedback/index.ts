import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FeedbackRequest {
  type: 'bug' | 'feature' | 'support' | 'general';
  subject: string;
  message: string;
  metadata?: Record<string, any>;
}

// Input validation
function validateFeedback(data: any): { valid: boolean; error?: string; data?: FeedbackRequest } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { type, subject, message, metadata } = data;

  // Validate type
  const validTypes = ['bug', 'feature', 'support', 'general'];
  if (!type || !validTypes.includes(type)) {
    return { valid: false, error: `Type must be one of: ${validTypes.join(', ')}` };
  }

  // Validate subject
  if (!subject || typeof subject !== 'string') {
    return { valid: false, error: 'Subject is required' };
  }
  if (subject.length < 3 || subject.length > 100) {
    return { valid: false, error: 'Subject must be between 3 and 100 characters' };
  }

  // Validate message
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Message is required' };
  }
  if (message.length < 10 || message.length > 2000) {
    return { valid: false, error: 'Message must be between 10 and 2000 characters' };
  }

  return {
    valid: true,
    data: { type, subject, message, metadata },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate input
    const requestData = await req.json();
    const validation = validateFeedback(requestData);
    
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { type, subject, message, metadata } = validation.data!;

    // Rate limit: max 5 feedback submissions per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo);

    if ((count || 0) >= 5) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert feedback
    const { data: feedback, error: insertError } = await supabase
      .from('feedback')
      .insert({
        user_id: user.id,
        type,
        subject,
        message,
        priority: type === 'bug' ? 'high' : 'medium',
        metadata: {
          ...metadata,
          user_email: user.email,
          submitted_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert feedback:', insertError);
      return new Response(
        JSON.stringify({ error: "Failed to submit feedback" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Feedback submitted: ${type} from user ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        feedbackId: feedback.id,
        message: "Thank you for your feedback!",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Feedback submission error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});