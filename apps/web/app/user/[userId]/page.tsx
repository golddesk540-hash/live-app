'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import {
  ArrowLeft,
  MoreHorizontal,
  Copy,
  Check,
  Heart,
  MessageCircle,
  Share2,
  ShieldAlert,
  Slash,
  Crown,
  Flame,
  Users,
  Radio,
  Video,
  Image as ImageIcon,
  Info,
  Calendar,
  Globe,
  ShieldCheck,
  Lock,
  Loader2,
  AlertCircle,
  X,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface PublicProfile {
  id: string;
  poppoId: string;
  nickname: string;
  avatarUrl: string;
  country: string;
  countryCode: string;
  gender: string;
  bio: string;
  hostLevel: number;
  wealthLevel: number;
  shiningLevel?: number;
  honorLevel?: number;
  isAdultVerified: boolean;
  memberSince: string;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  likesCount: number;
  isFollowing: boolean;
  isBlocked: boolean;
  hasBlockedViewer: boolean;
  isSelf: boolean;
  vip?: {
    hasActiveVip: boolean;
    vipLevel: number;
    vipTier: string;
    status: string;
    planName?: string | null;
    badgeLabel?: string | null;
    profileFrameAssetUrl?: string | null;
    nameDecorationStyle?: string | null;
    activeBenefitKeys?: string[];
  };
  recognition?: {
    wealth: { levelNumber: number; levelName: string; progressPercent: number; approvedBenefits: Array<{ benefitKey: string; title: string }> };
    shining: { levelNumber: number; levelName: string; progressPercent: number; approvedBenefits: Array<{ benefitKey: string; title: string }> };
    honor: { levelNumber: number; levelName: string; progressPercent: number; approvedBenefits: Array<{ benefitKey: string; title: string }> };
  };
  storeEquipment?: {
    profileFrame?: { itemId: string; name: string; previewImageUrl: string } | null;
    nameDecoration?: { itemId: string; name: string; visualStyle?: any } | null;
    specialBadge?: { itemId: string; name: string; visualStyle?: any } | null;
  };
}

function formatStat(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return String(num || 0);
}

function PublicProfileContent() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const { lang, isUr } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Interaction states
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'live' | 'videos' | 'photos' | 'about'>('live');

  // Modals & Menus
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('harassment');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);

  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Fetch public profile data
  useEffect(() => {
    async function loadPublicProfile() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/users/${encodeURIComponent(userId)}/public-profile`, {
          cache: 'no-store',
        });

        if (res.status === 404) {
          setError(isUr ? 'یہ صارف اکاؤنٹ موجود نہیں ہے۔' : 'This user profile was not found.');
          return;
        }

        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
          setIsFollowing(data.profile.isFollowing);
          setFollowersCount(data.profile.followersCount);
        } else {
          setError(data.error || 'Failed to load profile.');
        }
      } catch (err: any) {
        console.error('Error loading public profile:', err);
        setError('Network error loading profile.');
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      loadPublicProfile();
    }
  }, [userId, isUr]);

  // 2. Handle Follow / Unfollow
  const handleFollowToggle = async () => {
    if (!profile) return;

    if (profile.isSelf) {
      router.push('/profile/edit');
      return;
    }

    try {
      setFollowLoading(true);
      const method = isFollowing ? 'DELETE' : 'POST';
      const res = await fetch(`/api/users/${encodeURIComponent(profile.id)}/follow`, {
        method,
      });

      if (res.status === 401) {
        router.push(`/login?redirect=/user/${profile.poppoId}`);
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to update follow status.');
        return;
      }

      setIsFollowing(data.isFollowing);
      setFollowersCount(data.followersCount);
      showToast(data.message || (isFollowing ? 'Unfollowed' : 'Following'));
    } catch (err) {
      showToast('Error updating follow status.');
    } finally {
      setFollowLoading(false);
    }
  };

  // 3. Handle Copy User ID
  const handleCopyId = () => {
    if (!profile?.poppoId) return;
    navigator.clipboard?.writeText(profile.poppoId);
    setCopiedId(true);
    showToast(isUr ? `آئی ڈی ${profile.poppoId} کاپی ہوگئی!` : `User ID ${profile.poppoId} copied!`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // 4. Handle Share Profile
  const handleShareProfile = async () => {
    setIsMenuOpen(false);
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.nickname} on Popo Live`,
          text: `Check out ${profile?.nickname}'s live streams and rooms on Popo Live!`,
          url: shareUrl,
        });
        return;
      } catch (e) {}
    }
    navigator.clipboard?.writeText(shareUrl);
    showToast(isUr ? 'پروفائل کا لنک کاپی ہو گیا!' : 'Profile link copied to clipboard!');
  };

  // 5. Submit Report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      setIsSubmittingReport(true);
      const res = await fetch(`/api/users/${encodeURIComponent(profile.id)}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reportReason,
          description: reportDescription,
        }),
      });

      if (res.status === 401) {
        router.push(`/login?redirect=/user/${profile.poppoId}`);
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to submit report.');
        return;
      }

      setIsReportModalOpen(false);
      setReportDescription('');
      showToast(isUr ? 'رپورٹ موصول ہوگئی ہے۔ شکریہ!' : 'Report submitted. Thank you for keeping Popo Live safe.');
    } catch (err) {
      showToast('Network error submitting report.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // 6. Submit Block User
  const handleSubmitBlock = async () => {
    if (!profile) return;
    try {
      setIsSubmittingBlock(true);
      const res = await fetch(`/api/users/${encodeURIComponent(profile.id)}/block`, {
        method: 'POST',
      });

      if (res.status === 401) {
        router.push(`/login?redirect=/user/${profile.poppoId}`);
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to block user.');
        return;
      }

      setIsBlockModalOpen(false);
      showToast(isUr ? 'صارف کو بلاک کر دیا گیا۔' : 'User blocked successfully.');
      setTimeout(() => router.push('/'), 1200);
    } catch (err) {
      showToast('Network error blocking user.');
    } finally {
      setIsSubmittingBlock(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070514] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF2E74]" />
          <p className="text-xs text-white/60">{isUr ? 'پروفائل لوڈ ہو رہی ہے...' : 'Loading profile...'}</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#070514] flex items-center justify-center text-white p-4">
        <div className="max-w-xs text-center space-y-4 p-6 rounded-3xl bg-white/[0.03] border border-white/10">
          <AlertCircle className="w-10 h-10 text-[#FF2E74] mx-auto" />
          <h2 className="text-base font-bold text-white">{error || 'User Not Found'}</h2>
          <p className="text-xs text-white/60">
            {isUr ? 'صارف موجود نہیں ہے یا اکاؤنٹ غیر فعال ہے۔' : 'The requested profile does not exist or has been suspended.'}
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-full bg-[#FF2E74] text-white text-xs font-bold shadow-md shadow-[#FF2E74]/30"
          >
            {isUr ? 'ہوم پیج پر جائیں' : 'Back to Home'}
          </Link>
        </div>
      </div>
    );
  }

  const genderSymbol = profile.gender === 'female' ? '♀' : profile.gender === 'male' ? '♂' : '⚧';
  const genderColor = profile.gender === 'female' ? 'text-[#FF2E74]' : profile.gender === 'male' ? 'text-cyan-400' : 'text-purple-400';

  return (
    <main className="min-h-screen bg-[#070514] text-white flex justify-center py-0 sm:py-8 px-0 sm:px-4">
      {/* Phone Mockup Frame Container (matches 02_06_public_profile.png) */}
      <div className="w-full sm:max-w-md bg-gradient-to-b from-[#180E35] via-[#0E0922] to-[#070514] sm:rounded-[40px] sm:border-[8px] sm:border-[#22173F] sm:shadow-[0_0_80px_rgba(168,85,247,0.25)] flex flex-col min-h-screen sm:min-h-[860px] overflow-hidden relative">

        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#FF2E74] text-white text-xs font-bold shadow-lg shadow-[#FF2E74]/40 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Check className="w-3.5 h-3.5" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 1. Top Bar Navigation (matches 02_06 reference) */}
        <div className="absolute top-0 inset-x-0 pt-4 px-5 pb-2 flex items-center justify-between z-20">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 flex items-center justify-center text-white transition-colors"
            title={isUr ? 'واپس جائیں' : 'Go Back'}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* More Options Menu button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 flex items-center justify-center text-white transition-colors"
              title={isUr ? 'مزید آپشنز' : 'More Options'}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#181135] border border-white/15 p-1.5 shadow-2xl z-30 animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={handleShareProfile}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#FF2E74]" />
                  <span>{isUr ? 'پروفائل شیئر کریں' : 'Share Profile'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleCopyId();
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isUr ? 'یوزر آئی ڈی کاپی کریں' : 'Copy User ID'}</span>
                </button>

                {!profile.isSelf && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsReportModalOpen(true);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-medium text-amber-400 hover:bg-amber-500/10 rounded-xl flex items-center gap-2 transition-colors"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>{isUr ? 'صارف کی رپورٹ کریں' : 'Report User'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsBlockModalOpen(true);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-xl flex items-center gap-2 transition-colors"
                    >
                      <Slash className="w-3.5 h-3.5" />
                      <span>{isUr ? 'صارف کو بلاک کریں' : 'Block User'}</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. Hero Portrait / Cover Background (matches reference) */}
        <div className="relative w-full h-80 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80'}
            alt={profile.nickname}
            className="w-full h-full object-cover object-top"
          />
          {/* Smooth Gradient Overlay fading seamlessly into dark purple */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E0922] via-[#0E0922]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-[#0E0922]" />

          {/* User Name & Details overlayed on Hero Cover */}
          <div className="absolute bottom-2 inset-x-0 px-5 text-left">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1
                data-testid="public-profile-nickname"
                className={`text-2xl font-extrabold tracking-wide drop-shadow-md ${
                  profile.storeEquipment?.nameDecoration
                    ? profile.storeEquipment.nameDecoration.visualStyle?.nameClass ||
                      'bg-gradient-to-r from-pink-300 via-amber-200 to-fuchsia-300 bg-clip-text text-transparent'
                    : profile.vip?.hasActiveVip && profile.vip.activeBenefitKeys?.includes('vip_name_decoration')
                    ? 'bg-gradient-to-r from-amber-200 via-yellow-300 to-pink-300 bg-clip-text text-transparent'
                    : 'text-white'
                }`}
              >
                {profile.nickname}
              </h1>
              {profile.storeEquipment?.specialBadge && (
                <span
                  data-testid="public-profile-store-badge"
                  className="px-2 py-0.5 rounded-full bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white text-[10px] font-black shadow-md"
                >
                  {profile.storeEquipment.specialBadge.visualStyle?.badgeLabel || profile.storeEquipment.specialBadge.name}
                </span>
              )}
              {profile.vip?.hasActiveVip && profile.vip.badgeLabel && (
                <span
                  data-testid="public-profile-vip-badge"
                  className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 text-[#1D0F03] text-[10px] font-black shadow-md"
                >
                  👑 {profile.vip.badgeLabel}
                </span>
              )}
              <span className={`text-xl font-bold ${genderColor}`}>
                {genderSymbol}
              </span>
            </div>

            {/* Level Badge + User ID + Copy Icon (matches reference 02_06) */}
            <div className="flex items-center gap-2">
              {/* Pink Star / Crown badge */}
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#FF2E74] to-[#C026D3] flex items-center justify-center text-white text-[11px] shadow-sm">
                ★
              </div>

              <span className="text-xs font-mono font-medium text-white/80 tracking-wider drop-shadow">
                ID: {profile.poppoId}
              </span>

              <button
                type="button"
                onClick={handleCopyId}
                className="text-white/60 hover:text-white transition-colors"
                title={isUr ? 'آئی ڈی کاپی کریں' : 'Copy ID'}
              >
                {copiedId ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 3. Stats Row (Following, Followers, Likes) */}
        <div className="px-5 pt-3 pb-4">
          <div className="grid grid-cols-3 gap-2 text-center py-2 border-b border-white/10">
            {/* Following Count (Clickable to /following) */}
            <Link
              href={`/user/${profile.poppoId}/following`}
              className="flex flex-col items-center hover:opacity-80 transition-opacity"
            >
              <span className="text-base font-extrabold text-white">
                {formatStat(profile.followingCount)}
              </span>
              <span className="text-[11px] text-white/50">
                {isUr ? 'فالوئنگ' : 'Following'}
              </span>
            </Link>

            {/* Followers Count (Clickable to /followers) */}
            <Link
              href={`/user/${profile.poppoId}/followers`}
              className="flex flex-col items-center hover:opacity-80 transition-opacity"
            >
              <span className="text-base font-extrabold text-white">
                {formatStat(followersCount)}
              </span>
              <span className="text-[11px] text-white/50">
                {isUr ? 'فالوورز' : 'Followers'}
              </span>
            </Link>

            {/* Likes Count */}
            <div className="flex flex-col items-center">
              <span className="text-base font-extrabold text-white">
                {formatStat(profile.likesCount || 1200000)}
              </span>
              <span className="text-[11px] text-white/50">
                {isUr ? 'لائیکس' : 'Likes'}
              </span>
            </div>
          </div>

          {/* 4. Action Buttons: Follow / Following + Message (matches reference) */}
          <div className="flex items-center gap-3 mt-4">
            {profile.isSelf ? (
              <Link
                href="/profile/edit"
                className="flex-1 py-3 rounded-2xl bg-[#FF2E74] hover:bg-[#E02664] text-white text-xs font-bold text-center shadow-lg shadow-[#FF2E74]/30 transition-all"
              >
                {isUr ? 'پروفائل میں ترمیم کریں' : 'Edit Profile'}
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`flex-1 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-[0.99] disabled:opacity-50 ${
                  isFollowing
                    ? 'bg-white/10 hover:bg-white/15 text-white/90 border border-white/15'
                    : 'bg-gradient-to-r from-[#FF2E74] to-[#D92662] hover:brightness-110 text-white shadow-lg shadow-[#FF2E74]/30'
                }`}
              >
                {followLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isFollowing ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{isUr ? 'فالو کیا ہوا' : 'Following'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isUr ? 'فالو کریں' : 'Follow'}</span>
                  </>
                )}
              </button>
            )}

            {/* Message Button (Connects to Phase 8) */}
            <button
              type="button"
              onClick={() => setIsMessageModalOpen(true)}
              className="flex-1 py-3 rounded-2xl bg-[#1E1738] hover:bg-[#281F4A] border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-[0.99]"
            >
              <MessageCircle className="w-4 h-4 text-white/80" />
              <span>{isUr ? 'میسج' : 'Message'}</span>
            </button>
          </div>
        </div>

        {/* 5. Navigation Tabs (Live, Videos, Photos, About) */}
        <div className="px-5 border-b border-white/10">
          <div className="flex items-center justify-around text-xs font-bold text-white/60">
            {(
              [
                { id: 'live', label: 'Live' },
                { id: 'videos', label: isUr ? 'ویڈیوز' : 'Videos' },
                { id: 'photos', label: isUr ? 'تصاویر' : 'Photos' },
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

        {/* 6. Tab Content Area */}
        <div className="flex-1 px-5 py-4 overflow-y-auto custom-scrollbar">
          {/* TAB 1: LIVE (Grid matching 02_06 reference) */}
          {activeTab === 'live' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Live Card 1 */}
                <div className="relative rounded-2xl overflow-hidden bg-[#1A1238] border border-white/10 aspect-[3/4] group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80"
                    alt="Live Stream 1"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-[#FF2E74] text-white text-[10px] font-bold flex items-center gap-1 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    <span>Live</span>
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 text-[11px] font-bold text-white drop-shadow">
                    <Users className="w-3.5 h-3.5" />
                    <span>12.4K</span>
                  </div>
                </div>

                {/* Live Card 2 */}
                <div className="relative rounded-2xl overflow-hidden bg-[#1A1238] border border-white/10 aspect-[3/4] group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80"
                    alt="Live Stream 2"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-[#FF2E74] text-white text-[10px] font-bold flex items-center gap-1 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    <span>Live</span>
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 text-[11px] font-bold text-white drop-shadow">
                    <Users className="w-3.5 h-3.5" />
                    <span>8.9K</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VIDEOS / POSTS */}
          {activeTab === 'videos' && (
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 text-center space-y-2">
              <Video className="w-8 h-8 text-[#FF2E74] mx-auto opacity-70" />
              <p className="text-xs font-bold text-white/80">{isUr ? 'کوئی ویڈیو ریکارڈنگ دستیاب نہیں' : 'No Recorded Broadcasts'}</p>
              <p className="text-[11px] text-white/50">
                {isUr ? 'جب یہ میزبان لائیو نشریات مکمل کریں گے، وہ یہاں دکھائی دیں گی۔' : 'Recorded stream highlights will appear here after live broadcasts.'}
              </p>
            </div>
          )}

          {/* TAB 3: PHOTOS */}
          {activeTab === 'photos' && (
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 text-center space-y-2">
              <ImageIcon className="w-8 h-8 text-[#FF2E74] mx-auto opacity-70" />
              <p className="text-xs font-bold text-white/80">{isUr ? 'کوئی تصویر پوسٹ نہیں کی گئی' : 'No Photos Shared'}</p>
              <p className="text-[11px] text-white/50">
                {isUr ? 'سٹریمر نے ابھی تک کوئی فوٹو البم شیئر نہیں کیا۔' : 'Streamer has not uploaded photo albums yet.'}
              </p>
            </div>
          )}

          {/* TAB 4: ABOUT DETAILS (Public information only) */}
          {activeTab === 'about' && (
            <div className="space-y-3">
              {/* Bio */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-xs font-bold text-white/80 block mb-1">
                  {isUr ? 'سٹریمر بائیو' : 'Streamer Bio'}
                </span>
                <p className="text-xs text-white/70 leading-relaxed">
                  {profile.bio || (isUr ? 'اس صارف نے ابھی تک کوئی بائیو شامل نہیں کیا۔' : 'No bio provided yet.')}
                </p>
              </div>

              {/* Public Attributes */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-white/50">{isUr ? 'یوزر آئی ڈی' : 'User ID'}</span>
                  <span className="font-mono font-bold text-white">{profile.poppoId}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-white/50">{isUr ? 'ملک' : 'Country'}</span>
                  <span className="font-medium text-white">{profile.country}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-white/50">{isUr ? 'جنس' : 'Gender'}</span>
                  <span className="font-medium capitalize text-white flex items-center gap-1">
                    <span className={genderColor}>{genderSymbol}</span>
                    <span>{profile.gender}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-white/50">{isUr ? 'شمولیت' : 'Member Since'}</span>
                  <span className="text-white/80">{profile.memberSince}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-white/50">{isUr ? 'اکاؤنٹ کی توثیق' : 'Account Verification'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[10px] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Age 18+ Verified</span>
                  </span>
                </div>
              </div>

              {/* Module 7.8: Separate Wealth, Shining & Honor Public Recognition Card */}
              {profile.recognition && (
                <div
                  data-testid="public-profile-recognition-card"
                  className="p-3.5 rounded-2xl bg-[#150B33] border border-purple-400/25 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs font-extrabold text-purple-200">
                    <span>{isUr ? 'دولت، شائننگ اور اعزاز (7.8)' : 'Wealth, Shining & Honor'}</span>
                    <span className="text-[10px] text-white/50">VIP Independent</span>
                  </div>
                  {(
                    [
                      { key: 'wealth', label: isUr ? 'دولت' : 'Wealth', badge: 'text-amber-300', bar: 'from-amber-400 to-yellow-500', data: profile.recognition.wealth },
                      { key: 'shining', label: isUr ? 'شائننگ' : 'Shining', badge: 'text-pink-300', bar: 'from-[#FF2E74] to-[#EC4899]', data: profile.recognition.shining },
                      { key: 'honor', label: isUr ? 'اعزاز' : 'Honor', badge: 'text-emerald-300', bar: 'from-emerald-400 to-cyan-400', data: profile.recognition.honor },
                    ] as const
                  ).map((c) => (
                    <div key={c.key} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={`font-bold ${c.badge}`}>
                          {c.label} Lv.{c.data.levelNumber} • {c.data.levelName}
                        </span>
                        <span className="text-white/60 font-mono">{c.data.progressPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${c.bar}`} style={{ width: `${c.data.progressPercent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Privacy Notice Card */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-2 text-[11px] text-white/40">
                <Lock className="w-3.5 h-3.5 shrink-0 text-[#FF2E74]" />
                <span>
                  {isUr
                    ? 'صارف کی ذاتی تاریخ پیدائش، ای میل اور فون نمبر رازداری کے قواعد کے تحت محفوظ ہیں۔'
                    : 'Private birthday, email and phone numbers are strictly protected under Popo Live Privacy Policies.'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 7. Bottom Navigation to Followers / Following */}
        <div className="px-5 py-3 border-t border-white/10 bg-black/20 flex items-center justify-between text-xs">
          <Link
            href={`/user/${profile.poppoId}/followers`}
            className="flex items-center gap-1 text-white/70 hover:text-white transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-[#FF2E74]" />
            <span>{isUr ? 'فالوورز کی فہرست دیکھیں' : 'View Followers'}</span>
          </Link>

          <Link
            href={`/user/${profile.poppoId}/following`}
            className="flex items-center gap-1 text-white/70 hover:text-white transition-colors"
          >
            <span>{isUr ? 'فالوئنگ کی فہرست دیکھیں' : 'View Following'}</span>
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
          </Link>
        </div>

      </div>

      {/* MODAL 1: MESSAGE (PHASE 8 COMING SOON NOTICE) */}
      {isMessageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#181135] border border-white/15 p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#FF2E74] to-[#A855F7] mx-auto mb-3 flex items-center justify-center text-white shadow-lg shadow-[#FF2E74]/40">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              {isUr ? 'براہ راست میسجنگ جلد دستیاب ہوگی' : 'Direct Messaging Coming Soon'}
            </h3>
            <p className="text-xs text-white/60 mb-5 leading-relaxed">
              {isUr
                ? 'فیز 8 میں چیٹ اور براہ راست میسجز فعال ہوں گے۔ اس دوران لائیو سٹریمز میں کمنٹس اور تحائف کے ذریعے رابطہ کریں۔'
                : 'Direct messaging and live chat inbox will be activated in Phase 8. You can interact with this streamer by joining their live streams and party rooms!'}
            </p>
            <button
              type="button"
              onClick={() => setIsMessageModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#FF2E74] text-white text-xs font-bold shadow-md shadow-[#FF2E74]/30"
            >
              {isUr ? 'سمجھ گیا' : 'Got It'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: REPORT USER */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#181135] border border-white/15 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2 text-amber-400">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">{isUr ? 'اکاؤنٹ کی رپورٹ کریں' : 'Report User'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="p-1 rounded-full text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">
                  {isUr ? 'رپورٹ کی وجہ' : 'Reason for report'}
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-[#FF2E74]"
                >
                  <option value="harassment" className="bg-[#181135]">Harassment / Bullying</option>
                  <option value="inappropriate_content" className="bg-[#181135]">Inappropriate / NSFW Content</option>
                  <option value="spam_fraud" className="bg-[#181135]">Spam, Scam or Financial Fraud</option>
                  <option value="underage_streamer" className="bg-[#181135]">Underage User (Under 18)</option>
                  <option value="impersonation" className="bg-[#181135]">Impersonation / Fake Account</option>
                  <option value="other" className="bg-[#181135]">Other Safety Violation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">
                  {isUr ? 'تفصیل (اختیاری)' : 'Details (Optional)'}
                </label>
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Provide any additional context or incident timestamps..."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF2E74] resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors"
                >
                  {isUr ? 'منسوخ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSubmittingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>{isUr ? 'رپورٹ جمع کریں' : 'Submit Report'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: BLOCK USER CONFIRMATION */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#181135] border border-white/15 p-6 shadow-2xl text-center">
            <Slash className="w-10 h-10 text-red-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-white mb-1">
              {isUr ? `کیا آپ ${profile.nickname} کو بلاک کرنا چاہتے ہیں؟` : `Block ${profile.nickname}?`}
            </h3>
            <p className="text-xs text-white/60 mb-5 leading-relaxed">
              {isUr
                ? 'یہ صارف آپ کے لائیو سٹریمز، رومز یا پروفائل کو نہیں دیکھ سکے گا۔ فالو تعلقات خودکار طور پر ختم کر دیے جائیں گے۔'
                : 'Blocked users cannot view your streams, visit your party rooms, or interact with you. Any existing follow relationships will be severed.'}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBlockModalOpen(false)}
                className="w-1/2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors"
              >
                {isUr ? 'منسوخ' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSubmitBlock}
                disabled={isSubmittingBlock}
                className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isSubmittingBlock ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>{isUr ? 'بلاک کریں' : 'Confirm Block'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

export default function PublicProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070514] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF2E74]" />
        </div>
      }
    >
      <PublicProfileContent />
    </Suspense>
  );
}
