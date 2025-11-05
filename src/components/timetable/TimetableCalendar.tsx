import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Edit2, Trash2, Play } from 'lucide-react';
import { TimetableItem } from '@/hooks/useTimetable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TimetableCalendarProps {
  items: TimetableItem[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onStartSession: (item: TimetableItem) => void;
  onReschedule: (item: TimetableItem) => void;
  onDelete: (id: string) => void;
}

const STATUS_COLORS = {
  planned: 'secondary',
  in_progress: 'default',
  completed: 'outline',
  missed: 'destructive',
} as const;

const PRIORITY_COLORS = {
  low: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  high: 'bg-red-500/10 text-red-700 dark:text-red-400',
};

export function TimetableCalendar({
  items,
  selectedDate,
  onStartSession,
  onReschedule,
  onDelete,
}: TimetableCalendarProps) {
  const todayItems = items.filter(
    (item) => item.date === selectedDate.toISOString().split('T')[0]
  );

  const sortedItems = [...todayItems].sort((a, b) => {
    const timeA = a.metadata?.start_time || '00:00';
    const timeB = b.metadata?.start_time || '00:00';
    return timeA.localeCompare(timeB);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Today's Schedule
        </CardTitle>
        <CardDescription>
          {selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sortedItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No sessions scheduled for this day</p>
            <p className="text-sm mt-2">Click "Add Session" or generate an AI timetable</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="text-sm font-medium text-muted-foreground w-20 pt-1">
                    {item.metadata?.start_time || '—'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold truncate">{item.subject}</span>
                      {item.metadata?.priority && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            PRIORITY_COLORS[item.metadata.priority]
                          }`}
                        >
                          {item.metadata.priority}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">{item.topic}</div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.planned_duration} min
                      </span>
                      {item.metadata?.session_type && (
                        <span className="capitalize">{item.metadata.session_type.replace('_', ' ')}</span>
                      )}
                      {item.metadata?.rescheduled && (
                        <Badge variant="outline" className="text-xs">
                          Rescheduled
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_COLORS[item.status]}>{item.status.replace('_', ' ')}</Badge>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        ⋮
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {item.status === 'planned' && (
                        <DropdownMenuItem onClick={() => onStartSession(item)}>
                          <Play className="mr-2 h-4 w-4" />
                          Start Session
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onReschedule(item)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Reschedule
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(item.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
