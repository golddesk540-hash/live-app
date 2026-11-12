'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import { useUnreadNotificationsCount } from '@/components/notifications/useUnreadNotificationsCount';
import {
  COUNTRIES_LIST,
  POPULAR_COUNTRY_SHORTCUTS,
  getCountryFlag,
  getCountryName,
} from '@/lib/countries';
import {
  Search,
  Coins,
  Download,
  Radio,
  Users,
  Heart,
  MessageSquare,
  User,
  Compass,
  Swords,
  Trophy,
  Flame,
  Camera,
  ArrowLeft,
  Sparkles,
  ChevronRight,
  ChevronDown,
  LogOut,
  Settings,
  Shield,
  HelpCircle,
  Eye,
  Loader2,
  X,
  ExternalLink,
  Check,
  UserCheck,
  Calendar,
  Clock,
  LogIn,
  UserPlus,
  Globe,
  Filter,
  RefreshCw,
  MapPin,
  Bell,
  Crown,
  VideoOff,
  ShieldCheck,
  ListTodo,
} from 'lucide-react';
import LiveRoomCard from './LiveRoomCard';
import PartyRoomCard, { PartyRoomItem } from './PartyRoomCard';
import FollowingUserCard, { FollowedUserItem } from './FollowingUserCard';
import NearScreen from './NearScreen';
import DiscoveryBannerCarousel from './DiscoveryBannerCarousel';
import RankDoorSection from './RankDoorSection';
import RankingPreviewSection from './RankingPreviewSection';
import { NEAR_FEATURE_ENABLED } from '@/lib/featureFlags';

export type DiscoveryTab = 'explore' | 'following' | 'new' | 'pk' | 'party' | 'near';

interface RoomItem {
  roomId: string;
  roomNumber: string;
  title: string;
  coverUrl: string;
  category: string;
  status?: string;
  isLive: boolean;
  isPk: boolean;
  viewerCount: number;
  viewersFormatted: string;
  coinsEarned: number;
  coinsFormatted: string;
  country: string;
  countryCode: string;
  flagEmoji: string;
  tags?: string[];
  host: {
    id: string;
    nickname: string;
    poppoId: string;
    avatarUrl: string;
    hostLevel?: number;
    wealthLevel?: number;
    isVerified?: boolean;
  };
  pkDetails?: {
    pkId: string;
    title: string;
    status: string;
    votesHost?: number;
    votesOpponent?: number;
    pointsHost?: number;
    pointsOpponent?: number;
    opponent?: {
      id: string;
      nickname: string;
      avatarUrl: string;
      poppoId: string;
    } | null;
  } | null;
}

interface NewCreatorItem {
  id: string;
  poppoId: string;
  nickname: string;
  avatarUrl: string;
  country: string;
  countryCode: string;
  flagEmoji: string;
  hostLevel: number;
  wealthLevel: number;
  isVerified: boolean;
  createdAt: string;
  joinedFormatted: string;
  isLive: boolean;
  liveRoom?: {
    roomId: string;
    roomNumber: string;
    title: string;
    viewerCount: number;
    viewersFormatted: string;
  } | null;
  profileUrl: string;
}

interface PkBattleItem {
  id: string;
  roomId?: string | null;
  roomNumber?: string;
  title: string;
  status: 'active' | 'upcoming' | 'completed';
  isLiveRoom: boolean;
  viewerCount: number;
  viewersFormatted: string;
  startedAt: string;
  endedAt?: string | null;
  hostA: {
    id: string;
    nickname: string;
    poppoId: string;
    avatarUrl: string;
    hostLevel: number;
    countryCode: string;
    flagEmoji: string;
    votes: number;
    points: number;
    pointsFormatted: string;
  };
  hostB: {
    id: string;
    nickname: string;
    poppoId: string;
    avatarUrl: string;
    hostLevel: number;
    countryCode: string;
    flagEmoji: string;
    votes: number;
    points: number;
    pointsFormatted: string;
  };
  watchUrl?: string | null;
}

interface FollowingFeedData {
  authenticated: boolean;
  message?: string;
  isDemo?: boolean;
  users?: FollowedUserItem[];
  liveRooms: RoomItem[];
  offlineUsers: Array<{
    userId: string;
    nickname: string;
    poppoId: string;
    avatarUrl: string;
    country: string;
    countryCode: string;
    flagEmoji: string;
    hostLevel: number;
    isFollowing: boolean;
  }>;
  suggestedHosts: Array<{
    roomId: string;
    roomNumber: string;
    title: string;
    coverUrl: string;
    viewersFormatted: string;
    flagEmoji: string;
    host: {
      id: string;
      nickname: string;
      poppoId: string;
      avatarUrl: string;
      hostLevel: number;
    };
  }>;
  totalFollowed: number;
  liveCount: number;
}

interface DiscoveryShellProps {
  initialTab?: DiscoveryTab;
}

export function DiscoveryShell({ initialTab = 'explore' }: DiscoveryShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { lang, toggleLang, isUr } = useLanguage();
  const unreadNotifications = useUnreadNotificationsCount();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<DiscoveryTab>(initialTab);
  const [selectedCountry, setSelectedCountry] = useState<string>(
    searchParams.get('country')?.toUpperCase() || 'ALL'
  );
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [countryModalSearch, setCountryModalSearch] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Tab specific data states
  const [exploreRooms, setExploreRooms] = useState<RoomItem[]>([]);
  const [followingData, setFollowingData] = useState<FollowingFeedData | null>(null);
  const [newCreators, setNewCreators] = useState<NewCreatorItem[]>([]);
  const [pkBattles, setPkBattles] = useState<PkBattleItem[]>([]);
  const [partyRooms, setPartyRooms] = useState<PartyRoomItem[]>([]);
  const [pkCounts, setPkCounts] = useState<{ active: number; upcoming: number; completed: number; total: number }>({
    active: 0,
    upcoming: 0,
    completed: 0,
    total: 0,
  });

  // Filter chips
  const [newFilter, setNewFilter] = useState<'all' | 'live' | 'verified'>('all');
  const [pkStatusFilter, setPkStatusFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');

  // User auth state
  const [user, setUser] = useState<any | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Sync activeTab with pathname on browser back/forward
  useEffect(() => {
    if (pathname.includes('/live/following')) setActiveTab('following');
    else if (pathname.includes('/live/new')) setActiveTab('new');
    else if (pathname.includes('/live/pk')) setActiveTab('pk');
    else if (pathname.includes('/live/party') || pathname === '/party') setActiveTab('party');
    else if (pathname.includes('/live/near') || pathname === '/near') setActiveTab('near');
    else if (pathname.includes('/live/explore') || pathname === '/live') setActiveTab('explore');
  }, [pathname]);

  // Sync selectedCountry with URL search parameters
  useEffect(() => {
    const urlCountry = searchParams.get('country')?.toUpperCase();
    if (urlCountry && urlCountry !== selectedCountry) {
      setSelectedCountry(urlCountry);
    } else if (!urlCountry && selectedCountry !== 'ALL') {
      setSelectedCountry('ALL');
    }
  }, [searchParams]);

  // Check auth session once
  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const sessRes = await fetch('/api/auth/session').catch(() => null);
        if (sessRes && sessRes.ok) {
          const sessData = await sessRes.json();
          if (isMounted) {
            setUser(sessData.authenticated ? sessData.user : null);
            setIsAuthChecked(true);
          }
        }
      } catch (err) {
        console.error('Session check error:', err);
      }
    }
    if (!isAuthChecked) checkAuth();
    return () => { isMounted = false; };
  }, [isAuthChecked]);

  // Tab & Country data fetching
  useEffect(() => {
    let isMounted = true;

    async function loadTabData() {
      setLoading(true);
      try {
        const countryParam = selectedCountry && selectedCountry !== 'ALL' ? `&country=${selectedCountry}` : '';

        if (activeTab === 'explore') {
          const url = `/api/discovery/explore?q=${encodeURIComponent(searchQuery)}${countryParam}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (isMounted) setExploreRooms(data.rooms || []);
          }
        } else if (activeTab === 'following') {
          const url = `/api/discovery/following?${countryParam ? countryParam.substring(1) : ''}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (isMounted) setFollowingData(data);
          }
        } else if (activeTab === 'new') {
          const url = `/api/discovery/new?filter=${newFilter}${countryParam}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (isMounted) setNewCreators(data.creators || []);
          }
        } else if (activeTab === 'pk') {
          const url = `/api/discovery/pk?status=${pkStatusFilter}${countryParam}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (isMounted) {
              setPkBattles(data.battles || []);
              if (data.counts) setPkCounts(data.counts);
            }
          }
        } else if (activeTab === 'party') {
          const url = `/api/discovery/party?q=${encodeURIComponent(searchQuery)}${countryParam}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (isMounted) setPartyRooms(data.rooms || []);
          }
        }
      } catch (err) {
        console.error('Error fetching discovery tab data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTabData();
    return () => { isMounted = false; };
  }, [activeTab, searchQuery, selectedCountry, newFilter, pkStatusFilter]);

  const handleTabChange = (tab: DiscoveryTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    startTransition(() => {
      const countryQuery = selectedCountry !== 'ALL' ? `?country=${selectedCountry}` : '';
      router.push(`/live/${tab}${countryQuery}`, { scroll: false });
    });
  };

  const handleCountrySelect = (code: string) => {
    const cleanCode = code.toUpperCase();
    setSelectedCountry(cleanCode);
    setShowCountryModal(false);
    setCountryModalSearch('');

    startTransition(() => {
      const countryQuery = cleanCode !== 'ALL' ? `?country=${cleanCode}` : '';
      router.replace(`/live/${activeTab}${countryQuery}`, { scroll: false });
    });
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/account/logout', { method: 'POST' });
      setUser(null);
      setShowUserMenu(false);
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const tabs: { id: DiscoveryTab; label_en: string; label_ur: string }[] = [
    { id: 'explore', label_en: 'Explore', label_ur: 'دریافت' },
    { id: 'following', label_en: 'Following', label_ur: 'فالوئنگ' },
    { id: 'new', label_en: 'New', label_ur: 'نئے' },
    { id: 'pk', label_en: 'PK', label_ur: 'پی کے' },
  ];

  // Filtered country list for modal
  const filteredModalCountries = COUNTRIES_LIST.filter(
    (c) =>
      c.name.toLowerCase().includes(countryModalSearch.toLowerCase()) ||
      c.code.toLowerCase().includes(countryModalSearch.toLowerCase())
  );

  const isCustomCountrySelected =
    selectedCountry !== 'ALL' &&
    !POPULAR_COUNTRY_SHORTCUTS.some((p) => p.code === selectedCountry);

  return (
    <div
      className="min-h-screen bg-[#080915] text-white flex flex-col font-sans selection:bg-[#FF2E74] selection:text-white pb-20 lg:pb-0"
      dir={isUr ? 'rtl' : 'ltr'}
    >
      {/* 1. TOP HEADER (Responsive Desktop & Mobile) */}
      <header className="sticky top-0 z-40 bg-[#0c0e1e]/90 backdrop-blur-xl border-b border-white/10 h-14 sm:h-16 px-4 sm:px-8 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Back navigation on Mobile */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="md:hidden w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 transition-colors"
          >
            <ArrowLeft className={`w-4 h-4 ${isUr ? 'rotate-180' : ''}`} />
          </button>

          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-[#FF2E74] via-[#A855F7] to-[#3B82F6] p-[2px] shadow-lg shadow-pink-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#120B24] rounded-full flex items-center justify-center font-black text-xs sm:text-sm text-transparent bg-clip-text bg-gradient-to-tr from-[#FF2E74] to-yellow-300">
                P
              </div>
            </div>
            <span className="font-extrabold text-base sm:text-xl tracking-tight text-white flex items-center gap-1">
              Popo <span className="text-[#FF2E74]">Live</span>
            </span>
          </Link>
        </div>

        {/* Center: Search Bar (Desktop) */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative">
            <Search className={`absolute ${isUr ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 w-4 h-4 text-white/40`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              placeholder={isUr ? 'لائیو براڈکاسٹ، آئی ڈی یا اسٹریمر تلاش کریں...' : 'Search streamers, live rooms, user ID...'}
              className={`w-full ${isUr ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 bg-white/5 hover:bg-white/[0.08] focus:bg-[#15132d] rounded-full text-xs sm:text-sm text-white placeholder-white/35 border border-white/10 focus:border-[#FF2E74] outline-none transition-all`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute ${isUr ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-white/40 hover:text-white`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Action Icons & User Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/search"
            aria-label="Search"
            className="md:hidden w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 transition-colors"
          >
            <Search className="w-4 h-4" />
          </Link>

          <Link
            href="/recharge"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-yellow-500/10 hover:from-amber-500/20 hover:to-yellow-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{isUr ? 'کوائنز لیں' : 'Get Coins'}</span>
          </Link>

          <Link
            href="/inbox"
            data-testid="discovery-header-inbox-link"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#FF2E74]" />
            <span>{isUr ? 'ان باکس' : 'Inbox'}</span>
          </Link>

          <Link
            href="/square"
            data-testid="discovery-header-square-link"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>{isUr ? 'اسکوائر' : 'Square'}</span>
          </Link>

          <Link
            href="/notifications"
            data-testid="discovery-header-notifications-link"
            aria-label="Notifications"
            className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/85 hover:text-white transition-colors"
          >
            <Bell className="w-4 h-4 text-[#FF6BA3]" />
            {unreadNotifications > 0 && (
              <span
                data-testid="discovery-notifications-badge"
                className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#FF1A6C] text-white text-[9px] font-black flex items-center justify-center border border-[#120B24]"
              >
                {unreadNotifications}
              </span>
            )}
          </Link>

          <Link
            href="/download"
            className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-pink-400" />
            <span>{isUr ? 'ایپ حاصل کریں' : 'Get App'}</span>
          </Link>

          <button
            onClick={toggleLang}
            className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-white/80 transition-colors"
          >
            {isUr ? 'English' : 'اردو'}
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-white/5 transition-colors border border-white/10"
              >
                <img
                  src={user.avatarUrl || user.avatar_url || '/avatars/default.png'}
                  alt={user.nickname}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-1 ring-[#FF2E74]"
                />
                <span className="text-xs font-bold hidden md:inline max-w-[90px] truncate text-white">
                  {user.nickname}
                </span>
              </button>

              {showUserMenu && (
                <div
                  className={`absolute ${isUr ? 'left-0' : 'right-0'} mt-2 w-56 rounded-2xl bg-[#121324] border border-white/10 shadow-2xl p-2 z-50 text-xs space-y-1`}
                >
                  <div className="p-2 border-b border-white/5 mb-1">
                    <p className="font-bold text-white truncate">{user.nickname}</p>
                    <p className="text-[10px] text-white/50">ID: {user.poppoId || user.poppo_id}</p>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-pink-400" />
                    <span>{isUr ? 'میری پروفائل' : 'My Profile'}</span>
                  </Link>

                  <Link
                    href="/account"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    <span>{isUr ? 'ویب اکاؤنٹ' : 'Web Account'}</span>
                  </Link>

                  {(user.is_staff || user.role === 'staff' || user.role === 'admin') && (
                    <Link
                      href="/staff"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-fuchsia-400 hover:bg-fuchsia-500/10 transition-colors font-bold"
                    >
                      <Shield className="w-3.5 h-3.5 text-fuchsia-400" />
                      <span>{isUr ? 'اسٹاف پریویو' : 'Staff Preview'}</span>
                    </Link>
                  )}

                  <Link
                    href="/inbox"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#FF2E74]" />
                    <span>{isUr ? 'ان باکس اور پیغامات' : 'Inbox & Chats'}</span>
                  </Link>

                  <Link
                    href="/system-notices"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <Bell className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isUr ? 'سسٹم نوٹس' : 'System Notices'}</span>
                  </Link>

                  <Link
                    href="/notifications"
                    data-testid="discovery-menu-notifications"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Heart className="w-3.5 h-3.5 text-[#FF2E74]" />
                      <span>{isUr ? 'سرگرمیاں اور اطلاعات' : 'Notifications'}</span>
                    </span>
                    {unreadNotifications > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#FF1A6C] text-white text-[10px] font-black">
                        {unreadNotifications}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/square"
                    data-testid="discovery-menu-square"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                    <span>{isUr ? 'اسکوائر پوسٹس' : 'Square Posts'}</span>
                  </Link>

                  <Link
                    href="/square/discovery"
                    data-testid="discovery-menu-square-discovery"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <Compass className="w-3.5 h-3.5 text-[#FF4D8D]" />
                    <span>{isUr ? 'اسکوائر ڈسکوری' : 'Square Discovery'}</span>
                  </Link>

                  <Link
                    href="/square/create"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#FF2E74]" />
                    <span>{isUr ? 'پوسٹ بنائیں' : 'Create Post'}</span>
                  </Link>

                  <Link
                    href="/fan-club"
                    data-testid="discovery-menu-fan-club"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isUr ? 'فین کلب' : 'Fan Club'}</span>
                  </Link>

                  <Link
                    href="/invites"
                    data-testid="discovery-menu-invites"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#FF4D8D]" />
                    <span>{isUr ? 'دوستوں کو مدعو کریں' : 'Invite Friends'}</span>
                  </Link>

                  <Link
                    href="/daily-tasks"
                    data-testid="discovery-menu-daily-tasks"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <ListTodo className="w-3.5 h-3.5 text-[#FF4D8D]" />
                    <span>{isUr ? 'روزانہ کے ٹاسک' : 'Daily Host Tasks'}</span>
                  </Link>

                  <Link
                    href="/earning-identity"
                    data-testid="discovery-menu-earning-identity"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isUr ? 'کمائی کی شناخت' : 'Earning Identity'}</span>
                  </Link>

                  <Link
                    href="/video-call"
                    data-testid="discovery-menu-video-call-off"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <VideoOff className="w-3.5 h-3.5 text-purple-300/75" />
                      <span>{isUr ? '1-to-1 ویڈیو کال' : '1-to-1 Video Call'}</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full bg-[#FF1A6C]/20 border border-[#FF1A6C]/45 text-[9px] font-black text-[#FF6BA3]">
                      OFF
                    </span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isUr ? 'سیٹنگز' : 'Settings'}</span>
                  </Link>

                  <Link
                    href="/help"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isUr ? 'ہیلپ سینٹر' : 'Help Center'}</span>
                  </Link>

                  <div className="pt-1 border-t border-white/5">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors font-semibold"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{isUr ? 'لاگ آؤٹ' : 'Log Out'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
              >
                {isUr ? 'لاگ ان' : 'Log In'}
              </Link>
              <Link
                href="/register"
                className="hidden sm:inline-block px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#FF2E74] to-[#A855F7] text-white text-xs font-bold shadow-md shadow-pink-500/20 hover:brightness-110 transition-all"
              >
                {isUr ? 'رجسٹر' : 'Sign Up'}
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* 2. BODY LAYOUT: DESKTOP SIDEBAR + MAIN CONTENT */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        
        {/* DESKTOP SIDEBAR */}
        <aside className="w-64 shrink-0 hidden lg:flex flex-col justify-between py-6 px-4 border-r border-white/10 space-y-6">
          <div className="space-y-4">
            
            <Link
              href="/download"
              className="w-full py-3 px-4 bg-gradient-to-r from-[#FF2E74] to-[#A855F7] hover:brightness-110 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{isUr ? 'پوپو لائیو ایپ ڈاؤن لوڈ کریں' : 'Download Popo Live App'}</span>
            </Link>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider px-3 block mb-2">
                {isUr ? 'نیویگیشن' : 'Discovery'}
              </span>

              {[
                { id: 'explore', label_en: 'Explore', label_ur: 'دریافت', icon: Compass, count: 'HOT' },
                { id: 'party', label_en: 'Party Rooms', label_ur: 'پارٹی رومز', icon: Users, count: '9 SEATS' },
                { id: 'following', label_en: 'Following', label_ur: 'فالوئنگ', icon: Heart, count: null },
                { id: 'new', label_en: 'New Streamers', label_ur: 'نئے براڈکاسٹرز', icon: Sparkles, count: 'NEW' },
                { id: 'pk', label_en: 'PK Battles', label_ur: 'پی کے مقابلے', icon: Swords, count: 'LIVE' },
                { id: 'near', label_en: 'Near (Location)', label_ur: 'قریبی براڈکاسٹرز', icon: MapPin, count: 'OFF' },
              ].map((item) => {
                const isSelected = activeTab === item.id;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabChange(item.id as DiscoveryTab)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#FF2E74]/20 to-purple-600/20 text-white border border-[#FF2E74]/40 shadow-sm'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className={`w-4 h-4 ${isSelected ? 'text-[#FF2E74]' : 'text-white/50'}`} />
                      <span>{isUr ? item.label_ur : item.label_en}</span>
                    </div>
                    {item.count && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                        item.count === 'HOT'
                          ? 'bg-[#FF2E74] text-white'
                          : item.count === 'OFF'
                          ? 'bg-zinc-800 text-zinc-400 border border-zinc-700/60'
                          : 'bg-purple-500/20 text-purple-300'
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="space-y-1 pt-2 border-t border-white/5">
              <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider px-3 block mb-2">
                {isUr ? 'پلیٹ فارم' : 'Platform'}
              </span>

              {[
                { label_en: 'Daily Host Tasks', label_ur: 'روزانہ کے ٹاسک', icon: ListTodo, href: '/daily-tasks' },
                { label_en: 'Earning Identity', label_ur: 'کمائی کی شناخت', icon: ShieldCheck, href: '/earning-identity' },
                { label_en: 'Square Discovery', label_ur: 'اسکوائر ڈسکوری', icon: Compass, href: '/square/discovery' },
                { label_en: 'Agency Portal', label_ur: 'ایجنسی پورٹل', icon: Trophy, href: '/agency' },
                { label_en: 'Recharge Coins', label_ur: 'کوائنز ریچارج', icon: Coins, href: '/recharge' },
                { label_en: 'Help & Support', label_ur: 'مدد اور سوالات', icon: HelpCircle, href: '/help' },
                { label_en: 'Staff Preview', label_ur: 'اسٹاف پریویو', icon: Shield, href: '/staff' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-white/60 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <item.icon className="w-4 h-4 text-white/40" />
                  <span>{isUr ? item.label_ur : item.label_en}</span>
                </Link>
              ))}
            </div>

          </div>

          <div className="p-4 rounded-3xl bg-gradient-to-br from-purple-900/40 via-indigo-950/40 to-pink-900/20 border border-white/10 text-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF2E74] to-[#A855F7] flex items-center justify-center mx-auto text-white shadow-lg shadow-pink-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <h4 className="text-xs font-extrabold text-white">Start Broadcasting</h4>
            <p className="text-[10px] text-white/60 leading-relaxed">
              Go live with one click. Gain fans and monetize your talent.
            </p>
            <Link
              href="/live/setup"
              className="inline-block px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#e91e63] to-[#ff2d55] text-white text-[11px] font-bold shadow-md shadow-pink-500/30 hover:brightness-110 transition-all"
            >
              Go Live Setup
            </Link>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col min-w-0 px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
          
          {/* 3. TABS ROW (Matching 03_06 3-tab bar on Party, hidden on Near to match 03_09, or standard row) */}
          {activeTab === 'party' ? (
            <div className="flex items-center justify-center gap-8 sm:gap-14 py-2 sm:py-3 border-b border-white/5">
              <button
                type="button"
                onClick={() => handleTabChange('explore')}
                className="text-sm sm:text-base font-semibold text-zinc-400 hover:text-white transition-colors px-3 py-1 cursor-pointer"
              >
                Live
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('party')}
                className="px-6 sm:px-8 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-fuchsia-700 via-fuchsia-600 to-pink-600 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-fuchsia-900/50 ring-1 ring-fuchsia-400/30 transition-transform active:scale-95 cursor-pointer"
              >
                Party
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('pk')}
                className="text-sm sm:text-base font-semibold text-zinc-400 hover:text-white transition-colors px-3 py-1 cursor-pointer"
              >
                PK
              </button>
            </div>
          ) : activeTab === 'near' ? null : (
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar py-1">
                {tabs.map((tab) => {
                  const isSelected = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabChange(tab.id)}
                      className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#C2185B] via-[#D81B60] to-[#9C27B0] text-white shadow-lg shadow-pink-500/30 ring-1 ring-pink-400/30'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span>{isUr ? tab.label_ur : tab.label_en}</span>
                    </button>
                  );
                })}
              </div>

              {loading && (
                <div className="flex items-center gap-1.5 text-xs text-pink-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">{isUr ? 'لوڈ ہو رہا ہے...' : 'Updating...'}</span>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. COUNTRY FILTERS BAR (Only on Explore/New/PK tabs, hidden on Party, Following and Near to match 03_06, 03_08 & 03_09 1:1) */}
          {/* ========================================================================= */}
          {activeTab !== 'party' && activeTab !== 'following' && activeTab !== 'near' && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs">
              {POPULAR_COUNTRY_SHORTCUTS.map((c) => {
                const isSelected = selectedCountry === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCountrySelect(c.code)}
                    className={`px-3.5 py-1.5 rounded-full font-bold flex items-center gap-1.5 flex-shrink-0 transition-all ${
                      isSelected
                        ? 'bg-white/20 text-white border border-pink-500 shadow-md shadow-pink-500/20'
                        : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5'
                    }`}
                  >
                    <span className="text-sm leading-none">{c.flag}</span>
                    <span>{c.name}</span>
                  </button>
                );
              })}

              {/* Custom Country Pill if selected from More Countries */}
              {isCustomCountrySelected && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-500/20 border border-pink-500 text-white font-bold flex-shrink-0 shadow-md">
                  <span className="text-sm leading-none">{getCountryFlag(selectedCountry)}</span>
                  <span>{getCountryName(selectedCountry)}</span>
                  <button
                    onClick={() => handleCountrySelect('ALL')}
                    className="hover:bg-white/20 rounded-full p-0.5 ml-0.5 text-white/70 hover:text-white"
                    title="Clear country filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* More Countries Dropdown Trigger (Matching 03_03) */}
              <button
                type="button"
                onClick={() => setShowCountryModal(true)}
                className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 font-bold flex items-center gap-1.5 flex-shrink-0 transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-pink-400" />
                <span>More Countries</span>
                <ChevronDown className="w-3 h-3 text-white/50" />
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: EXPLORE DISCOVERY TAB */}
          {/* ========================================================================= */}
          {activeTab === 'explore' && (
            <div className="space-y-5 sm:space-y-6">
              {/* 1. Promotional Banner Carousel (Matching 03_05 1:1) */}
              <DiscoveryBannerCarousel />

              {/* 2. Rank Door Shortcuts (Event, Rank, Agency, Notice) */}
              <RankDoorSection />

              {/* 3. Ranking Podium Preview (Rank 2 Silver, Rank 1 Gold Center, Rank 3 Bronze) */}
              <RankingPreviewSection />

              {loading && exploreRooms.length === 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                    <div key={i} className="aspect-[3/4] rounded-2xl sm:rounded-3xl bg-white/5 animate-pulse border border-white/5" />
                  ))}
                </div>
              ) : exploreRooms.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-white/5 space-y-3">
                  <Radio className="w-10 h-10 text-white/30 mx-auto" />
                  <h3 className="text-sm font-bold text-white">
                    {selectedCountry !== 'ALL'
                      ? `No live streams from ${getCountryName(selectedCountry)} right now`
                      : 'No active live streams right now'}
                  </h3>
                  <p className="text-xs text-white/50 max-w-sm mx-auto">
                    {selectedCountry !== 'ALL'
                      ? 'Try switching to Popular to see live creators broadcasting worldwide.'
                      : 'Check back in a few moments or explore new broadcasters!'}
                  </p>
                  {selectedCountry !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => handleCountrySelect('ALL')}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold shadow-md hover:brightness-110"
                    >
                      View Popular Worldwide (🔥)
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
                  {exploreRooms.map((room) => (
                    <LiveRoomCard key={room.roomId} room={room} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: FOLLOWING DISCOVERY TAB (STRICT REFERENCE IMAGE 03_08 IMPLEMENTATION) */}
          {/* ========================================================================= */}
          {activeTab === 'following' && (
            <div className="w-full max-w-2xl mx-auto space-y-3 py-1">
              {/* Header Status Bar & Quick Refresh */}
              <div className="flex items-center justify-between px-2 pt-1 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping inline-block" />
                    <span>{isUr ? 'فالو کردہ براڈکاسٹرز' : 'Followed Broadcasters'}</span>
                  </span>
                  {followingData?.users && followingData.users.length > 0 && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                      {followingData.users.length} {isUr ? 'فالوئنگ' : 'FOLLOWING'}
                    </span>
                  )}
                  {followingData?.isDemo && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                      Preview
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const res = await fetch('/api/discovery/following');
                      if (res.ok) setFollowingData(await res.json());
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-white/50 hover:text-white transition-colors px-2.5 py-1 rounded-lg hover:bg-white/5 cursor-pointer"
                  title="Refresh followed broadcasters"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-pink-400' : ''}`} />
                  <span>{isUr ? 'تازہ کریں' : 'Refresh'}</span>
                </button>
              </div>

              {/* 1. LOADING SKELETON STATE */}
              {loading && (!followingData?.users || followingData.users.length === 0) ? (
                <div className="space-y-3 p-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-4 px-3 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-white/10 ring-2 ring-pink-500/30" />
                        <div className="space-y-2">
                          <div className="w-28 h-4 rounded-md bg-white/10" />
                          <div className="w-20 h-3 rounded-md bg-white/5" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-7 rounded-full bg-white/10" />
                        <div className="w-8 h-8 rounded-full bg-white/5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : followingData?.users && followingData.users.length > 0 ? (
                /* 2. NORMAL STATE: VERTICAL LIST STRICTLY MATCHING 03_08_following.png */
                <div className="divide-y divide-white/[0.05] bg-white/[0.015] rounded-3xl border border-white/[0.06] p-1.5 sm:p-2.5 backdrop-blur-sm shadow-xl shadow-black/30">
                  {followingData.users.map((followedUser) => (
                    <FollowingUserCard
                      key={followedUser.id || followedUser.userId}
                      user={followedUser}
                    />
                  ))}
                </div>
              ) : (
                /* 3. EMPTY STATE: WHEN USER FOLLOWS NO ONE */
                <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-white/5 space-y-4 my-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-pink-500/20 to-purple-600/20 border border-pink-500/30 flex items-center justify-center mx-auto text-pink-400 shadow-lg shadow-pink-500/10">
                    <Heart className="w-6 h-6 fill-pink-500/30 text-pink-400" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">
                      {isUr ? 'آپ فی الحال کسی براڈکاسٹر کو فالو نہیں کر رہے' : 'You are not following any broadcasters yet'}
                    </h3>
                    <p className="text-xs text-white/50 max-w-sm mx-auto">
                      {isUr
                        ? 'مشہور لائیو براڈکاسٹرز کو فالو کریں تاکہ جب وہ لائیو آئیں تو آپ کو فوراً اطلاع ملے!'
                        : 'Follow live streamers to get instant notifications and watch their broadcasts right here!'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange('explore')}
                    className="px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110 active:scale-95 text-white text-xs font-bold shadow-lg shadow-pink-500/25 transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Compass className="w-4 h-4" />
                    <span>{isUr ? 'براڈکاسٹرز دریافت کریں' : 'Explore Broadcasters'}</span>
                  </button>
                </div>
              )}

              {/* GUEST BANNER (If not authenticated, informative sign-in prompt below the list) */}
              {!user && (
                <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-pink-950/40 border border-pink-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-lg">
                  <div className="space-y-0.5">
                    <p className="text-xs sm:text-sm font-bold text-white">
                      {isUr ? 'اپنے اکاؤنٹ میں لاگ ان کریں' : 'Sign in to customize your followed feed'}
                    </p>
                    <p className="text-[11px] text-white/60">
                      {isUr
                        ? 'اپنے پسندیدہ براڈکاسٹرز کی اطلاعات حاصل کرنے کے لیے سائن ان کریں۔'
                        : 'Follow broadcasters, receive real-time push alerts, and join live chats.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href="/login?redirect=/live/following"
                      className="px-4 py-1.5 rounded-full bg-[#FF2E74] hover:bg-[#ff1a66] text-white text-xs font-bold transition-all shadow-md shadow-pink-500/20 cursor-pointer"
                    >
                      {isUr ? 'لاگ ان' : 'Log In'}
                    </Link>
                    <Link
                      href="/register"
                      className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10 cursor-pointer"
                    >
                      {isUr ? 'رجسٹر' : 'Sign Up'}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: NEW DISCOVERY TAB */}
          {/* ========================================================================= */}
          {activeTab === 'new' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {[
                  { id: 'all', label: 'All New Creators' },
                  { id: 'live', label: '🔴 Live Now' },
                  { id: 'verified', label: '✓ Verified' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setNewFilter(f.id as any)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                      newFilter === f.id
                        ? 'bg-white text-black shadow-md'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {loading && newCreators.length === 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="h-44 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
                  ))}
                </div>
              ) : newCreators.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-white/5 space-y-2">
                  <Sparkles className="w-8 h-8 text-white/30 mx-auto" />
                  <p className="text-xs text-white/50">
                    {selectedCountry !== 'ALL'
                      ? `No new creators registered in ${getCountryName(selectedCountry)} for this filter.`
                      : 'No new creators match the selected filter.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {newCreators.map((creator) => (
                    <div
                      key={creator.id}
                      className="p-3.5 rounded-2xl bg-[#121324] border border-white/10 hover:border-pink-500/40 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="relative">
                          <img
                            src={creator.avatarUrl}
                            alt={creator.nickname}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-pink-500/30"
                          />
                          <span className="absolute -bottom-1 -right-1 text-xs">{creator.flagEmoji}</span>
                        </div>

                        {creator.isLive ? (
                          <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-pink-500 to-rose-600 text-white text-[9px] font-black uppercase animate-pulse">
                            LIVE
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3" />
                            {creator.joinedFormatted}
                          </span>
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-white truncate">{creator.nickname}</p>
                        <p className="text-[10px] text-zinc-400">ID: {creator.poppoId}</p>
                        <p className="text-[10px] text-zinc-500">{creator.country}</p>
                      </div>

                      <div className="flex items-center gap-1.5 pt-1">
                        {creator.isLive && creator.liveRoom ? (
                          <Link
                            href={`/live/room/${creator.liveRoom.roomId}`}
                            className="w-full py-1.5 text-center rounded-xl bg-gradient-to-r from-[#FF2E74] to-[#C2185B] text-white text-[11px] font-bold shadow-md hover:brightness-110"
                          >
                            Watch Live
                          </Link>
                        ) : (
                          <Link
                            href={creator.profileUrl}
                            className="w-full py-1.5 text-center rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold border border-white/10 transition-colors"
                          >
                            View Profile
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: PK BATTLES DISCOVERY TAB */}
          {/* ========================================================================= */}
          {activeTab === 'pk' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {[
                  { id: 'all', label: `All PK (${pkCounts.total})` },
                  { id: 'active', label: `⚔️ Live PK (${pkCounts.active})` },
                  { id: 'upcoming', label: `⏳ Upcoming (${pkCounts.upcoming})` },
                  { id: 'completed', label: `🏁 Completed (${pkCounts.completed})` },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setPkStatusFilter(s.id as any)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex-shrink-0 ${
                      pkStatusFilter === s.id
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {loading && pkBattles.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-48 rounded-3xl bg-white/5 animate-pulse border border-white/5" />
                  ))}
                </div>
              ) : pkBattles.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-white/5 space-y-2">
                  <Swords className="w-8 h-8 text-white/30 mx-auto" />
                  <p className="text-xs text-white/50">
                    {selectedCountry !== 'ALL'
                      ? `No PK battles found for ${getCountryName(selectedCountry)}.`
                      : `No PK battles found under "${pkStatusFilter}".`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pkBattles.map((b) => (
                    <div
                      key={b.id}
                      className="relative p-4 rounded-3xl bg-gradient-to-br from-[#121324] via-[#170e2b] to-[#121324] border border-purple-500/20 hover:border-pink-500/40 shadow-xl transition-all space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate max-w-[200px]">
                          {b.title}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                            b.status === 'active'
                              ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white animate-pulse'
                              : b.status === 'upcoming'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          <Swords className="w-3 h-3" />
                          {b.status === 'active' ? 'Live PK' : b.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        {/* Host A */}
                        <div className="flex-1 flex flex-col items-center text-center space-y-1">
                          <div className="relative">
                            <img
                              src={b.hostA.avatarUrl}
                              alt={b.hostA.nickname}
                              className="w-14 h-14 rounded-full object-cover ring-2 ring-pink-500"
                            />
                            <span className="absolute -bottom-1 -right-1 text-xs">{b.hostA.flagEmoji}</span>
                          </div>
                          <p className="text-xs font-bold text-white truncate max-w-[100px]">{b.hostA.nickname}</p>
                          <span className="text-[10px] font-extrabold text-pink-400">
                            {b.hostA.pointsFormatted} pts
                          </span>
                        </div>

                        {/* Middle VS Graphic */}
                        <div className="shrink-0 flex flex-col items-center justify-center space-y-1">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center font-black text-xs text-white shadow-lg shadow-pink-500/30">
                            VS
                          </div>
                          <span className="text-[10px] text-zinc-400 font-bold">{b.viewersFormatted}</span>
                        </div>

                        {/* Host B */}
                        <div className="flex-1 flex flex-col items-center text-center space-y-1">
                          <div className="relative">
                            <img
                              src={b.hostB.avatarUrl}
                              alt={b.hostB.nickname}
                              className="w-14 h-14 rounded-full object-cover ring-2 ring-cyan-400"
                            />
                            <span className="absolute -bottom-1 -right-1 text-xs">{b.hostB.flagEmoji}</span>
                          </div>
                          <p className="text-xs font-bold text-white truncate max-w-[100px]">{b.hostB.nickname}</p>
                          <span className="text-[10px] font-extrabold text-cyan-400">
                            {b.hostB.pointsFormatted} pts
                          </span>
                        </div>
                      </div>

                      <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden flex">
                        <div
                          className="bg-gradient-to-r from-pink-500 to-rose-500 h-full"
                          style={{
                            width: `${Math.max(15, Math.min(85, ((b.hostA.points || 1) / ((b.hostA.points || 1) + (b.hostB.points || 1))) * 100))}%`,
                          }}
                        />
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-400 flex-1 h-full" />
                      </div>

                      {b.status === 'active' && b.roomId ? (
                        <Link
                          href={`/live/room/${b.roomId}`}
                          className="w-full py-2 rounded-2xl bg-gradient-to-r from-[#FF2E74] to-[#9C27B0] hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-pink-500/25 transition-all"
                        >
                          <Radio className="w-3.5 h-3.5 animate-pulse" />
                          <span>Watch Live PK Battle</span>
                        </Link>
                      ) : (
                        <div className="w-full py-2 text-center text-zinc-500 text-[11px] font-semibold bg-white/5 rounded-2xl">
                          {b.status === 'upcoming' ? 'Scheduled Broadcast • Starting Soon' : 'Battle Completed'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: PARTY DISCOVERY LIST (1:1 PIXEL MATCH TO 03_06_party_discovery_list.png) */}
          {/* ========================================================================= */}
          {activeTab === 'party' && (
            <div className="w-full max-w-md mx-auto sm:max-w-xl md:max-w-2xl space-y-4 pb-8">
              {/* Header Status & Quick Refresh */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white/80">Voice Party Rooms</span>
                  <span className="px-2 py-0.5 rounded-full bg-fuchsia-600/30 text-fuchsia-300 text-[10px] font-black border border-fuchsia-500/30">
                    9 SEATS
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    fetch(`/api/discovery/party?q=${encodeURIComponent(searchQuery)}`)
                      .then((r) => r.json())
                      .then((d) => setPartyRooms(d.rooms || []))
                      .catch((err) => console.error('Party refresh error:', err))
                      .finally(() => setLoading(false));
                  }}
                  className="flex items-center gap-1.5 text-xs text-fuchsia-400 hover:text-fuchsia-300 transition-colors font-semibold cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Loading Skeleton */}
              {loading && partyRooms.length === 0 ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between w-full px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-2xl bg-[#14172f]/60 border border-white/5 animate-pulse"
                    >
                      <div className="flex items-center gap-3.5 sm:gap-4">
                        <div className="w-[78px] h-[54px] sm:w-[84px] sm:h-[58px] rounded-xl bg-white/10 shrink-0" />
                        <div className="space-y-2">
                          <div className="w-36 h-4 bg-white/10 rounded" />
                          <div className="w-20 h-3 bg-white/10 rounded" />
                        </div>
                      </div>
                      <div className="w-5 h-5 rounded bg-white/10 shrink-0" />
                    </div>
                  ))}
                </div>
              ) : partyRooms.length === 0 ? (
                /* Empty State */
                <div className="p-10 text-center rounded-3xl bg-white/[0.02] border border-white/5 space-y-3">
                  <Users className="w-10 h-10 text-white/30 mx-auto" />
                  <h3 className="text-sm font-bold text-white">No active party rooms found</h3>
                  <p className="text-xs text-white/50 max-w-sm mx-auto">
                    Party rooms allow up to 9 participants to chat, play music, and hang out together.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setLoading(true);
                      fetch('/api/discovery/party')
                        .then((r) => r.json())
                        .then((d) => setPartyRooms(d.rooms || []))
                        .finally(() => setLoading(false));
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white text-xs font-bold shadow-md hover:brightness-110 cursor-pointer"
                  >
                    Reload Party Rooms
                  </button>
                </div>
              ) : (
                /* Vertical Party Rooms Stack (1:1 with 03_06 reference) */
                <div className="space-y-3 sm:space-y-3.5">
                  {partyRooms.map((room) => (
                    <PartyRoomCard key={room.id} room={room} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: NEAR (DEFAULT OFF) — STRICT MATCH TO 03_09_near_default_off.png */}
          {/* ========================================================================= */}
          {activeTab === 'near' && (
            <div className="w-full flex justify-center py-2">
              <NearScreen onBack={() => handleTabChange('explore')} />
            </div>
          )}

        </main>
      </div>

      {/* 5. SELECT COUNTRY MODAL (1:1 PIXEL MATCH TO 03_03_country_filters.png) */}
      {showCountryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div
            className="w-full sm:max-w-md max-h-[85vh] sm:max-h-[75vh] bg-[#121326] rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Select Country
              </h2>
              <button
                onClick={() => setShowCountryModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input Box (Matching 03_03) */}
            <div className="px-5 pb-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  autoFocus
                  value={countryModalSearch}
                  onChange={(e) => setCountryModalSearch(e.target.value)}
                  placeholder="Search country"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/[0.08] focus:bg-[#1a1b32] text-sm text-white placeholder-white/35 border border-white/10 focus:border-[#FF2E74] outline-none transition-all"
                />
                {countryModalSearch && (
                  <button
                    onClick={() => setCountryModalSearch('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Country List with Radio Indicators */}
            <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1 divide-y divide-white/[0.03]">
              
              {/* Option 1: All Countries / Popular */}
              {(!countryModalSearch || 'all countries popular worldwide'.includes(countryModalSearch.toLowerCase())) && (
                <button
                  type="button"
                  onClick={() => handleCountrySelect('ALL')}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${
                    selectedCountry === 'ALL'
                      ? 'bg-white/10 text-white'
                      : 'hover:bg-white/5 text-white/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* All Countries ring icon */}
                    <div className="w-6 h-6 rounded-full border-2 border-[#FF2E74] flex items-center justify-center">
                      <span className="text-[10px] leading-none">🔥</span>
                    </div>
                    <span className="text-sm font-bold">All Countries</span>
                  </div>

                  {/* Radio selection circle */}
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedCountry === 'ALL'
                        ? 'border-[#FF2E74] bg-[#FF2E74]'
                        : 'border-zinc-600'
                    }`}
                  >
                    {selectedCountry === 'ALL' && (
                      <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
                    )}
                  </div>
                </button>
              )}

              {/* Specific Countries List */}
              {filteredModalCountries.map((c) => {
                const isSelected = selectedCountry === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCountrySelect(c.code)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${
                      isSelected ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl leading-none">{c.flag}</span>
                      <span className="text-sm font-semibold text-white/90">{c.name}</span>
                    </div>

                    {/* Radio circle button (matching 03_03 reference) */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? 'border-[#FF2E74] bg-[#FF2E74]' : 'border-zinc-600'
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
                      )}
                    </div>
                  </button>
                );
              })}

              {filteredModalCountries.length === 0 && (
                <div className="py-8 text-center text-xs text-white/40">
                  No countries match &quot;{countryModalSearch}&quot;
                </div>
              )}
            </div>

            {/* Bottom Clear Filter footer */}
            <div className="p-3 border-t border-white/5 flex items-center justify-between text-xs px-5 bg-black/20">
              <span className="text-white/40">
                Current: <strong className="text-white">{getCountryName(selectedCountry)}</strong>
              </span>
              {selectedCountry !== 'ALL' && (
                <button
                  onClick={() => handleCountrySelect('ALL')}
                  className="text-pink-400 hover:text-pink-300 font-bold"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. MOBILE BOTTOM NAVIGATION */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0e1e]/95 backdrop-blur-xl border-t border-white/10 h-16 px-4 flex items-center justify-around">
        <button
          onClick={() => handleTabChange('explore')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'explore' ? 'text-[#FF2E74]' : 'text-white/40 hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-full ${activeTab === 'explore' ? 'bg-pink-500/10' : ''}`}>
            <Compass className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold">{isUr ? 'دریافت' : 'Explore'}</span>
        </button>

        <button
          onClick={() => handleTabChange('following')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'following' ? 'text-[#FF2E74]' : 'text-white/40 hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-full ${activeTab === 'following' ? 'bg-pink-500/10' : ''}`}>
            <Heart className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold">{isUr ? 'فالو' : 'Follow'}</span>
        </button>

        <Link
          href="/live/setup"
          aria-label="Go Live"
          className="relative -top-4 w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF2E74] to-[#A855F7] flex items-center justify-center text-white shadow-xl shadow-pink-500/40 active:scale-95 transition-transform"
        >
          <Camera className="w-6 h-6" />
        </Link>

        <Link
          href="/inbox"
          data-testid="discovery-mobile-inbox-link"
          className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-colors"
        >
          <div className="p-1">
            <MessageSquare className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-semibold">{isUr ? 'پیغامات' : 'Inbox'}</span>
        </Link>

        <Link
          href={user ? '/profile' : '/login'}
          className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-colors"
        >
          {user?.avatarUrl || user?.avatar_url ? (
            <img
              src={user.avatarUrl || user.avatar_url}
              alt="Me"
              className="w-5 h-5 rounded-full object-cover ring-1 ring-white/30"
            />
          ) : (
            <div className="p-1">
              <User className="w-5 h-5" />
            </div>
          )}
          <span className="text-[10px] font-semibold">{isUr ? 'میری پروفائل' : 'Me'}</span>
        </Link>
      </nav>

      {/* SEARCH MODAL (Mobile) */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col p-4 animate-in fade-in">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <Search className="w-5 h-5 text-pink-500" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms, streamers, ID..."
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-zinc-500"
            />
            <button
              onClick={() => setShowSearchModal(false)}
              className="p-1.5 rounded-full bg-white/10 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="py-4 text-xs text-zinc-400">
            Press enter or type above to filter live rooms instantly.
          </div>
        </div>
      )}
    </div>
  );
}
