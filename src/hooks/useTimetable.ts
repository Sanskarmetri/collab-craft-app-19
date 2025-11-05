import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type DbTimetableItem = Database['public']['Tables']['timetable_items']['Row'];

export type TimetableItem = DbTimetableItem & {
  metadata?: {
    start_time?: string;
    priority?: 'low' | 'medium' | 'high';
    session_type?: 'new_topic' | 'revision' | 'practice' | 'mock_test';
    rescheduled?: boolean;
    original_date?: string;
  } | null;
};

export function useTimetable() {
  const [items, setItems] = useState<TimetableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const fetchTimetable = async (startDate?: Date, endDate?: Date) => {
    try {
      setLoading(true);
      let query = supabase
        .from('timetable_items')
        .select('*')
        .order('date', { ascending: true })
        .order('created_at', { ascending: true });

      if (startDate) {
        query = query.gte('date', startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        query = query.lte('date', endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;
      setItems((data || []) as TimetableItem[]);
    } catch (error) {
      console.error('Error fetching timetable:', error);
      toast({
        title: 'Error',
        description: 'Failed to load timetable',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTimetable = async (params: {
    examDate: string;
    dailyHours: number;
    subjects: string[];
    preferredSlots: { morning: boolean; afternoon: boolean; evening: boolean };
    daysToGenerate?: number;
  }) => {
    try {
      setGenerating(true);
      const { data, error } = await supabase.functions.invoke('generate-timetable', {
        body: params,
      });

      if (error) throw error;

      toast({
        title: 'Success!',
        description: data.message || 'Timetable generated successfully',
      });

      // Refresh the timetable
      await fetchTimetable();
      
      return data.items;
    } catch (error: any) {
      console.error('Error generating timetable:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate timetable',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setGenerating(false);
    }
  };

  const rescheduleSession = async (sessionId: string, newDate: string, newTime?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('reschedule-session', {
        body: { sessionId, newDate, newTime },
      });

      if (error) throw error;

      toast({
        title: 'Rescheduled',
        description: data.message || 'Session rescheduled successfully',
      });

      await fetchTimetable();
      return data.session;
    } catch (error: any) {
      toast({
        title: 'Reschedule Failed',
        description: error.message || 'Failed to reschedule session',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateSessionStatus = async (
    sessionId: string,
    status: 'planned' | 'in_progress' | 'completed' | 'missed'
  ) => {
    try {
      const { error } = await supabase
        .from('timetable_items')
        .update({ status })
        .eq('id', sessionId);

      if (error) throw error;

      await fetchTimetable();
    } catch (error) {
      console.error('Error updating session status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update session status',
        variant: 'destructive',
      });
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('timetable_items')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: 'Deleted',
        description: 'Session deleted successfully',
      });

      await fetchTimetable();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete session',
        variant: 'destructive',
      });
    }
  };

  const addSession = async (session: {
    date: string;
    subject: 'current_affairs' | 'history' | 'geography' | 'polity' | 'economics' | 'science_tech' | 'ethics';
    topic: string;
    planned_duration: number;
    metadata?: any;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('timetable_items')
        .insert([{ ...session, user_id: user.id, status: 'planned' as const }]);

      if (error) throw error;

      toast({
        title: 'Added',
        description: 'Session added successfully',
      });

      await fetchTimetable();
    } catch (error) {
      console.error('Error adding session:', error);
      toast({
        title: 'Error',
        description: 'Failed to add session',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  return {
    items,
    loading,
    generating,
    fetchTimetable,
    generateTimetable,
    rescheduleSession,
    updateSessionStatus,
    deleteSession,
    addSession,
  };
}
