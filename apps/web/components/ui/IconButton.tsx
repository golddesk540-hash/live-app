import React from 'react';
import { cn } from '@/lib/utils';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'glass' | 'solid' | 'pink' | 'ghost' | 'vip';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  shape?: 'circle' | 'rounded';
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant = 'glass',
      size = 'md',
      shape = 'circle',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center transition-all duration-200 select-none active:scale-95 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-popo-dark-950';

    const variants = {
      glass:
        'bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/10 hover:border-white/20',
      solid:
        'bg-popo-dark-800 hover:bg-popo-dark-700 text-popo-text-primary border border-white/10',
      pink:
        'bg-popo-pink hover:bg-popo-pink-hover text-white shadow-glow-pink',
      ghost:
        'bg-transparent hover:bg-white/10 text-popo-text-secondary hover:text-white',
      vip:
        'bg-gradient-to-r from-popo-gold to-yellow-500 text-popo-dark-950 font-bold shadow-glow-gold',
    };

    const sizes = {
      xs: 'w-7 h-7 text-xs',
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-12 h-12 text-lg',
    };

    const shapes = {
      circle: 'rounded-full',
      rounded: 'rounded-xl',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, variants[variant], sizes[size], shapes[shape], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
