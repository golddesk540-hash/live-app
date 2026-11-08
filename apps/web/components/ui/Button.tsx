import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'vip' | 'cyan' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold transition-all duration-200 select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-popo-dark-950';

    const variants = {
      primary:
        'bg-gradient-to-r from-popo-pink to-[#FF5E3A] text-white hover:opacity-95 shadow-glow-pink focus-visible:ring-popo-pink border border-white/10',
      secondary:
        'bg-popo-dark-850 hover:bg-popo-dark-800 text-popo-text-primary border border-white/10 hover:border-white/20 focus-visible:ring-white/20',
      outline:
        'bg-transparent border border-popo-pink text-popo-pink hover:bg-popo-pink/10 focus-visible:ring-popo-pink',
      ghost:
        'bg-transparent hover:bg-white/5 text-popo-text-secondary hover:text-white focus-visible:ring-white/10',
      vip:
        'bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FF8C00] text-popo-dark-950 font-bold shadow-glow-gold hover:brightness-105 border border-yellow-200/30 focus-visible:ring-popo-gold',
      cyan:
        'bg-gradient-to-r from-[#00E5FF] to-[#0070F3] text-popo-dark-950 font-bold shadow-glow-cyan hover:opacity-95 focus-visible:ring-popo-cyan',
      danger:
        'bg-popo-state-error text-white hover:bg-red-600 focus-visible:ring-popo-state-error',
    };

    const sizes = {
      xs: 'text-xs h-7 px-2.5 rounded-full gap-1',
      sm: 'text-xs md:text-sm h-8 px-3.5 rounded-full gap-1.5',
      md: 'text-sm h-10 px-5 rounded-full gap-2',
      lg: 'text-base h-12 px-6 rounded-full gap-2.5',
      icon: 'h-10 w-10 rounded-full p-0 flex items-center justify-center',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
