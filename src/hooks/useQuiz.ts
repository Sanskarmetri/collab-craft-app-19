import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: 'mcq' | 'short_answer' | 'long_answer';
  options?: string[];
  user_answer?: string | number | null;
  is_correct?: boolean | null;
}

export interface QuizAttempt {
  id: string;
  quiz_type: string;
  subject: string;
  questions: QuizQuestion[];
  total_questions: number;
  answered_questions: number;
  score?: number;
  time_taken?: number;
  time_limit: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  started_at: string;
  completed_at?: string;
}

export interface QuizResult {
  score: number;
  correctCount: number;
  totalQuestions: number;
  answeredQuestions: number;
  gradingResults: any[];
  feedback?: any;
}

export function useQuiz() {
  const { user } = useAuth();
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // Auto-save answers to local storage
  useEffect(() => {
    if (currentAttempt) {
      localStorage.setItem(`quiz_${currentAttempt.id}_answers`, JSON.stringify(answers));
    }
  }, [answers, currentAttempt]);

  // Load saved answers
  useEffect(() => {
    if (currentAttempt) {
      const saved = localStorage.getItem(`quiz_${currentAttempt.id}_answers`);
      if (saved) {
        setAnswers(JSON.parse(saved));
      }
    }
  }, [currentAttempt?.id]);

  // Timer countdown
  useEffect(() => {
    if (!currentAttempt || currentAttempt.status !== 'in_progress') return;

    const startTime = new Date(currentAttempt.started_at).getTime();
    const endTime = startTime + (currentAttempt.time_limit * 1000);

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        handleSubmitQuiz();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentAttempt]);

  const startQuiz = async (
    quizType: string,
    subject: string,
    numberOfQuestions = 10,
    difficulty = 'medium'
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { quizType, subject, numberOfQuestions, difficulty }
      });

      if (error) throw error;

      const attempt: QuizAttempt = {
        id: data.attemptId,
        quiz_type: quizType,
        subject,
        questions: data.questions,
        total_questions: data.totalQuestions,
        answered_questions: 0,
        time_limit: data.timeLimit,
        status: 'in_progress',
        started_at: new Date().toISOString()
      };

      setCurrentAttempt(attempt);
      setCurrentQuestionIndex(0);
      setTimeRemaining(data.timeLimit);
      setAnswers({});

      toast.success('Quiz started!');
    } catch (error: any) {
      console.error('Error starting quiz:', error);
      toast.error('Failed to start quiz: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveAnswer = useCallback((questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  }, []);

  const nextQuestion = () => {
    if (currentAttempt && currentQuestionIndex < currentAttempt.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const goToQuestion = (index: number) => {
    if (currentAttempt && index >= 0 && index < currentAttempt.questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const handleSubmitQuiz = async (): Promise<QuizResult | null> => {
    if (!currentAttempt) return null;

    setLoading(true);
    try {
      const startTime = new Date(currentAttempt.started_at).getTime();
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);

      const { data, error } = await supabase.functions.invoke('submit-quiz', {
        body: {
          attemptId: currentAttempt.id,
          answers,
          timeTaken
        }
      });

      if (error) throw error;

      // Clear saved answers
      localStorage.removeItem(`quiz_${currentAttempt.id}_answers`);

      toast.success('Quiz submitted successfully!');
      return data as QuizResult;
    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz: ' + error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizHistory = async (limit = 10): Promise<any[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('quiz_attempts' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching quiz history:', error);
      return [];
    }
  };

  const getQuizDetails = async (attemptId: string): Promise<any> => {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts' as any)
        .select('*')
        .eq('id', attemptId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching quiz details:', error);
      return null;
    }
  };

  const currentQuestion = currentAttempt?.questions[currentQuestionIndex];
  const progress = currentAttempt 
    ? ((currentQuestionIndex + 1) / currentAttempt.total_questions) * 100 
    : 0;
  const answeredCount = Object.keys(answers).length;

  return {
    currentAttempt,
    currentQuestion,
    currentQuestionIndex,
    progress,
    timeRemaining,
    answeredCount,
    answers,
    loading,
    startQuiz,
    saveAnswer,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    submitQuiz: handleSubmitQuiz,
    fetchQuizHistory,
    getQuizDetails
  };
}