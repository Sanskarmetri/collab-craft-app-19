import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight, 
  Timer, 
  BookOpen,
  TrendingUp 
} from 'lucide-react';
import { useQuiz, QuizResult } from '@/hooks/useQuiz';
import QuizQuestion from '@/components/quiz/QuizQuestion';
import QuizResults from '@/components/quiz/QuizResults';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
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

const quizTypes = [
  { 
    type: 'daily',
    title: 'Daily Quiz', 
    description: 'Quick 10-question daily practice', 
    duration: '10 min',
    questions: 10
  },
  { 
    type: 'topic',
    title: 'Topic Quiz', 
    description: 'Deep dive into specific topics', 
    duration: '20 min',
    questions: 20
  },
  { 
    type: 'full_mock',
    title: 'Full Mock Test', 
    description: 'Complete UPSC prelims simulation', 
    duration: '2 hours',
    questions: 100
  },
];

const subjects = [
  { value: 'polity', label: 'Polity' },
  { value: 'history', label: 'History' },
  { value: 'geography', label: 'Geography' },
  { value: 'economics', label: 'Economics' },
  { value: 'science_tech', label: 'Science & Technology' },
  { value: 'current_affairs', label: 'Current Affairs' },
  { value: 'ethics', label: 'Ethics' },
];

export default function Quiz() {
  const location = useLocation();
  const quiz = useQuiz();
  const [selectedQuizType, setSelectedQuizType] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('medium');
  const [quizHistory, setQuizHistory] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  useEffect(() => {
    loadQuizHistory();
  }, []);

  // Handle news quiz navigation state
  useEffect(() => {
    const state = location.state as any;
    if (state?.newsQuizAttempt) {
      const data = state.newsQuizAttempt;
      quiz.startQuiz('daily', 'current_affairs', data.totalQuestions).catch(() => {});
      // Clear location state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const loadQuizHistory = async () => {
    const history = await quiz.fetchQuizHistory(5);
    setQuizHistory(history);
  };

  const handleStartQuiz = async (type: string) => {
    if (!selectedSubject) {
      return;
    }

    const quizConfig = quizTypes.find(q => q.type === type);
    if (!quizConfig) return;

    await quiz.startQuiz(
      type,
      selectedSubject,
      quizConfig.questions,
      selectedDifficulty
    );
  };

  const handleSubmitQuiz = async () => {
    const result = await quiz.submitQuiz();
    if (result) {
      setQuizResult(result);
      setShowResults(true);
      loadQuizHistory();
    }
    setShowSubmitDialog(false);
  };

  const handleNewQuiz = () => {
    setShowResults(false);
    setQuizResult(null);
    setSelectedQuizType('');
    setSelectedSubject('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Quiz selection screen
  if (!quiz.currentAttempt && !showResults) {

    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Quiz Center</h1>
            <p className="text-muted-foreground">Test your knowledge and track progress</p>
          </div>

          {/* Subject Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Subject</CardTitle>
              <CardDescription>Choose the subject you want to practice</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {subjects.map((subject) => (
                  <Button
                    key={subject.value}
                    variant={selectedSubject === subject.value ? 'default' : 'outline'}
                    onClick={() => setSelectedSubject(subject.value)}
                    className="h-auto py-4"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    {subject.label}
                  </Button>
                ))}
              </div>

              {selectedSubject && (
                <div className="mt-4">
                  <label className="text-sm font-medium mb-2 block">Difficulty Level</label>
                  <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quiz Types */}
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            {quizTypes.map((type) => (
              <Card 
                key={type.type}
                className={`cursor-pointer transition-all ${
                  !selectedSubject ? 'opacity-50' : 'hover:border-primary'
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{type.title}</CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {type.duration}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {type.questions} questions
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleStartQuiz(type.type)}
                      disabled={!selectedSubject || quiz.loading}
                    >
                      {quiz.loading ? 'Starting...' : 'Start'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quiz History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Quizzes</CardTitle>
              <CardDescription>Your quiz history and performance</CardDescription>
            </CardHeader>
            <CardContent>
              {quizHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No quiz history yet. Start your first quiz above!
                </p>
              ) : (
                <div className="space-y-3">
                  {quizHistory.map((attempt) => (
                    <div 
                      key={attempt.id} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {quizTypes.find(q => q.type === attempt.quiz_type)?.title || attempt.quiz_type} - {attempt.subject}
                          {attempt.score >= 75 && (
                            <Badge variant="default">Excellent</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Completed {attempt.completed_at ? format(new Date(attempt.completed_at), 'MMM dd, yyyy') : 'N/A'}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-lg font-bold text-accent">{attempt.score?.toFixed(1)}%</div>
                          <div className="text-xs text-muted-foreground">
                            {attempt.answered_questions}/{attempt.total_questions} answered
                          </div>
                        </div>
                        <CheckCircle className="h-5 w-5 text-accent" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Show results screen
  if (showResults && quizResult) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" onClick={handleNewQuiz}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quizzes
            </Button>
          </div>
          <QuizResults 
            result={quizResult}
            onNewQuiz={handleNewQuiz}
            onReviewAnswers={() => {
              // TODO: Implement review mode
            }}
          />
        </div>
      </AppLayout>
    );
  }

  // Quiz in progress
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header with timer and progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">
                {quizTypes.find(q => q.type === quiz.currentAttempt?.quiz_type)?.title || 'Quiz'}
              </h2>
              <p className="text-sm text-muted-foreground capitalize">
                {quiz.currentAttempt?.subject}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Timer className="h-5 w-5 text-primary" />
                <span className={quiz.timeRemaining < 60 ? 'text-destructive' : ''}>
                  {formatTime(quiz.timeRemaining)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Time Remaining</p>
            </div>
          </div>

          <Progress value={quiz.progress} className="mb-2" />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Question {quiz.currentQuestionIndex + 1} of {quiz.currentAttempt?.total_questions}
            </span>
            <span>
              {quiz.answeredCount} answered
            </span>
          </div>
        </div>

        {/* Question */}
        {quiz.currentQuestion && (
          <div className="mb-6">
            <QuizQuestion
              question={quiz.currentQuestion}
              answer={quiz.answers[quiz.currentQuestion.id]}
              onAnswerChange={(answer) => quiz.saveAnswer(quiz.currentQuestion!.id, answer)}
              questionNumber={quiz.currentQuestionIndex + 1}
            />
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mb-6">
          <Button
            variant="outline"
            onClick={quiz.previousQuestion}
            disabled={quiz.currentQuestionIndex === 0}
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button
            onClick={quiz.nextQuestion}
            disabled={
              quiz.currentQuestionIndex === (quiz.currentAttempt?.total_questions || 0) - 1
            }
            className="flex-1"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Question navigator */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Question Navigator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-10 gap-2">
              {quiz.currentAttempt?.questions.map((q, idx) => (
                <Button
                  key={idx}
                  variant={
                    idx === quiz.currentQuestionIndex
                      ? 'default'
                      : quiz.answers[q.id] !== undefined && quiz.answers[q.id] !== null
                      ? 'secondary'
                      : 'outline'
                  }
                  size="sm"
                  onClick={() => quiz.goToQuestion(idx)}
                  className="h-8 w-8 p-0"
                >
                  {idx + 1}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-primary" />
                <span>Current</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-secondary" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded border-2" />
                <span>Not Answered</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit button */}
        <Button
          onClick={() => setShowSubmitDialog(true)}
          className="w-full"
          size="lg"
        >
          Submit Quiz
        </Button>

        {/* Submit confirmation dialog */}
        <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
              <AlertDialogDescription>
                You have answered {quiz.answeredCount} out of {quiz.currentAttempt?.total_questions} questions.
                {quiz.answeredCount < (quiz.currentAttempt?.total_questions || 0) && (
                  <span className="block mt-2 text-yellow-600">
                    Warning: You have {(quiz.currentAttempt?.total_questions || 0) - quiz.answeredCount} unanswered questions.
                  </span>
                )}
                <br />
                Are you sure you want to submit?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSubmitQuiz} disabled={quiz.loading}>
                {quiz.loading ? 'Submitting...' : 'Submit'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
