'use client';

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import {
  COUNTRIES_LIST,
  POPULAR_COUNTRY_SHORTCUTS,
  getCountryFlag,
  getCountryName,
} from '@/lib/countries';
import {
  Radio,
  Users,
  Heart,
  MessageSquare,
  User,
  Compass,
  Trophy,
  Flame,
  Search,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Loader2,
  X,
  ExternalLink,
  Check,
  Globe,
  Filter,
  RefreshCw,
  Bell,
  Eye,
  Swords,
  Coins,
  Download,
  Smartphone,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { DesignFixtures, FixtureLiveRoom, FixturePartyRoom } from '@/lib/design/designFixtures';
import WebTopNav from './WebTopNav';
import WebLeftRail, { NavRailId } from './WebLeftRail';
import WebMobileNav from './WebMobileNav';
import AppDownloadModal from './AppDownloadModal';
import DiscoveryBannerCarousel from './DiscoveryBannerCarousel';
import RankDoorSection from './RankDoorSection';
import RankingPreviewSection from './RankingPreviewSection';

export type DiscoveryTab =
  | 'explore'
  | 'live'
  | 'party'
  | 'following'
  | 'new'
  | 'message'
  | 'profile'
  | 'near'
  | string;

export interface DiscoveryShellProps {
  initialTab?: DiscoveryTab;
  activeNav?: NavRailId | string;
  children?: React.ReactNode;
}

export function DiscoveryShell({
  initialTab = 'live',
  activeNav,
  children,
}: DiscoveryShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { lang, toggleLang, isUr } = useLanguage();
  const [isPending, startTransition] = useTransition();

  // Normalize initial tab
  const normalizedInitialTab = useMemo<string>(() => {
    if (initialTab === 'explore') return 'live';
    return initialTab || 'live';
  }, [initialTab]);

  const [activeTab, setActiveTab] = useState<string>(normalizedInitialTab);
  const [selectedCountry, setSelectedCountry] = useState<string>(
    searchParams.get('country')?.toUpperCase() || 'ALL'
  );
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [countryModalSearch, setCountryModalSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAppDownloadModal, setShowAppDownloadModal] = useState(false);
  const [showDesktopModal, setShowDesktopModal] = useState(false);
  const [notificationBellUsers, setNotificationBellUsers] = useState<Record<string, boolean>>({});

  // Sync activeTab with pathname and query params
  useEffect(() => {
    if (pathname.includes('/party')) {
      setActiveTab('party');
    } else if (pathname.includes('/inbox')) {
      setActiveTab('message');
    } else if (pathname.includes('/profile')) {
      setActiveTab('profile');
    } else if (pathname.includes('/live/following') || searchParams.get('tab') === 'following') {
      setActiveTab('following');
    } else if (pathname.includes('/live/new') || searchParams.get('tab') === 'new') {
      setActiveTab('new');
    } else if (pathname.includes('/near') || initialTab === 'near') {
      setActiveTab('near');
    } else if (pathname === '/live' || pathname === '/' || pathname.includes('/live')) {
      setActiveTab('live');
    }
  }, [pathname, searchParams, initialTab]);

  // Sync selectedCountry with searchParams
  useEffect(() => {
    const urlCountry = searchParams.get('country')?.toUpperCase();
    if (urlCountry && urlCountry !== selectedCountry) {
      setSelectedCountry(urlCountry);
    } else if (!urlCountry && selectedCountry !== 'ALL') {
      setSelectedCountry('ALL');
    }
  }, [searchParams]);

  // Read data from DesignFixtures
  const allLiveRooms = useMemo(() => {
    try {
      return DesignFixtures.liveRooms;
    } catch {
      return [];
    }
  }, []);

  const allPartyRooms = useMemo(() => {
    try {
      return DesignFixtures.partyRooms;
    } catch {
      return [];
    }
  }, []);

  const followedUsers = useMemo(() => {
    try {
      return DesignFixtures.followers;
    } catch {
      return [];
    }
  }, []);

  // Filter Live rooms by country and search query
  const filteredLiveRooms = useMemo(() => {
    return allLiveRooms.filter((room) => {
      const matchesCountry =
        selectedCountry === 'ALL' ||
        room.countryCode.toUpperCase() === selectedCountry.toUpperCase();
      const matchesSearch =
        !searchQuery.trim() ||
        room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.hostNickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.roomNumber.includes(searchQuery.trim());
      return matchesCountry && matchesSearch;
    });
  }, [allLiveRooms, selectedCountry, searchQuery]);

  // Filter Party rooms by country and search query
  const filteredPartyRooms = useMemo(() => {
    return allPartyRooms.filter((room) => {
      const matchesCountry =
        selectedCountry === 'ALL' ||
        room.countryCode.toUpperCase() === selectedCountry.toUpperCase();
      const matchesSearch =
        !searchQuery.trim() ||
        room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.hostNickname.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCountry && matchesSearch;
    });
  }, [allPartyRooms, selectedCountry, searchQuery]);

  const handleCountrySelect = (code: string) => {
    const cleanCode = code.toUpperCase();
    setSelectedCountry(cleanCode);
    setShowCountryModal(false);
    setCountryModalSearch('');

    startTransition(() => {
      const countryQuery = cleanCode !== 'ALL' ? `?country=${cleanCode}` : '';
      router.replace(`${pathname}${countryQuery}`, { scroll: false });
    });
  };

  const handleToggleBell = (userId: string) => {
    setNotificationBellUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // Filter countries list for modal
  const filteredModalCountries = useMemo(() => {
    if (!countryModalSearch.trim()) return COUNTRIES_LIST;
    const q = countryModalSearch.toLowerCase();
    return COUNTRIES_LIST.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [countryModalSearch]);

  const isCustomCountrySelected =
    selectedCountry !== 'ALL' &&
    !POPULAR_COUNTRY_SHORTCUTS.some((p) => p.code === selectedCountry);

  // Tab switching in sub-headers
  const liveSubTabs = [
    { id: 'live', label_en: 'Explore', label_ur: 'دریافت' },
    { id: 'following', label_en: 'Following', label_ur: 'فالوئنگ' },
    { id: 'new', label_en: 'New', label_ur: 'نئے' },
  ];

  return (
    <div
      className="min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col font-sans antialiased pb-16 md:pb-0"
      dir={isUr ? 'rtl' : 'ltr'}
    >
      {/* 1. TOP NAVIGATION BAR */}
      <WebTopNav
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={(q) => {
          if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
        }}
        onOpenAppModal={() => setShowAppDownloadModal(true)}
        onOpenDesktopModal={() => setShowDesktopModal(true)}
        isUr={isUr}
        onToggleLang={toggleLang}
      />

      {/* 2. BODY LAYOUT: LEFT RAIL + MAIN CONTENT */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* LEFT NAVIGATION RAIL */}
        <WebLeftRail
          activeNav={activeNav || activeTab}
          onSelectNav={(id) => {
            if (id === 'app') {
              setShowAppDownloadModal(true);
            } else if (id === 'live') {
              setActiveTab('live');
            } else if (id === 'party') {
              setActiveTab('party');
            } else if (id === 'following') {
              setActiveTab('following');
            } else if (id === 'message') {
              setActiveTab('message');
            } else if (id === 'profile') {
              setActiveTab('profile');
            }
          }}
          onOpenAppModal={() => setShowAppDownloadModal(true)}
          isUr={isUr}
        />

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col min-w-0 px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
          {children ? (
            children
          ) : (
            <>
              {/* ========================================================================= */}
              {/* TAB 1: LIVE DISCOVERY PANEL */}
              {/* ========================================================================= */}
              {(activeTab === 'live' || activeTab === 'explore') && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Sub Tab Switcher Bar */}
                  <div className="flex items-center justify-between border-b border-gray-200/80 pb-2">
                    <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-0.5">
                      {liveSubTabs.map((tab) => {
                        const isSelected = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                              setActiveTab(tab.id);
                              if (tab.id === 'following') router.push('/live?tab=following');
                              else if (tab.id === 'new') router.push('/live?tab=new');
                              else router.push('/live');
                            }}
                            className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                              isSelected
                                ? 'bg-[#FF1A6C] text-white shadow-xs'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                          >
                            <span>{isUr ? tab.label_ur : tab.label_en}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Country Filter Chips */}
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs">
                    {POPULAR_COUNTRY_SHORTCUTS.map((c) => {
                      const isSelected = selectedCountry === c.code;
                      return (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => handleCountrySelect(c.code)}
                          className={`px-3.5 py-1.5 rounded-full font-bold flex items-center gap-1.5 shrink-0 transition-all ${
                            isSelected
                              ? 'bg-pink-50 text-[#FF1A6C] border border-pink-300 shadow-2xs'
                              : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200/80'
                          }`}
                        >
                          <span className="text-sm leading-none">{c.flag}</span>
                          <span>{c.name}</span>
                        </button>
                      );
                    })}

                    {/* Custom Country Pill */}
                    {isCustomCountrySelected && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-50 border border-pink-300 text-[#FF1A6C] font-bold shrink-0 shadow-2xs">
                        <span className="text-sm leading-none">{getCountryFlag(selectedCountry)}</span>
                        <span>{getCountryName(selectedCountry)}</span>
                        <button
                          type="button"
                          onClick={() => handleCountrySelect('ALL')}
                          className="hover:bg-pink-100 rounded-full p-0.5 ml-0.5"
                          title="Clear country filter"
                        >
                          <X className="w-3 h-3 text-[#FF1A6C]" />
                        </button>
                      </div>
                    )}

                    {/* More Countries Trigger */}
                    <button
                      type="button"
                      onClick={() => setShowCountryModal(true)}
                      className="px-3.5 py-1.5 rounded-full bg-white hover:bg-gray-100 text-gray-700 border border-gray-200/80 font-bold flex items-center gap-1.5 shrink-0 transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5 text-[#FF1A6C]" />
                      <span>More Countries</span>
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>

                  {/* 1. Promotional Carousel */}
                  <DiscoveryBannerCarousel />

                  {/* 2. Rank Door Shortcuts */}
                  <RankDoorSection />

                  {/* 3. Ranking Podium Preview */}
                  <RankingPreviewSection />

                  {/* 4. Live Rooms Grid (Light Portrait Cards) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FF1A6C] animate-pulse" />
                        <h2 className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight">
                          {isUr ? 'اس وقت لائیو' : 'Live Now'}
                        </h2>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-pink-100 text-[#FF1A6C]">
                          {filteredLiveRooms.length}
                        </span>
                      </div>
                    </div>

                    {filteredLiveRooms.length === 0 ? (
                      <div className="p-10 text-center rounded-3xl bg-white border border-gray-200 shadow-xs space-y-3">
                        <Radio className="w-10 h-10 text-gray-300 mx-auto" />
                        <h3 className="text-sm font-bold text-gray-800">
                          {selectedCountry !== 'ALL'
                            ? `No live streams from ${getCountryName(selectedCountry)} right now`
                            : 'No active live streams right now'}
                        </h3>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto">
                          Try selecting All Countries to watch live broadcasters streaming worldwide.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleCountrySelect('ALL')}
                          className="px-4 py-2 rounded-xl bg-[#FF1A6C] text-white text-xs font-bold shadow-xs hover:bg-[#e0125c]"
                        >
                          View All Countries (🔥)
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                        {filteredLiveRooms.map((room) => (
                          <Link
                            key={room.id}
                            href={`/live/room/${room.id}`}
                            className="group flex flex-col space-y-2 select-none"
                          >
                            {/* Portrait Card */}
                            <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200/80 shadow-xs group-hover:shadow-md group-hover:border-pink-300 transition-all">
                              <img
                                src={room.coverUrl}
                                alt={room.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />

                              {/* Top Bar on Card: Live Badge & Viewer Count */}
                              <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between text-white text-[11px] font-bold">
                                <span className="px-2 py-0.5 rounded-md bg-[#FF1A6C] text-white uppercase text-[10px] font-black tracking-wide flex items-center gap-1 shadow-xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                  LIVE
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs flex items-center gap-1">
                                  <Eye className="w-3 h-3 text-gray-200" />
                                  <span>{room.viewerCount.toLocaleString()}</span>
                                </span>
                              </div>

                              {/* PK Badge if Active */}
                              {room.isPkActive && (
                                <div className="absolute top-10 left-2.5 px-2 py-0.5 rounded-md bg-gradient-to-r from-red-600 to-pink-600 text-white text-[10px] font-black flex items-center gap-1 shadow-xs">
                                  <Swords className="w-3 h-3" />
                                  PK
                                </div>
                              )}

                              {/* Category Tag on bottom left */}
                              <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-xs text-white text-[10px] font-semibold">
                                {room.category}
                              </div>
                            </div>

                            {/* Host Nickname & Room Title Under Card */}
                            <div className="space-y-0.5 px-0.5">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-gray-900 truncate group-hover:text-[#FF1A6C] transition-colors">
                                  {room.hostNickname}
                                </p>
                                <span className="text-xs leading-none">{room.flagEmoji}</span>
                              </div>
                              <p className="text-[11px] text-gray-500 truncate">
                                {room.title}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 2: PARTY DISCOVERY PANEL */}
              {/* ========================================================================= */}
              {activeTab === 'party' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Party Header Banner */}
                  <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 border border-purple-100 flex items-center justify-between gap-4 shadow-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">
                          {isUr ? '9 سیٹ پارٹی لاؤنجز' : '9-Seat Party Lounges'}
                        </h2>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                          {filteredPartyRooms.length} Rooms
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 max-w-md">
                        {isUr
                          ? 'دوستوں کے ساتھ آڈیو رومز میں شامل ہوں، گانے سنیں اور بات چیت کریں'
                          : 'Join themed audio lounges, hang out with creators, and share real-time voice moments.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAppDownloadModal(true)}
                      className="px-4 py-2 rounded-xl bg-[#FF1A6C] hover:bg-[#e0125c] text-white text-xs font-bold shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isUr ? 'روم بنائیں' : 'Create Room'}</span>
                    </button>
                  </div>

                  {/* 6 Fixture Party Rooms */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPartyRooms.map((room) => {
                      const occupiedSeats = room.seats.filter((s) => s.isOccupied).length;
                      return (
                        <div
                          key={room.id}
                          className="p-4 rounded-2xl bg-white border border-gray-200 hover:border-pink-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3.5"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={room.coverUrl}
                              alt={room.title}
                              className="w-14 h-14 rounded-2xl object-cover border border-gray-200/80 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-900 truncate">
                                  {room.title}
                                </h3>
                                <span className="text-xs">{room.flagEmoji}</span>
                              </div>
                              <p className="text-xs text-gray-500 truncate">
                                Host: {room.hostNickname}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                                  {occupiedSeats} / 9 Seats
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {room.category}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Seats Avatars Preview */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {room.seats
                                .filter((s) => s.isOccupied && s.avatarUrl)
                                .slice(0, 5)
                                .map((seat, i) => (
                                  <img
                                    key={i}
                                    src={seat.avatarUrl || ''}
                                    alt="Seat"
                                    className="w-6 h-6 rounded-full object-cover ring-2 ring-white"
                                  />
                                ))}
                            </div>

                            <button
                              type="button"
                              onClick={() => setShowAppDownloadModal(true)}
                              className="px-3 py-1 rounded-xl bg-pink-50 hover:bg-pink-100 text-[#FF1A6C] text-xs font-bold border border-pink-200/80 transition-colors"
                            >
                              Join Seat
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 3: FOLLOWING BROADCASTERS PANEL */}
              {/* ========================================================================= */}
              {activeTab === 'following' && (
                <div className="space-y-4 max-w-3xl mx-auto animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200/80">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-[#FF1A6C] fill-current" />
                      <h2 className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight">
                        {isUr ? 'فالو کردہ براڈکاسٹرز' : 'Followed Broadcasters'}
                      </h2>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-pink-100 text-[#FF1A6C]">
                        {followedUsers.length}
                      </span>
                    </div>

                    <span className="text-xs text-gray-400">
                      {isUr ? 'آن لائن الرٹس آن ہیں' : 'Live push alerts enabled'}
                    </span>
                  </div>

                  <div className="divide-y divide-gray-100 bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                    {followedUsers.map((user) => {
                      const isBellActive = notificationBellUsers[user.userId] ?? true;
                      return (
                        <div
                          key={user.userId}
                          className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-gray-50/80 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img
                                src={user.avatarUrl}
                                alt={user.nickname}
                                className="w-12 h-12 rounded-full object-cover ring-2 ring-[#FF1A6C]/40"
                              />
                              {user.isOnline && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                              )}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-gray-900">
                                {user.nickname}
                              </h3>
                              <p className="text-xs text-gray-500">
                                {user.isOnline ? '🔴 Live Now' : 'Offline'} · {user.mutualCount} mutual
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleBell(user.userId)}
                              className={`p-2 rounded-full transition-colors ${
                                isBellActive
                                  ? 'bg-pink-50 text-[#FF1A6C]'
                                  : 'bg-gray-100 text-gray-400 hover:text-gray-700'
                              }`}
                              title="Toggle live notification alert"
                            >
                              <Bell className="w-4 h-4" />
                            </button>

                            <Link
                              href="/live"
                              className="px-3.5 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all"
                            >
                              Watch
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 4: NEW CREATORS */}
              {/* ========================================================================= */}
              {activeTab === 'new' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200/80">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <h2 className="text-base font-extrabold text-gray-900">
                      {isUr ? 'نئے براڈکاسٹرز' : 'New Broadcasters'}
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {DesignFixtures.userProfiles.map((creator) => (
                      <div
                        key={creator.userId}
                        className="p-4 rounded-2xl bg-white border border-gray-200 hover:border-pink-300 shadow-xs flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={creator.avatarUrl}
                            alt={creator.nickname}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-[#FF1A6C]/30"
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="text-xs font-bold text-gray-900 truncate">
                              {creator.nickname}
                            </h3>
                            <p className="text-[10px] text-gray-400">ID: {creator.poppoId}</p>
                            <span className="text-[10px] text-gray-500">{creator.country}</span>
                          </div>
                        </div>

                        <Link
                          href="/profile"
                          className="w-full py-1.5 text-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors"
                        >
                          View Profile
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 5: MESSAGE (INBOX SHORTCUT CONTAINER) */}
              {/* ========================================================================= */}
              {activeTab === 'message' && (
                <div className="p-8 max-w-2xl mx-auto rounded-3xl bg-white border border-gray-200 shadow-xs space-y-4 text-center animate-in fade-in duration-150">
                  <div className="w-14 h-14 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-center mx-auto text-[#FF1A6C]">
                    <MessageSquare className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-base font-extrabold text-gray-900">
                      {isUr ? 'پیغامات اور چیٹ ان باکس' : 'Message & Chat Inbox'}
                    </h2>
                    <p className="text-xs text-gray-500 max-w-md mx-auto">
                      {isUr
                        ? 'اپنے پیغامات، فالوورز کی اطلاعات اور سسٹم نوٹس دیکھیں'
                        : 'View direct message conversations, system notices, and official announcements.'}
                    </p>
                  </div>
                  <Link
                    href="/inbox"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF1A6C] hover:bg-[#e0125c] text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <span>{isUr ? 'مکمل ان باکس کھولیں' : 'Open Full Inbox'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 6: PROFILE (ME SHORTCUT CONTAINER) */}
              {/* ========================================================================= */}
              {activeTab === 'profile' && (
                <div className="p-8 max-w-2xl mx-auto rounded-3xl bg-white border border-gray-200 shadow-xs space-y-4 text-center animate-in fade-in duration-150">
                  <div className="w-16 h-16 rounded-full ring-2 ring-[#FF1A6C] p-0.5 mx-auto">
                    <img
                      src={DesignFixtures.currentUserProfile.avatarUrl}
                      alt={DesignFixtures.currentUserProfile.nickname}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-base font-extrabold text-gray-900">
                      {DesignFixtures.currentUserProfile.nickname}
                    </h2>
                    <p className="text-xs text-gray-500">
                      ID: {DesignFixtures.currentUserProfile.poppoId} · VIP {DesignFixtures.currentUserProfile.vipLevel}
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF1A6C] hover:bg-[#e0125c] text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <span>{isUr ? 'مکمل پروفائل دیکھیں' : 'View Full Profile & Centers'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 7: NEAR LOCATION CONTAINER */}
              {/* ========================================================================= */}
              {activeTab === 'near' && (
                <div className="p-8 max-w-md mx-auto rounded-3xl bg-white border border-gray-200 shadow-xs space-y-3 text-center animate-in fade-in duration-150">
                  <Compass className="w-10 h-10 text-gray-300 mx-auto" />
                  <h3 className="text-sm font-bold text-gray-800">
                    Near Feature Disabled
                  </h3>
                  <p className="text-xs text-gray-500">
                    Location-based live discovery is currently disabled by default. Please use Explore to discover broadcasters.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('live')}
                    className="px-4 py-2 rounded-xl bg-[#FF1A6C] text-white text-xs font-bold shadow-xs hover:bg-[#e0125c]"
                  >
                    Explore Broadcasters
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* 3. MOBILE BOTTOM NAVIGATION (< 768px) */}
      <WebMobileNav
        activeNav={activeNav || activeTab}
        onOpenAppModal={() => setShowAppDownloadModal(true)}
        isUr={isUr}
      />

      {/* 4. APP & DESKTOP DOWNLOAD MODAL */}
      <AppDownloadModal
        isOpen={showAppDownloadModal || showDesktopModal}
        onClose={() => {
          setShowAppDownloadModal(false);
          setShowDesktopModal(false);
        }}
        isUr={isUr}
      />

      {/* 5. SELECT COUNTRY MODAL (Light Themed) */}
      {showCountryModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setShowCountryModal(false)}
        >
          <div
            className="w-full sm:max-w-md max-h-[85vh] sm:max-h-[75vh] bg-white rounded-t-3xl sm:rounded-3xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <h2 className="text-base font-extrabold text-gray-900 tracking-tight">
                Select Country
              </h2>
              <button
                type="button"
                onClick={() => setShowCountryModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input Box */}
            <div className="px-5 py-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  autoFocus
                  value={countryModalSearch}
                  onChange={(e) => setCountryModalSearch(e.target.value)}
                  placeholder="Search country"
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 text-sm text-gray-900 placeholder-gray-400 border border-transparent focus:border-[#FF1A6C] focus:bg-white outline-none transition-all"
                />
                {countryModalSearch && (
                  <button
                    type="button"
                    onClick={() => setCountryModalSearch('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Country List */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
              {/* Option: All Countries */}
              {(!countryModalSearch ||
                'all countries popular worldwide'.includes(countryModalSearch.toLowerCase())) && (
                <button
                  type="button"
                  onClick={() => handleCountrySelect('ALL')}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${
                    selectedCountry === 'ALL'
                      ? 'bg-pink-50 text-[#FF1A6C] font-bold'
                      : 'hover:bg-gray-50 text-gray-700 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">🔥</span>
                    <span className="text-sm">All Countries</span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedCountry === 'ALL'
                        ? 'border-[#FF1A6C] bg-[#FF1A6C]'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedCountry === 'ALL' && (
                      <div className="w-2 h-2 rounded-full bg-white shadow-xs" />
                    )}
                  </div>
                </button>
              )}

              {/* Specific Countries */}
              {filteredModalCountries.map((c) => {
                const isSelected = selectedCountry === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCountrySelect(c.code)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${
                      isSelected
                        ? 'bg-pink-50 text-[#FF1A6C] font-bold'
                        : 'hover:bg-gray-50 text-gray-700 font-semibold'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl leading-none">{c.flag}</span>
                      <span className="text-sm">{c.name}</span>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-[#FF1A6C] bg-[#FF1A6C]'
                          : 'border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white shadow-xs" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Footer */}
            <div className="p-3 border-t border-gray-100 flex items-center justify-between text-xs px-5 bg-gray-50">
              <span className="text-gray-500">
                Current: <strong className="text-gray-900">{getCountryName(selectedCountry)}</strong>
              </span>
              {selectedCountry !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => handleCountrySelect('ALL')}
                  className="text-[#FF1A6C] hover:text-[#e0125c] font-bold"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DiscoveryShell;
