import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock } from 'lucide-react';
import { Achievement } from '@/hooks/useAchievements';

interface AchievementCardProps {
  achievement: Achievement;
  unlocked?: boolean;
  unlockedAt?: string;
}

export function AchievementCard({ achievement, unlocked = false, unlockedAt }: AchievementCardProps) {
  return (
    <Card className={unlocked ? 'border-accent' : 'opacity-60'}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-3xl">{unlocked ? achievement.icon : <Lock className="h-8 w-8 text-muted-foreground" />}</div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{achievement.name}</h4>
              <Badge variant={unlocked ? 'default' : 'secondary'}>
                +{achievement.xp_reward} XP
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{achievement.description}</p>
            {unlocked && unlockedAt && (
              <p className="text-xs text-muted-foreground">
                Unlocked {new Date(unlockedAt).toLocaleDateString()}
              </p>
            )}
            {!unlocked && (
              <div className="text-xs text-muted-foreground mt-2">
                Requirements: {Object.entries(achievement.criteria).map(([key, value]) => 
                  `${key.replace('_', ' ')}: ${value}`
                ).join(', ')}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}