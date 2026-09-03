import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type ResourceType = 'pyq' | 'ncert' | 'improve';

export interface ResourceProgressRow {
  id: string;
  resource_type: ResourceType;
  subject: string;
  title: string;
  created_at: string;
}

export const progressKey = (type: ResourceType, subject: string, title: string) =>
  `${type}::${subject}::${title}`;

export function useResourceProgress() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ResourceProgressRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRows = useCallback(async () => {
    if (!user) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('resource_progress')
      .select('id, resource_type, subject, title, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error) setRows((data ?? []) as ResourceProgressRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const covered = new Set(rows.map((r) => progressKey(r.resource_type, r.subject, r.title)));

  const toggle = useCallback(
    async (type: ResourceType, subject: string, title: string) => {
      if (!user) return false;
      const existing = rows.find(
        (r) => r.resource_type === type && r.subject === subject && r.title === title,
      );
      if (existing) {
        setRows((prev) => prev.filter((r) => r.id !== existing.id));
        const { error } = await supabase.from('resource_progress').delete().eq('id', existing.id);
        if (error) await fetchRows();
        return false;
      }
      const { data, error } = await supabase
        .from('resource_progress')
        .insert({ user_id: user.id, resource_type: type, subject, title })
        .select('id, resource_type, subject, title, created_at')
        .single();
      if (error) {
        await fetchRows();
        return false;
      }
      setRows((prev) => [data as ResourceProgressRow, ...prev]);
      return true;
    },
    [user, rows, fetchRows],
  );

  const counts = rows.reduce(
    (acc, r) => {
      acc[r.resource_type] = (acc[r.resource_type] ?? 0) + 1;
      return acc;
    },
    { pyq: 0, ncert: 0, improve: 0 } as Record<ResourceType, number>,
  );

  const bySubject = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.subject] = (acc[r.subject] ?? 0) + 1;
    return acc;
  }, {});

  return { rows, loading, covered, toggle, counts, bySubject, refetch: fetchRows, isAuthed: !!user };
}
