import { useEffect, useMemo, useRef, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellRing, CalendarClock, Plus, Timer, Trash2 } from 'lucide-react';

type Task = {
  id: string;
  title: string;
  done: boolean;
  remindAt?: string; // ISO string
  notified?: boolean;
};

const TARGET_KEY = 'studybyself.planner.target.v1';
const TASKS_KEY = 'studybyself.planner.tasks.v1';

const toLocalInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
};

const defaultTarget = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return toLocalInput(d);
};

const readTasks = (): Task[] => {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

function Digit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-b from-card to-background px-3 py-4 shadow-lg sm:px-6 sm:py-6">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-border/60" />
        <span className="block text-center font-mono text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-5xl md:text-6xl">
          {String(Math.max(0, value)).padStart(2, '0')}
        </span>
      </div>
      <span className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">
        {label}
      </span>
    </div>
  );
}

export default function Planner() {
  const { toast } = useToast();
  const [target, setTarget] = useState<string>(
    () => localStorage.getItem(TARGET_KEY) || defaultTarget(),
  );
  const [now, setNow] = useState(() => Date.now());
  const [tasks, setTasks] = useState<Task[]>(() => readTasks());
  const [newTask, setNewTask] = useState('');
  const [newRemind, setNewRemind] = useState('');
  const reachedRef = useRef(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    localStorage.setItem(TARGET_KEY, target);
    reachedRef.current = false;
  }, [target]);

  useEffect(() => {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const targetMs = useMemo(() => {
    const t = new Date(target).getTime();
    return Number.isNaN(t) ? null : t;
  }, [target]);

  const remaining = targetMs === null ? 0 : Math.max(0, targetMs - now);
  const isPast = targetMs !== null && targetMs <= now;

  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  // Countdown finished notice
  useEffect(() => {
    if (isPast && !reachedRef.current && targetMs) {
      reachedRef.current = true;
      toast({ title: "Time's up", description: 'Your countdown has reached its target time.' });
    }
  }, [isPast, targetMs, toast]);

  // Reminder checks
  useEffect(() => {
    const due = tasks.filter(
      (t) => !t.done && !t.notified && t.remindAt && new Date(t.remindAt).getTime() <= now,
    );
    if (due.length === 0) return;
    due.forEach((t) => {
      toast({ title: 'Reminder', description: t.title });
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('Studybyself reminder', { body: t.title });
        } catch {
          /* ignore */
        }
      }
    });
    const ids = new Set(due.map((d) => d.id));
    setTasks((prev) => prev.map((t) => (ids.has(t.id) ? { ...t, notified: true } : t)));
  }, [now, tasks, toast]);

  const addTask = () => {
    const title = newTask.trim();
    if (!title) return;
    setTasks((prev) => [
      {
        id: crypto.randomUUID(),
        title,
        done: false,
        remindAt: newRemind ? new Date(newRemind).toISOString() : undefined,
      },
      ...prev,
    ]);
    setNewTask('');
    setNewRemind('');
    if (newRemind && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => undefined);
    }
  };

  const pending = tasks.filter((t) => !t.done).length;

  const clockTime = new Date(now).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <CalendarClock className="h-8 w-8 text-primary" />
            Countdown &amp; Notes
          </h1>
          <p className="mt-1 text-muted-foreground">
            Set the day and time you're counting down to, and keep your to-do list with reminders in
            one place.
          </p>
        </div>

        <Card className="overflow-hidden border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-primary" />
                  {isPast ? 'Target reached' : 'Time remaining'}
                </CardTitle>
                <CardDescription>Now {clockTime}</CardDescription>
              </div>
              <Input
                type="datetime-local"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full max-w-[240px]"
                aria-label="Target date and time"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 sm:gap-4">
              <Digit value={days} label="Days" />
              <Digit value={hours} label="Hours" />
              <Digit value={minutes} label="Minutes" />
              <Digit value={seconds} label="Seconds" />
            </div>
            {targetMs !== null && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Target:{' '}
                {new Date(targetMs).toLocaleString([], {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>Notes &amp; To-do</CardTitle>
                <CardDescription>Add tasks and set an optional reminder time.</CardDescription>
              </div>
              <Badge variant="secondary">{pending} pending</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addTask();
                }}
                placeholder="Revise Polity — Fundamental Rights"
                className="flex-1"
              />
              <Input
                type="datetime-local"
                value={newRemind}
                onChange={(e) => setNewRemind(e.target.value)}
                className="sm:w-[220px]"
                aria-label="Reminder time"
              />
              <Button onClick={addTask} disabled={!newTask.trim()}>
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
            </div>

            {tasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing here yet. Add your first task above.
              </p>
            ) : (
              <ul className="space-y-2">
                {tasks.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-start gap-3 rounded-lg border bg-card/50 p-3"
                  >
                    <Checkbox
                      checked={t.done}
                      onCheckedChange={(v) =>
                        setTasks((prev) =>
                          prev.map((x) => (x.id === t.id ? { ...x, done: Boolean(v) } : x)),
                        )
                      }
                      className="mt-1"
                      aria-label={`Mark ${t.title} done`}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={
                          t.done ? 'break-words line-through text-muted-foreground' : 'break-words'
                        }
                      >
                        {t.title}
                      </p>
                      {t.remindAt && (
                        <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                          {t.notified ? (
                            <BellRing className="h-3 w-3 text-primary" />
                          ) : (
                            <Bell className="h-3 w-3" />
                          )}
                          {new Date(t.remindAt).toLocaleString([], {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setTasks((prev) => prev.filter((x) => x.id !== t.id))}
                      aria-label="Delete task"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
