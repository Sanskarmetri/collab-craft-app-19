import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  criteria: Record<string, number>;
}

export interface UserAchievement {
  id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement: Achievement;
}

export function useAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAchievements = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch all achievements
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('xp_reward', { ascending: true });

      if (achievementsError) throw achievementsError;

      // Fetch user's unlocked achievements
      const { data: unlocked, error: unlockedError } = await supabase
        .from('user_achievements')
        .select('*, achievement:achievements(*)')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });

      if (unlockedError) throw unlockedError;

      setAchievements((allAchievements || []).map(a => ({
        ...a,
        criteria: a.criteria as Record<string, number>
      })));
      setUserAchievements(unlocked as any || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      toast.error('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const checkAchievements = useCallback(async (triggerType: string = 'manual') => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('check-achievements', {
        body: { triggerType }
      });

      if (error) throw error;

      if (data?.newAchievements?.length > 0) {
        data.newAchievements.forEach((achievement: Achievement) => {
          toast.success(`🎉 Achievement Unlocked: ${achievement.name}`, {
            description: `${achievement.icon} ${achievement.description} (+${achievement.xp_reward} XP)`,
            duration: 5000,
          });
        });
        
        await fetchAchievements();
      }

      return data;
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }, [user, fetchAchievements]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  // Subscribe to new achievements
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-achievements-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchAchievements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchAchievements]);

  const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));
  const lockedAchievements = achievements.filter(a => !unlockedIds.has(a.id));

  return {
    achievements,
    userAchievements,
    lockedAchievements,
    loading,
    checkAchievements,
    refetch: fetchAchievements,
  };
}