import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateTimetableRequest {
  examDate: string;
  dailyHours: number;
  subjects: string[];
  preferredSlots: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
  };
  startDate?: string;
  daysToGenerate?: number;
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

    const requestData: GenerateTimetableRequest = await req.json();

    // Validate input
    if (!requestData.examDate || !requestData.dailyHours || !requestData.subjects?.length) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: examDate, dailyHours, subjects" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile for additional context
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Calculate days until exam
    const examDate = new Date(requestData.examDate);
    const startDate = requestData.startDate ? new Date(requestData.startDate) : new Date();
    const daysUntilExam = Math.ceil((examDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysToGenerate = Math.min(requestData.daysToGenerate || 7, daysUntilExam);

    console.log(`Generating timetable for user ${user.id}, ${daysToGenerate} days, ${requestData.dailyHours} hours/day`);

    // Build AI prompt for timetable generation
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    const timeSlots = [];
    if (requestData.preferredSlots.morning) timeSlots.push("morning (6 AM - 12 PM)");
    if (requestData.preferredSlots.afternoon) timeSlots.push("afternoon (12 PM - 5 PM)");
    if (requestData.preferredSlots.evening) timeSlots.push("evening (5 PM - 10 PM)");

    const systemPrompt = `You are an expert UPSC study planner. Generate a realistic, balanced study timetable that follows evidence-based learning principles:

1. **Spaced Repetition**: Schedule revision sessions at increasing intervals
2. **Interleaving**: Mix different subjects to improve retention
3. **Active Recall**: Prioritize practice and testing over passive reading
4. **Energy Management**: Schedule difficult subjects during peak focus hours
5. **Buffer Time**: Include 10-15 minute breaks between sessions
6. **Revision Cycles**: Ensure each topic is revisited 2-3 times before exam

Guidelines:
- Each study session should be 45-90 minutes maximum
- Include 10-15 minute breaks between sessions
- Distribute subjects evenly across the week
- Prioritize weak areas while maintaining strong subjects
- Leave one day per week for full revision/mock tests
- Include Current Affairs daily (15-30 minutes)
- Schedule difficult subjects during preferred time slots

Return ONLY a valid JSON array (no markdown, no explanations) with this exact structure:
[
  {
    "date": "YYYY-MM-DD",
    "subject": "history|geography|polity|economics|science_tech|ethics|current_affairs",
    "topic": "Specific topic name",
    "planned_duration": 60,
    "start_time": "09:00",
    "priority": "high|medium|low",
    "session_type": "new_topic|revision|practice|mock_test"
  }
]`;

    const userPrompt = `Generate a ${daysToGenerate}-day study timetable with these parameters:

**Exam Details:**
- Exam Date: ${requestData.examDate}
- Days until exam: ${daysUntilExam}
- Exam Type: ${profile?.exam_type || "UPSC"}

**Study Capacity:**
- Daily study hours: ${requestData.dailyHours}
- Preferred time slots: ${timeSlots.join(", ") || "flexible"}

**Subjects to cover:**
${requestData.subjects.map((s, i) => `${i + 1}. ${s}`).join("\n")}

**Start Date:** ${startDate.toISOString().split("T")[0]}

Create an optimized schedule that maximizes learning efficiency while preventing burnout. Ensure all subjects receive adequate coverage with proper revision cycles.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits and try again." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const aiContent = aiResponse.choices[0].message.content;

    console.log("AI Response:", aiContent.substring(0, 200));

    // Parse the AI response
    let timetableItems;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = aiContent
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      timetableItems = JSON.parse(cleanedContent);

      if (!Array.isArray(timetableItems)) {
        throw new Error("AI response is not an array");
      }
    } catch (parseError: any) {
      console.error("Failed to parse AI response:", parseError);
      return new Response(
        JSON.stringify({
          error: "Failed to generate timetable. Please try again.",
          details: parseError?.message || "Unknown parsing error",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const normalizeSubjectToEnum = (raw: unknown): string | null => {
      if (typeof raw !== "string") return null;
      const s = raw.trim().toLowerCase();

      // Accept both enum-like outputs and friendly names
      if (s === "history") return "history";
      if (s === "geography") return "geography";
      if (s === "polity") return "polity";
      if (s === "economics") return "economics";
      if (s === "ethics") return "ethics";
      if (s === "science_tech" || s.includes("science")) return "science_tech";
      if (s === "current_affairs" || s.includes("current")) return "current_affairs";

      return null;
    };

    // Validate and format items for database
    const formattedItems = timetableItems.map((item: any) => {
      const subjectEnum = normalizeSubjectToEnum(item.subject);
      if (!subjectEnum) {
        throw new Error(`Invalid subject from AI: ${String(item.subject)}`);
      }

      return {
        user_id: user.id,
        date: item.date,
        subject: subjectEnum,
        topic: item.topic,
        planned_duration: item.planned_duration || 60,
        status: "planned" as const,
        metadata: {
          start_time: item.start_time,
          priority: item.priority || "medium",
          session_type: item.session_type || "new_topic",
        },
      };
    });

    // Insert into database
    const { data: insertedItems, error: insertError } = await supabase
      .from("timetable_items")
      .insert(formattedItems)
      .select();

    if (insertError) {
      console.error("Database insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save timetable", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully generated ${insertedItems.length} timetable items`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        items: insertedItems,
        message: `Successfully generated ${insertedItems.length} study sessions for the next ${daysToGenerate} days`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Timetable generation error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        details: "Failed to generate timetable"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
