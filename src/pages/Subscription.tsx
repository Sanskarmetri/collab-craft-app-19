import { useState, useEffect } from 'react';
import { Check, Crown, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';

const PREMIUM_PRODUCT_ID = 'prod_TWT96mHHwNrcbn';

export default function Subscription() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    subscribed: boolean;
    product_id?: string;
    subscription_end?: string;
    subscription_status?: string;
  }>({ subscribed: false });

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Subscription activated! Checking status...');
      checkSubscription();
    } else if (searchParams.get('canceled') === 'true') {
      toast.info('Checkout canceled');
    }
  }, [searchParams]);

  useEffect(() => {
    checkSubscription();
  }, [user]);

  const checkSubscription = async () => {
    if (!user) return;
    
    try {
      setCheckingSubscription(true);
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;
      
      setSubscriptionStatus(data);
      console.log('Subscription status:', data);
    } catch (error: any) {
      console.error('Error checking subscription:', error);
      toast.error('Failed to check subscription status');
    } finally {
      setCheckingSubscription(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to initiate checkout');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open subscription management');
    } finally {
      setLoading(false);
    }
  };

  const isPremium = subscriptionStatus.subscribed && subscriptionStatus.product_id === PREMIUM_PRODUCT_ID;

  const features = {
    free: [
      'Daily AI chat (20 requests/day)',
      'Basic quiz generation',
      'Focus mode with basic blocking',
      'Study time tracking',
      'Basic analytics',
    ],
    premium: [
      'Unlimited AI chat requests',
      'Advanced quiz generation with AI grading',
      'Full-length mock tests',
      'Advanced focus mode',
      'Detailed analytics with insights',
      'Priority support',
      'Personalized study recommendations',
      'Export study data',
    ],
  };

  if (checkingSubscription) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-muted-foreground">
            Upgrade to Premium for unlimited access to all features
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Free Tier */}
          <Card className={!isPremium ? 'border-primary' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Free</CardTitle>
                {!isPremium && <Badge variant="secondary">Current Plan</Badge>}
              </div>
              <CardDescription>
                <span className="text-3xl font-bold">₹0</span>
                <span className="text-muted-foreground">/month</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.free.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Premium Tier */}
          <Card className={isPremium ? 'border-primary shadow-lg' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Premium
                </CardTitle>
                {isPremium && <Badge>Active</Badge>}
              </div>
              <CardDescription>
                <span className="text-3xl font-bold">₹299</span>
                <span className="text-muted-foreground">/month</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {features.premium.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {isPremium ? (
                <div className="space-y-2">
                  {subscriptionStatus.subscription_end && (
                    <p className="text-sm text-muted-foreground">
                      Renews on {new Date(subscriptionStatus.subscription_end).toLocaleDateString()}
                    </p>
                  )}
                  <Button 
                    onClick={handleManageSubscription} 
                    disabled={loading}
                    className="w-full"
                    variant="outline"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Manage Subscription'
                    )}
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={handleSubscribe} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Upgrade to Premium'
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {!checkingSubscription && (
          <div className="mt-6 text-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={checkSubscription}
              disabled={checkingSubscription}
            >
              {checkingSubscription ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                'Refresh Status'
              )}
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
