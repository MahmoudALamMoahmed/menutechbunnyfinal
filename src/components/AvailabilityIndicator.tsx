import { Loader2, Check, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

interface AvailabilityIndicatorProps {
  status: AvailabilityStatus;
  message: string;
}

export function AvailabilityIndicator({ status, message }: AvailabilityIndicatorProps) {
  if (status === 'idle') return null;

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs mt-1',
        status === 'checking' && 'text-muted-foreground',
        status === 'available' && 'text-green-600',
        status === 'taken' && 'text-destructive',
        status === 'invalid' && 'text-amber-600'
      )}
    >
      {status === 'checking' && <Loader2 className="h-3 w-3 animate-spin" />}
      {status === 'available' && <Check className="h-3 w-3" />}
      {status === 'taken' && <X className="h-3 w-3" />}
      {status === 'invalid' && <AlertCircle className="h-3 w-3" />}
      <span>{message}</span>
    </div>
  );
}
