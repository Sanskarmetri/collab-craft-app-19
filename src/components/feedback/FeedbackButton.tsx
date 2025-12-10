import { MessageSquarePlus } from 'lucide-react';
import { FeedbackDialog } from './FeedbackDialog';
import { Button } from '@/components/ui/button';

export function FeedbackButton() {
  return (
    <FeedbackDialog
      trigger={
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-20 right-4 z-50 h-12 w-12 rounded-full shadow-lg md:bottom-6"
          aria-label="Send feedback"
        >
          <MessageSquarePlus className="h-5 w-5" />
        </Button>
      }
    />
  );
}