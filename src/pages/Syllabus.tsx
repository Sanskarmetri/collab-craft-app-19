import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Check, Library, Map } from 'lucide-react';
import { SYLLABUS, type SyllabusSubject } from '@/data/syllabus';
import { useResourceProgress, progressKey } from '@/hooks/useResourceProgress';
import { useToast } from '@/hooks/use-toast';

const chapterTitle = (book: string, title: string) => `${book} — ${title}`;

export default function Syllabus() {
  const { toast } = useToast();
  const { covered, toggle, isAuthed, counts } = useResourceProgress();
  const [active, setActive] = useState<SyllabusSubject | null>(null);

  const coveredCount = (subject: SyllabusSubject) =>
    subject.chapters.filter((ch) =>
      covered.has(progressKey('ncert', subject.name, chapterTitle(ch.book, ch.title))),
    ).length;

  const groups = useMemo(() => {
    if (!active) return [];
    const map = new Map<string, typeof active.chapters>();
    active.chapters.forEach((ch) => {
      const list = map.get(ch.book) ?? [];
      list.push(ch);
      map.set(ch.book, list);
    });
    return Array.from(map.entries());
  }, [active]);

  const onToggle = async (subjectName: string, title: string) => {
    if (!isAuthed) {
      toast({
        title: 'Sign in required',
        description: 'Log in to track your coverage.',
        variant: 'destructive',
      });
      return;
    }
    await toggle('ncert', subjectName, title);
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
              <Map className="h-8 w-8 text-primary" />
              Syllabus Map
            </h1>
            <p className="mt-1 text-muted-foreground">
              Every subject, book by book. Tick chapters as you finish them — they feed the Study
              Coverage tracker on your dashboard.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{counts.ncert} chapters covered</Badge>
            <Button variant="outline" size="sm" asChild>
              <Link to="/resources" className="gap-1.5">
                <Library className="h-4 w-4" />
                Study Library
              </Link>
            </Button>
          </div>
        </div>

        {!active && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SYLLABUS.map((subject) => {
              const done = coveredCount(subject);
              const total = subject.chapters.length;
              const pct = total ? Math.round((done / total) * 100) : 0;
              return (
                <Card
                  key={subject.id}
                  className="cursor-pointer transition-colors hover:border-primary/60"
                  onClick={() => setActive(subject)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                      <Badge variant="outline">{subject.paper}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Progress value={pct} />
                    <p className="text-xs text-muted-foreground">
                      {done} of {total} chapters covered · {pct}%
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {active && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button variant="ghost" size="sm" onClick={() => setActive(null)} className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                All subjects
              </Button>
              <p className="text-sm text-muted-foreground">
                {coveredCount(active)} / {active.chapters.length} chapters covered
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold">{active.name}</h2>
              <p className="text-sm text-muted-foreground">Mapped to {active.paper}</p>
            </div>

            {groups.map(([book, chapters]) => (
              <Card key={book}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{book}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {chapters.map((ch) => {
                    const title = chapterTitle(book, ch.title);
                    const isCovered = covered.has(progressKey('ncert', active.name, title));
                    return (
                      <button
                        key={ch.title}
                        type="button"
                        onClick={() => onToggle(active.name, title)}
                        className={`flex w-full items-center justify-between gap-3 rounded-md border p-2.5 text-left transition-colors ${
                          isCovered
                            ? 'border-primary/50 bg-primary/5'
                            : 'hover:border-primary/40'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{ch.title}</p>
                          {ch.classLevel > 0 && (
                            <p className="text-xs text-muted-foreground">Class {ch.classLevel}</p>
                          )}
                        </div>
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                            isCovered
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-muted-foreground/40 text-transparent'
                          }`}
                        >
                          <Check className="h-4 w-4" />
                        </span>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
