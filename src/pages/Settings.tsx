import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, Moon, Globe, Lock, Trash2, Download, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

export default function Settings() {
  const [exportingData, setExportingData] = useState(false);
  const [deletingData, setDeletingData] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const handleExportData = async () => {
    try {
      setExportingData(true);
      const { data, error } = await supabase.functions.invoke('export-user-data');
      
      if (error) throw error;
      
      // Create blob and download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `studybyself-data-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully');
    } catch (error: any) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setExportingData(false);
    }
  };

  const handleDeleteData = async () => {
    if (deleteConfirmation !== 'DELETE_MY_DATA') {
      toast.error('Please type DELETE_MY_DATA to confirm');
      return;
    }

    try {
      setDeletingData(true);
      const { error } = await supabase.functions.invoke('delete-user-data', {
        body: { confirmation: deleteConfirmation }
      });
      
      if (error) throw error;
      
      toast.success('All data deleted. You will be signed out.');
      
      // Sign out after 2 seconds
      setTimeout(async () => {
        await supabase.auth.signOut();
      }, 2000);
    } catch (error: any) {
      console.error('Error deleting data:', error);
      toast.error('Failed to delete data');
      setDeletingData(false);
    }
  };

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
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleExportData}
                  disabled={exportingData}
                >
                  {exportingData ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export My Data
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  asChild
                >
                  <Link to="/legal/privacy">Privacy Policy</Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  asChild
                >
                  <Link to="/legal/terms">Terms of Service</Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  asChild
                >
                  <Link to="/legal/cookies">Cookie Policy</Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  asChild
                >
                  <Link to="/legal/refund">Refund Policy</Link>
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
              <CardDescription>Irreversible actions - This will permanently delete ALL your data</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Delete All My Data & Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                      <p>
                        This action cannot be undone. This will permanently delete:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Your account and profile</li>
                        <li>All study sessions and focus time data</li>
                        <li>All quiz results and performance analytics</li>
                        <li>Your timetable and schedules</li>
                        <li>All achievements and progress</li>
                        <li>Chat conversations with AI tutors</li>
                      </ul>
                      <p className="font-semibold">
                        Type <span className="font-mono bg-destructive/20 px-1">DELETE_MY_DATA</span> to confirm:
                      </p>
                      <Input
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder="Type DELETE_MY_DATA"
                        className="font-mono"
                      />
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteData}
                      disabled={deleteConfirmation !== 'DELETE_MY_DATA' || deletingData}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {deletingData ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete Everything'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
