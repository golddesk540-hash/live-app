'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bookmark,
  Crown,
  Flame,
  Heart,
  MoreVertical,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchBar } from '@/components/ui/SearchBar';
import { ProfilePreviewModal } from '@/components/inbox/ProfilePreviewModal';
import { InboxUserProfile } from '@/components/inbox/types';
import { INITIAL_FAN_CLUBS } from './mockFanClubData';
import {
  clearLocalJoinedFanClubs,
  loadLocalJoinedFanClubs,
  saveLocalJoinedFanClubs,
} from './fanClubLocalStore';
import {
  FanClubDetailTab,
  FanClubFilterTab,
  FanClubItem,
  FanClubMember,
  JoinedClubRecord,
} from './types';
import { FanClubProfileView } from './FanClubProfileView';
import { FanBadgePreviewModal } from './FanBadgePreviewModal';
import { JoinFanClubModal, LeaveFanClubModal } from './FanClubJoinLeaveModals';

function mapMemberToInboxProfile(m: FanClubMember): InboxUserProfile {
  return {
    id: m.id,
    name: m.name,
    handle: m.handle,
    poppoId: m.poppoId,
    avatarUrl: m.avatarUrl,
    avatarColor: m.avatarColor,
    ringColor: m.ringColor,
    status: m.isOnline ? 'online' : 'offline',
    lastSeenText: m.isOnline ? 'Online in Fan Club' : 'Offline',
    bio: m.bio,
    countryFlag: m.countryFlag,
    countryName: m.countryName,
    level: m.level,
    isVip: m.isVip,
    followersCount: m.followersCount,
    followingCount: m.followingCount,
    roleTag: `${m.badgeTitle} Lv.${m.badgeLevel}`,
  };
}

export const FanClubScreen: React.FC = () => {
  const [clubs, setClubs] = useState<FanClubItem[]>(INITIAL_FAN_CLUBS);
  const [joinedClubs, setJoinedClubs] = useState<JoinedClubRecord[]>([]);
  const [filterTab, setFilterTab] = useState<FanClubFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClubId, setSelectedClubId] = useState<string>(INITIAL_FAN_CLUBS[0].id);
  const [mobileShowProfile, setMobileShowProfile] = useState(false);
  const [detailTab, setDetailTab] = useState<FanClubDetailTab>('overview');
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);

  const [joinTarget, setJoinTarget] = useState<FanClubItem | null>(null);
  const [leaveTarget, setLeaveTarget] = useState<FanClubItem | null>(null);
  const [badgeTarget, setBadgeTarget] = useState<FanClubItem | null>(null);
  const [previewMember, setPreviewMember] = useState<FanClubMember | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadLocalJoinedFanClubs();
    if (saved.length > 0) {
      setJoinedClubs(saved);
    }
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const joinedMap = useMemo(() => {
    const map = new Map<string, JoinedClubRecord>();
    for (const r of joinedClubs) map.set(r.clubId, r);
    return map;
  }, [joinedClubs]);

  const filteredClubs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = clubs;

    if (filterTab === 'featured') list = list.filter((c) => c.isFeatured);
    else if (filterTab === 'popular') list = [...list].sort((a, b) => b.memberCount - a.memberCount);
    else if (filterTab === 'recommended') list = list.filter((c) => c.isRecommended);
    else if (filterTab === 'joined') list = list.filter((c) => joinedMap.has(c.id));

    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.hostName.toLowerCase().includes(q) ||
          c.hostHandle.toLowerCase().includes(q) ||
          c.badgeLabel.toLowerCase().includes(q)
      );
    }
    return list;
  }, [clubs, filterTab, searchQuery, joinedMap]);

  const selectedClub = useMemo(
    () => clubs.find((c) => c.id === selectedClubId) || clubs[0] || null,
    [clubs, selectedClubId]
  );

  const featuredSpotlight = useMemo(() => clubs[0] || null, [clubs]);

  const handleOpenClub = (clubId: string, initialDetailTab: FanClubDetailTab = 'overview') => {
    setSelectedClubId(clubId);
    setDetailTab(initialDetailTab);
    setMobileShowProfile(true);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handleConfirmJoin = (club: FanClubItem) => {
    setJoinedClubs((prev) => {
      if (prev.some((r) => r.clubId === club.id)) return prev;
      const next: JoinedClubRecord[] = [
        {
          clubId: club.id,
          clubName: club.name,
          hostName: club.hostName,
          badgeLabel: club.badgeLabel,
          clubLevel: club.clubLevel,
          joinedDateLabel: 'Nov 12, 2026',
        },
        ...prev,
      ];
      saveLocalJoinedFanClubs(next);
      return next;
    });
    showToast(`Joined ${club.name} locally!`);
  };

  const handleConfirmLeave = (clubId: string) => {
    setJoinedClubs((prev) => {
      const next = prev.filter((r) => r.clubId !== clubId);
      saveLocalJoinedFanClubs(next);
      return next;
    });
    showToast('Left Fan Club locally');
  };

  const handleResetDemo = () => {
    clearLocalJoinedFanClubs();
    setClubs(INITIAL_FAN_CLUBS);
    setJoinedClubs([]);
    setFilterTab('all');
    setSearchQuery('');
    setSelectedClubId(INITIAL_FAN_CLUBS[0].id);
    setMobileShowProfile(false);
    setHeaderMenuOpen(false);
    showToast('Fan Club demo state restored');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#130626] via-[#0B0418] to-[#070312] text-white flex flex-col pb-12">
      {/* Top Bar (Matches 08_06_fan_club.png) */}
      <header className="sticky top-0 z-40 bg-[#120624]/95 backdrop-blur-xl border-b border-purple-400/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {mobileShowProfile ? (
              <button
                type="button"
                onClick={() => setMobileShowProfile(false)}
                aria-label="Back to Fan Club Discovery"
                className="lg:hidden p-2 rounded-full bg-[#1E0F3B] hover:bg-[#2A1652] text-purple-100 border border-white/10 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : null}

            <Link
              href="/live"
              aria-label="Back to Live Discovery"
              className={`${mobileShowProfile ? 'hidden lg:inline-flex' : 'inline-flex'} p-2 rounded-full bg-[#1E0F3B] hover:bg-[#2A1652] text-purple-100 border border-white/10 transition-colors`}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-full border-2 border-purple-200/80 bg-[#1D0D39] flex items-center justify-center shadow-glow-pink group-hover:scale-105 transition-transform">
                <span className="w-3.5 h-3.5 rounded-full bg-white shadow-sm" />
              </div>
              <span className="text-base sm:text-lg font-black tracking-tight text-white">
                Popo <span className="text-[#FF1A6C]">Live</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="fan-club-header-joined-toggle"
              onClick={() => {
                setFilterTab((prev) => (prev === 'joined' ? 'all' : 'joined'));
                setMobileShowProfile(false);
              }}
              aria-label="Toggle My Joined Clubs"
              className={`p-2 rounded-full border transition-colors ${
                filterTab === 'joined'
                  ? 'bg-[#FF1A6C] border-[#FF1A6C] text-white shadow-glow-pink'
                  : 'bg-[#1C0D38] hover:bg-[#28154D] border-white/10 text-purple-100/85'
              }`}
            >
              <Heart className={`w-4 h-4 ${filterTab === 'joined' ? 'fill-white' : ''}`} />
            </button>

            <Link
              href="/profile"
              aria-label="View Profile"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-xs font-bold text-purple-100"
            >
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span>My Clubs ({joinedClubs.length})</span>
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setHeaderMenuOpen((v) => !v)}
                data-testid="fan-club-header-menu-btn"
                aria-label="Fan Club options"
                className="p-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-purple-100/85 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {headerMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#100521] border border-purple-400/25 shadow-2xl p-1.5 z-50 space-y-0.5">
                  <button
                    type="button"
                    data-testid="simulate-empty-clubs-btn"
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      setClubs([]);
                      setMobileShowProfile(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-amber-200 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Bookmark className="w-3.5 h-3.5" /> Preview Empty Catalog
                  </button>
                  <button
                    type="button"
                    onClick={handleResetDemo}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-cyan-400" /> Restore Demo Clubs
                  </button>
                  <Link
                    href="/square"
                    onClick={() => setHeaderMenuOpen(false)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#FF4D8D]" /> Square Community
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7">
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">
          {/* LEFT / DISCOVERY COLUMN */}
          <section className={`${mobileShowProfile ? 'hidden lg:block' : 'block'} space-y-4`}>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Fan Club</h1>
              <p className="text-xs sm:text-sm text-purple-200/70 mt-0.5">
                Join a host&apos;s fan community
              </p>
            </div>

            {/* Featured Club Hero Card matching 08_06_fan_club.png */}
            {featuredSpotlight && filterTab === 'all' && !searchQuery && (
              <div
                data-testid="fan-club-hero-spotlight"
                className="rounded-3xl bg-[#16092D]/95 border border-purple-400/25 p-5 text-center space-y-3 shadow-xl"
              >
                <div className="w-20 h-20 rounded-full mx-auto bg-[#7028B8] border border-purple-300/35 shadow-lg flex items-center justify-center">
                  <Sparkles className="w-9 h-9 text-amber-300 fill-amber-300" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-wide text-white uppercase">
                    {featuredSpotlight.name}
                  </h2>
                  <p className="text-xs text-purple-200/70 mt-0.5">
                    {(
                      featuredSpotlight.memberCount +
                      (joinedMap.has(featuredSpotlight.id) ? 1 : 0)
                    ).toLocaleString()}{' '}
                    fans · Level {featuredSpotlight.clubLevel}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2">
                  {joinedMap.has(featuredSpotlight.id) ? (
                    <button
                      type="button"
                      data-testid="hero-view-membership-btn"
                      onClick={() => handleOpenClub(featuredSpotlight.id, 'membership')}
                      className="px-6 py-2.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs font-black hover:bg-emerald-500/30 transition-all"
                    >
                      View Membership
                    </button>
                  ) : (
                    <button
                      type="button"
                      data-testid="hero-join-fan-club-btn"
                      onClick={() => setJoinTarget(featuredSpotlight)}
                      className="px-7 py-2.5 rounded-full bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] text-white text-xs sm:text-sm font-black shadow-glow-pink hover:brightness-110 active:scale-95 transition-all"
                    >
                      Join Fan Club
                    </button>
                  )}

                  <button
                    type="button"
                    data-testid="hero-open-profile-btn"
                    onClick={() => handleOpenClub(featuredSpotlight.id, 'overview')}
                    className="px-4 py-2.5 rounded-full bg-[#241046] hover:bg-[#31165E] border border-white/10 text-xs font-bold text-purple-100"
                  >
                    Open Club
                  </button>
                </div>
              </div>
            )}

            {/* Search Bar */}
            <SearchBar
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Search Fan Clubs, hosts, badges..."
              data-testid="fan-club-search-input"
            />

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {(
                [
                  { id: 'all', label: 'All Clubs', Icon: Sparkles },
                  { id: 'featured', label: 'Featured', Icon: Crown },
                  { id: 'popular', label: 'Popular', Icon: Flame },
                  { id: 'recommended', label: 'Recommended', Icon: Users },
                  { id: 'joined', label: `My Clubs (${joinedClubs.length})`, Icon: Heart },
                ] as const
              ).map(({ id, label, Icon }) => {
                const active = filterTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    data-testid={`fan-club-tab-${id}`}
                    onClick={() => setFilterTab(id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap inline-flex items-center gap-1.5 transition-all border ${
                      active
                        ? 'bg-gradient-to-r from-[#FF1A6C] to-[#D946EF] border-transparent text-white shadow-glow-pink'
                        : 'bg-[#170A2F] border-white/10 text-purple-200/75 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Club List OR Empty States */}
            {clubs.length === 0 ? (
              <div
                data-testid="no-fan-clubs-empty"
                className="rounded-3xl bg-[#16092D]/95 border border-purple-400/20 p-6"
              >
                <EmptyState
                  icon={<Crown className="w-7 h-7" />}
                  title="No Fan Clubs available"
                  description="There are currently no active host Fan Clubs loaded in this demo catalog."
                  actionLabel="Restore Fan Clubs"
                  onAction={handleResetDemo}
                />
              </div>
            ) : filteredClubs.length === 0 ? (
              <div
                data-testid={filterTab === 'joined' && !searchQuery ? 'no-joined-clubs-empty' : 'no-search-clubs-empty'}
                className="rounded-3xl bg-[#16092D]/95 border border-purple-400/20 p-6"
              >
                <EmptyState
                  icon={
                    filterTab === 'joined' && !searchQuery ? (
                      <Heart className="w-7 h-7" />
                    ) : (
                      <Search className="w-7 h-7" />
                    )
                  }
                  title={
                    filterTab === 'joined' && !searchQuery
                      ? 'No joined Fan Clubs'
                      : 'No search results'
                  }
                  description={
                    filterTab === 'joined' && !searchQuery
                      ? 'Join a favorite host’s Fan Club to earn their supporter badge and see updates here.'
                      : `No Fan Club matched "${searchQuery}". Try another host or club name.`
                  }
                  actionLabel={filterTab === 'joined' ? 'Explore Fan Clubs' : 'Clear Search'}
                  onAction={() => {
                    setSearchQuery('');
                    setFilterTab('all');
                  }}
                />
              </div>
            ) : (
              <div data-testid="fan-club-list" className="space-y-3">
                {filteredClubs.map((club) => {
                  const isJoined = joinedMap.has(club.id);
                  const isSelected = selectedClub?.id === club.id;
                  return (
                    <div
                      key={club.id}
                      data-testid={`fan-club-card-${club.id}`}
                      onClick={() => handleOpenClub(club.id, 'overview')}
                      className={`rounded-3xl p-4 border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#200D42] border-[#FF1A6C]/60 shadow-lg'
                          : 'bg-[#15082B]/95 border-purple-400/20 hover:border-purple-400/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-300/70 bg-[#251348] shrink-0">
                            {club.hostAvatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={club.hostAvatarUrl}
                                alt={club.hostName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="w-full h-full flex items-center justify-center text-xs font-black">
                                {club.hostName.slice(0, 2)}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-xs sm:text-sm font-black text-white truncate">
                                {club.name}
                              </h3>
                              {club.hostVerified && (
                                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              )}
                            </div>
                            <div className="text-[11px] text-purple-200/70 truncate">
                              {club.hostName} ·{' '}
                              {(club.memberCount + (isJoined ? 1 : 0)).toLocaleString()} fans
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-300/35 text-[10px] font-bold text-amber-200">
                                Level {club.clubLevel}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] font-semibold text-purple-200/80">
                                {club.badgeLabel}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          data-testid={`card-action-${club.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isJoined) handleOpenClub(club.id, 'membership');
                            else setJoinTarget(club);
                          }}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold shrink-0 transition-all ${
                            isJoined
                              ? 'bg-emerald-500/20 border border-emerald-400/45 text-emerald-200'
                              : 'bg-gradient-to-r from-[#FF1A6C] to-[#D946EF] text-white shadow-sm hover:brightness-110'
                          }`}
                        >
                          {isJoined ? 'Joined' : 'Join'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* RIGHT / SELECTED FAN CLUB PROFILE & DETAILS COLUMN */}
          <section className={`${mobileShowProfile ? 'block' : 'hidden lg:block'}`}>
            {selectedClub ? (
              <FanClubProfileView
                club={selectedClub}
                membership={joinedMap.get(selectedClub.id) || null}
                activeTab={detailTab}
                onTabChange={setDetailTab}
                onBack={() => {
                  setMobileShowProfile(false);
                  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' });
                }}
                onOpenJoin={(c) => setJoinTarget(c)}
                onOpenLeave={(c) => setLeaveTarget(c)}
                onOpenBadge={(c) => setBadgeTarget(c)}
                onPreviewMember={(m) => setPreviewMember(m)}
              />
            ) : (
              <div className="rounded-3xl bg-[#16092D]/95 border border-purple-400/20 p-8">
                <EmptyState
                  icon={<Crown className="w-7 h-7" />}
                  title="Select a Fan Club"
                  description="Pick a Fan Club from Discovery or restore the demo catalog to inspect members, badges, and updates."
                />
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Interactive Modals */}
      <JoinFanClubModal
        club={joinTarget}
        onClose={() => setJoinTarget(null)}
        onConfirmJoin={handleConfirmJoin}
        onViewMembership={(clubId) => handleOpenClub(clubId, 'membership')}
      />

      <LeaveFanClubModal
        club={leaveTarget}
        onClose={() => setLeaveTarget(null)}
        onConfirmLeave={handleConfirmLeave}
      />

      <FanBadgePreviewModal
        club={badgeTarget}
        isJoined={Boolean(badgeTarget && joinedMap.has(badgeTarget.id))}
        isOpen={Boolean(badgeTarget)}
        onClose={() => setBadgeTarget(null)}
        onJoinClick={(c) => setJoinTarget(c)}
      />

      <ProfilePreviewModal
        user={previewMember ? mapMemberToInboxProfile(previewMember) : null}
        isOpen={Boolean(previewMember)}
        onClose={() => setPreviewMember(null)}
        onMessageUser={() => showToast('Opening direct chat in Inbox...')}
      />

      {toast && (
        <div
          data-testid="fan-club-toast"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#1F0E3D]/95 border border-[#FF1A6C]/50 text-white text-xs font-bold shadow-glow-pink backdrop-blur-md whitespace-nowrap pointer-events-none"
        >
          {toast}
        </div>
      )}
    </div>
  );
};
