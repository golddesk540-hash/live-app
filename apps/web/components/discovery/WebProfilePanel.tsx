'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Copy,
  Check,
  Coins,
  Crown,
  Sparkles,
  Award,
  Flame,
  ArrowRight,
  ShieldCheck,
  Users,
  Eye,
  Settings,
  Gift,
  HelpCircle,
  FileText,
  CreditCard,
  ChevronRight,
  ExternalLink,
  Smartphone,
} from 'lucide-react';
import { DesignFixtures } from '@/lib/design/designFixtures';

export interface WebProfilePanelProps {
  isUr?: boolean;
  onOpenAppModal?: () => void;
}

export const WebProfilePanel: React.FC<WebProfilePanelProps> = ({
  isUr = false,
  onOpenAppModal,
}) => {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Retrieve user data from DesignFixtures
  const user = useMemo(() => {
    try {
      return DesignFixtures.currentUserProfile;
    } catch {
      return {
        userId: 'u_amina_noor',
        nickname: 'Amina Noor',
        poppoId: '883901',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        gender: 'female',
        bio: 'Acoustic singer & guitar player 🎶 Based in Karachi.',
        vipLevel: 3,
        wealthLevel: 14,
        hostLevel: 32,
        friendsCount: 24,
        followingCount: 18,
        followersCount: 14200,
        visitorCount: 1850,
      };
    }
  }, []);

  const wallet = useMemo(() => {
    try {
      return DesignFixtures.wallet;
    } catch {
      return {
        coinBalance: 154200,
        pointsBalance: 48500,
        withdrawableUsd: 485.0,
      };
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleCopyId = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(user.poppoId);
      }
      setCopied(true);
      showToast(`ID copied: ${user.poppoId}`);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy ID:', e);
    }
  };

  const featureIcons = [
    { title: 'Reward', icon: Gift, color: 'text-pink-500 bg-pink-50' },
    { title: 'Rank', icon: Flame, color: 'text-amber-500 bg-amber-50' },
    { title: 'Store', icon: CreditCard, color: 'text-purple-500 bg-purple-50' },
    { title: 'Invite', icon: Users, color: 'text-blue-500 bg-blue-50' },
    { title: 'Guardian', icon: ShieldCheck, color: 'text-emerald-500 bg-emerald-50' },
    { title: 'Honor Level', icon: Crown, color: 'text-yellow-600 bg-yellow-50' },
    { title: 'Fan Club', icon: Sparkles, color: 'text-rose-500 bg-rose-50' },
    { title: 'Medal Wall', icon: Award, color: 'text-indigo-500 bg-indigo-50' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150" data-testid="profile-panel">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-2xl bg-gray-900 text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. MAIN PROFILE CARD */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-200/90 shadow-xs relative overflow-hidden">
        {/* Subtle Decorative Gradient */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-pink-100/50 via-purple-50/30 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar with VIP Golden Crown Ring */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 shadow-md">
              <img
                src={user.avatarUrl}
                alt={user.nickname}
                className="w-full h-full rounded-full object-cover ring-2 ring-white"
              />
            </div>
            {/* VIP Crown Badge */}
            <div className="absolute -top-1 -right-1 p-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-md">
              <Crown className="w-4 h-4 fill-current" />
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {user.nickname}
              </h1>
              <span className="text-sm">{user.flagEmoji || '🇵🇰'}</span>

              {/* VIP Badge */}
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-2xs">
                VIP {user.vipLevel}
              </span>
            </div>

            {/* Levels & Badges */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 font-extrabold border border-amber-200 text-[10px]">
                Wealth Lv. {user.wealthLevel}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 font-extrabold border border-purple-200 text-[10px]">
                Shining Lv. {user.hostLevel}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-600 font-bold text-[10px]">
                {user.country}
              </span>
            </div>

            {/* ID & Copy Button */}
            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 text-xs text-gray-500">
              <span>ID: <strong className="text-gray-800 font-mono">{user.poppoId}</strong></span>
              <button
                type="button"
                onClick={handleCopyId}
                className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold transition-colors flex items-center gap-1"
                title="Copy User ID"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Bio */}
            <p className="text-xs text-gray-600 max-w-lg pt-1">
              {user.bio}
            </p>
          </div>
        </div>

        {/* 2. FOUR PROFILE STATS ROW */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 mt-8 pt-6 border-t border-gray-100 text-center">
          <div className="p-3 rounded-2xl bg-gray-50/80 hover:bg-pink-50/50 transition-colors">
            <span className="block text-base sm:text-xl font-black text-gray-900">{user.friendsCount}</span>
            <span className="text-[11px] font-bold text-gray-400">Friends</span>
          </div>
          <div className="p-3 rounded-2xl bg-gray-50/80 hover:bg-pink-50/50 transition-colors">
            <span className="block text-base sm:text-xl font-black text-gray-900">{user.followingCount}</span>
            <span className="text-[11px] font-bold text-gray-400">Following</span>
          </div>
          <div className="p-3 rounded-2xl bg-gray-50/80 hover:bg-pink-50/50 transition-colors">
            <span className="block text-base sm:text-xl font-black text-[#FF1A6C]">
              {(user.followersCount / 1000).toFixed(1)}k
            </span>
            <span className="text-[11px] font-bold text-gray-400">Followers</span>
          </div>
          <div className="p-3 rounded-2xl bg-gray-50/80 hover:bg-pink-50/50 transition-colors">
            <span className="block text-base sm:text-xl font-black text-gray-900">
              {(user.visitorCount / 1000).toFixed(1)}k
            </span>
            <span className="text-[11px] font-bold text-gray-400">Visitors</span>
          </div>
        </div>
      </div>

      {/* 3. COINS & POINTS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Coins Balance Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 text-white shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-200" />
              <span className="text-xs font-bold uppercase tracking-wider text-yellow-100">
                Coin Balance
              </span>
            </div>
            <p className="text-2xl font-black tracking-tight">
              {wallet.coinBalance.toLocaleString()}
            </p>
            <p className="text-[11px] text-yellow-100/90 font-medium">Available for gifts & reactions</p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onOpenAppModal) onOpenAppModal();
            }}
            className="px-4 py-2.5 rounded-xl bg-white text-amber-900 hover:bg-yellow-50 font-black text-xs shadow-xs transition-colors shrink-0"
          >
            Get Coins
          </button>
        </div>

        {/* Points Balance Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-700 via-indigo-700 to-indigo-900 text-white shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-300" />
              <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
                Points Balance
              </span>
            </div>
            <p className="text-2xl font-black tracking-tight">
              {wallet.pointsBalance.toLocaleString()}
            </p>
            <p className="text-[11px] text-purple-200 font-medium">
              ≈ ${(wallet.withdrawableUsd || 485).toFixed(2)} USD withdrawable
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onOpenAppModal) onOpenAppModal();
            }}
            className="px-4 py-2.5 rounded-xl bg-white text-indigo-900 hover:bg-purple-50 font-black text-xs shadow-xs transition-colors shrink-0"
          >
            Exchange
          </button>
        </div>
      </div>

      {/* 4. VIP 3 PRIVILEGE BANNER */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-gray-900 via-[#1a1829] to-gray-900 border border-amber-400/30 text-white shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-black shadow-md">
              <Crown className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-amber-300">VIP 3 Privileges</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Active Member
                </span>
              </div>
              <p className="text-xs text-white/60">24 days remaining · Next: VIP 4 (72% progress)</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onOpenAppModal) onOpenAppModal();
            }}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs transition-colors shadow-xs"
          >
            Manage VIP
          </button>
        </div>

        {/* VIP Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-white/70">
            <span>Progress to VIP 4</span>
            <span className="font-bold text-amber-300">7,200 / 10,000 pts (72%)</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 w-[72%]" />
          </div>
        </div>

        {/* 6 Privilege Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[11px] font-semibold text-white/90">Exclusive Crown Frame</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
            <span className="text-[11px] font-semibold text-white/90">Studio Entrance Waves</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
            <Gift className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-[11px] font-semibold text-white/90">5% Bonus Diamonds</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[11px] font-semibold text-white/90">Priority KYC Queue</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-400 shrink-0" />
            <span className="text-[11px] font-semibold text-white/90">Daily Coin Grant</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-[11px] font-semibold text-white/90">Star Club Access</span>
          </div>
        </div>
      </div>

      {/* 5. EIGHT FEATURE ICONS (MOBILE ADAPTATION) */}
      <div className="p-6 rounded-3xl bg-white border border-gray-200/90 shadow-xs space-y-3">
        <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
          Centers & Features
        </span>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 text-center">
          {featureIcons.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                onClick={() => {
                  showToast(`${feat.title} center available`);
                }}
                className="flex flex-col items-center space-y-1.5 p-2 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-2xs ${feat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-gray-700 group-hover:text-[#FF1A6C] transition-colors">
                  {feat.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. POLICY BANNERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-pink-50 text-[#FF1A6C]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Community Safety & Rules</h4>
              <p className="text-gray-400 text-[11px]">Strict zero-harassment and anti-fraud policies.</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Broadcaster Terms & Payouts</h4>
              <p className="text-gray-400 text-[11px]">Fair revenue sharing and diamond withdrawals.</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        </div>
      </div>
    </div>
  );
};

export default WebProfilePanel;
