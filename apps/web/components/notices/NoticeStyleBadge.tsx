'use client';

import React from 'react';
import {
  UserCog,
  ShieldAlert,
  Sparkles,
  Gift,
  Megaphone,
  Crown,
  Bell,
} from 'lucide-react';
import { SystemNoticeItem } from './types';

export function getCategoryVisualMeta(category: SystemNoticeItem['category']) {
  switch (category) {
    case 'account':
      return {
        pillClass: 'bg-[#28245E] text-[#7DA8FF] border-[#4B6BFF]/30',
        iconBg: 'bg-[#3B82F6]/15 text-[#7DA8FF]',
        Icon: UserCog,
      };
    case 'security_safety':
      return {
        pillClass: 'bg-[#3B2618] text-[#FBBF24] border-[#F59E0B]/35',
        iconBg: 'bg-amber-500/15 text-amber-400',
        Icon: ShieldAlert,
      };
    case 'platform':
      return {
        pillClass: 'bg-[#2C1A5E] text-[#C084FC] border-[#A855F7]/30',
        iconBg: 'bg-purple-500/15 text-purple-300',
        Icon: Megaphone,
      };
    case 'feature':
      return {
        pillClass: 'bg-[#3D123D] text-[#FF4D8D] border-[#FF1A6C]/35',
        iconBg: 'bg-[#FF1A6C]/15 text-[#FF4D8D]',
        Icon: Sparkles,
      };
    case 'wallet_gift':
      return {
        pillClass: 'bg-[#12383B] text-[#34D399] border-[#10B981]/35',
        iconBg: 'bg-emerald-500/15 text-emerald-400',
        Icon: Gift,
      };
    case 'important':
      return {
        pillClass: 'bg-gradient-to-r from-amber-500/25 to-yellow-500/20 text-[#FFD700] border-[#FFB800]/50',
        iconBg: 'bg-amber-400/20 text-[#FFD700]',
        Icon: Crown,
      };
    default:
      return {
        pillClass: 'bg-[#251548] text-purple-200 border-white/15',
        iconBg: 'bg-white/10 text-purple-200',
        Icon: Bell,
      };
  }
}
