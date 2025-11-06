import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuizQuestion as QuizQuestionType } from '@/hooks/useQuiz';

interface QuizQuestionProps {
  question: QuizQuestionType;
  answer: any;
  onAnswerChange: (answer: any) => void;
  questionNumber: number;
}

export default function QuizQuestion({ 
  question, 
  answer, 
  onAnswerChange, 
  questionNumber 
}: QuizQuestionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-normal">
          <span className="font-semibold text-primary">Question {questionNumber}:</span> {question.question_text}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {question.question_type === 'mcq' && question.options ? (
          <RadioGroup 
            value={answer?.toString()} 
            onValueChange={(value) => onAnswerChange(parseInt(value))}
          >
            <div className="space-y-3">
              {question.options.map((option, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                  <Label 
                    htmlFor={`option-${idx}`} 
                    className="flex-1 cursor-pointer py-2 px-3 rounded-md hover:bg-muted transition-colors"
                  >
                    <span className="font-medium text-muted-foreground mr-2">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        ) : question.question_type === 'short_answer' ? (
          <Textarea
            value={answer || ''}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="Type your answer here (150-200 words)..."
            className="min-h-[150px]"
          />
        ) : question.question_type === 'long_answer' ? (
          <Textarea
            value={answer || ''}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="Type your answer here (250-300 words)..."
            className="min-h-[300px]"
          />
        ) : null}
      </CardContent>
    </Card>
  );
}