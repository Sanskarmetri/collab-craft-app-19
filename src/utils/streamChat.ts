import { supabase } from "@/integrations/supabase/client";

type Message = { role: "user" | "assistant" | "system"; content: string };

interface StreamChatOptions {
  messages: Message[];
  subject: string;
  language: string;
  signal?: AbortSignal;
  onDelta: (deltaText: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

export async function streamChat({
  messages,
  subject,
  language,
  signal,
  onDelta,
  onDone,
  onError,
}: StreamChatOptions) {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    onError(new Error('Missing Supabase environment variables'));
    return;
  }

  // The Edge Function reads the bearer token to identify the caller, so it must
  // carry the signed-in user's access token — never the publishable/anon key.
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  if (!accessToken) {
    onError(new Error('Please sign in to chat with the AI tutor.'));
    return;
  }

  const CHAT_URL = `${SUPABASE_URL}/functions/v1/ai-chat`;

  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Public client identifier the gateway expects; the user's JWT above is
        // what actually authorizes this request.
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
      signal,
      body: JSON.stringify({ messages, subject, language }),
    });


    if (!resp.ok) {
      if (resp.status === 401) {
        throw new Error("Authentication required. Please sign in again.");
      }
      if (resp.status === 400) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "Invalid request. Please check your input.");
      }
      if (resp.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }
      if (resp.status === 402) {
        throw new Error("AI service requires payment. Please contact support.");
      }
      throw new Error(`Failed to start chat: ${resp.status}`);
    }

    if (!resp.body) {
      throw new Error("No response body");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            onDelta(content);
          }
        } catch {
          // A newline-terminated SSE event is complete. Skip malformed events so
          // one bad payload cannot block every valid event that follows it.
          continue;
        }
      }
    }

    // Flush any remaining buffer
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw || raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          // Ignore incomplete leftovers
        }
      }
    }

    onDone();
  } catch (error) {
    if ((error as Error)?.name === "AbortError" || signal?.aborted) {
      // Stale request cancelled by the UI — not a user-facing failure.
      return;
    }
    onError(error instanceof Error ? error : new Error("Unknown error"));
  }
}

