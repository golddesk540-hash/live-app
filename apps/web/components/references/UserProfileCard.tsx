'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Copy, Check, MessageCircle, Heart, Sparkles, ShieldCheck } from 'lucide-react';

export interface UserProfileCardProps {
  userId?: string;
  nickname?: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  country?: string;
  wealthLevel?: number;
  isVIP?: boolean;
  followingCount?: number;
  followersCount?: number;
  pointsEarned?: number;
  className?: string;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  userId = '88421093',
  nickname = 'Amina Sheikh',
  bio = '🎙️ Solo Singer | Daily Live 9PM PKT | Let’s hit Level 40 together! ✨',
  avatar = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  coverImage = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
  country = '🇵🇰 Pakistan',
  wealthLevel = 28,
  isVIP = true,
  followingCount = 142,
  followersCount = 28900,
  pointsEarned = 452000,
  className,
}) => {
  const [copied, setCopied] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard?.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'w-full max-w-sm mx-auto rounded-3xl bg-popo-dark-900 border border-white/10 overflow-hidden shadow-2xl text-left select-none',
        className
      )}
    >
      {/* Cover Image */}
      <div className="relative h-28 w-full bg-popo-dark-800 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-popo-dark-900 via-transparent to-transparent" />
      </div>

      {/* Profile Header Details */}
      <div className="px-5 pb-5 -mt-10 relative">
        <div className="flex items-end justify-between mb-3">
          <Avatar
            src={avatar}
            size="xl"
            ring="vip"
            isVIP={isVIP}
            status="online"
            level={wealthLevel}
          />
          <div className="flex gap-2 mb-1">
            <Button
              variant={isFollowing ? 'secondary' : 'primary'}
              size="sm"
              leftIcon={<Heart className={cn('w-3.5 h-3.5', isFollowing && 'fill-popo-pink text-popo-pink')} />}
              onClick={() => setIsFollowing(!isFollowing)}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
            <Button variant="secondary" size="sm" leftIcon={<MessageCircle className="w-3.5 h-3.5" />}>
              Chat
            </Button>
          </div>
        </div>

        {/* User Titles */}
        <div className="flex flex-col gap-1 mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">{nickname}</h3>
            <ShieldCheck className="w-4 h-4 text-popo-cyan" />
          </div>

          <div className="flex items-center gap-2 text-xs text-popo-text-secondary">
            <span>{country}</span>
            <span>•</span>
            <button
              onClick={handleCopyId}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <span>ID: {userId}</span>
              {copied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 text-popo-text-muted" />
              )}
            </button>
          </div>
        </div>

        {/* Badges Row */}
        <div className="flex items-center gap-1.5 flex-wrap mb-4">
          <Badge variant="level" level={wealthLevel} size="xs" />
          {isVIP && <Badge variant="vip" size="xs">VIP 3</Badge>}
          <Badge variant="host" size="xs">Official Host</Badge>
        </div>

        {/* Bio */}
        <p className="text-xs text-popo-text-secondary leading-relaxed mb-4">{bio}</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-popo-dark-850 border border-white/5 text-center">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white">{followingCount}</span>
            <span className="text-[10px] text-popo-text-muted uppercase">Following</span>
          </div>
          <div className="flex flex-col border-x border-white/5">
            <span className="text-sm font-bold text-white">{(followersCount / 1000).toFixed(1)}k</span>
            <span className="text-[10px] text-popo-text-muted uppercase">Followers</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-amber-400 flex items-center justify-center gap-0.5">
              <Sparkles className="w-3 h-3 fill-amber-400" />
              {(pointsEarned / 1000).toFixed(0)}k
            </span>
            <span className="text-[10px] text-popo-text-muted uppercase">Points</span>
          </div>
        </div>
      </div>
    </div>
  );
};
