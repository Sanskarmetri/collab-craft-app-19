import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Play, BookOpen, Brain, Calendar, Newspaper, CalendarClock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useResourceProgress } from '@/hooks/useResourceProgress';

const SUBJECT_BAR_COLORS = ['bg-primary', 'bg-accent'];

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({ streak: 0, focusMin: 0, quizzes: 0, avgScore: 0 });
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const { counts: coverage, bySubject, rows: coverageRows } = useResourceProgress();

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];

    const fetchStats = async () => {
      const [profileRes, analyticsRes, sessionsRes] = await Promise.all([
        supabase.from('profiles').select('streak').eq('id', user.id).single(),
        supabase.from('analytics').select('total_focus_minutes, quizzes_taken, average_score').eq('date', today).eq('user_id', user.id).single(),
        supabase.from('sessions').select('subject, topic, start_ts, end_ts, duration').eq('user_id', user.id).gte('start_ts', `${today}T00:00:00`).order('start_ts', { ascending: false }).limit(5),
      ]);

      const requestError = profileRes.error || (analyticsRes.error?.code === 'PGRST116' ? null : analyticsRes.error) || sessionsRes.error;
      if (requestError) {
        toast({
          title: 'Could not load progress',
          description: 'Your latest study statistics are temporarily unavailable.',
          variant: 'destructive',
        });
      }

      setStats({
        streak: profileRes.data?.streak || 0,
        focusMin: analyticsRes.data?.total_focus_minutes || 0,
        quizzes: analyticsRes.data?.quizzes_taken || 0,
        avgScore: analyticsRes.data?.average_score || 0,
      });
      setTodaySessions(sessionsRes.data || []);
    };

    fetchStats();
  }, [user, toast]);

  const focusHrs = (stats.focusMin / 60).toFixed(1);
  const statCards = [
    { label: 'Study Streak', value: stats.streak, unit: 'days', tone: 'text-primary', bar: stats.streak > 0 ? 80 : 0, barTone: 'bg-primary', hint: stats.streak > 0 ? 'Keep it going!' : 'Start today' },
    { label: 'Focus Time', value: focusHrs, unit: 'hrs', tone: 'text-accent', bar: Math.min(100, (stats.focusMin / 240) * 100), barTone: 'bg-accent', hint: "Today's focused study" },
    { label: 'Quizzes Taken', value: stats.quizzes, unit: '', tone: 'text-foreground', bar: Math.min(100, stats.quizzes * 25), barTone: 'bg-primary', hint: stats.quizzes > 0 ? 'Great progress!' : 'Take your first quiz' },
    { label: 'Average Score', value: stats.avgScore, unit: '%', tone: 'text-foreground', bar: stats.avgScore, barTone: 'bg-accent', hint: stats.quizzes > 0 ? 'Across all quizzes' : 'No quizzes yet' },
  ];

  const topSubjects = Object.entries(bySubject).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const maxSubjectCount = topSubjects[0]?.[1] || 1;

  const quickActions = [
    { to: '/focus', label: 'Start Focus Session', icon: Play, primary: true },
    { to: '/quiz', label: 'Take a Quiz', icon: BookOpen },
    { to: '/chat', label: 'Chat with AI Tutor', icon: Brain },
    { to: '/timetable', label: 'View Timetable', icon: Calendar },
    { to: '/planner', label: 'Countdown & Notes', icon: CalendarClock },
    { to: '/news', label: 'UPSC Daily News', icon: Newspaper },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Greeting */}
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">Scholar Dashboard</p>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">
            Welcome back, <span className="italic">{user?.user_metadata?.name || 'Student'}</span>
          </h1>
        </div>

        {/* Tactical stats grid */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map((s) => (
            <Card key={s.label} className="border-border/60">
              <CardContent className="p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{s.label}</p>
                <p className={`font-serif text-3xl ${s.tone}`}>
                  {s.value}
                  {s.unit && <span className="ml-1 text-sm italic text-muted-foreground">{s.unit}</span>}
                </p>
                <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-background">
                  <div className={`h-full rounded-full ${s.barTone} transition-all duration-700`} style={{ width: `${s.bar}%` }} />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">{s.hint}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Coverage panel */}
          <Card className="border-border/60 lg:col-span-2">
            <CardContent className="p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-xl">Study Coverage</h2>
                  <p className="text-xs text-muted-foreground">PYQs, NCERT chapters and techniques marked covered</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/syllabus">Syllabus map</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/resources">Library</Link>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'PYQs solved', value: coverage.pyq },
                  { label: 'NCERT read', value: coverage.ncert },
                  { label: 'Techniques', value: coverage.improve },
                ].map((c) => (
                  <div key={c.label} className="rounded-xl border border-border/60 bg-background/50 p-3">
                    <p className="font-serif text-2xl">{c.value}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{c.label}</p>
                  </div>
                ))}
              </div>

              {coverageRows.length > 0 ? (
                <div className="space-y-3">
                  {topSubjects.map(([subj, n], i) => (
                    <div key={subj}>
                      <div className="mb-1.5 flex justify-between text-xs">
                        <span className="text-muted-foreground">{subj}</span>
                        <span className="font-medium">{n} covered</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-background">
                        <div
                          className={`h-full rounded-full ${SUBJECT_BAR_COLORS[i % 2]} shadow-[0_0_8px_hsl(var(--primary)/0.3)] transition-all duration-700`}
                          style={{ width: `${(n / maxSubjectCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nothing marked yet — open the Study Library and tap "Mark covered" on any PYQ, NCERT chapter or technique.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card className="border-border/60">
            <CardContent className="p-5">
              <h2 className="font-serif text-xl mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {quickActions.map(({ to, label, icon: Icon, primary }) => (
                  <Button
                    key={to}
                    className={`w-full justify-start ${primary ? '' : 'border-border/60'}`}
                    variant={primary ? 'default' : 'outline'}
                    asChild
                  >
                    <Link to={to}>
                      <Icon className="mr-2 h-4 w-4" />
                      {label}
                    </Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's sessions */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-serif text-xl">Today's Sessions</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/timetable" className="text-xs text-primary">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>

          {todaySessions.length > 0 ? (
            <div className="space-y-3">
              {todaySessions.map((s, i) => (
                <Card key={i} className={`border-border/60 ${!s.duration ? '' : 'bg-card/50'}`}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-background">
                        <div className={`h-2 w-2 rounded-full ${!s.duration ? 'bg-accent animate-pulse' : 'bg-muted-foreground/50'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">{s.subject?.replace('_', ' ')}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {s.topic} • {s.duration ? `${s.duration} min` : 'In progress'}
                        </p>
                      </div>
                    </div>
                    {!s.duration && (
                      <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">Live</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-border/60 bg-card/50">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-background">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                </div>
                <div>
                  <p className="text-sm font-medium">No sessions yet today</p>
                  <p className="text-[11px] text-muted-foreground">Start a focus session to begin your streak</p>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
