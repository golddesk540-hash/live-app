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
import LiveRoomCard from './LiveRoomCard';
import WebPartyPanel from './WebPartyPanel';
import WebFollowingPanel from './WebFollowingPanel';
import WebMessagePanel from './WebMessagePanel';
import WebProfilePanel from './WebProfilePanel';
import GoLiveRedirectSheet from './GoLiveRedirectSheet';
import { LiveApiService, USE_LIVE_API } from '@/lib/liveApiService';

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
  const [showGoLiveSheet, setShowGoLiveSheet] = useState(false);
  const [notificationBellUsers, setNotificationBellUsers] = useState<Record<string, boolean>>({});

  // Sync activeTab with pathname and query params
  useEffect(() => {
    if (pathname.includes('/party')) {
      setActiveTab('party');
    } else if (pathname.includes('/inbox')) {
      setActiveTab('message');
    } else if (pathname.includes('/profile')) {
      setActiveTab('profile');
    } else if (pathname.includes('/following') || pathname.includes('/live/following') || searchParams.get('tab') === 'following') {
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

  // Live API states
  const [liveApiRooms, setLiveApiRooms] = useState<FixtureLiveRoom[]>([]);
  const [liveApiLoading, setLiveApiLoading] = useState<boolean>(USE_LIVE_API);
  const [liveApiError, setLiveApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    let isMounted = true;
    setLiveApiLoading(true);
    setLiveApiError(null);

    LiveApiService.getLiveRooms({
      country: selectedCountry !== 'ALL' ? selectedCountry : undefined,
      search: searchQuery || undefined,
    })
      .then((rooms) => {
        if (!isMounted) return;
        setLiveApiRooms(rooms);
        setLiveApiLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setLiveApiError(err.message || 'Failed to load live rooms');
        setLiveApiLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCountry, searchQuery]);

  // Read live rooms from PostgreSQL when USE_LIVE_API is ON, or DesignFixtures when OFF
  const { liveRoomsState, fixturesError } = useMemo(() => {
    if (USE_LIVE_API) {
      if (liveApiError) {
        return {
          liveRoomsState: [] as FixtureLiveRoom[],
          fixturesError: liveApiError,
        };
      }
      return {
        liveRoomsState: liveApiRooms,
        fixturesError: null,
      };
    }

    try {
      if (DesignFixtures.isError) {
        return {
          liveRoomsState: [] as FixtureLiveRoom[],
          fixturesError:
            DesignFixtures.liveRoomsError?.message ||
            'Failed to load live broadcast rooms. Please check your network connection and tap to retry.',
        };
      }
      return {
        liveRoomsState: DesignFixtures.liveRooms || [],
        fixturesError: null,
      };
    } catch (err: any) {
      return {
        liveRoomsState: [] as FixtureLiveRoom[],
        fixturesError:
          err?.message || 'Design fixture error loading live broadcast rooms.',
      };
    }
  }, [liveApiRooms, liveApiError]);

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
    return liveRoomsState.filter((room) => {
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
  }, [liveRoomsState, selectedCountry, searchQuery]);

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
              {/* TAB 1: LIVE DISCOVERY PANEL (R5: Exact 3-Item Order)                      */}
              {/* 1. Country Filter Chips                                                   */}
              {/* 2. Live Now Section                                                       */}
              {/* 3. Portrait Live-Room Cards                                               */}
              {/* ========================================================================= */}
              {(activeTab === 'live' || activeTab === 'explore') && (
                <div className="space-y-6 animate-in fade-in duration-150" data-testid="live-discovery-panel">
                  {/* 1. Country Filter Chips */}
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs" data-testid="country-filter-chips">
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

                  {/* 2. Live Now Section & 3. Portrait Live-Room Cards */}
                  <div className="space-y-3" data-testid="live-now-section">
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

                    {fixturesError ? (
                      <div data-testid="live-error-state" className="p-10 text-center rounded-3xl bg-white border border-red-200 shadow-xs space-y-3">
                        <Radio className="w-10 h-10 text-red-400 mx-auto" />
                        <h3 className="text-sm font-bold text-gray-800">
                          {isUr ? 'لائیو رومز لوڈ کرنے میں مسئلہ پیش آیا' : 'Unable to load live rooms'}
                        </h3>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto">
                          {fixturesError}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            DesignFixtures.reset();
                            window.location.reload();
                          }}
                          className="px-4 py-2 rounded-xl bg-[#FF1A6C] text-white text-xs font-bold shadow-xs hover:bg-[#e0125c] transition-colors"
                        >
                          {isUr ? 'دوبارہ کوشش کریں' : 'Retry'}
                        </button>
                      </div>
                    ) : filteredLiveRooms.length === 0 ? (
                      <div data-testid="live-empty-state" className="p-10 text-center rounded-3xl bg-white border border-gray-200 shadow-xs space-y-3">
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
                      <div data-testid="live-room-cards-grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                        {filteredLiveRooms.map((room) => (
                          <LiveRoomCard key={room.id} room={room} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 2: PARTY DISCOVERY & 9-SEAT VOICE LOUNGES PANEL */}
              {/* ========================================================================= */}
              {activeTab === 'party' && (
                <WebPartyPanel
                  isUr={isUr}
                  onOpenAppModal={() => setShowAppDownloadModal(true)}
                />
              )}

              {/* ========================================================================= */}
              {/* TAB 3: FOLLOWING BROADCASTERS PANEL */}
              {/* ========================================================================= */}
              {activeTab === 'following' && (
                <WebFollowingPanel
                  isUr={isUr}
                  onOpenMessage={() => {
                    setActiveTab('message');
                  }}
                />
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

                        <button
                          type="button"
                          onClick={() => setActiveTab('profile')}
                          className="w-full py-1.5 text-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors"
                        >
                          View Profile
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 5: MESSAGE (COMPLETE INBOX & CHAT THREADS) */}
              {/* ========================================================================= */}
              {activeTab === 'message' && (
                <WebMessagePanel
                  isUr={isUr}
                  onOpenLiveRoom={(roomId) => router.push(`/live/room/${roomId}`)}
                />
              )}

              {/* ========================================================================= */}
              {/* TAB 6: PROFILE (COMPLETE ME & CREATOR CENTERS PANEL) */}
              {/* ========================================================================= */}
              {activeTab === 'profile' && (
                <WebProfilePanel
                  isUr={isUr}
                  onOpenAppModal={() => setShowAppDownloadModal(true)}
                  onOpenGoLive={() => setShowGoLiveSheet(true)}
                />
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

      {/* GO LIVE REDIRECT SHEET */}
      <GoLiveRedirectSheet
        isOpen={showGoLiveSheet}
        onClose={() => setShowGoLiveSheet(false)}
        isUr={isUr}
      />
    </div>
  );
}

export default DiscoveryShell;
