import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  checks: {
    database: { status: string; latency?: number };
    ai_gateway: { status: string; latency?: number };
    auth: { status: string };
  };
  uptime: number;
}

const startTime = Date.now();

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const health: HealthCheck = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    checks: {
      database: { status: "unknown" },
      ai_gateway: { status: "unknown" },
      auth: { status: "unknown" },
    },
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };

  try {
    // Check database connectivity
    const dbStart = Date.now();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { error: dbError } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);
    
    health.checks.database = {
      status: dbError ? "unhealthy" : "healthy",
      latency: Date.now() - dbStart,
    };

    // Check AI gateway (lightweight ping)
    const aiStart = Date.now();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (LOVABLE_API_KEY) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/models", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
          },
        });
        health.checks.ai_gateway = {
          status: aiResponse.ok ? "healthy" : "degraded",
          latency: Date.now() - aiStart,
        };
      } catch (e) {
        health.checks.ai_gateway = { status: "unhealthy", latency: Date.now() - aiStart };
      }
    } else {
      health.checks.ai_gateway = { status: "not_configured" };
    }

    // Check auth service
    const { error: authError } = await supabase.auth.getSession();
    health.checks.auth = {
      status: authError ? "degraded" : "healthy",
    };

    // Determine overall status
    const statuses = Object.values(health.checks).map((c) => c.status);
    if (statuses.includes("unhealthy")) {
      health.status = "unhealthy";
    } else if (statuses.includes("degraded")) {
      health.status = "degraded";
    }

    const statusCode = health.status === "unhealthy" ? 503 : 200;

    return new Response(JSON.stringify(health, null, 2), {
      status: statusCode,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    health.status = "unhealthy";
    return new Response(
      JSON.stringify({
        ...health,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});