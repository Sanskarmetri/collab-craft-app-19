import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Globe } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

const subjects = [
  'Current Affairs',
  'History',
  'Geography',
  'Polity',
  'Economics',
  'Science & Tech',
  'Ethics',
];

const mockMessages = [
  { role: 'assistant', content: 'Hello! I\'m your AI tutor. How can I help you today?' },
];

const suggestedQuestions = [
  'Explain Article 370',
  'What is GDP?',
  'Recent developments in space technology',
  'Ethics case study examples',
];

export default function Chat() {
  const [messages, setMessages] = useState(mockMessages);
  const [input, setInput] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Current Affairs');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', content: input }]);
    setInput('');
    // Mock response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'This is a mock response. AI integration will be added in Phase 4.'
      }]);
    }, 1000);
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
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        <div className="mb-4 flex flex-wrap gap-2">
          {suggestedQuestions.map(question => (
            <Badge
              key={question}
              variant="outline"
              className="cursor-pointer hover:bg-accent"
              onClick={() => setInput(question)}
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
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button onClick={handleSend}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
