import { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DailyAnalytic } from '@/hooks/useAnalytics';

interface CalendarHeatmapProps {
  data: DailyAnalytic[];
}

export function CalendarHeatmap({ data }: CalendarHeatmapProps) {
  const heatmapData = useMemo(() => {
    const dataMap = new Map(data.map(d => [d.date, d.total_study_minutes]));
    const today = new Date();
    const days: { date: Date; minutes: number }[] = [];

    // Generate last 12 weeks (84 days)
    for (let i = 83; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        date,
        minutes: dataMap.get(dateStr) || 0,
      });
    }

    return days;
  }, [data]);

  const getColor = (minutes: number) => {
    if (minutes === 0) return 'bg-muted';
    if (minutes < 60) return 'bg-accent/30';
    if (minutes < 120) return 'bg-accent/50';
    if (minutes < 180) return 'bg-accent/70';
    return 'bg-accent';
  };

  const weeks = useMemo(() => {
    const result: typeof heatmapData[] = [];
    for (let i = 0; i < heatmapData.length; i += 7) {
      result.push(heatmapData.slice(i, i + 7));
    }
    return result;
  }, [heatmapData]);

  return (
    <TooltipProvider>
      <div className="space-y-2">
        <div className="flex gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <Tooltip key={dayIndex}>
                  <TooltipTrigger asChild>
                    <div
                      className={`w-3 h-3 rounded-sm transition-colors ${getColor(day.minutes)}`}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm font-medium">
                      {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {day.minutes > 0 ? `${Math.round(day.minutes)} minutes` : 'No study time'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <div className="w-3 h-3 rounded-sm bg-accent/30" />
            <div className="w-3 h-3 rounded-sm bg-accent/50" />
            <div className="w-3 h-3 rounded-sm bg-accent/70" />
            <div className="w-3 h-3 rounded-sm bg-accent" />
          </div>
          <span>More</span>
        </div>
      </div>
    </TooltipProvider>
  );
}