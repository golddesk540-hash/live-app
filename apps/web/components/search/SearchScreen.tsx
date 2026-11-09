'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  ArrowLeft,
  X,
  ChevronRight,
  Flame,
  Sparkles,
  Users,
  Radio,
  Swords,
  Music,
  UserCheck,
  User,
  ShieldCheck,
  ExternalLink,
  Trash2,
  Loader2,
} from 'lucide-react';
import LiveRoomCard from '@/components/discovery/LiveRoomCard';
import PartyRoomCard, { PartyRoomItem } from '@/components/discovery/PartyRoomCard';
import { SearchUserResult, SearchRoomResult, SearchPartyResult } from '@/app/api/search/route';

const DEFAULT_RECENT_SEARCHES = ['Zara Live', 'Sana', 'PK Room'];

const POPULAR_SEARCH_ITEMS = [
  { id: 'live-hosts', label: 'Live Hosts', query: 'Live', iconType: 'flame', hasChevron: false },
  { id: 'pk-battle', label: 'PK Battle', query: 'PK', iconType: 'flame', hasChevron: true },
  { id: 'party-room', label: 'Party Room', query: 'Party', iconType: 'flame', hasChevron: false },
  { id: 'music', label: 'Music', query: 'Music', iconType: 'flame', hasChevron: false },
  { id: 'new-hosts', label: 'New Hosts', query: 'Star', iconType: 'purple', hasChevron: false },
];

export default function SearchScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [queryText, setQueryText] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<'all' | 'users' | 'rooms' | 'party'>('all');

  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(DEFAULT_RECENT_SEARCHES);

  const [results, setResults] = useState<{
    users: SearchUserResult[];
    rooms: SearchRoomResult[];
    party: SearchPartyResult[];
  }>({
    users: [],
    rooms: [],
    party: [],
  });

  const [counts, setCounts] = useState({ users: 0, rooms: 0, party: 0, total: 0 });
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('popolive_recent_searches');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecentSearches(parsed);
        }
      }
    } catch (e) {
      console.warn('Could not read recent searches from storage', e);
    }
  }, []);

  // Save recent search
  const saveRecentSearch = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 10);
      try {
        localStorage.setItem('popolive_recent_searches', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save recent search', e);
      }
      return updated;
    });
  };

  // Clear recent searches
  const handleClearRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('popolive_recent_searches');
    } catch (e) {
      console.warn('Could not clear storage', e);
    }
  };

  // Execute search API call
  const performSearch = async (searchTerm: string) => {
    const clean = searchTerm.trim();
    if (!clean) {
      setActiveQuery('');
      setHasSearched(false);
      setResults({ users: [], rooms: [], party: [] });
      setCounts({ users: 0, rooms: 0, party: 0, total: 0 });
      return;
    }

    setActiveQuery(clean);
    setQueryText(clean);
    setLoading(true);
    setHasSearched(true);
    saveRecentSearch(clean);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(clean)}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || { users: [], rooms: [], party: [] });
        setCounts(data.counts || { users: 0, rooms: 0, party: 0, total: 0 });
      }
    } catch (err) {
      console.error('Error fetching search results:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run initial search if query param passed in URL
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (queryText.trim()) {
      performSearch(queryText);
    }
  };

  const handleClearInput = () => {
    setQueryText('');
    setActiveQuery('');
    setHasSearched(false);
    setResults({ users: [], rooms: [], party: [] });
    setCounts({ users: 0, rooms: 0, party: 0, total: 0 });
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-[#080915] text-white flex flex-col font-sans selection:bg-[#FF2E74] selection:text-white pb-24">
      
      {/* 1. TOP HEADER (1:1 with 03_07_search.png) */}
      <header className="sticky top-0 z-40 bg-[#0c0e1e]/95 backdrop-blur-xl border-b border-white/5 h-14 sm:h-16 px-4 sm:px-8 flex items-center justify-between gap-4">
        {/* Back navigation button */}
        <button
          onClick={() => router.back()}
          aria-label="Back"
          className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center text-white/90 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Center: Popo Live branding */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF2E74] via-[#A855F7] to-[#3B82F6] p-[2px] shadow-lg shadow-pink-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#120B24] rounded-full flex items-center justify-center font-black text-xs text-transparent bg-clip-text bg-gradient-to-tr from-[#FF2E74] to-yellow-300">
              P
            </div>
          </div>
          <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-1">
            Popo <span className="text-white">Live</span>
          </span>
        </Link>

        {/* Header action icon on top right (matching reference 03_07) */}
        <button
          type="button"
          onClick={() => inputRef.current?.focus()}
          aria-label="Search Action"
          className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center text-white/80 transition-all cursor-pointer"
        >
          <div className="w-5 h-5 rounded-full border border-white/70 flex items-center justify-center relative">
            <div className="w-2.5 h-[1.5px] bg-white/70 rotate-45 absolute -bottom-1 -right-1" />
          </div>
        </button>
      </header>

      {/* 2. MAIN SEARCH CONTAINER (Centered, responsive layout matching reference) */}
      <main className="flex-1 max-w-md sm:max-w-xl md:max-w-2xl w-full mx-auto px-4 py-5 space-y-4">
        
        {/* UPPER CARD CONTAINER: Search Input & Recent Searches (1:1 with 03_07_search.png) */}
        <section className="rounded-3xl bg-[#14172f] border border-white/5 p-4 sm:p-5 space-y-5 shadow-xl shadow-black/30">
          
          {/* SEARCH INPUT BAR */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-center w-full rounded-full bg-[#1b203e] border border-white/10 hover:border-white/20 focus-within:border-pink-500/70 focus-within:bg-[#1f2548] transition-all px-4 py-3 shadow-inner">
              <Search className="w-4 h-4 text-white/40 shrink-0 mr-3" />
              <input
                ref={inputRef}
                type="text"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Search users, rooms, or ID"
                autoFocus={!initialQuery}
                className="w-full bg-transparent text-sm sm:text-base text-white placeholder-zinc-400 outline-none"
              />
              {queryText && (
                <button
                  type="button"
                  onClick={handleClearInput}
                  className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white shrink-0 ml-2 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>

          {/* RECENT SEARCHES SECTION (Matching 03_07 reference) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white tracking-tight">Recent Searches</h2>
              {recentSearches.length > 0 ? (
                <button
                  type="button"
                  onClick={handleClearRecent}
                  title="Clear recent searches"
                  className="text-xs text-zinc-400 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              ) : (
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              )}
            </div>

            {/* Recent Search Chips */}
            {recentSearches.length > 0 ? (
              <div className="flex items-center gap-2.5 flex-wrap">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => performSearch(term)}
                    className="px-4 py-2 rounded-full bg-[#1e2345] hover:bg-[#282f5b] active:scale-95 text-xs text-zinc-200 font-medium border border-white/5 transition-all cursor-pointer"
                  >
                    {term}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic">No recent searches yet.</p>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CASE A: NO SEARCH ACTIVE -> DISPLAY POPULAR SEARCHES (1:1 with 03_07_search.png) */}
        {/* ========================================================================= */}
        {!hasSearched && (
          <section className="rounded-3xl bg-[#14172f] border border-white/5 p-4 sm:p-5 space-y-1 shadow-xl shadow-black/30">
            {/* Header */}
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-sm font-bold text-white tracking-tight">Popular Searches</h2>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </div>

            {/* List of 5 items from 03_07 reference */}
            <div className="divide-y divide-white/5">
              {POPULAR_SEARCH_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => performSearch(item.query)}
                  className="w-full flex items-center justify-between py-3.5 hover:bg-white/[0.03] active:bg-white/[0.06] rounded-xl px-2 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    {item.iconType === 'flame' ? (
                      <Flame className="w-4 h-4 text-rose-500 fill-rose-500 shrink-0" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-purple-400 fill-purple-400 shrink-0" />
                    )}
                    <span className="text-sm font-semibold text-white/90">{item.label}</span>
                  </div>

                  {item.hasChevron && (
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* CASE B: SEARCH ACTIVE -> DISPLAY SEARCH RESULTS WITH TABS */}
        {/* ========================================================================= */}
        {hasSearched && (
          <div className="space-y-4">
            
            {/* Filter Tabs Row */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: `All (${counts.total})` },
                  { id: 'users', label: `Users (${counts.users})` },
                  { id: 'rooms', label: `Live (${counts.rooms})` },
                  { id: 'party', label: `Party (${counts.party})` },
                ].map((tab) => {
                  const isSelected = activeFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveFilter(tab.id as any)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20'
                          : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {loading && (
                <div className="flex items-center gap-1.5 text-xs text-pink-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching...</span>
                </div>
              )}
            </div>

            {/* RESULTS CONTENT */}
            {loading && counts.total === 0 ? (
              /* Loading Skeletons */
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-2xl bg-[#14172f]/60 border border-white/5 animate-pulse flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/10" />
                      <div className="space-y-2">
                        <div className="w-32 h-4 rounded bg-white/10" />
                        <div className="w-20 h-3 rounded bg-white/10" />
                      </div>
                    </div>
                    <div className="w-16 h-8 rounded-xl bg-white/10" />
                  </div>
                ))}
              </div>
            ) : counts.total === 0 ? (
              /* Empty Results State */
              <div className="rounded-3xl bg-[#14172f] border border-white/5 p-8 text-center space-y-3">
                <Search className="w-10 h-10 text-zinc-500 mx-auto" />
                <h3 className="text-base font-bold text-white">No results found for &quot;{activeQuery}&quot;</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Check your spelling or try searching for another nickname, user ID, room title, or popular category.
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearInput}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    View Popular Searches
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                
                {/* 1. USERS SECTION */}
                {(activeFilter === 'all' || activeFilter === 'users') && results.users.length > 0 && (
                  <div className="rounded-3xl bg-[#14172f] border border-white/5 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-pink-400" />
                        <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                          Users ({results.users.length})
                        </h3>
                      </div>
                    </div>

                    <div className="divide-y divide-white/5">
                      {results.users.map((u) => (
                        <div
                          key={u.id}
                          className="py-3 flex items-center justify-between gap-3 hover:bg-white/[0.02] rounded-xl px-1 transition-colors"
                        >
                          <Link href={u.profileUrl} className="flex items-center gap-3 min-w-0 flex-1 group">
                            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-zinc-800 shrink-0 ring-2 ring-pink-500/40 group-hover:ring-pink-500 transition-all">
                              <img src={u.avatarUrl} alt={u.nickname} className="w-full h-full object-cover" />
                              {u.isLive && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#14172f]" />
                              )}
                            </div>

                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-bold text-white truncate group-hover:text-pink-300 transition-colors">
                                  {u.nickname}
                                </span>
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              </div>
                              <p className="text-[11px] text-zinc-400">ID: {u.poppoId}</p>
                              <div className="flex items-center gap-1.5 pt-0.5">
                                <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px] font-black border border-purple-500/30">
                                  Lv.{u.hostLevel}
                                </span>
                                {u.isLive && (
                                  <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[9px] font-black border border-rose-500/30 animate-pulse">
                                    LIVE
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>

                          <div className="shrink-0 flex items-center gap-2">
                            {u.isLive && u.liveRoomId && (
                              <Link
                                href={`/live/room/${u.liveRoomId}`}
                                className="px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 hover:brightness-110 text-white text-xs font-bold shadow-md shadow-pink-500/20 flex items-center gap-1"
                              >
                                <Radio className="w-3 h-3 animate-pulse" />
                                <span>Watch</span>
                              </Link>
                            )}
                            <Link
                              href={u.profileUrl}
                              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                            >
                              Profile
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. LIVE ROOMS SECTION */}
                {(activeFilter === 'all' || activeFilter === 'rooms') && results.rooms.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <Radio className="w-4 h-4 text-rose-400" />
                      <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                        Live Rooms ({results.rooms.length})
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {results.rooms.map((room) => (
                        <LiveRoomCard
                          key={room.id}
                          room={{
                            roomId: room.roomId,
                            roomNumber: room.roomNumber,
                            title: room.title,
                            coverUrl: room.coverUrl,
                            category: room.category,
                            isLive: room.isLive,
                            isPk: room.isPk,
                            viewerCount: room.viewerCount,
                            viewersFormatted: room.viewersFormatted,
                            coinsEarned: 0,
                            coinsFormatted: '0',
                            country: room.country,
                            countryCode: room.countryCode,
                            flagEmoji: room.flagEmoji,
                            host: {
                              id: room.host.poppoId,
                              nickname: room.host.nickname,
                              poppoId: room.host.poppoId,
                              avatarUrl: room.host.avatarUrl,
                            },
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. PARTY ROOMS SECTION */}
                {(activeFilter === 'all' || activeFilter === 'party') && results.party.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <Users className="w-4 h-4 text-fuchsia-400" />
                      <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                        Party Rooms ({results.party.length})
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {results.party.map((party) => (
                        <PartyRoomCard
                          key={party.id}
                          room={{
                            id: party.id,
                            roomNumber: party.roomNumber,
                            title: party.title,
                            collageUrl: party.collageUrl,
                            currentMembers: party.currentMembers,
                            maxMembers: party.maxMembers,
                            seatCountFormatted: party.seatCountFormatted,
                            category: party.category,
                            isLive: party.isLive,
                            hostNickname: party.hostNickname,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
