import React from 'react';
import { cn } from '@/lib/utils';
import { Crown, Sparkles } from 'lucide-react';

export interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  ring?: 'none' | 'live' | 'vip' | 'seat' | 'pink';
  status?: 'online' | 'live' | 'offline';
  level?: number;
  isVIP?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'User avatar',
  fallback,
  size = 'md',
  ring = 'none',
  status,
  level,
  isVIP = false,
  className,
}) => {
  const sizeMap = {
    xs: { outer: 'w-6 h-6', text: 'text-[10px]', status: 'w-1.5 h-1.5', levelText: 'text-[8px] px-1' },
    sm: { outer: 'w-8 h-8', text: 'text-xs', status: 'w-2 h-2', levelText: 'text-[9px] px-1' },
    md: { outer: 'w-11 h-11', text: 'text-sm', status: 'w-2.5 h-2.5', levelText: 'text-[10px] px-1.5' },
    lg: { outer: 'w-14 h-14', text: 'text-base', status: 'w-3 h-3', levelText: 'text-[10px] px-2' },
    xl: { outer: 'w-20 h-20', text: 'text-xl', status: 'w-4 h-4', levelText: 'text-xs px-2.5' },
    '2xl': { outer: 'w-28 h-28', text: 'text-2xl', status: 'w-5 h-5', levelText: 'text-xs px-3' },
  };

  const ringStyles = {
    none: '',
    live: 'p-[2.5px] bg-gradient-to-tr from-popo-live via-popo-pink to-amber-500 animate-live-pulse rounded-full shadow-glow-pink',
    vip: 'p-[2.5px] bg-gradient-to-tr from-[#FFD700] via-[#FFA500] to-[#FF8C00] rounded-full shadow-glow-gold',
    seat: 'p-[2.5px] bg-gradient-to-tr from-popo-cyan via-blue-500 to-indigo-500 rounded-full shadow-glow-cyan',
    pink: 'p-[2px] bg-popo-pink rounded-full',
  };

  const initials = fallback || (alt ? alt.slice(0, 2).toUpperCase() : 'PL');

  return (
    <div className={cn('relative inline-flex shrink-0 select-none items-center justify-center', className)}>
      {/* Optional VIP Crown badge at top */}
      {isVIP && (
        <div className="absolute -top-2 z-10 bg-amber-400 p-0.5 rounded-full shadow-glow-gold animate-bounce">
          <Crown className="w-3.5 h-3.5 text-black fill-black" />
        </div>
      )}

      {/* Ring container */}
      <div className={cn(ringStyles[ring])}>
        <div
          className={cn(
            'relative overflow-hidden rounded-full bg-popo-dark-800 flex items-center justify-center font-bold text-white border border-white/10',
            sizeMap[size].outer
          )}
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt} className="w-full h-full object-cover" />
          ) : (
            <span className={sizeMap[size].text}>{initials}</span>
          )}
        </div>
      </div>

      {/* Status indicator dot */}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-popo-dark-950',
            sizeMap[size].status,
            status === 'online' && 'bg-emerald-400',
            status === 'live' && 'bg-popo-live animate-ping',
            status === 'offline' && 'bg-popo-dark-600'
          )}
        />
      )}

      {/* Level Tag (if specified) */}
      {level !== undefined && (
        <span
          className={cn(
            'absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-700 text-black font-extrabold rounded-full shadow-md z-10 flex items-center gap-0.5 whitespace-nowrap border border-amber-300/40',
            sizeMap[size].levelText
          )}
        >
          <Sparkles className="w-2 h-2 shrink-0 fill-black" />
          <span>{level}</span>
        </span>
      )}
    </div>
  );
};
