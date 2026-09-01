import { Home, MessageSquare, Clock, Newspaper, Library, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useNavLock } from '@/hooks/useNavLock';


const navItems = [
  { icon: Home, label: 'Home', path: '/dashboard' },
  { icon: MessageSquare, label: 'Chat', path: '/chat' },
  { icon: Clock, label: 'Focus', path: '/focus' },
  { icon: Newspaper, label: 'News', path: '/news' },
  { icon: Library, label: 'Library', path: '/resources' },
  { icon: User, label: 'Profile', path: '/profile' },
];


export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="grid h-16 grid-cols-6">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              onClick={(event) => {
                if (isActive) event.preventDefault();
              }}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex min-w-0 flex-col items-center justify-center gap-1 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="max-w-full truncate px-0.5 text-[10px] font-medium sm:text-xs">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
