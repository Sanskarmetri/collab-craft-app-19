import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Input validation schema
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  subject: string;
  language: string;
}

const VALID_SUBJECTS = [
  "Current Affairs",
  "History", 
  "Geography",
  "Polity",
  "Economics",
  "Science & Tech",
  "Ethics"
];

const VALID_LANGUAGES = ["en", "hi"];

const MAX_MESSAGE_LENGTH = 2000;
const MAX_MESSAGES = 50;

function validateChatRequest(data: any): { valid: boolean; error?: string; data?: ChatRequest } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { messages, subject, language } = data;

  // Validate messages array
  if (!Array.isArray(messages)) {
    return { valid: false, error: 'Messages must be an array' };
  }

  if (messages.length === 0) {
    return { valid: false, error: 'At least one message is required' };
  }

  if (messages.length > MAX_MESSAGES) {
    return { valid: false, error: `Maximum ${MAX_MESSAGES} messages allowed` };
  }

  // Validate each message
  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') {
      return { valid: false, error: 'Invalid message format' };
    }

    if (!['user', 'assistant', 'system'].includes(msg.role)) {
      return { valid: false, error: 'Invalid message role' };
    }

    if (typeof msg.content !== 'string') {
      return { valid: false, error: 'Message content must be a string' };
    }

    if (msg.content.length === 0) {
      return { valid: false, error: 'Message content cannot be empty' };
    }

    if (msg.content.length > MAX_MESSAGE_LENGTH) {
      return { valid: false, error: `Message content must be less than ${MAX_MESSAGE_LENGTH} characters` };
    }
  }

  // Validate subject
  if (typeof subject !== 'string' || !VALID_SUBJECTS.includes(subject)) {
    return { valid: false, error: 'Invalid subject. Must be one of: ' + VALID_SUBJECTS.join(', ') };
  }

  // Validate language
  if (typeof language !== 'string' || !VALID_LANGUAGES.includes(language)) {
    return { valid: false, error: 'Invalid language. Must be either "en" or "hi"' };
  }

  return { 
    valid: true, 
    data: { messages, subject, language } as ChatRequest 
  };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Subject-specific system prompts for UPSC preparation
const SUBJECT_PROMPTS: Record<string, string> = {
  "Current Affairs": `You are an expert UPSC Current Affairs tutor. Help students understand recent developments in national and international affairs, their significance, and their relevance to UPSC exams. Provide context, analysis, and connections to static subjects. Keep responses clear, factual, and exam-focused.`,
  
  "History": `You are an expert UPSC History tutor specializing in Indian History (Ancient, Medieval, Modern) and World History. Help students understand historical events, their causes, consequences, and relevance to present-day India. Connect historical developments to current affairs when relevant. Base your answers on standard NCERT textbooks and reference materials.`,
  
  "Geography": `You are an expert UPSC Geography tutor covering Physical, Human, and Economic Geography of India and the World. Help students understand geographical concepts, map-based questions, and their practical applications. Relate geographical features to current affairs and developmental issues. Use NCERT Geography as primary reference.`,
  
  "Polity": `You are an expert UPSC Polity tutor specializing in Indian Constitution, Political System, Governance, and Public Policy. Explain constitutional provisions, amendments, landmark judgments, and their practical implications. Connect theoretical concepts to current political developments. Base answers on Laxmikanth and Constitution of India.`,
  
  "Economics": `You are an expert UPSC Economics tutor covering Indian Economy, Economic Development, and Budget Analysis. Help students understand economic concepts, government schemes, fiscal policies, and their impact. Simplify complex economic data and relate it to current economic issues. Use NCERT Economics and Economic Survey as reference.`,
  
  "Science & Tech": `You are an expert UPSC Science & Technology tutor covering recent developments in Space, Defense, Biotechnology, IT, and Environmental Science. Help students understand scientific concepts, technological innovations, and their implications for India. Connect science topics to current affairs and government initiatives.`,
  
  "Ethics": `You are an expert UPSC Ethics tutor specializing in Ethics, Integrity, and Aptitude for GS Paper 4. Help students analyze case studies, understand ethical frameworks, and develop answer-writing skills. Provide structured approaches to ethical dilemmas and real-world applications of moral philosophy.`
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    // Validate input
    const validation = validateChatRequest(requestBody);
    if (!validation.valid) {
      console.error('Validation error:', validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }), 
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { messages, subject, language } = validation.data!;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error("AI service is not configured");
    }

    // Get subject-specific system prompt
    const systemPrompt = SUBJECT_PROMPTS[subject] || SUBJECT_PROMPTS["Current Affairs"];
    
    // Add language instruction if Hindi is selected
    const languageInstruction = language === "hi" 
      ? " Respond in Hindi (Devanagari script) when the user asks in Hindi."
      : "";

    console.log(`Chat request - Subject: ${subject}, Language: ${language}, Messages: ${messages.length}, User message length: ${messages[messages.length - 1]?.content?.length || 0}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt + languageInstruction },
          ...messages,
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), 
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service requires payment. Please contact support." }), 
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    // Stream the response back to client
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
    
  } catch (e) {
    console.error("Chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
