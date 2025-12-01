import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SubscriptionStatus {
  subscribed: boolean;
  product_id?: string;
  subscription_end?: string;
  subscription_status?: 'free' | 'premium';
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>({ subscribed: false, subscription_status: 'free' });
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    if (!user) {
      setStatus({ subscribed: false, subscription_status: 'free' });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        setStatus({ subscribed: false, subscription_status: 'free' });
      } else {
        setStatus(data);
      }
    } catch (error) {
      console.error('Exception checking subscription:', error);
      setStatus({ subscribed: false, subscription_status: 'free' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
    
    // Check subscription status periodically (every 5 minutes)
    const interval = setInterval(checkSubscription, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user]);

  return {
    ...status,
    loading,
    refresh: checkSubscription,
    isPremium: status.subscribed && status.subscription_status === 'premium',
  };
};
