import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, TrendingUp, BookOpen } from 'lucide-react';
import { QuizResult } from '@/hooks/useQuiz';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface QuizResultsProps {
  result: QuizResult;
  onNewQuiz: () => void;
}

export default function QuizResults({ result, onNewQuiz }: QuizResultsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-accent';
    if (score >= 50) return 'text-yellow-500';
    return 'text-destructive';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: 'Excellent', variant: 'default' as const };
    if (score >= 75) return { label: 'Very Good', variant: 'default' as const };
    if (score >= 60) return { label: 'Good', variant: 'secondary' as const };
    if (score >= 50) return { label: 'Average', variant: 'secondary' as const };
    return { label: 'Needs Improvement', variant: 'destructive' as const };
  };

  const badge = getScoreBadge(result.score);

  return (
    <div className="space-y-6">
      {/* Score Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold mb-2">
            <span className={getScoreColor(result.score)}>
              {result.score.toFixed(1)}%
            </span>
          </CardTitle>
          <CardDescription className="flex items-center justify-center gap-2">
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-accent">{result.correctCount}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-destructive">
                  {result.totalQuestions - result.correctCount}
                </div>
                <div className="text-sm text-muted-foreground">Incorrect</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-muted-foreground">
                  {result.totalQuestions - result.answeredQuestions}
                </div>
                <div className="text-sm text-muted-foreground">Unanswered</div>
              </div>
            </div>
            <Progress value={(result.correctCount / result.totalQuestions) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Feedback Card */}
      {result.feedback && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Performance Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Summary</h4>
              <p className="text-muted-foreground">{result.feedback.summary}</p>
            </div>

            {result.feedback.weak_areas && result.feedback.weak_areas.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Areas to Focus On
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.feedback.weak_areas.map((area: string, idx: number) => (
                    <Badge key={idx} variant="outline">{area}</Badge>
                  ))}
                </div>
              </div>
            )}

            {result.feedback.recommendations && result.feedback.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Recommendations
                </h4>
                <ul className="space-y-1">
                  {result.feedback.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.feedback.next_steps && result.feedback.next_steps.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Next Steps</h4>
                <ul className="space-y-1">
                  {result.feedback.next_steps.map((step: string, idx: number) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-accent font-bold">{idx + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detailed Results */}
      <Card>
        <CardHeader>
          <CardTitle>Question-wise Analysis</CardTitle>
          <CardDescription>Review your answers and explanations</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {result.gradingResults.map((item: any, idx: number) => (
              <AccordionItem key={idx} value={`item-${idx}`}>
                <AccordionTrigger>
                  <div className="flex items-center gap-3 text-left">
                    {item.is_correct ? (
                      <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                    )}
                    <span className="line-clamp-1">Question {idx + 1}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div>
                    <h5 className="font-semibold mb-2">{item.question_text}</h5>
                  </div>

                  {item.question_type === 'mcq' && (
                    <>
                      <div>
                        <span className="text-sm font-medium">Your Answer: </span>
                        <span className={item.is_correct ? 'text-accent' : 'text-destructive'}>
                          {item.options[item.user_answer]}
                        </span>
                      </div>
                      {!item.is_correct && (
                        <div>
                          <span className="text-sm font-medium">Correct Answer: </span>
                          <span className="text-accent">{item.options[item.correct_answer]}</span>
                        </div>
                      )}
                      {item.explanation && (
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-sm font-medium mb-1">Explanation:</p>
                          <p className="text-sm text-muted-foreground">{item.explanation}</p>
                        </div>
                      )}
                    </>
                  )}

                  {(item.question_type === 'short_answer' || item.question_type === 'long_answer') && (
                    <>
                      {item.ai_grading && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Score:</span>
                            <Badge>{item.ai_grading.score}/10</Badge>
                          </div>
                          <div className="bg-muted p-3 rounded-md space-y-2">
                            <div>
                              <p className="text-sm font-medium">Content Feedback:</p>
                              <p className="text-sm text-muted-foreground">{item.ai_grading.content_feedback}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Structure Feedback:</p>
                              <p className="text-sm text-muted-foreground">{item.ai_grading.structure_feedback}</p>
                            </div>
                            {item.ai_grading.improvements && item.ai_grading.improvements.length > 0 && (
                              <div>
                                <p className="text-sm font-medium">Improvements:</p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground">
                                  {item.ai_grading.improvements.map((imp: string, i: number) => (
                                    <li key={i}>{imp}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div>
        <Button onClick={onNewQuiz} className="w-full">
          Take Another Quiz
        </Button>
      </div>
    </div>
  );
}