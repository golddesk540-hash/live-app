import React from 'react';
import { cn } from '@/lib/utils';
import { Crown, Radio, Sparkles, Mic2 } from 'lucide-react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'level' | 'vip' | 'live' | 'host' | 'party' | 'category' | 'outline' | 'success';
  level?: number;
  size?: 'xs' | 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'category',
  level = 1,
  size = 'sm',
  children,
  ...props
}) => {
  // Determine level color gradient dynamically based on wealth scale
  const getLevelGradient = (lvl: number) => {
    if (lvl >= 70) return 'from-[#FF1A6C] via-[#7928CA] to-[#00E5FF] text-white'; // God / Royal Tier
    if (lvl >= 40) return 'from-[#9333EA] to-[#3B82F6] text-white';              // Diamond Tier
    if (lvl >= 20) return 'from-[#FFB800] to-[#FF8C00] text-black font-extrabold'; // Gold Tier
    if (lvl >= 10) return 'from-[#94A3B8] to-[#475569] text-white';              // Silver Tier
    return 'from-[#78350F] to-[#B45309] text-amber-100';                         // Bronze Tier
  };

  const sizes = {
    xs: 'text-[9px] px-1.5 py-0.5 rounded-full font-bold',
    sm: 'text-[11px] px-2.5 py-0.5 rounded-full font-bold',
    md: 'text-xs px-3 py-1 rounded-full font-bold',
  };

  if (variant === 'level') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 bg-gradient-to-r shadow-sm select-none',
          getLevelGradient(level),
          sizes[size],
          className
        )}
        {...props}
      >
        <Sparkles className="w-2.5 h-2.5 shrink-0" />
        <span>Lv.{level}</span>
      </span>
    );
  }

  if (variant === 'vip') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-popo-dark-950 font-black shadow-glow-gold select-none uppercase tracking-wide',
          sizes[size],
          className
        )}
        {...props}
      >
        <Crown className="w-3 h-3 fill-popo-dark-950 shrink-0" />
        <span>{children || 'VIP'}</span>
      </span>
    );
  }

  if (variant === 'live') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 bg-gradient-to-r from-popo-live to-[#FF1A6C] text-white font-extrabold uppercase tracking-wider shadow-glow-pink select-none',
          sizes[size],
          className
        )}
        {...props}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-live-pulse shrink-0" />
        <span>{children || 'LIVE'}</span>
      </span>
    );
  }

  if (variant === 'host') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 bg-popo-purple-dark text-popo-purple-light border border-popo-purple-light/30 uppercase tracking-wider',
          sizes[size],
          className
        )}
        {...props}
      >
        <Mic2 className="w-2.5 h-2.5" />
        <span>{children || 'HOST'}</span>
      </span>
    );
  }

  if (variant === 'party') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 bg-gradient-to-r from-popo-purple to-popo-pink text-white font-bold',
          sizes[size],
          className
        )}
        {...props}
      >
        <Radio className="w-2.5 h-2.5" />
        <span>{children || '9-SEAT'}</span>
      </span>
    );
  }

  if (variant === 'success') {
    return (
      <span
        className={cn('inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', sizes[size], className)}
        {...props}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span>{children}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center bg-white/5 hover:bg-white/10 text-popo-text-secondary border border-white/10 transition-colors',
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
