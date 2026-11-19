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
  Radio,
  Briefcase,
  History,
  QrCode,
  Tag,
  X,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Package,
} from 'lucide-react';
import {
  DesignFixtures,
  FixtureRedeemCode,
  FixtureHelpTopic,
  FixtureAgencyMember,
} from '@/lib/design/designFixtures';

export interface WebProfilePanelProps {
  isUr?: boolean;
  onOpenAppModal?: () => void;
  onOpenGoLive?: () => void;
}

export const WebProfilePanel: React.FC<WebProfilePanelProps> = ({
  isUr = false,
  onOpenAppModal,
  onOpenGoLive,
}) => {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemInput, setRedeemInput] = useState('');
  const [redeemResult, setRedeemResult] = useState<FixtureRedeemCode | null>(null);

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAgencyModal, setShowAgencyModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

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

  const [coinBalance, setCoinBalance] = useState<number>(() => {
    try {
      return DesignFixtures.currentCoinBalance;
    } catch {
      return 154200;
    }
  });

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

  const agency = useMemo(() => {
    try {
      return DesignFixtures.agencyInfo;
    } catch {
      return {
        agencyId: 'agy_78601',
        agencyCode: 'AGY-78601',
        agencyName: 'Indus Star Media Agency',
        agentLeader: 'Kamran Malik',
        status: 'active',
        memberCount: 4,
      };
    }
  }, []);

  const coinSeller = useMemo(() => {
    try {
      return DesignFixtures.coinSellerInfo;
    } catch {
      return {
        sellerName: 'Karachi TopUp Express',
        agentName: 'Kamran Malik',
        whatsappContact: '+92 300 8765432',
      };
    }
  }, []);

  const helpTopics = useMemo(() => {
    try {
      return DesignFixtures.helpTopics;
    } catch {
      return [];
    }
  }, []);

  const agencyMembers = useMemo(() => {
    try {
      return DesignFixtures.agencyMembers;
    } catch {
      return [];
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

  const handleRedeemCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemInput.trim()) return;

    try {
      const result = DesignFixtures.redeemCode(redeemInput.trim());
      setRedeemResult(result);
      if (result.isValid) {
        setCoinBalance(DesignFixtures.currentCoinBalance);
        showToast(`🎉 Code redeemed: +${result.coinReward.toLocaleString()} Coins!`);
      }
    } catch (err: any) {
      setRedeemResult({
        code: redeemInput,
        isValid: false,
        coinReward: 0,
        bonusItem: null,
        message: 'Promotional server busy. Please try again.',
      });
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
    <div className="space-y-6 animate-in fade-in duration-150" data-testid="profile-main-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-2xl bg-gray-900 text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. PROFILE HEADER CARD */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-200/90 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar with VIP Golden Crown Ring */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-4 ring-amber-400 shadow-md">
              <img
                src={user.avatarUrl}
                alt={user.nickname}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white flex items-center justify-center shadow-sm">
              <Crown className="w-4 h-4 fill-white" />
            </div>
          </div>

          {/* User Information */}
          <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {user.nickname}
              </h1>
              <span className="text-base">{user.flagEmoji}</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                VIP {user.vipLevel}
              </span>
            </div>

            {/* Badges Row */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 font-extrabold border border-amber-200 text-[10px]">
                Wealth Lv. {user.wealthLevel}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-pink-50 text-[#FF1A6C] font-extrabold border border-pink-200 text-[10px]">
                Shining Lv. {user.hostLevel}
              </span>
              <span className="text-[11px] text-gray-400">
                {user.bio}
              </span>
            </div>

            {/* User ID & Copy Button */}
            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 text-xs text-gray-500">
              <span>ID: <strong className="text-gray-800 font-mono">{user.poppoId}</strong></span>
              <button
                type="button"
                onClick={handleCopyId}
                className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold transition-colors flex items-center gap-1"
                title="Copy User ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. FOUR PROFILE STATS ROW */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 mt-8 pt-6 border-t border-gray-100 text-center">
          <div className="p-3 rounded-2xl bg-gray-50/80 hover:bg-pink-50/50 transition-colors">
            <span className="block text-base sm:text-xl font-black text-gray-900">{user.friendsCount}</span>
            <span className="text-xs font-semibold text-gray-500">Friends</span>
          </div>
          <div className="p-3 rounded-2xl bg-gray-50/80 hover:bg-pink-50/50 transition-colors">
            <span className="block text-base sm:text-xl font-black text-gray-900">{user.followingCount}</span>
            <span className="text-xs font-semibold text-gray-500">Following</span>
          </div>
          <div className="p-3 rounded-2xl bg-gray-50/80 hover:bg-pink-50/50 transition-colors">
            <span className="block text-base sm:text-xl font-black text-gray-900">{(user.followersCount / 1000).toFixed(1)}k</span>
            <span className="text-xs font-semibold text-gray-500">Followers</span>
          </div>
          <div className="p-3 rounded-2xl bg-gray-50/80 hover:bg-pink-50/50 transition-colors">
            <span className="block text-base sm:text-xl font-black text-gray-900">{(user.visitorCount / 1000).toFixed(1)}k</span>
            <span className="text-xs font-semibold text-gray-500">Visitors</span>
          </div>
        </div>
      </div>

      {/* 3. COINS & POINTS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Coins Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 text-white shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-200" />
              <span className="text-xs font-bold uppercase tracking-wider text-yellow-100">
                Popo Coins
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              {coinBalance.toLocaleString()}
            </h3>
            <p className="text-[11px] text-yellow-100/90 font-medium">Available for sending gifts</p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onOpenAppModal) onOpenAppModal();
            }}
            className="px-4 py-2 rounded-2xl bg-white text-amber-800 text-xs font-black shadow-md hover:bg-yellow-50 active:scale-95 transition-transform"
          >
            Get Coins
          </button>
        </div>

        {/* Points Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-700 via-indigo-700 to-indigo-900 text-white shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-300" />
              <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
                Broadcaster Points
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              {wallet.pointsBalance.toLocaleString()}
            </h3>
            <p className="text-[11px] text-purple-200/90 font-medium">
              ≈ ${(wallet.withdrawableUsd || 485.0).toFixed(2)} USD Withdrawable
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowWithdrawModal(true)}
            className="px-4 py-2 rounded-2xl bg-white text-indigo-900 text-xs font-black shadow-md hover:bg-purple-50 active:scale-95 transition-transform"
          >
            Exchange
          </button>
        </div>
      </div>

      {/* 4. VIP PRIVILEGE BANNER */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-gray-900 via-purple-950 to-gray-900 text-white border border-purple-900/40 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-white shadow-md">
              <Crown className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight">VIP 3 · Crown Sovereign</h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Active (43 days left)
                </span>
              </div>
              <p className="text-xs text-gray-400">Exclusive gifts, entrance anims, and stealth browsing</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onOpenAppModal) onOpenAppModal();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
          >
            VIP Privileges
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-gray-400">
            <span>VIP Progress</span>
            <span className="text-amber-300 font-bold">7,200 / 10,000 pts (72%)</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full w-[72%]" />
          </div>
        </div>

        {/* 6 VIP Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
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

      {/* 5. EIGHT FEATURE ICONS */}
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

      {/* 6. STREAMER CENTER & BUILDER CENTER HUBS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Streamer Center Card */}
        <div className="p-6 rounded-3xl bg-white border border-gray-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-pink-50 text-[#FF1A6C] flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">Streamer Center</h3>
                <p className="text-[11px] text-gray-400">Broadcaster tasks, level perks, and earnings</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onOpenGoLive) onOpenGoLive();
              }}
              className="px-3 py-1.5 rounded-full bg-[#FF1A6C] hover:bg-[#e0125c] text-white text-xs font-black shadow-xs flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>+ Go Live</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Daily Host Tasks</span>
              <p className="font-extrabold text-gray-900">3 of 5 Completed</p>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="w-3/5 h-full bg-[#FF1A6C]" />
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Task Level</span>
              <p className="font-extrabold text-gray-900">Level 14 · Advanced</p>
              <span className="text-[10px] text-emerald-600 font-semibold">+15% Earning Boost</span>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Starter Pack</span>
              <p className="font-extrabold text-gray-900">Claimed (Active)</p>
              <span className="text-[10px] text-purple-600 font-semibold">Priority Broadcaster</span>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Earning Identity</span>
              <p className="font-extrabold text-gray-900">Verified Broadcaster</p>
              <span className="text-[10px] text-blue-600 font-semibold">KYC Level 2 Approved</span>
            </div>
          </div>
        </div>

        {/* Builder Center Card */}
        <div className="p-6 rounded-3xl bg-white border border-gray-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">Builder Center</h3>
                <p className="text-[11px] text-gray-400">Agency roster, coin sellers & withdrawals</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAgencyModal(true)}
              className="px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold transition"
            >
              My Agency
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Agency Details</span>
              <p className="font-extrabold text-gray-900 truncate">{agency.agencyName}</p>
              <span className="text-[10px] text-gray-500 font-mono">Code: {agency.agencyCode}</span>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Agency Members</span>
              <p className="font-extrabold text-gray-900">{agencyMembers.length} Broadcasters</p>
              <span className="text-[10px] text-emerald-600 font-semibold">Active Roster</span>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Coin Seller</span>
              <p className="font-extrabold text-gray-900 truncate">{coinSeller.sellerName}</p>
              <span className="text-[10px] text-gray-500">{coinSeller.whatsappContact}</span>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Withdrawable</span>
              <p className="font-extrabold text-emerald-600">${(wallet.withdrawableUsd || 485.0).toFixed(2)} USD</p>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(true)}
                className="text-[10px] text-[#FF1A6C] font-bold hover:underline"
              >
                Request Withdrawal →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 7. SEVEN LOWER MODULE ROWS */}
      <div className="p-6 rounded-3xl bg-white border border-gray-200/90 shadow-xs space-y-2">
        <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block mb-2">
          Account & Services
        </span>

        {/* Row 1: Help Topics */}
        <div
          onClick={() => setShowHelpModal(true)}
          className="p-3.5 rounded-2xl hover:bg-gray-50 flex items-center justify-between cursor-pointer transition border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800">Help Center & FAQ</h4>
              <p className="text-[10px] text-gray-400">8 comprehensive help topics and guidelines</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>

        {/* Row 2: Watch History */}
        <div
          onClick={() => showToast('Watch history: 8 live rooms visited this week')}
          className="p-3.5 rounded-2xl hover:bg-gray-50 flex items-center justify-between cursor-pointer transition border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800">Watch History</h4>
              <p className="text-[10px] text-gray-400">Review previously visited live streams</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>

        {/* Row 3: Level / Task Level */}
        <div
          onClick={() => showToast('Task Level 14: Next tier unlocks +20% gift rebate')}
          className="p-3.5 rounded-2xl hover:bg-gray-50 flex items-center justify-between cursor-pointer transition border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800">Task Level</h4>
              <p className="text-[10px] text-gray-400">Level 14 progress & broadcaster privileges</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>

        {/* Row 4: Achievement Poster */}
        <div
          onClick={() => showToast('Achievement Poster: Karachi Acoustic Champion 🏆')}
          className="p-3.5 rounded-2xl hover:bg-gray-50 flex items-center justify-between cursor-pointer transition border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800">Achievement Poster</h4>
              <p className="text-[10px] text-gray-400">Shareable creator milestone posters</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>

        {/* Row 5: Backpack / Bag */}
        <div
          onClick={() => showToast('Backpack: 2 exclusive avatar frames & 1 chat bubble')}
          className="p-3.5 rounded-2xl hover:bg-gray-50 flex items-center justify-between cursor-pointer transition border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800">Backpack & Inventory</h4>
              <p className="text-[10px] text-gray-400">Your store items, frames, and entrance carriages</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>

        {/* Row 6: My Agency */}
        <div
          onClick={() => setShowAgencyModal(true)}
          className="p-3.5 rounded-2xl hover:bg-gray-50 flex items-center justify-between cursor-pointer transition border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800">My Agency</h4>
              <p className="text-[10px] text-gray-400">Indus Star Media Agency (Code: AGY-78601)</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>

        {/* Row 7: Redeem Code */}
        <div
          onClick={() => {
            setRedeemResult(null);
            setRedeemInput('');
            setShowRedeemModal(true);
          }}
          className="p-3.5 rounded-2xl hover:bg-gray-50 flex items-center justify-between cursor-pointer transition border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800">Redeem Code</h4>
              <p className="text-[10px] text-gray-400">Enter voucher code for bonus coins</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* 8. POLICY BANNERS */}
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

      {/* ========================================================================= */}
      {/* MODAL 1: REDEEM CODE MODAL                                                */}
      {/* ========================================================================= */}
      {showRedeemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#FF1A6C]" />
                <h3 className="text-sm font-extrabold text-gray-900">Redeem Voucher Code</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRedeemModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Enter official promotional code to receive instant coin rewards.
              (Try test code: <strong className="text-pink-600 font-mono">POPO-WELCOME-2026</strong>)
            </p>

            <form onSubmit={handleRedeemCode} className="space-y-3">
              <input
                type="text"
                value={redeemInput}
                onChange={(e) => setRedeemInput(e.target.value)}
                placeholder="e.g. POPO-WELCOME-2026"
                className="w-full py-2.5 px-4 rounded-xl border border-gray-200 text-xs font-mono uppercase tracking-wider focus:outline-none focus:border-[#FF1A6C]"
              />

              {redeemResult && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    redeemResult.isValid
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  {redeemResult.isValid ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{redeemResult.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!redeemInput.trim()}
                className="w-full py-2.5 rounded-xl bg-[#FF1A6C] hover:bg-[#e0125c] disabled:opacity-40 text-white text-xs font-bold transition shadow-xs"
              >
                Redeem Code
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: HELP TOPICS MODAL                                               */}
      {/* ========================================================================= */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-extrabold text-gray-900">Help Center & FAQ</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {helpTopics.map((topic) => (
                <div key={topic.id} className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                  <span className="text-[10px] font-bold text-[#FF1A6C] uppercase">{topic.category}</span>
                  <h4 className="text-xs font-bold text-gray-900">{topic.question}</h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed">{topic.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: AGENCY MANAGEMENT MODAL                                         */}
      {/* ========================================================================= */}
      {showAgencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900">{agency.agencyName}</h3>
                  <span className="text-[10px] text-gray-500 font-mono">Leader: {agency.agentLeader} · Code: {agency.agencyCode}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAgencyModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h4 className="text-xs font-bold text-gray-700">Agency Broadcaster Roster:</h4>
            <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
              {agencyMembers.map((member) => (
                <div key={member.id} className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={member.avatarUrl} alt={member.nickname} className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-200" />
                    <div>
                      <h5 className="text-xs font-bold text-gray-900">{member.nickname}</h5>
                      <p className="text-[10px] text-gray-500">ID: {member.userId} · Lv.{member.hostLevel}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    member.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {member.status === 'active' ? 'Active Host' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DIAMOND WITHDRAWAL FORM                                         */}
      {/* ========================================================================= */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-gray-900">Exchange & Withdrawal</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawSuccess(false);
                }}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {withdrawSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <h4 className="text-base font-extrabold text-gray-900">Withdrawal Request Submitted</h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  $485.00 USD request has been routed to your authorized payment method (Bank Transfer / EasyPaisa).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setWithdrawSuccess(false);
                  }}
                  className="px-6 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex justify-between items-center">
                  <span className="text-gray-500">Available Points:</span>
                  <span className="font-bold text-gray-900">{wallet.pointsBalance.toLocaleString()} pts</span>
                </div>

                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex justify-between items-center">
                  <span className="text-gray-500">Withdrawable Cash:</span>
                  <span className="font-extrabold text-emerald-600 text-sm">${(wallet.withdrawableUsd || 485.0).toFixed(2)} USD</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600">Payout Method</label>
                  <select className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-800">
                    <option>Bank Transfer (Habib Bank Limited)</option>
                    <option>EasyPaisa Mobile Wallet</option>
                    <option>JazzCash Wallet</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setWithdrawSuccess(true)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                >
                  Submit Withdrawal Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebProfilePanel;
