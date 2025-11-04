import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, Square, Coffee } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [quote] = useState(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((selectedPreset * 60 - timeLeft) / (selectedPreset * 60)) * 100;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">Focus Mode</h1>
          <p className="text-muted-foreground">Stay focused and build consistency</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center">Choose Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 justify-center">
              {presets.map(preset => (
                <Button
                  key={preset.value}
                  variant={selectedPreset === preset.value ? 'default' : 'outline'}
                  onClick={() => {
                    setSelectedPreset(preset.value);
                    setTimeLeft(preset.value * 60);
                    setIsActive(false);
                  }}
                  disabled={isActive}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <div className="text-6xl font-bold mb-4">
                {formatTime(timeLeft)}
              </div>
              <Progress value={progress} className="mb-4" />
            </div>

            <div className="flex gap-2 justify-center">
              {!isActive ? (
                <Button size="lg" onClick={() => setIsActive(true)}>
                  <Play className="mr-2 h-5 w-5" />
                  Start Focus
                </Button>
              ) : (
                <>
                  <Button size="lg" variant="outline" onClick={() => setIsActive(false)}>
                    <Pause className="mr-2 h-5 w-5" />
                    Pause
                  </Button>
                  <Button size="lg" variant="destructive" onClick={() => {
                    setIsActive(false);
                    setTimeLeft(selectedPreset * 60);
                  }}>
                    <Square className="mr-2 h-5 w-5" />
                    End
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {isActive && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm">Take a Break?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Coffee className="mr-2 h-4 w-4" />
                  5 min break
                </Button>
                <Button variant="outline" size="sm">
                  <Coffee className="mr-2 h-4 w-4" />
                  10 min break
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Today's Focus Stats</CardTitle>
            <CardDescription>Your focused study time for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-muted-foreground">Sessions</div>
              </div>
              <div>
                <div className="text-2xl font-bold">0m</div>
                <div className="text-xs text-muted-foreground">Total Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-muted-foreground">Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm italic text-muted-foreground">"{quote}"</p>
        </div>
      </div>
    </AppLayout>
  );
}
