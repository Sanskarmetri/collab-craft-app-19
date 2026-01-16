import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { TimetableItem } from '@/hooks/useTimetable';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Clock, CheckCircle2 } from 'lucide-react';

interface WeeklyTimetableViewProps {
  items: TimetableItem[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
}

const SUBJECT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  history: { bg: 'bg-amber-500/15', border: 'border-l-amber-500', text: 'text-amber-700 dark:text-amber-400' },
  geography: { bg: 'bg-emerald-500/15', border: 'border-l-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' },
  polity: { bg: 'bg-blue-500/15', border: 'border-l-blue-500', text: 'text-blue-700 dark:text-blue-400' },
  economics: { bg: 'bg-purple-500/15', border: 'border-l-purple-500', text: 'text-purple-700 dark:text-purple-400' },
  science_tech: { bg: 'bg-cyan-500/15', border: 'border-l-cyan-500', text: 'text-cyan-700 dark:text-cyan-400' },
  ethics: { bg: 'bg-rose-500/15', border: 'border-l-rose-500', text: 'text-rose-700 dark:text-rose-400' },
  current_affairs: { bg: 'bg-orange-500/15', border: 'border-l-orange-500', text: 'text-orange-700 dark:text-orange-400' },
};

const getSubjectColor = (subject: string) => {
  const key = subject.toLowerCase().replace(/[^a-z_]/g, '_');
  return SUBJECT_COLORS[key] || { bg: 'bg-muted', border: 'border-l-muted-foreground', text: 'text-muted-foreground' };
};

const formatSubjectName = (subject: string) => {
  return subject
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

export function WeeklyTimetableView({
  items,
  selectedDate,
  onDateChange,
  onToggleComplete,
}: WeeklyTimetableViewProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const itemsByDate = useMemo(() => {
    const grouped: Record<string, TimetableItem[]> = {};
    items.forEach((item) => {
      if (!grouped[item.date]) grouped[item.date] = [];
      grouped[item.date].push(item);
    });
    // Sort each day's items by start_time
    Object.values(grouped).forEach((dayItems) => {
      dayItems.sort((a, b) => {
        const timeA = a.metadata?.start_time || '00:00';
        const timeB = b.metadata?.start_time || '00:00';
        return timeA.localeCompare(timeB);
      });
    });
    return grouped;
  }, [items]);

  const handleToggle = (item: TimetableItem) => {
    const isCompleted = item.status === 'completed';
    onToggleComplete(item.id, !isCompleted);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          Week of {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Subject Legend */}
        <div className="px-4 pb-3 flex flex-wrap gap-2 border-b">
          {Object.entries(SUBJECT_COLORS).map(([key, colors]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs">
              <div className={cn('w-3 h-3 rounded-sm', colors.bg, 'border-l-2', colors.border)} />
              <span className={colors.text}>{formatSubjectName(key)}</span>
            </div>
          ))}
        </div>

        {/* Weekly Grid */}
        <div className="grid grid-cols-7 divide-x">
          {weekDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayItems = itemsByDate[dateStr] || [];
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDate);

            return (
              <div
                key={dateStr}
                className={cn(
                  'min-h-[200px] flex flex-col',
                  isSelected && 'bg-accent/30'
                )}
              >
                {/* Day Header */}
                <button
                  onClick={() => onDateChange(day)}
                  className={cn(
                    'p-2 text-center border-b hover:bg-accent/50 transition-colors',
                    isToday && 'bg-primary/10'
                  )}
                >
                  <div className="text-xs text-muted-foreground uppercase">
                    {format(day, 'EEE')}
                  </div>
                  <div
                    className={cn(
                      'text-lg font-semibold',
                      isToday && 'text-primary'
                    )}
                  >
                    {format(day, 'd')}
                  </div>
                </button>

                {/* Day Items */}
                <div className="flex-1 p-1 space-y-1 overflow-y-auto max-h-[300px]">
                  {dayItems.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-4">
                      No sessions
                    </div>
                  ) : (
                    dayItems.map((item) => {
                      const colors = getSubjectColor(item.subject);
                      const isCompleted = item.status === 'completed';

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            'p-2 rounded-md border-l-4 transition-all cursor-pointer hover:shadow-sm',
                            colors.bg,
                            colors.border,
                            isCompleted && 'opacity-60'
                          )}
                          onClick={() => handleToggle(item)}
                        >
                          <div className="flex items-start gap-1.5">
                            <Checkbox
                              checked={isCompleted}
                              onCheckedChange={() => handleToggle(item)}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div
                                className={cn(
                                  'text-xs font-medium truncate',
                                  colors.text,
                                  isCompleted && 'line-through'
                                )}
                              >
                                {formatSubjectName(item.subject)}
                              </div>
                              <div
                                className={cn(
                                  'text-[10px] text-muted-foreground truncate',
                                  isCompleted && 'line-through'
                                )}
                              >
                                {item.topic}
                              </div>
                              <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                                <Clock className="h-2.5 w-2.5" />
                                {item.metadata?.start_time || '—'}
                                <span>·</span>
                                {item.planned_duration}m
                              </div>
                            </div>
                          </div>
                          {isCompleted && (
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-600">
                              <CheckCircle2 className="h-3 w-3" />
                              Done
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
