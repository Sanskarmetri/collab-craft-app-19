import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAchievements } from './useAchievements';
import { useAuth } from './useAuth';

export type SessionStatus = 'idle' | 'active' | 'paused' | 'break' | 'completed';

type SubjectType = 'current_affairs' | 'history' | 'geography' | 'polity' | 'economics' | 'science_tech' | 'ethics';

interface FocusSessionData {
  subject: SubjectType;
  topic: string;
  duration: number;
  notes?: string;
}

export function useFocusSession() {
  const { user } = useAuth();
  const { checkAchievements } = useAchievements();
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [focusTime, setFocusTime] = useState(0);
  const [breakTime, setBreakTime] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [exitAttempts, setExitAttempts] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusRef = useRef<SessionStatus>('idle');
  const storageKey = user ? `studybyself.focus.${user.id}` : null;
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
      
      if (statusRef.current === 'active') {
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
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        status?: SessionStatus;
        timeLeft?: number;
        totalDuration?: number;
        focusTime?: number;
        breakTime?: number;
        sessionId?: string;
        exitAttempts?: number;
        savedAt?: number;
      };
      if (!saved.sessionId || !saved.status || saved.status === 'idle' || saved.status === 'completed') return;
      const elapsed = saved.status === 'active' && saved.savedAt
        ? Math.floor((Date.now() - saved.savedAt) / 1000)
        : 0;
      setSessionId(saved.sessionId);
      setTotalDuration(saved.totalDuration || 0);
      setTimeLeft(Math.max(0, (saved.timeLeft || 0) - elapsed));
      setFocusTime((saved.focusTime || 0) + elapsed);
      setBreakTime(saved.breakTime || 0);
      setExitAttempts(saved.exitAttempts || 0);
      setStatus(saved.status);
      statusRef.current = saved.status;
      if (saved.status === 'active' || saved.status === 'break') startTimer();
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey, startTimer]);

  useEffect(() => {
    if (!storageKey) return;
    if (status === 'idle' || status === 'completed') {
      localStorage.removeItem(storageKey);
      return;
    }
    localStorage.setItem(storageKey, JSON.stringify({
      status, timeLeft, totalDuration, focusTime, breakTime, sessionId, exitAttempts, savedAt: Date.now(),
    }));
  }, [storageKey, status, timeLeft, totalDuration, focusTime, breakTime, sessionId, exitAttempts]);

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
          notes: data.notes,
          planned_duration: duration,
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
      statusRef.current = 'active';
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
    statusRef.current = 'paused';
    setStatus('paused');
    toast({
      title: 'Session Paused',
      description: 'Take a moment, but come back soon!',
    });
  }, [stopTimer, toast]);

  const resumeSession = useCallback(() => {
    statusRef.current = 'active';
    setStatus('active');
    startTimer();
  }, [startTimer]);

  const startBreak = useCallback((minutes: number) => {
    stopTimer();
    statusRef.current = 'break';
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
        const { error } = await supabase.functions.invoke('complete-focus-session', {
          body: { sessionId },
        });
        if (error) throw error;

        window.postMessage({ type: 'FOCUS_END' }, '*');

        toast({
          title: 'Session Completed!',
          description: `Great work! You focused for ${Math.floor(focusTime / 60)} minutes.`,
        });
        
        // Check for achievements
        checkAchievements('session_complete');
      } catch (error) {
        console.error('Failed to complete session:', error);
        statusRef.current = 'paused';
        setStatus('paused');
        toast({
          title: 'Session could not be verified',
          description: 'Resume the timer to retry completing this session.',
          variant: 'destructive',
        });
        return;
      }
    }

    setStatus('completed');
    setSessionId(null);
  }, [stopTimer, sessionId, focusTime, toast, user, checkAchievements]);

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
    statusRef.current = 'idle';
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
