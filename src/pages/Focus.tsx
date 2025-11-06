import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Pause, Square, Coffee, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useFocusSession } from '@/hooks/useFocusSession';
import { supabase } from '@/integrations/supabase/client';

const presets = [
  { label: '25 min', value: 25 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
];

const motivationalQuotes = [
  'Every expert was once a beginner.',
  'Success is the sum of small efforts repeated daily.',
  'Focus on progress, not perfection.',
  'Your dedication today builds tomorrow\'s success.',
];

export default function Focus() {
  const [selectedPreset, setSelectedPreset] = useState(45);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [showBreakDialog, setShowBreakDialog] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [breakDuration, setBreakDuration] = useState(5);
  const [countdown, setCountdown] = useState(0);
  const [todayStats, setTodayStats] = useState({ sessions: 0, totalMinutes: 0, streak: 0 });
  const [quote] = useState(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);

  const {
    status,
    timeLeft,
    totalDuration,
    focusTime,
    exitAttempts,
    startSession,
    pauseSession,
    resumeSession,
    startBreak,
    completeSession,
    cancelSession,
    logExitAttempt,
  } = useFocusSession();

  useEffect(() => {
    const fetchTodayStats = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data: analytics } = await supabase
        .from('analytics')
        .select('sessions_completed, total_focus_minutes')
        .eq('date', today)
        .single();

      const { data: profile } = await supabase
        .from('profiles')
        .select('streak')
        .single();

      setTodayStats({
        sessions: analytics?.sessions_completed || 0,
        totalMinutes: analytics?.total_focus_minutes || 0,
        streak: profile?.streak || 0,
      });
    };

    fetchTodayStats();
  }, [status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;

  const handleStart = () => {
    if (!subject || !topic) {
      alert('Please enter subject and topic');
      return;
    }
    startSession(selectedPreset, { subject: subject as any, topic, duration: selectedPreset });
  };

  const handleBreakRequest = (minutes: number) => {
    setBreakDuration(minutes);
    setShowBreakDialog(true);
  };

  const confirmBreak = () => {
    setCountdown(15);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          startBreak(breakDuration);
          setShowBreakDialog(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleEndRequest = () => {
    logExitAttempt();
    setShowEndDialog(true);
  };

  const confirmEnd = () => {
    setCountdown(15);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          cancelSession();
          setShowEndDialog(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">Focus Mode</h1>
          <p className="text-muted-foreground">Stay focused and build consistency</p>
          {exitAttempts > 0 && status === 'active' && (
            <div className="mt-2 text-sm text-destructive flex items-center justify-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {exitAttempts} exit attempt{exitAttempts > 1 ? 's' : ''} logged
            </div>
          )}
        </div>

        {status === 'idle' && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., History, Polity, Geography"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Medieval India, Fundamental Rights"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-center">Choose Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 justify-center">
                  {presets.map((preset) => (
                    <Button
                      key={preset.value}
                      variant={selectedPreset === preset.value ? 'default' : 'outline'}
                      onClick={() => setSelectedPreset(preset.value)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {(status === 'active' || status === 'paused' || status === 'break') && (
          <>
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <div className="text-sm text-muted-foreground mb-2">
                    {status === 'break' ? '☕ Break Time' : `📚 ${subject} - ${topic}`}
                  </div>
                  <div className="text-6xl font-bold mb-4">{formatTime(timeLeft)}</div>
                  <Progress value={progress} className="mb-4" />
                  <div className="text-xs text-muted-foreground">
                    Focus time: {Math.floor(focusTime / 60)} min
                  </div>
                </div>

                <div className="flex gap-2 justify-center">
                  {status === 'active' ? (
                    <>
                      <Button size="lg" variant="outline" onClick={pauseSession}>
                        <Pause className="mr-2 h-5 w-5" />
                        Pause
                      </Button>
                      <Button size="lg" variant="destructive" onClick={handleEndRequest}>
                        <Square className="mr-2 h-5 w-5" />
                        End Session
                      </Button>
                    </>
                  ) : status === 'paused' ? (
                    <>
                      <Button size="lg" onClick={resumeSession}>
                        <Play className="mr-2 h-5 w-5" />
                        Resume
                      </Button>
                      <Button size="lg" variant="destructive" onClick={handleEndRequest}>
                        <Square className="mr-2 h-5 w-5" />
                        End Session
                      </Button>
                    </>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {status === 'active' && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-sm">Need a Break?</CardTitle>
                  <CardDescription className="text-xs">
                    Breaks require confirmation to maintain focus
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBreakRequest(5)}
                    >
                      <Coffee className="mr-2 h-4 w-4" />
                      5 min break
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBreakRequest(10)}
                    >
                      <Coffee className="mr-2 h-4 w-4" />
                      10 min break
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {status === 'idle' && (
          <div className="flex justify-center mb-6">
            <Button size="lg" onClick={handleStart}>
              <Play className="mr-2 h-5 w-5" />
              Start Focus Session
            </Button>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Today's Focus Stats</CardTitle>
            <CardDescription>Your focused study time for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{todayStats.sessions}</div>
                <div className="text-xs text-muted-foreground">Sessions</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{todayStats.totalMinutes}m</div>
                <div className="text-xs text-muted-foreground">Total Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{todayStats.streak}</div>
                <div className="text-xs text-muted-foreground">Day Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm italic text-muted-foreground">"{quote}"</p>
        </div>
      </div>

      <AlertDialog open={showBreakDialog} onOpenChange={setShowBreakDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Take a {breakDuration}-minute break?</AlertDialogTitle>
            <AlertDialogDescription>
              Breaking focus can disrupt your flow. Are you sure you want to take a break?
              {countdown > 0 && (
                <div className="mt-4 text-center text-2xl font-bold">{countdown}</div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={countdown > 0}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBreak} disabled={countdown > 0}>
              Confirm Break
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <AlertTriangle className="h-5 w-5 inline mr-2 text-destructive" />
              End session early?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You've focused for {Math.floor(focusTime / 60)} minutes so far. Ending early will
              delete this session and may affect your streak.
              {countdown > 0 && (
                <div className="mt-4 text-center text-2xl font-bold text-destructive">
                  {countdown}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={countdown > 0}>Keep Studying</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmEnd}
              disabled={countdown > 0}
              className="bg-destructive"
            >
              End Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
