import React from 'react';
import { cn } from '@/lib/utils';

export interface StatusIndicatorProps {
  type: 'live-pulse' | 'audio-wave' | 'presence';
  status?: 'online' | 'live' | 'idle' | 'offline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  type,
  status = 'online',
  size = 'md',
  className,
}) => {
  if (type === 'live-pulse') {
    return (
      <span className={cn('relative flex items-center justify-center shrink-0', className)}>
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-popo-live opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-popo-live shadow-glow-pink" />
      </span>
    );
  }

  if (type === 'audio-wave') {
    return (
      <div className={cn('flex items-end justify-center gap-0.5 h-4 w-4 shrink-0', className)}>
        <span className="w-1 bg-popo-cyan rounded-full animate-wave-1" />
        <span className="w-1 bg-popo-cyan rounded-full animate-wave-2" />
        <span className="w-1 bg-popo-cyan rounded-full animate-wave-3" />
      </div>
    );
  }

  // Presence dot
  const statusColors = {
    online: 'bg-emerald-400 ring-emerald-950',
    live: 'bg-popo-live ring-red-950 animate-pulse',
    idle: 'bg-amber-400 ring-amber-950',
    offline: 'bg-popo-dark-600 ring-popo-dark-950',
  };

  const sizes = {
    sm: 'w-2 h-2 ring-1',
    md: 'w-2.5 h-2.5 ring-2',
    lg: 'w-3 h-3 ring-2',
  };

  return (
    <span
      className={cn(
        'inline-block rounded-full shrink-0',
        statusColors[status],
        sizes[size],
        className
      )}
    />
  );
};
