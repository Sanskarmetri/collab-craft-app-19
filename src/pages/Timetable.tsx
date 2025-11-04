import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

const mockSessions = [
  { time: '09:00 AM', subject: 'History', topic: 'Ancient India', duration: 60, status: 'completed' },
  { time: '11:00 AM', subject: 'Polity', topic: 'Constitution Basics', duration: 90, status: 'planned' },
  { time: '02:00 PM', subject: 'Current Affairs', topic: 'Weekly News', duration: 45, status: 'planned' },
];

export default function Timetable() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Study Timetable</h1>
            <p className="text-muted-foreground">Plan and track your daily study schedule</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Session
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
                <CardDescription>
                  {date?.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockSessions.map((session, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-start gap-4">
                        <div className="text-sm font-medium text-muted-foreground w-20">
                          {session.time}
                        </div>
                        <div>
                          <div className="font-semibold">{session.subject}</div>
                          <div className="text-sm text-muted-foreground">{session.topic}</div>
                          <div className="text-xs text-muted-foreground mt-1">{session.duration} minutes</div>
                        </div>
                      </div>
                      <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                        {session.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Schedule</CardTitle>
                <CardDescription>Let AI create an optimized study plan for you</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Generate Smart Schedule
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
