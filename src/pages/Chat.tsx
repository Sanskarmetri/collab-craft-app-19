import { useState, useRef, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Globe, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I\'m your AI tutor. Select a subject and ask me anything!' },
  ]);
  const [input, setInput] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Current Affairs');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      await streamChat({
        messages: [...messages, userMessage],
        subject: selectedSubject,
        language,
        onDelta: (chunk) => {
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
          setIsLoading(false);
        },
        onError: (error) => {
          setIsLoading(false);
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
      setIsLoading(false);
      console.error('Chat error:', error);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">AI Tutor</h1>
            <p className="text-muted-foreground">Get personalized help across all subjects</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
          >
            <Globe className="mr-2 h-4 w-4" />
            {language === 'en' ? 'English' : 'हिंदी'}
          </Button>
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

        <Card className="mb-4 p-4 h-[calc(100vh-24rem)] overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 pr-4">
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
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
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
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
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
