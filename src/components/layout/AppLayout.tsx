import { ReactNode } from 'react';
import Header from './Header';
import BottomNav from './BottomNav';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-[100dvh] bg-background">
      <Header />
      <main className="container mx-auto p-4 pb-[calc(5rem+env(safe-area-inset-bottom))] md:p-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
