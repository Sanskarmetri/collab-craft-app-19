import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  FileQuestion,
  BookOpen,
  TrendingUp,
  Loader2,
  Library,
  Check,
  ExternalLink,
  Map,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useResourceProgress, progressKey, type ResourceType } from '@/hooks/useResourceProgress';
import { SYLLABUS, PYQ_PAPERS } from '@/data/syllabus';

interface ImproveItem {
  title: string;
  meta?: string;
  body?: string;
  tags?: string[];
}

type TabKey = 'pyq' | 'ncert' | 'improve';

const PYQ_YEARS = Array.from(new Set(PYQ_PAPERS.map((p) => p.year))).sort((a, b) => b - a);

export default function Resources() {
  const { toast } = useToast();
  const [tab, setTab] = useState<TabKey>('pyq');
  const [subject, setSubject] = useState(SYLLABUS[0].name);
  const [year, setYear] = useState(PYQ_YEARS[0]);
  const [extra, setExtra] = useState('');
  const [loading, setLoading] = useState(false);
  const [improveItems, setImproveItems] = useState<ImproveItem[]>([]);
  const { covered, toggle, isAuthed, counts } = useResourceProgress();

  const activeSubject = useMemo(
    () => SYLLABUS.find((s) => s.name === subject) ?? SYLLABUS[0],
    [subject],
  );

  const yearPapers = useMemo(() => PYQ_PAPERS.filter((p) => p.year === year), [year]);

  const chaptersByBook = useMemo(() => {
    const groups = new Map<string, typeof activeSubject.chapters>();
    activeSubject.chapters.forEach((ch) => {
      const list = groups.get(ch.book) ?? [];
      list.push(ch);
      groups.set(ch.book, list);
    });
    return Array.from(groups.entries());
  }, [activeSubject]);

  const toggleCovered = async (type: TabKey, subjectName: string, title: string) => {
    if (!isAuthed) {
      toast({
        title: 'Sign in required',
        description: 'Log in to track your coverage.',
        variant: 'destructive',
      });
      return;
    }
    await toggle(type as ResourceType, subjectName, title);
  };

  const loadImprove = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('study-resources', {
        body: { type: 'improve', subject, extra },
      });
      if (error) throw error;
      setImproveItems(data?.items ?? []);
      if (!data?.items?.length) {
        toast({ title: 'No results', description: 'Try again or pick another subject.' });
      }
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: 'Could not load improvement techniques.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const CoveredButton = ({
    type,
    subjectName,
    title,
  }: {
    type: TabKey;
    subjectName: string;
    title: string;
  }) => {
    const isCovered = covered.has(progressKey(type as ResourceType, subjectName, title));
    return (
      <Button
        size="sm"
        variant={isCovered ? 'default' : 'outline'}
        className="shrink-0 gap-1.5"
        onClick={() => toggleCovered(type, subjectName, title)}
      >
        <Check className="h-4 w-4" />
        {isCovered ? 'Covered' : 'Mark covered'}
      </Button>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
              <Library className="h-8 w-8 text-primary" />
              Study Library
            </h1>
            <p className="mt-1 text-muted-foreground">
              Real UPSC previous-year papers, actual NCERT chapters, and improvement methods.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{counts.pyq} PYQs</Badge>
            <Badge variant="secondary">{counts.ncert} chapters</Badge>
            <Badge variant="secondary">{counts.improve} techniques</Badge>
            <Button variant="outline" size="sm" asChild>
              <Link to="/syllabus" className="gap-1.5">
                <Map className="h-4 w-4" />
                Syllabus map
              </Link>
            </Button>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="pyq" className="gap-1.5">
              <FileQuestion className="h-4 w-4" />
              PYQ
            </TabsTrigger>
            <TabsTrigger value="ncert" className="gap-1.5">
              <BookOpen className="h-4 w-4" />
              NCERT
            </TabsTrigger>
            <TabsTrigger value="improve" className="gap-1.5">
              <TrendingUp className="h-4 w-4" />
              Improve
            </TabsTrigger>
          </TabsList>

          {/* ---------------- PYQ: real UPSC papers ---------------- */}
          <TabsContent value="pyq" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Official UPSC Civil Services previous-year question papers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {PYQ_YEARS.map((y) => (
                    <Badge
                      key={y}
                      variant={year === y ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setYear(y)}
                    >
                      {y}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {yearPapers.map((paper) => (
              <Card key={paper.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-base leading-snug">
                        {paper.year} · {paper.paper}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {paper.exam} · {paper.questions} questions · {paper.marks} marks
                      </p>
                    </div>
                    <CoveredButton
                      type="pyq"
                      subjectName={paper.subject}
                      title={`${paper.year} ${paper.paper}`}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    Open on upsc.gov.in
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ---------------- NCERT: real chapters ---------------- */}
          <TabsContent value="ncert" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Standard NCERT reading list for {activeSubject.name} ({activeSubject.paper})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {SYLLABUS.map((s) => (
                    <Badge
                      key={s.id}
                      variant={subject === s.name ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setSubject(s.name)}
                    >
                      {s.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {chaptersByBook.map(([book, chapters]) => (
              <Card key={book}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{book}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {chapters.map((ch) => {
                    const isCovered = covered.has(
                      progressKey('ncert', activeSubject.name, `${book} — ${ch.title}`),
                    );
                    return (
                      <div
                        key={ch.title}
                        className={`flex items-center justify-between gap-3 rounded-md border p-2.5 ${
                          isCovered ? 'border-primary/50 bg-primary/5' : ''
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{ch.title}</p>
                          {ch.classLevel > 0 && (
                            <p className="text-xs text-muted-foreground">Class {ch.classLevel}</p>
                          )}
                        </div>
                        <CoveredButton
                          type="ncert"
                          subjectName={activeSubject.name}
                          title={`${book} — ${ch.title}`}
                        />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ---------------- Improve: AI techniques ---------------- */}
          <TabsContent value="improve" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Concrete techniques to fix weak areas in this subject.
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {SYLLABUS.map((s) => (
                    <Badge
                      key={s.id}
                      variant={subject === s.name ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setSubject(s.name)}
                    >
                      {s.name}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={extra}
                    onChange={(e) => setExtra(e.target.value)}
                    placeholder="Optional: describe your weakness (e.g. I forget dates)"
                  />
                  <Button onClick={loadImprove} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Generate
                  </Button>
                </div>
              </CardContent>
            </Card>

            {loading &&
              [...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </CardContent>
                </Card>
              ))}

            {!loading && improveItems.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center text-sm text-muted-foreground">
                  Pick a subject and hit Generate to get improvement techniques.
                </CardContent>
              </Card>
            )}

            {!loading &&
              improveItems.map((item, i) => (
                <Card
                  key={i}
                  className={
                    covered.has(progressKey('improve', subject, item.title))
                      ? 'border-primary/50'
                      : undefined
                  }
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <CardTitle className="text-base leading-snug">{item.title}</CardTitle>
                        {item.meta && <p className="text-xs text-muted-foreground">{item.meta}</p>}
                      </div>
                      <CoveredButton type="improve" subjectName={subject} title={item.title} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {item.body && (
                      <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                    )}
                    {!!item.tags?.length && (
                      <div className="flex flex-wrap gap-1.5">
                        {item.tags.map((t, j) => (
                          <Badge key={j} variant="secondary" className="text-xs">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
