import React from 'react';
import { cn } from '@/lib/utils';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'pink' | 'gold' | 'cyan' | 'white';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'pink',
  className,
}) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const variants = {
    pink: 'border-popo-pink/20 border-t-popo-pink shadow-glow-pink',
    gold: 'border-popo-gold/20 border-t-popo-gold shadow-glow-gold',
    cyan: 'border-popo-cyan/20 border-t-popo-cyan shadow-glow-cyan',
    white: 'border-white/20 border-t-white',
  };

  return (
    <div
      className={cn(
        'rounded-full animate-spin shrink-0',
        sizes[size],
        variants[variant],
        className
      )}
    />
  );
};

export const SkeletonRoomCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        'relative aspect-[3/4] rounded-2xl bg-popo-dark-850 overflow-hidden border border-white/5 animate-pulse',
        className
      )}
    >
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-popo-dark-700" />
        <div className="h-3 w-16 bg-popo-dark-700 rounded-md" />
      </div>
      <div className="absolute top-3 right-3 h-5 w-12 bg-popo-dark-700 rounded-full" />
      <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-2">
        <div className="h-4 w-3/4 bg-popo-dark-700 rounded-md" />
        <div className="flex gap-1.5">
          <div className="h-3 w-12 bg-popo-dark-700 rounded-md" />
          <div className="h-3 w-10 bg-popo-dark-700 rounded-md" />
        </div>
      </div>
    </div>
  );
};
