import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAchievements } from './useAchievements';

export type SessionStatus = 'idle' | 'active' | 'paused' | 'break' | 'completed';

type SubjectType = 'current_affairs' | 'history' | 'geography' | 'polity' | 'economics' | 'science_tech' | 'ethics';

interface FocusSessionData {
  subject: SubjectType;
  topic: string;
  duration: number;
  notes?: string;
}

export function useFocusSession() {
  const { checkAchievements } = useAchievements();
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [focusTime, setFocusTime] = useState(0);
  const [breakTime, setBreakTime] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [exitAttempts, setExitAttempts] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const startTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
      
      if (status === 'active') {
        setFocusTime((prev) => prev + 1);
      }
    }, 1000);
  }, [status]);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  useEffect(() => {
    if (timeLeft === 0 && status === 'active') {
      completeSession();
    } else if (timeLeft === 0 && status === 'break') {
      setStatus('active');
      toast({
        title: 'Break Over',
        description: 'Time to get back to studying!',
      });
    }
  }, [timeLeft, status]);

  const startSession = useCallback(async (duration: number, data: FocusSessionData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: session, error } = await supabase
        .from('sessions')
        .insert([{
          user_id: user.id,
          subject: data.subject as any,
          topic: data.topic,
          start_ts: new Date().toISOString(),
          notes: data.notes,
        }])
        .select()
        .single();

      if (error) throw error;

      setSessionId(session.id);
      setTotalDuration(duration * 60);
      setTimeLeft(duration * 60);
      setFocusTime(0);
      setBreakTime(0);
      setExitAttempts(0);
      setStatus('active');
      startTimer();

      // Notify browser extension to enable blocking
      window.postMessage({ type: 'FOCUS_START', sessionId: session.id }, '*');

      toast({
        title: 'Focus Session Started',
        description: `Stay focused for ${duration} minutes!`,
      });
    } catch (error) {
      console.error('Failed to start session:', error);
      toast({
        title: 'Error',
        description: 'Failed to start focus session',
        variant: 'destructive',
      });
    }
  }, [startTimer, toast]);

  const pauseSession = useCallback(() => {
    stopTimer();
    setStatus('paused');
    toast({
      title: 'Session Paused',
      description: 'Take a moment, but come back soon!',
    });
  }, [stopTimer, toast]);

  const resumeSession = useCallback(() => {
    setStatus('active');
    startTimer();
  }, [startTimer]);

  const startBreak = useCallback((minutes: number) => {
    stopTimer();
    setStatus('break');
    setTimeLeft(minutes * 60);
    startTimer();
    
    const breakStart = Date.now();
    setBreakTime((prev) => prev + (Date.now() - breakStart) / 1000);
    
    toast({
      title: 'Break Started',
      description: `Relax for ${minutes} minutes`,
    });
  }, [stopTimer, startTimer, toast]);

  const logExitAttempt = useCallback(async () => {
    setExitAttempts((prev) => prev + 1);
    
    if (sessionId) {
      try {
        const { data: session } = await supabase
          .from('sessions')
          .select('notes')
          .eq('id', sessionId)
          .single();

        const currentNotes = session?.notes || '';
        const timestamp = new Date().toISOString();
        await supabase
          .from('sessions')
          .update({
            notes: `${currentNotes}\n[${timestamp}] Exit attempt logged`
          })
          .eq('id', sessionId);
      } catch (error) {
        console.error('Failed to log exit attempt:', error);
      }
    }
  }, [sessionId]);

  const completeSession = useCallback(async () => {
    stopTimer();
    
    if (sessionId) {
      try {
        await supabase
          .from('sessions')
          .update({
            end_ts: new Date().toISOString(),
            focus_time: Math.floor(focusTime / 60),
          })
          .eq('id', sessionId);

        // Update daily analytics
        const today = new Date().toISOString().split('T')[0];
        const { data: analytics } = await supabase
          .from('analytics')
          .select('*')
          .eq('date', today)
          .single();

        if (analytics) {
          await supabase
            .from('analytics')
            .update({
              sessions_completed: (analytics.sessions_completed || 0) + 1,
              total_focus_minutes: (analytics.total_focus_minutes || 0) + Math.floor(focusTime / 60),
            })
            .eq('date', today);
        } else {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('analytics').insert({
              user_id: user.id,
              date: today,
              sessions_completed: 1,
              total_focus_minutes: Math.floor(focusTime / 60),
            });
          }
        }

        window.postMessage({ type: 'FOCUS_END' }, '*');

        toast({
          title: 'Session Completed!',
          description: `Great work! You focused for ${Math.floor(focusTime / 60)} minutes.`,
        });
        
        // Check for achievements
        checkAchievements('session_complete');
      } catch (error) {
        console.error('Failed to complete session:', error);
      }
    }

    setStatus('completed');
    setSessionId(null);
  }, [stopTimer, sessionId, focusTime, toast]);

  const cancelSession = useCallback(async () => {
    stopTimer();
    
    if (sessionId) {
      try {
        await supabase
          .from('sessions')
          .delete()
          .eq('id', sessionId);
      } catch (error) {
        console.error('Failed to delete session:', error);
      }
    }

    window.postMessage({ type: 'FOCUS_END' }, '*');
    setStatus('idle');
    setSessionId(null);
    setExitAttempts(0);
  }, [stopTimer, sessionId]);

  return {
    status,
    timeLeft,
    totalDuration,
    focusTime,
    exitAttempts,
    startSession,
    pauseSession,
    resumeSession,
    startBreak,
    completeSession,
    cancelSession,
    logExitAttempt,
  };
}
