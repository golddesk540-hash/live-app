'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart,
  Radio,
  Eye,
  Check,
  UserPlus,
  UserMinus,
  Sparkles,
  Search,
  Bell,
  BellOff,
  ChevronRight,
  ShieldCheck,
  X,
  MessageSquare,
  Flame,
} from 'lucide-react';
import {
  DesignFixtures,
  FixtureUserRelation,
  FixtureLiveRoom,
} from '@/lib/design/designFixtures';

export interface WebFollowingPanelProps {
  isUr?: boolean;
  onOpenMessage?: (userId: string) => void;
}

export const WebFollowingPanel: React.FC<WebFollowingPanelProps> = ({
  isUr = false,
  onOpenMessage,
}) => {
  const router = useRouter();

  // Filter tab: 'all' | 'live' | 'offline'
  const [filterMode, setFilterMode] = useState<'all' | 'live' | 'offline'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Unfollow state map (userId -> isFollowed boolean)
  const [followMap, setFollowMap] = useState<Record<string, boolean>>({});
  // Notification bell map (userId -> boolean)
  const [bellMap, setBellMap] = useState<Record<string, boolean>>({});
  // User profile modal
  const [selectedUser, setSelectedUser] = useState<FixtureUserRelation | null>(null);

  // Retrieve fixtures
  const { followersList, followingError } = useMemo(() => {
    try {
      if (DesignFixtures.isError) {
        throw new Error('Follower relationship graph offline. Please retry.');
      }
      return { followersList: DesignFixtures.followers, followingError: null };
    } catch (err: any) {
      return {
        followersList: [] as FixtureUserRelation[],
        followingError: err?.message || 'Failed to load followed users.',
      };
    }
  }, []);

  const liveRoomsMap = useMemo(() => {
    try {
      const map: Record<string, FixtureLiveRoom> = {};
      DesignFixtures.liveRooms.forEach((r) => {
        map[r.hostNickname.toLowerCase()] = r;
      });
      return map;
    } catch {
      return {};
    }
  }, []);

  // Filtered followers
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return followersList.filter((user) => {
      // Check follow status (default true unless explicitly unfollowed)
      const isCurrentlyFollowed = followMap[user.userId] ?? true;
      if (!isCurrentlyFollowed && filterMode !== 'all') return false;

      const liveRoom = liveRoomsMap[user.nickname.toLowerCase()];
      const isLive = Boolean(user.isOnline && liveRoom);

      if (filterMode === 'live' && !isLive) return false;
      if (filterMode === 'offline' && isLive) return false;

      if (!q) return true;
      return (
        user.nickname.toLowerCase().includes(q) ||
        user.userId.toLowerCase().includes(q)
      );
    });
  }, [followersList, followMap, filterMode, searchQuery, liveRoomsMap]);

  const liveCount = useMemo(() => {
    return followersList.filter(
      (u) => (followMap[u.userId] ?? true) && u.isOnline && liveRoomsMap[u.nickname.toLowerCase()]
    ).length;
  }, [followersList, followMap, liveRoomsMap]);

  const handleToggleFollow = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFollowMap((prev) => ({
      ...prev,
      [userId]: !(prev[userId] ?? true),
    }));
  };

  const handleToggleBell = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBellMap((prev) => ({
      ...prev,
      [userId]: !(prev[userId] ?? true),
    }));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-150" data-testid="following-panel">
      {/* 1. TOP HEADER & STATS */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-pink-50 via-rose-50 to-purple-50 border border-pink-100 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#FF1A6C] fill-current" />
            <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">
              {isUr ? 'فالو کردہ براڈکاسٹرز' : 'Followed Broadcasters'}
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-pink-100 text-[#FF1A6C]">
              {followersList.length} Following
            </span>
            {liveCount > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {liveCount} Live Now
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 max-w-md">
            {isUr
              ? 'اپنے پسندیدہ براڈکاسٹرز کے لائیو سیشنز اور اپ ڈیٹس دیکھیں'
              : 'Keep track of your favorite creators, get notified when they stream, and join live rooms.'}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-60">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search followed..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#FF1A6C] shadow-2xs"
          />
        </div>
      </div>

      {/* 2. FILTER PILLS */}
      <div className="flex items-center justify-between border-b border-gray-200/80 pb-2">
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3.5 py-1.5 rounded-full font-bold transition-all ${
              filterMode === 'all'
                ? 'bg-[#FF1A6C] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            All ({followersList.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('live')}
            className={`px-3.5 py-1.5 rounded-full font-bold transition-all flex items-center gap-1.5 ${
              filterMode === 'live'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Now ({liveCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('offline')}
            className={`px-3.5 py-1.5 rounded-full font-bold transition-all ${
              filterMode === 'offline'
                ? 'bg-gray-800 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Offline ({followersList.length - liveCount})
          </button>
        </div>

        <span className="text-[11px] text-gray-400 hidden sm:inline">
          Live push alerts active
        </span>
      </div>

      {/* 3. FOLLOWED USERS LIST */}
      {followingError ? (
        <div className="p-10 text-center rounded-3xl bg-white border border-red-200 shadow-xs space-y-3">
          <Heart className="w-10 h-10 text-red-400 mx-auto" />
          <h3 className="text-sm font-bold text-gray-800">Unable to load followed users</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">{followingError}</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-10 text-center rounded-3xl bg-white border border-gray-200 shadow-xs space-y-3">
          <Heart className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-sm font-bold text-gray-800">
            {filterMode === 'live'
              ? 'None of your followed broadcasters are live right now'
              : 'No followed broadcasters found'}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Discover trending live performers, singers and gaming hosts in Explore!
          </p>
          <button
            type="button"
            onClick={() => router.push('/live')}
            className="px-4 py-2 rounded-xl bg-[#FF1A6C] text-white text-xs font-bold shadow-xs hover:bg-[#e0125c] transition-colors"
          >
            Discover Live Broadcasters (🔥)
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 bg-white rounded-3xl border border-gray-200/90 shadow-xs overflow-hidden">
          {filteredUsers.map((user) => {
            const isFollowed = followMap[user.userId] ?? true;
            const isBellActive = bellMap[user.userId] ?? true;
            const liveRoom = liveRoomsMap[user.nickname.toLowerCase()];
            const isLive = Boolean(user.isOnline && liveRoom);

            return (
              <div
                key={user.userId}
                onClick={() => setSelectedUser(user)}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-pink-50/30 transition-all cursor-pointer gap-3"
                data-testid={`following-row-${user.userId}`}
              >
                {/* User Info */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <img
                      src={user.avatarUrl}
                      alt={user.nickname}
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover ring-2 ${
                        isLive ? 'ring-[#FF1A6C] ring-offset-2 animate-pulse' : 'ring-gray-200'
                      }`}
                    />
                    {isLive ? (
                      <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-[#FF1A6C] text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                        LIVE
                      </span>
                    ) : user.isOnline ? (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-gray-900 group-hover:text-[#FF1A6C] transition-colors truncate">
                        {user.nickname}
                      </h3>
                      <span className="text-xs">🇵🇰</span>
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.2 rounded">
                        Pakistan
                      </span>
                    </div>

                    {isLive && liveRoom ? (
                      <p className="text-xs text-[#FF1A6C] font-semibold truncate flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 animate-pulse shrink-0" />
                        <span className="truncate">{liveRoom.title}</span>
                        <span className="text-gray-400 font-normal">
                          · {liveRoom.viewerCount.toLocaleString()} watching
                        </span>
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 truncate">
                        {user.isOnline ? 'Online now' : 'Offline'} · {user.mutualCount} mutual friends
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:gap-2.5 self-end sm:self-center shrink-0">
                  {/* Push Alert Bell */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleBell(user.userId, e)}
                    className={`p-2 rounded-xl border transition-colors ${
                      isBellActive
                        ? 'bg-pink-50 text-[#FF1A6C] border-pink-200'
                        : 'bg-gray-100 text-gray-400 border-gray-200 hover:text-gray-600'
                    }`}
                    title={isBellActive ? 'Live alerts enabled' : 'Live alerts muted'}
                  >
                    {isBellActive ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  </button>

                  {/* Follow / Unfollow Toggle */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleFollow(user.userId, e)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                      isFollowed
                        ? 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'
                        : 'bg-[#FF1A6C] hover:bg-[#e0125c] text-white border-transparent'
                    }`}
                  >
                    {isFollowed ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>

                  {/* Watch Live or Profile */}
                  {isLive && liveRoom ? (
                    <Link
                      href={`/live/room/${liveRoom.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#FF1A6C] to-[#E0125C] text-white text-xs font-black shadow-xs hover:opacity-95 transition-all flex items-center gap-1"
                    >
                      <Radio className="w-3 h-3" />
                      <span>Watch</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedUser(user)}
                      className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors"
                    >
                      Profile
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. USER PROFILE QUICK PREVIEW MODAL */}
      {selectedUser && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                Broadcaster Profile
              </span>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center space-y-2">
              <img
                src={selectedUser.avatarUrl}
                alt={selectedUser.nickname}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-pink-100"
              />
              <div>
                <div className="flex items-center justify-center gap-1.5">
                  <h3 className="text-base font-extrabold text-gray-900">{selectedUser.nickname}</h3>
                  <span>🇵🇰</span>
                </div>
                <p className="text-xs text-gray-400">ID: {selectedUser.userId.replace('u_', '88')}</p>
              </div>

              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold border border-amber-200 text-[10px]">
                  Wealth Lv. 14
                </span>
                <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold border border-purple-200 text-[10px]">
                  VIP Member
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">
                  {selectedUser.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  const uid = selectedUser.userId;
                  setSelectedUser(null);
                  if (onOpenMessage) {
                    onOpenMessage(uid);
                  } else {
                    router.push('/inbox');
                  }
                }}
                className="py-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-[#FF1A6C] text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message</span>
              </button>

              {liveRoomsMap[selectedUser.nickname.toLowerCase()] ? (
                <Link
                  href={`/live/room/${liveRoomsMap[selectedUser.nickname.toLowerCase()].id}`}
                  className="py-2.5 rounded-xl bg-[#FF1A6C] hover:bg-[#e0125c] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Watch Stream</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebFollowingPanel;
