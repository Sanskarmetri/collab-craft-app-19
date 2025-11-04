type Message = { role: "user" | "assistant" | "system"; content: string };

interface StreamChatOptions {
  messages: Message[];
  subject: string;
  language: string;
  onDelta: (deltaText: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

export async function streamChat({
  messages,
  subject,
  language,
  onDelta,
  onDone,
  onError,
}: StreamChatOptions) {
  const CHAT_URL = `https://mpsdskpkxszrfsgpheoe.supabase.co/functions/v1/ai-chat`;

  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wc2Rza3BreHN6cmZzZ3BoZW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNzk1ODAsImV4cCI6MjA3NzY1NTU4MH0.QBPdD7bNA-CwHmk-1T5VbK1FlxiIJmCOAHX2nBpdaYY`,
      },
      body: JSON.stringify({ messages, subject, language }),
    });

    if (!resp.ok) {
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
          // Incomplete JSON - put it back and wait for more data
          textBuffer = line + "\n" + textBuffer;
          break;
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
    console.error("Stream chat error:", error);
    onError(error instanceof Error ? error : new Error("Unknown error"));
  }
}
