import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'glass' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    const baseStyles = 'rounded-2xl transition-all duration-200 overflow-hidden text-left';

    const variants = {
      default: 'bg-popo-dark-850 border border-white/10 text-popo-text-primary',
      elevated: 'bg-popo-dark-850 shadow-card-dark border border-white/10',
      interactive:
        'bg-popo-dark-850 hover:bg-popo-dark-800 border border-white/10 hover:border-popo-pink/40 hover:shadow-card-hover cursor-pointer active:scale-[0.99]',
      glass:
        'bg-popo-dark-900/70 backdrop-blur-xl border border-white/10 text-popo-text-primary shadow-2xl',
      gradient:
        'relative bg-gradient-to-b from-popo-dark-850 to-popo-dark-900 border border-white/10 before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-popo-pink before:via-popo-purple before:to-popo-cyan',
    };

    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-4 md:p-5',
      lg: 'p-6 md:p-8',
    };

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], paddings[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
