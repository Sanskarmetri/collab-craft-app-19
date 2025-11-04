import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle } from 'lucide-react';

const quizTypes = [
  { title: 'Daily Quiz', description: 'Quick 10-question daily practice', duration: '10 min' },
  { title: 'Topic Quiz', description: 'Deep dive into specific topics', duration: '20 min' },
  { title: 'Full Mock Test', description: 'Complete UPSC prelims simulation', duration: '2 hours' },
];

const mockQuestion = {
  question: 'Which of the following is the primary function of the Reserve Bank of India?',
  options: [
    'Fiscal policy formulation',
    'Monetary policy implementation',
    'Direct taxation',
    'Public expenditure management',
  ],
  correct: 1,
};

export default function Quiz() {
  const [quizStarted, setQuizStarted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [currentQuestion] = useState(1);
  const [totalQuestions] = useState(10);

  if (!quizStarted) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Quiz Center</h1>
            <p className="text-muted-foreground">Test your knowledge and track progress</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-6">
            {quizTypes.map((type, idx) => (
              <Card key={idx} className="cursor-pointer hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">{type.title}</CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      <Clock className="inline h-4 w-4 mr-1" />
                      {type.duration}
                    </span>
                    <Button size="sm" onClick={() => setQuizStarted(true)}>
                      Start
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Quizzes</CardTitle>
              <CardDescription>Your quiz history and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((_, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Daily Quiz - Economics</div>
                      <div className="text-sm text-muted-foreground">Completed 2 hours ago</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-accent">85%</span>
                      <CheckCircle className="h-5 w-5 text-accent" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">Daily Quiz - Economics</h2>
            <span className="text-sm text-muted-foreground">
              <Clock className="inline h-4 w-4 mr-1" />
              08:45
            </span>
          </div>
          <Progress value={(currentQuestion / totalQuestions) * 100} />
          <p className="text-sm text-muted-foreground mt-2">
            Question {currentQuestion} of {totalQuestions}
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-normal">{mockQuestion.question}</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
              <div className="space-y-3">
                {mockQuestion.options.map((option, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                    <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1">
            Previous
          </Button>
          <Button className="flex-1">
            Next Question
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
