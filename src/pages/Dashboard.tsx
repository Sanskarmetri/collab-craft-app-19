import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Target, BookOpen, TrendingUp, Play, Brain, Calendar, Newspaper, Library } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useResourceProgress } from '@/hooks/useResourceProgress';


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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.user_metadata?.name || 'Student'}!
          </h1>
          <p className="text-muted-foreground">
            Here's your study progress for today
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.streak} days</div>
              <p className="text-xs text-muted-foreground">
                {stats.streak > 0 ? 'Keep it going!' : 'Start your first session today!'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Focus Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.focusMin} min</div>
              <p className="text-xs text-muted-foreground">Today's focused study time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quizzes Taken</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.quizzes}</div>
              <p className="text-xs text-muted-foreground">
                {stats.quizzes > 0 ? 'Great progress!' : 'Take your first quiz'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgScore}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.quizzes > 0 ? 'Across all quizzes' : 'No quizzes yet'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Library className="h-5 w-5 text-primary" />
                Study Coverage
              </CardTitle>
              <CardDescription>Items you've marked as covered in the Study Library</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/syllabus">Syllabus map</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/resources">Open Library</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'PYQs solved', value: coverage.pyq },
                { label: 'NCERT chapters read', value: coverage.ncert },
                { label: 'Techniques applied', value: coverage.improve },
              ].map((c) => (
                <div key={c.label} className="rounded-lg border p-4">
                  <div className="text-2xl font-bold">{c.value}</div>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </div>
              ))}
            </div>

            {coverageRows.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(bySubject)
                  .sort((a, b) => b[1] - a[1])
                  .map(([subj, n]) => (
                    <Badge key={subj} variant="secondary" className="text-xs">
                      {subj} · {n}
                    </Badge>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nothing marked yet — open the Study Library and tap "Mark covered" on any PYQ, NCERT chapter or technique.
              </p>
            )}
          </CardContent>
        </Card>



        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Today's Sessions</CardTitle>
              <CardDescription>Your study sessions for today</CardDescription>
            </CardHeader>
            <CardContent>
              {todaySessions.length > 0 ? (
                <div className="space-y-3">
                  {todaySessions.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                      <div>
                        <span className="font-medium capitalize">{s.subject?.replace('_', ' ')}</span>
                        <span className="text-muted-foreground ml-2">— {s.topic}</span>
                      </div>
                      <span className="text-muted-foreground">{s.duration ? `${s.duration} min` : 'In progress'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No sessions yet today. Start a focus session!
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with your preparation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" asChild>
                <Link to="/focus">
                  <Play className="mr-2 h-4 w-4" />
                  Start Focus Session
                </Link>
              </Button>
              <Button className="w-full" variant="outline" asChild>
                <Link to="/quiz">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Take a Quiz
                </Link>
              </Button>
              <Button className="w-full" variant="outline" asChild>
                <Link to="/chat">
                  <Brain className="mr-2 h-4 w-4" />
                  Chat with AI Tutor
                </Link>
              </Button>
              <Button className="w-full" variant="outline" asChild>
                <Link to="/timetable">
                  <Calendar className="mr-2 h-4 w-4" />
                  View Timetable
                </Link>
              </Button>
              <Button className="w-full" variant="outline" asChild>
                <Link to="/news">
                  <Newspaper className="mr-2 h-4 w-4" />
                  UPSC Daily News
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
