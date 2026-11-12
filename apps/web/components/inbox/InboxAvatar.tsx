'use client';

import React from 'react';
import { ShieldCheck, Crown } from 'lucide-react';
import { InboxUserProfile } from './types';

interface InboxAvatarProps {
  user: InboxUserProfile;
  size?: 'sm' | 'md' | 'lg';
  onClick?: (e: React.MouseEvent) => void;
}

const RING_GRADIENTS: Record<InboxUserProfile['ringColor'], string> = {
  pink: 'from-[#FF1A6C] via-[#EC4899] to-[#D946EF]',
  blue: 'from-[#3B82F6] via-[#00E5FF] to-[#6366F1]',
  purple: 'from-[#9333EA] via-[#A855F7] to-[#FF1A6C]',
  gold: 'from-[#FFB800] via-[#FFD700] to-[#F59E0B]',
  emerald: 'from-[#10B981] via-[#34D399] to-[#06B6D4]',
};

const SIZE_CLASSES = {
  sm: { box: 'w-10 h-10', dot: 'w-2.5 h-2.5', text: 'text-xs' },
  md: { box: 'w-13 h-13 w-[52px] h-[52px]', dot: 'w-3 h-3', text: 'text-sm' },
  lg: { box: 'w-14 h-14', dot: 'w-3.5 h-3.5', text: 'text-base' },
};

export const InboxAvatar: React.FC<InboxAvatarProps> = ({ user, size = 'md', onClick }) => {
  const s = SIZE_CLASSES[size];

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex shrink-0 select-none ${onClick ? 'cursor-pointer group' : ''}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e as unknown as React.MouseEvent);
              }
            }
          : undefined
      }
      aria-label={`${user.name} profile`}
    >
      <div
        className={`p-[2.5px] rounded-full bg-gradient-to-tr ${RING_GRADIENTS[user.ringColor]} shadow-sm transition-transform duration-150 ${
          onClick ? 'group-hover:scale-105' : ''
        }`}
      >
        <div
          className={`${s.box} rounded-full overflow-hidden bg-[#1D0F38] flex items-center justify-center border-2 border-[#0E051E]`}
        >
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${user.avatarColor} flex items-center justify-center font-extrabold text-white ${s.text}`}
            >
              {user.name
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Status Dot */}
      <span
        title={user.lastSeenText}
        className={`absolute bottom-0 right-0 ${s.dot} rounded-full border-2 border-[#0E051E] ${
          user.status === 'online'
            ? 'bg-emerald-400'
            : user.status === 'live'
            ? 'bg-[#FF1A6C] animate-pulse'
            : 'bg-zinc-500'
        }`}
      />

      {/* Official or VIP Mini Indicator */}
      {user.isOfficial ? (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center border border-[#0E051E]">
          <ShieldCheck className="w-2.5 h-2.5" />
        </span>
      ) : user.isVip ? (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center border border-[#0E051E]">
          <Crown className="w-2.5 h-2.5 fill-black" />
        </span>
      ) : null}
    </div>
  );
};
