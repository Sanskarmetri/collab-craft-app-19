import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileQuestion, BookOpen, TrendingUp, Loader2, Library, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useResourceProgress, progressKey, type ResourceType } from '@/hooks/useResourceProgress';


interface ResourceItem {
  title: string;
  meta?: string;
  body?: string;
  tags?: string[];
}

const SUBJECTS = [
  'History', 'Geography', 'Polity', 'Economics', 'Science & Technology',
  'Environment', 'Ethics', 'Current Affairs',
];

type TabKey = 'pyq' | 'ncert' | 'improve';

const tabMeta: Record<TabKey, { label: string; icon: typeof FileQuestion; hint: string; placeholder: string }> = {
  pyq: {
    label: 'PYQ',
    icon: FileQuestion,
    hint: 'Previous year UPSC questions with model answers.',
    placeholder: 'Optional: narrow to a topic (e.g. Fundamental Rights)',
  },
  ncert: {
    label: 'NCERT',
    icon: BookOpen,
    hint: 'Must-read NCERT chapters in the right reading order.',
    placeholder: 'Optional: narrow to a topic (e.g. Climatology)',
  },
  improve: {
    label: 'How to Improve',
    icon: TrendingUp,
    hint: 'Concrete techniques to fix weak areas in this subject.',
    placeholder: 'Optional: describe your weakness (e.g. I forget dates)',
  },
};

export default function Resources() {
  const { toast } = useToast();
  const [tab, setTab] = useState<TabKey>('pyq');
  const [subject, setSubject] = useState('Polity');
  const [extra, setExtra] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<TabKey, ResourceItem[]>>({ pyq: [], ncert: [], improve: [] });

  const load = async (type: TabKey) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('study-resources', {
        body: { type, subject, extra },
      });
      if (error) throw error;
      setResults((r) => ({ ...r, [type]: data?.items ?? [] }));
      if (!data?.items?.length) {
        toast({ title: 'No results', description: 'Try again or pick another subject.' });
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Could not load study resources.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const items = results[tab];
  const Meta = tabMeta[tab];

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Library className="h-8 w-8 text-primary" />
            Study Library
          </h1>
          <p className="text-muted-foreground mt-1">
            Previous year questions, NCERT roadmap, and improvement methods — tailored per subject.
          </p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            {(Object.keys(tabMeta) as TabKey[]).map((key) => {
              const Icon = tabMeta[key].icon;
              return (
                <TabsTrigger key={key} value={key} className="gap-1.5">
                  <Icon className="h-4 w-4" />
                  {tabMeta[key].label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {(Object.keys(tabMeta) as TabKey[]).map((key) => (
            <TabsContent key={key} value={key} className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{tabMeta[key].hint}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {SUBJECTS.map((s) => (
                      <Badge
                        key={s}
                        variant={subject === s ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setSubject(s)}
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      value={extra}
                      onChange={(e) => setExtra(e.target.value)}
                      placeholder={tabMeta[key].placeholder}
                    />
                    <Button onClick={() => load(key)} disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Generate
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {loading && (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader>
                      <CardContent>
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3 mt-2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!loading && items.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center text-muted-foreground text-sm">
                    Pick a subject and hit Generate to load {Meta.label.toLowerCase()} content.
                  </CardContent>
                </Card>
              )}

              {!loading &&
                items.map((item, i) => {
                  const isCovered = covered.has(progressKey(key, subject, item.title));
                  return (
                    <Card key={i} className={isCovered ? 'border-primary/50' : undefined}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <CardTitle className="text-base leading-snug">{item.title}</CardTitle>
                            {item.meta && <p className="text-xs text-muted-foreground">{item.meta}</p>}
                          </div>
                          <Button
                            size="sm"
                            variant={isCovered ? 'default' : 'outline'}
                            className="shrink-0 gap-1.5"
                            onClick={() => toggleCovered(key, item.title)}
                          >
                            <Check className="h-4 w-4" />
                            {isCovered ? 'Covered' : 'Mark covered'}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {item.body && <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>}
                        {!!item.tags?.length && (
                          <div className="flex flex-wrap gap-1.5">
                            {item.tags.map((t, j) => (
                              <Badge key={j} variant="secondary" className="text-xs">{t}</Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppLayout>
  );
}
