import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Download, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTimetable } from '@/hooks/useTimetable';
import { GenerateTimetableDialog } from '@/components/timetable/GenerateTimetableDialog';
import { TimetableCalendar } from '@/components/timetable/TimetableCalendar';
import { WeeklyTimetableView } from '@/components/timetable/WeeklyTimetableView';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { addWeeks, subWeeks } from 'date-fns';

type ViewMode = 'daily' | 'weekly';

export default function Timetable() {
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const {
    items,
    loading,
    generating,
    generateTimetable,
    rescheduleSession,
    updateSessionStatus,
    deleteSession,
  } = useTimetable();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleStartSession = (item: any) => {
    updateSessionStatus(item.id, 'in_progress');
    navigate('/focus');
  };

  const handleReschedule = (item: any) => {
    const newDate = prompt('Enter new date (YYYY-MM-DD):', item.date);
    const newTime = prompt('Enter new time (HH:MM):', item.metadata?.start_time);

    if (newDate) {
      rescheduleSession(item.id, newDate, newTime || undefined);
    }
  };

  const handleToggleComplete = (id: string, completed: boolean) => {
    updateSessionStatus(id, completed ? 'completed' : 'planned');
  };

  const handleWeekChange = (direction: 'prev' | 'next') => {
    setDate((prev) => (direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1)));
  };

  const exportToIcal = () => {
    const icalData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//StudyBySelf//Timetable//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      ...items.map((item) => {
        const startTime = item.metadata?.start_time || '09:00';
        const [hours, minutes] = startTime.split(':');
        const startDate = new Date(item.date);
        startDate.setHours(parseInt(hours), parseInt(minutes));

        const endDate = new Date(startDate);
        endDate.setMinutes(endDate.getMinutes() + item.planned_duration);

        return [
          'BEGIN:VEVENT',
          `UID:${item.id}@studybyself.app`,
          `DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
          `DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
          `SUMMARY:${item.subject} - ${item.topic}`,
          `DESCRIPTION:Study session for ${item.subject}\\nTopic: ${item.topic}\\nDuration: ${item.planned_duration} minutes`,
          `STATUS:${item.status.toUpperCase()}`,
          'END:VEVENT',
        ].join('\r\n');
      }),
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icalData], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'study-timetable.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Exported',
      description: 'Timetable exported to calendar file',
    });
  };

  const datesWithSessions = items.map((item) => new Date(item.date));

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Study Timetable</h1>
            <p className="text-muted-foreground">AI-powered study planning and scheduling</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" onClick={exportToIcal} disabled={items.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={() => setShowGenerateDialog(true)} disabled={generating}>
              {generating ? (
                <>Generating...</>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate AI Schedule
                </>
              )}
            </Button>
          </div>
        </div>

        {viewMode === 'weekly' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => handleWeekChange('prev')}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous Week
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDate(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleWeekChange('next')}>
                Next Week
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Loading timetable...</p>
                </CardContent>
              </Card>
            ) : (
              <WeeklyTimetableView
                items={items}
                selectedDate={date}
                onDateChange={setDate}
                onToggleComplete={handleToggleComplete}
              />
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  className="rounded-md border"
                  modifiers={{
                    scheduled: datesWithSessions,
                  }}
                  modifiersStyles={{
                    scheduled: {
                      backgroundColor: 'hsl(var(--primary) / 0.2)',
                      fontWeight: 'bold',
                    },
                  }}
                />
                <div className="mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary/20"></div>
                    <span>Days with sessions</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="md:col-span-2">
              {loading ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">Loading timetable...</p>
                  </CardContent>
                </Card>
              ) : (
                <TimetableCalendar
                  items={items}
                  selectedDate={date}
                  onDateChange={setDate}
                  onStartSession={handleStartSession}
                  onReschedule={handleReschedule}
                  onDelete={deleteSession}
                />
              )}
            </div>
          </div>
        )}

        <GenerateTimetableDialog
          open={showGenerateDialog}
          onOpenChange={setShowGenerateDialog}
          onGenerate={generateTimetable}
          generating={generating}
        />
      </div>
    </AppLayout>
  );
}
