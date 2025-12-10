import { supabase } from '@/integrations/supabase/client';

// Rate limit configuration by endpoint and subscription tier
export const RATE_LIMITS = {
  'ai-chat': { free: 20, premium: 100, window: 'hour' },
  'generate-quiz': { free: 5, premium: 50, window: 'hour' },
  'generate-timetable': { free: 3, premium: 20, window: 'day' },
  'submit-quiz': { free: 10, premium: 100, window: 'hour' },
} as const;

export type RateLimitedEndpoint = keyof typeof RATE_LIMITS;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}

export async function checkRateLimit(
  userId: string,
  endpoint: RateLimitedEndpoint,
  isPremium: boolean
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[endpoint];
  const limit = isPremium ? config.premium : config.free;
  
  // Calculate time window
  const now = new Date();
  let windowStart: Date;
  
  if (config.window === 'hour') {
    windowStart = new Date(now.getTime() - 60 * 60 * 1000);
  } else {
    // day
    windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  
  // Count recent requests
  const { count, error } = await supabase
    .from('api_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .gte('created_at', windowStart.toISOString());
  
  if (error) {
    console.error('Rate limit check failed:', error);
    // Allow request on error (fail open)
    return { allowed: true, remaining: limit, resetAt: now, limit };
  }
  
  const used = count || 0;
  const remaining = Math.max(0, limit - used);
  
  // Calculate reset time
  let resetAt: Date;
  if (config.window === 'hour') {
    resetAt = new Date(now.getTime() + 60 * 60 * 1000);
  } else {
    resetAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  }
  
  return {
    allowed: remaining > 0,
    remaining,
    resetAt,
    limit,
  };
}

export async function recordApiUsage(
  userId: string,
  endpoint: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await supabase.from('api_usage').insert({
      user_id: userId,
      endpoint,
      metadata,
    });
  } catch (error) {
    console.error('Failed to record API usage:', error);
  }
}

// Client-side rate limit display
export function formatRateLimitMessage(result: RateLimitResult, endpoint: string): string {
  if (result.allowed) {
    return `${result.remaining}/${result.limit} requests remaining`;
  }
  
  const resetIn = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000 / 60);
  const unit = resetIn > 60 ? `${Math.ceil(resetIn / 60)} hours` : `${resetIn} minutes`;
  
  return `Rate limit exceeded. Try again in ${unit}. Upgrade to Premium for higher limits.`;
}