import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Sparkles } from 'lucide-react';

const SUBJECTS = [
  'Current Affairs',
  'History',
  'Geography',
  'Polity',
  'Economics',
  'Science & Tech',
  'Ethics',
];

interface GenerateTimetableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (params: any) => Promise<void>;
  generating: boolean;
}

export function GenerateTimetableDialog({
  open,
  onOpenChange,
  onGenerate,
  generating,
}: GenerateTimetableDialogProps) {
  const [examDate, setExamDate] = useState('');
  const [dailyHours, setDailyHours] = useState(6);
  const [daysToGenerate, setDaysToGenerate] = useState(7);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(SUBJECTS);
  const [preferredSlots, setPreferredSlots] = useState({
    morning: true,
    afternoon: true,
    evening: false,
  });

  const handleGenerate = async () => {
    if (!examDate || selectedSubjects.length === 0) {
      return;
    }

    await onGenerate({
      examDate,
      dailyHours,
      subjects: selectedSubjects,
      preferredSlots,
      daysToGenerate,
    });

    onOpenChange(false);
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Powered Timetable Generator
          </DialogTitle>
          <DialogDescription>
            Let AI create an optimized study schedule based on your preferences and exam timeline
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Exam Date */}
          <div className="space-y-2">
            <Label htmlFor="exam-date">Exam Date *</Label>
            <Input
              id="exam-date"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Daily Hours */}
          <div className="space-y-2">
            <Label htmlFor="daily-hours">Daily Study Hours: {dailyHours} hours</Label>
            <Input
              id="daily-hours"
              type="range"
              min="2"
              max="12"
              step="1"
              value={dailyHours}
              onChange={(e) => setDailyHours(parseInt(e.target.value))}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Recommended: 6-8 hours for optimal retention without burnout
            </p>
          </div>

          {/* Days to Generate */}
          <div className="space-y-2">
            <Label htmlFor="days">Days to Generate</Label>
            <Input
              id="days"
              type="number"
              min="1"
              max="30"
              value={daysToGenerate}
              onChange={(e) => setDaysToGenerate(parseInt(e.target.value))}
            />
          </div>

          {/* Preferred Time Slots */}
          <div className="space-y-2">
            <Label>Preferred Study Time Slots</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="morning"
                  checked={preferredSlots.morning}
                  onCheckedChange={(checked) =>
                    setPreferredSlots((prev) => ({ ...prev, morning: !!checked }))
                  }
                />
                <label htmlFor="morning" className="text-sm cursor-pointer">
                  Morning (6 AM - 12 PM) - Best for difficult subjects
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="afternoon"
                  checked={preferredSlots.afternoon}
                  onCheckedChange={(checked) =>
                    setPreferredSlots((prev) => ({ ...prev, afternoon: !!checked }))
                  }
                />
                <label htmlFor="afternoon" className="text-sm cursor-pointer">
                  Afternoon (12 PM - 5 PM) - Good for practice and revision
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="evening"
                  checked={preferredSlots.evening}
                  onCheckedChange={(checked) =>
                    setPreferredSlots((prev) => ({ ...prev, evening: !!checked }))
                  }
                />
                <label htmlFor="evening" className="text-sm cursor-pointer">
                  Evening (5 PM - 10 PM) - Suitable for lighter subjects
                </label>
              </div>
            </div>
          </div>

          {/* Subjects */}
          <div className="space-y-2">
            <Label>Subjects to Include *</Label>
            <div className="grid grid-cols-2 gap-2">
              {SUBJECTS.map((subject) => (
                <div key={subject} className="flex items-center space-x-2">
                  <Checkbox
                    id={subject}
                    checked={selectedSubjects.includes(subject)}
                    onCheckedChange={() => toggleSubject(subject)}
                  />
                  <label htmlFor={subject} className="text-sm cursor-pointer">
                    {subject}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Selected: {selectedSubjects.length} / {SUBJECTS.length}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!examDate || selectedSubjects.length === 0 || generating}
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Timetable
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
