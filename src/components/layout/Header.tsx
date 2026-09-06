import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { BookOpen, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { useNavLock } from '@/hooks/useNavLock';

export default function Header() {
  const { user } = useAuth();
  const location = useLocation();
  const shouldBlockNav = useNavLock();

  const guardNav = (path: string) => (event: React.MouseEvent) => {
    if (location.pathname === path || shouldBlockNav()) event.preventDefault();
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/dashboard" onClick={guardNav('/dashboard')} className="flex items-center space-x-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="font-serif text-2xl italic tracking-tight">Studybyself</h1>
        </Link>

        <div className="flex items-center space-x-2">
          <NotificationCenter />
          <Button variant="ghost" size="icon" asChild>
            <Link to="/settings" onClick={guardNav('/settings')}>
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
          <Link to="/profile" onClick={guardNav('/profile')}>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(user?.user_metadata?.name)}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
