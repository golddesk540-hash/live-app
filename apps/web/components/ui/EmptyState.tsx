import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { VideoOff } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-3xl bg-popo-dark-850/50 border border-white/5 max-w-md mx-auto',
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-popo-dark-800 border border-white/10 flex items-center justify-center text-popo-pink shadow-glow-pink mb-4">
        {icon || <VideoOff className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-bold text-white mb-1.5">{title}</h3>
      {description && <p className="text-sm text-popo-text-secondary mb-6 leading-relaxed">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
