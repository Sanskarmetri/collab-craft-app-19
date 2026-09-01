import { useState, useRef, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Globe, Loader2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { streamChat } from '@/utils/streamChat';

const subjects = [
  'Current Affairs',
  'History',
  'Geography',
  'Polity',
  'Economics',
  'Science & Tech',
  'Ethics',
];

type Message = { role: 'user' | 'assistant'; content: string };

const suggestedQuestions: Record<string, string[]> = {
  'Current Affairs': [
    'Latest developments in India-China relations',
    'Recent Supreme Court judgments',
    'New government schemes launched this month',
  ],
  'History': [
    'Causes of the Revolt of 1857',
    'Impact of Mauryan administration',
    'Gandhi\'s role in freedom movement',
  ],
  'Geography': [
    'Explain monsoon mechanism',
    'India\'s strategic location advantages',
    'Major soil types in India',
  ],
  'Polity': [
    'Explain Article 370 and its implications',
    'Difference between Money Bill and Finance Bill',
    'Powers of Governor vs Chief Minister',
  ],
  'Economics': [
    'What is GDP vs GNP?',
    'Explain Fiscal Deficit',
    'Impact of GST on Indian economy',
  ],
  'Science & Tech': [
    'Recent ISRO missions',
    'Artificial Intelligence applications',
    'Green hydrogen technology',
  ],
  'Ethics': [
    'Ethics case study: Whistle-blowing dilemma',
    'Difference between ethics and morality',
    'Ethical theories for civil services',
  ],
};

const STORAGE_KEY = 'studybyself.chat.v1';
const MAX_STORED_MESSAGES = 100;

const DEFAULT_MESSAGES: Message[] = [
  { role: 'assistant', content: 'Hello! I\'m your AI tutor. Select a subject and ask me anything!' },
];

function loadStoredChat(): { messages: Message[]; subject: string; language: 'en' | 'hi' } {
  if (typeof window === 'undefined') {
    return { messages: DEFAULT_MESSAGES, subject: 'Current Affairs', language: 'en' };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error('empty');
    const parsed = JSON.parse(raw);
    return {
      messages: Array.isArray(parsed.messages) && parsed.messages.length ? parsed.messages : DEFAULT_MESSAGES,
      subject: subjects.includes(parsed.subject) ? parsed.subject : 'Current Affairs',
      language: parsed.language === 'hi' ? 'hi' : 'en',
    };
  } catch {
    return { messages: DEFAULT_MESSAGES, subject: 'Current Affairs', language: 'en' };
  }
}

export default function Chat() {
  const [stored] = useState(loadStoredChat);
  const [messages, setMessages] = useState<Message[]>(stored.messages);
  const [input, setInput] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(stored.subject);
  const [language, setLanguage] = useState<'en' | 'hi'>(stored.language);
  const [isLoading, setIsLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const messageViewportRef = useRef<HTMLDivElement>(null);
  const shouldFollowRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);
  const lastPromptRef = useRef<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!shouldFollowRef.current) return;
    const viewport = messageViewportRef.current;
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [messages]);

  // Cancel any in-flight stream when leaving the section so a late
  // response can't write into an unmounted view.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ messages: messages.slice(-MAX_STORED_MESSAGES), subject: selectedSubject, language })
        );
      } catch {
        // storage full or unavailable — ignore
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [messages, selectedSubject, language]);

  const handleClearChat = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
    setStreamError(null);
    setMessages(DEFAULT_MESSAGES);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };


  const runStream = async (history: Message[], prompt: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    lastPromptRef.current = prompt;

    setStreamError(null);
    setIsLoading(true);

    let assistantContent = '';
    const isStale = () => abortRef.current !== controller;

    try {
      await streamChat({
        messages: history,
        subject: selectedSubject,
        language,
        signal: controller.signal,
        onDelta: (chunk) => {
          if (isStale()) return;
          assistantContent += chunk;
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg?.role === 'assistant') {
              return prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content: assistantContent } : m
              );
            }
            return [...prev, { role: 'assistant', content: assistantContent }];
          });
        },
        onDone: () => {
          if (isStale()) return;
          setIsLoading(false);
          abortRef.current = null;
        },
        onError: (error) => {
          if (isStale()) return;
          setIsLoading(false);
          abortRef.current = null;
          setStreamError(error.message || 'The AI tutor could not respond.');
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
          // Remove incomplete assistant message if error occurs
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg?.role === 'assistant' && !lastMsg.content.trim()) {
              return prev.slice(0, -1);
            }
            return prev;
          });
        },
      });
    } catch (error) {
      if (isStale()) return;
      setIsLoading(false);
      abortRef.current = null;
      setStreamError(error instanceof Error ? error.message : 'Unexpected chat error.');
      console.error('Chat error:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const history = [...messages, userMessage];
    setMessages(history);
    setInput('');
    await runStream(history, userMessage.content);
  };

  const handleRetry = async () => {
    if (isLoading) return;
    const history = messages.filter(
      (m, i) => !(i === messages.length - 1 && m.role === 'assistant' && !m.content.trim())
    );
    await runStream(history, lastPromptRef.current ?? '');
  };


  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">AI Tutor</h1>
            <p className="text-muted-foreground">Get personalized help across all subjects</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            >
              <Globe className="mr-2 h-4 w-4" />
              {language === 'en' ? 'English' : 'हिंदी'}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClearChat} disabled={isLoading}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>

        <Tabs value={selectedSubject} onValueChange={setSelectedSubject} className="mb-4">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="inline-flex w-full">
              {subjects.map(subject => (
                <TabsTrigger key={subject} value={subject} className="text-xs">
                  {subject}
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>
        </Tabs>

        <Card className="mb-4 flex h-[max(20rem,calc(100dvh-24rem))] flex-col overflow-hidden p-4">
          <div
            ref={messageViewportRef}
            className="flex-1 overflow-y-auto pr-4"
            onScroll={(event) => {
              const viewport = event.currentTarget;
              shouldFollowRef.current = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 80;
            }}
          >
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="mb-4 flex flex-wrap gap-2">
          {suggestedQuestions[selectedSubject]?.map(question => (
            <Badge
              key={question}
              variant="outline"
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => !isLoading && setInput(question)}
            >
              {question}
            </Badge>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder={`Ask about ${selectedSubject}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
