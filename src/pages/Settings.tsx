import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, Moon, Globe, Lock, Trash2 } from 'lucide-react';

export default function Settings() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your app preferences</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="study-reminders" className="flex-1">
                  Study Reminders
                  <p className="text-sm text-muted-foreground font-normal">
                    Get notified when it's time to study
                  </p>
                </Label>
                <Switch id="study-reminders" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="quiz-notifications" className="flex-1">
                  Quiz Notifications
                  <p className="text-sm text-muted-foreground font-normal">
                    Daily quiz reminders and results
                  </p>
                </Label>
                <Switch id="quiz-notifications" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="streak-alerts" className="flex-1">
                  Streak Alerts
                  <p className="text-sm text-muted-foreground font-normal">
                    Don't break your study streak
                  </p>
                </Label>
                <Switch id="streak-alerts" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="achievement-notifications" className="flex-1">
                  Achievement Notifications
                  <p className="text-sm text-muted-foreground font-normal">
                    Celebrate your milestones
                  </p>
                </Label>
                <Switch id="achievement-notifications" defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize the app appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode" className="flex-1">
                  Dark Mode
                  <p className="text-sm text-muted-foreground font-normal">
                    Optimized for extended study sessions
                  </p>
                </Label>
                <Switch id="dark-mode" defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language & Region
              </CardTitle>
              <CardDescription>Set your language preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="bilingual-mode" className="flex-1">
                  Bilingual Mode
                  <p className="text-sm text-muted-foreground font-normal">
                    Show content in both English and Hindi
                  </p>
                </Label>
                <Switch id="bilingual-mode" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>Manage your data and privacy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Export Data
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Privacy Policy
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Terms of Service
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" className="w-full">
                Clear All Study Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
