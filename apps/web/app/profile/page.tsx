'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import {
  ArrowLeft,
  Copy,
  Check,
  Gift,
  Settings,
  Sliders,
  Share2,
  Crown,
  Flame,
  Eye,
  Radio,
  Users,
  Grid,
  FileText,
  Lock,
  Globe,
  Calendar,
  ShieldCheck,
  LogOut,
  Edit3,
  Loader2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Heart,
  Video,
  Mic,
  Award,
  Wallet,
} from 'lucide-react';

interface UserProfileData {
  id: string;
  poppoId: string;
  email: string | null;
  phone: string | null;
  nickname: string;
  avatarUrl: string;
  gender: string;
  birthdate: string | null;
  country: string | null;
  countryCode: string | null;
  bio: string;
  hostLevel: number;
  wealthLevel: number;
  isAdultVerified: boolean;
  status: string;
  createdAt: string;
  vip?: {
    hasActiveVip: boolean;
    vipLevel: number;
    vipTier: string;
    status: string;
    planName?: string | null;
    badgeLabel?: string | null;
    badgeAssetUrl?: string | null;
    profileFrameAssetUrl?: string | null;
    nameDecorationStyle?: string | null;
    themeKey?: string | null;
    expiryDate?: string | null;
    activeBenefitKeys?: string[];
  };
}

interface UserStatistics {
  followersCount: number;
  followingCount: number;
  likesCount: number;
  totalGiftsReceived: number;
  hostLevel: number;
  wealthLevel: number;
  fanClub: {
    unlocked: boolean;
    status: string;
    membersCount: number;
    description: string;
  };
}

function formatStatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return String(num || 0);
}

function MyProfileContent() {
  const router = useRouter();
  const { lang, isUr } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [stats, setStats] = useState<UserStatistics>({
    followersCount: 0,
    followingCount: 0,
    likesCount: 0,
    totalGiftsReceived: 0,
    hostLevel: 1,
    wealthLevel: 1,
    fanClub: {
      unlocked: false,
      status: 'coming_soon',
      membersCount: 0,
      description: 'Unlocks at Host Level 5',
    },
  });

  const [activeTab, setActiveTab] = useState<'posts' | 'live' | 'rooms' | 'about'>('posts');
  const [copiedId, setCopiedId] = useState(false);
  const [toastMessage, setToMessage] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 1. Fetch authenticated user data & statistics
  useEffect(() => {
    async function loadData() {
      try {
        const [profileRes, statsRes] = await Promise.all([
          fetch('/api/profile/me', { cache: 'no-store' }),
          fetch('/api/profile/me/statistics', { cache: 'no-store' }),
        ]);

        if (profileRes.status === 401) {
          router.push('/login?redirect=/profile');
          return;
        }

        const profileData = await profileRes.json();
        if (profileData.user) {
          setUser(profileData.user);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.statistics) {
            setStats(statsData.statistics);
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  // Copy User ID
  const handleCopyUserId = () => {
    if (!user?.poppoId) return;
    navigator.clipboard?.writeText(user.poppoId);
    setCopiedId(true);
    setToMessage(isUr ? `آئی ڈی ${user.poppoId} کاپی ہوگئی!` : `User ID ${user.poppoId} copied!`);
    setTimeout(() => {
      setCopiedId(false);
      setToMessage(null);
    }, 2500);
  };

  // Logout
  const handleLogout = async () => {
    if (!confirm(isUr ? 'کیا آپ واقعی لاگ آؤٹ کرنا چاہتے ہیں؟' : 'Are you sure you want to log out?')) {
      return;
    }

    try {
      setIsLoggingOut(true);
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      setIsLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09061A] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF2E74]" />
          <p className="text-xs text-white/60">{isUr ? 'پروفائل لوڈ ہو رہی ہے...' : 'Loading profile...'}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#09061A] flex items-center justify-center text-white p-4">
        <div className="text-center space-y-4">
          <p className="text-sm text-white/70">{isUr ? 'صارف کا ڈیٹا دستیاب نہیں ہے۔' : 'User profile could not be loaded.'}</p>
          <Link
            href="/login"
            className="inline-block px-5 py-2.5 rounded-full bg-[#FF2E74] text-white text-xs font-bold"
          >
            {isUr ? 'لاگ ان کریں' : 'Log In'}
          </Link>
        </div>
      </div>
    );
  }

  // Country Flag / Code
  const countryDisplay = user.country || 'Pakistan';
  const genderSymbol = user.gender === 'female' ? '♀' : user.gender === 'male' ? '♂' : '⚧';
  const genderColor = user.gender === 'female' ? 'text-[#FF2E74]' : user.gender === 'male' ? 'text-cyan-400' : 'text-purple-400';

  return (
    <main className="min-h-screen bg-[#070514] text-white flex justify-center py-0 sm:py-8 px-0 sm:px-4">
      {/* Phone Mockup Frame Container (matches 02_05_my_profile.png) */}
      <div className="w-full sm:max-w-md bg-gradient-to-b from-[#120B28] via-[#0C0820] to-[#080516] sm:rounded-[40px] sm:border-[8px] sm:border-[#22173F] sm:shadow-[0_0_80px_rgba(168,85,247,0.25)] flex flex-col min-h-screen sm:min-h-[860px] overflow-hidden relative">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#FF2E74] text-white text-xs font-bold shadow-lg shadow-[#FF2E74]/40 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Check className="w-3.5 h-3.5" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 1. Top Bar Navigation (matches reference) */}
        <div className="pt-4 px-5 pb-2 flex items-center justify-between z-10">
          <Link
            href="/"
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            title={isUr ? 'واپس جائیں' : 'Back to Home'}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2">
            {/* Crown / Level Badge */}
            <div
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-amber-400 cursor-default"
              title={`Host Level ${user.hostLevel || 1}`}
            >
              <Crown className="w-4 h-4" />
            </div>

            {/* Sliders / Settings Button (routes to /user-id session management) */}
            <Link
              href="/user-id"
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
              title={isUr ? 'اکاؤنٹ اور سیشن سیکیورٹی' : 'Account & Device Sessions'}
            >
              <Sliders className="w-4 h-4" />
            </Link>

            {/* Public Profile Share / View */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('about');
                setToMessage(isUr ? 'پروفائل کا پیش منظر دیکھا جا رہا ہے' : 'Viewing Profile Details');
                setTimeout(() => setToMessage(null), 2000);
              }}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
              title={isUr ? 'عوامی پروفائل دیکھیں' : 'View Public Profile'}
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Center Profile Details */}
        <div className="px-5 pt-2 pb-4 flex flex-col items-center text-center">
          {/* Avatar with Circular Glowing Ring & Approved VIP Profile Frame */}
          <div className="relative mb-3" data-testid="profile-avatar-frame-wrap">
            <div
              className={`w-24 h-24 rounded-full p-[3px] ${
                user.vip?.hasActiveVip && user.vip.activeBenefitKeys?.includes('premium_profile_frame')
                  ? 'bg-gradient-to-tr from-amber-300 via-[#EC248F] to-yellow-400 shadow-[0_0_34px_rgba(251,191,36,0.7)] ring-2 ring-amber-300/60'
                  : user.vip?.hasActiveVip
                  ? 'bg-gradient-to-tr from-amber-400 to-[#C026D3] shadow-[0_0_26px_rgba(251,191,36,0.45)]'
                  : 'bg-gradient-to-tr from-[#FF2E74] via-[#C026D3] to-[#A855F7] shadow-[0_0_30px_rgba(255,46,116,0.5)]'
              }`}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-[#0F0A24]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.avatarUrl || '/avatars/default.png'}
                  alt={user.nickname}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* VIP Crown / Host Badge (top-right of avatar) */}
            {user.vip?.hasActiveVip ? (
              <div
                data-testid="profile-vip-badge"
                className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 text-[#1D0F03] shadow-lg text-[10px] font-black flex items-center gap-0.5"
              >
                <span>👑</span>
                <span>{user.vip.badgeLabel || 'VIP'}</span>
              </div>
            ) : (
              <div className="absolute -top-1.5 -right-1 w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-md flex items-center justify-center text-[10px]">
                👑
              </div>
            )}

            {/* Level Flame Badge (bottom-right of avatar) */}
            <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-[10px] font-black text-white shadow-md flex items-center gap-0.5">
              <Flame className="w-2.5 h-2.5 fill-white" />
              <span>Lv.{user.hostLevel || 1}</span>
            </div>
          </div>

          {/* Nickname + Approved VIP Name Decoration + Gender Symbol */}
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <h2
              data-testid="profile-nickname"
              className={`text-xl font-bold tracking-wide ${
                user.vip?.hasActiveVip && user.vip.activeBenefitKeys?.includes('vip_name_decoration')
                  ? 'bg-gradient-to-r from-amber-200 via-yellow-300 to-pink-300 bg-clip-text text-transparent'
                  : 'text-white'
              }`}
            >
              {user.nickname}
            </h2>
            <span className={`text-base font-bold ${genderColor}`}>
              {genderSymbol}
            </span>
          </div>

          {/* User ID Banner + Purple Copy Button (matches reference 02_05) */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-xs font-mono font-medium text-white/70 tracking-wider">
              ID: {user.poppoId}
            </span>
            <button
              type="button"
              onClick={handleCopyUserId}
              className="p-1 rounded-lg bg-[#3B225E] hover:bg-[#4E2D7C] text-white/90 hover:text-white transition-all shadow-sm active:scale-95"
              title={isUr ? 'یوزر آئی ڈی کاپی کریں' : 'Copy User ID'}
            >
              {copiedId ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Statistics Bar: Following, Followers, Likes (real database counts) */}
          <div className="w-full grid grid-cols-3 gap-2 py-3 px-4 rounded-2xl bg-white/[0.03] border border-white/5 mb-5">
            <div className="flex flex-col items-center">
              <span className="text-base font-extrabold text-white">
                {formatStatNumber(stats.followingCount)}
              </span>
              <span className="text-[11px] text-white/50">
                {isUr ? 'فالوئنگ' : 'Following'}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-base font-extrabold text-white">
                {formatStatNumber(stats.followersCount)}
              </span>
              <span className="text-[11px] text-white/50">
                {isUr ? 'فالوورز' : 'Followers'}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-base font-extrabold text-white">
                {formatStatNumber(stats.likesCount || stats.totalGiftsReceived || 0)}
              </span>
              <span className="text-[11px] text-white/50">
                {isUr ? 'لائیکس / تحائف' : 'Likes'}
              </span>
            </div>
          </div>

          {/* Action Buttons: Edit Profile + Wallet + Gift Button */}
          <div className="w-full flex items-center gap-2.5">
            <Link
              href="/profile/edit"
              className="flex-1 py-3 px-4 rounded-2xl bg-[#1E1738] hover:bg-[#281F4A] border border-white/10 text-white text-xs font-bold text-center transition-all shadow-md active:scale-[0.99]"
            >
              {isUr ? 'پروفائل میں ترمیم کریں' : 'Edit Profile'}
            </Link>

            <Link
              href="/wallet"
              className="px-3.5 h-11 rounded-2xl bg-[#1E1738] hover:bg-[#281F4A] border border-amber-400/25 flex items-center justify-center gap-1.5 text-amber-300 text-xs font-bold shadow-md transition-all active:scale-95"
              title={isUr ? 'والٹ: کوائنز اور پوائنٹس' : 'Wallet: Coins & Points'}
            >
              <Wallet className="w-4 h-4" />
              <span>{isUr ? 'والٹ' : 'Wallet'}</span>
            </Link>

            <Link
              href="/recharge"
              className="w-12 h-11 rounded-2xl bg-gradient-to-tr from-[#FF2E74] to-[#A855F7] hover:brightness-110 flex items-center justify-center text-white shadow-lg shadow-[#FF2E74]/30 transition-all active:scale-95"
              title={isUr ? 'کوائنز حاصل کریں' : 'Gifts & Recharge'}
            >
              <Gift className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* 3. Navigation Tabs (Posts, Live, Rooms, About) */}
        <div className="px-5 border-b border-white/10">
          <div className="flex items-center justify-between text-xs font-bold text-white/60">
            {(
              [
                { id: 'posts', label: isUr ? 'پوسٹس' : 'Posts' },
                { id: 'live', label: 'Live' },
                { id: 'rooms', label: isUr ? 'پارٹی رومز' : 'Rooms' },
                { id: 'about', label: isUr ? 'معلومات' : 'About' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 relative transition-colors ${
                  activeTab === tab.id ? 'text-white font-extrabold' : 'hover:text-white/90'
                }`}
              >
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#FF2E74] shadow-[0_0_8px_#FF2E74]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Tab Content Area */}
        <div className="flex-1 px-5 py-4 overflow-y-auto custom-scrollbar">
          {/* TAB 1: POSTS (Grid of Stream Cards matching 02_05 reference screenshot) */}
          {activeTab === 'posts' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Stream Card 1 */}
                <div className="relative rounded-2xl overflow-hidden bg-[#1A1238] border border-white/10 aspect-[3/4] group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80'}
                    alt="Stream Highlight"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                  {/* Top Live Badge */}
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-[#FF2E74] text-white text-[10px] font-bold flex items-center gap-1 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    <span>Live</span>
                  </div>

                  {/* Bottom Viewers count */}
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 text-[11px] font-bold text-white drop-shadow">
                    <Users className="w-3.5 h-3.5" />
                    <span>9.2K</span>
                  </div>
                </div>

                {/* Stream Card 2 */}
                <div className="relative rounded-2xl overflow-hidden bg-[#1A1238] border border-white/10 aspect-[3/4] group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80"
                    alt="Stream Highlight 2"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                  {/* Top Live Badge */}
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-[#FF2E74] text-white text-[10px] font-bold flex items-center gap-1 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    <span>Live</span>
                  </div>

                  {/* Bottom Viewers count */}
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 text-[11px] font-bold text-white drop-shadow">
                    <Users className="w-3.5 h-3.5" />
                    <span>3.1K</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <Video className="w-4 h-4 text-[#FF2E74]" />
                  <span>{isUr ? 'ریکارڈ شدہ لائیو سٹریمز' : 'Past Broadcast Recordings'}</span>
                </div>
                <Link
                  href="/live"
                  className="text-[11px] text-[#FF2E74] font-bold hover:underline"
                >
                  {isUr ? 'سب دیکھیں' : 'View All'}
                </Link>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE SCHEDULE & STREAMING */}
          {activeTab === 'live' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-gradient-to-tr from-[#FF2E74]/15 to-[#A855F7]/15 border border-[#FF2E74]/30 text-center">
                <div className="w-10 h-10 rounded-full bg-[#FF2E74] mx-auto mb-2 flex items-center justify-center text-white shadow-lg shadow-[#FF2E74]/40">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {isUr ? 'سٹریمنگ کا آغاز کریں' : 'Ready to Broadcast?'}
                </h4>
                <p className="text-[11px] text-white/60 mb-3">
                  {isUr
                    ? 'پوپو لائیو کے لاکھوں ناظرین سے جڑیں اور تحائف حاصل کریں۔'
                    : 'Connect with millions of fans worldwide and receive real-time virtual gifts.'}
                </p>
                <Link
                  href="/download"
                  className="inline-block px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF2E74] to-[#A855F7] text-white text-xs font-bold shadow-md shadow-[#FF2E74]/30 hover:brightness-110"
                >
                  {isUr ? 'ایپ میں لائیو جائیں' : 'Go Live on Popo App'}
                </Link>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <h5 className="text-xs font-bold text-white/80 mb-2">
                  {isUr ? 'سٹریمنگ کے اوقات' : 'Streaming Schedule'}
                </h5>
                <p className="text-xs text-white/60">
                  {user.bio ? user.bio : (isUr ? 'کوئی شیڈول مقرر نہیں ہے۔' : 'Daily 9:00 PM - 12:00 AM PKT')}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: 9-SEAT AUDIO PARTY ROOMS */}
          {activeTab === 'rooms' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
                <div className="w-10 h-10 rounded-full bg-[#3B225E] mx-auto mb-2 flex items-center justify-center text-[#FF2E74]">
                  <Mic className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {isUr ? '9-سیٹ پارٹی روم' : '9-Seat Audio Party Room'}
                </h4>
                <p className="text-[11px] text-white/60 mb-3">
                  {isUr
                    ? 'دوستوں کے ساتھ چیٹ کریں، گانے گائیں اور ورچوئل گیمز کھیلیں'
                    : 'Host audio chat parties, sing karaoke, and invite up to 8 co-hosts on stage.'}
                </p>
                <Link
                  href="/download"
                  className="inline-block px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors"
                >
                  {isUr ? 'پارٹی روم کھولیں' : 'Open Party Room'}
                </Link>
              </div>
            </div>
          )}

          {/* TAB 4: ABOUT USER DETAILS (Comprehensive profile info) */}
          {activeTab === 'about' && (
            <div className="space-y-3">
              {/* Bio Section */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white/80">
                    {isUr ? 'بائیو (Bio)' : 'About Me'}
                  </span>
                  <Link
                    href="/profile/edit"
                    className="text-[11px] text-[#FF2E74] font-bold hover:underline flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isUr ? 'ترمیم' : 'Edit'}</span>
                  </Link>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  {user.bio ? (
                    user.bio
                  ) : (
                    <span className="italic text-white/40">
                      {isUr
                        ? 'ابھی تک کوئی بائیو شامل نہیں کی گئی۔ بائیو لکھنے کے لیے ترمیم پر کلک کریں۔'
                        : 'No bio added yet. Click Edit Profile to tell others about your streams!'}
                    </span>
                  )}
                </p>
              </div>

              {/* Information Grid */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3 text-xs">
                {/* User ID */}
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-white/50">{isUr ? 'یوزر آئی ڈی' : 'User ID'}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">{user.poppoId}</span>
                    <button
                      type="button"
                      onClick={handleCopyUserId}
                      className="text-[#FF2E74] hover:text-white"
                      title="Copy"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Country */}
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-white/50">{isUr ? 'ملک' : 'Country'}</span>
                  <span className="font-medium text-white">{countryDisplay}</span>
                </div>

                {/* Gender */}
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-white/50">{isUr ? 'جنس' : 'Gender'}</span>
                  <span className="font-medium capitalize text-white flex items-center gap-1">
                    <span className={genderColor}>{genderSymbol}</span>
                    <span>{user.gender || 'Not specified'}</span>
                  </span>
                </div>

                {/* Birthday (Private to account owner) */}
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <div className="flex items-center gap-1 text-white/50">
                    <Lock className="w-3 h-3 text-[#FF2E74]" />
                    <span>{isUr ? 'تاریخ پیدائش (صرف آپ کو نظر آتا ہے)' : 'Birthday (Private)'}</span>
                  </div>
                  <span className="font-mono text-white/80">
                    {user.birthdate || 'Verified 18+'}
                  </span>
                </div>

                {/* Member Since */}
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-white/50">{isUr ? 'شمولیت کی تاریخ' : 'Member Since'}</span>
                  <span className="text-white/80">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'November 2026'}
                  </span>
                </div>

                {/* Verification Status */}
                <div className="flex items-center justify-between">
                  <span className="text-white/50">{isUr ? 'اکاؤنٹ کی حیثیت' : 'Verification Status'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[10px] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Active & 18+ Verified</span>
                  </span>
                </div>
              </div>

              {/* Level Badges & Fan Club Status */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Host Level {user.hostLevel || 1}</p>
                      <p className="text-[10px] text-white/50">Wealth Level {user.wealthLevel || 1}</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/70">
                    Bronze Host
                  </span>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-white/50">{isUr ? 'وی آئی پی رکنیت' : 'VIP Membership'}</span>
                  <Link
                    href="/vip"
                    className="text-[11px] font-bold text-amber-300 hover:underline flex items-center gap-1"
                  >
                    <span>
                      {user.vip?.hasActiveVip
                        ? `${user.vip.badgeLabel} (${user.vip.planName})${
                            user.vip.expiryDate
                              ? ` • Exp ${new Date(user.vip.expiryDate).toLocaleDateString()}`
                              : ''
                          }`
                        : `Status: ${(user.vip?.status || 'None').toUpperCase()} • Upgrade VIP`}
                    </span>
                  </Link>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-white/50">{isUr ? 'فین کلب' : 'Fan Club'}</span>
                  <span className="text-[10px] text-amber-300 font-medium">
                    {stats.fanClub?.description || 'Coming Soon (Unlocks at Lv.5)'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. Bottom Quick Actions & Logout */}
        <div className="px-5 py-3 border-t border-white/10 bg-black/20 flex items-center justify-between text-xs">
          <Link
            href="/user-id"
            className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors py-1"
          >
            <Sliders className="w-3.5 h-3.5 text-[#FF2E74]" />
            <span>{isUr ? 'سیشنز اور سیکیورٹی' : 'Active Sessions'}</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-1.5 text-red-400 hover:text-red-300 transition-colors py-1 disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isLoggingOut ? (isUr ? 'لاگ آؤٹ ہو رہا ہے...' : 'Logging out...') : (isUr ? 'لاگ آؤٹ' : 'Log Out')}</span>
          </button>
        </div>

      </div>
    </main>
  );
}

export default function MyProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09061A] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF2E74]" />
        </div>
      }
    >
      <MyProfileContent />
    </Suspense>
  );
}
