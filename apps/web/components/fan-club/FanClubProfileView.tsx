'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Crown,
  Sparkles,
  Heart,
  ShieldCheck,
  Users,
  Calendar,
  LogOut,
  Search as SearchIcon,
  MessageSquare,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { CURRENT_DEMO_FAN_MEMBER } from './mockFanClubData';
import {
  FanClubDetailTab,
  FanClubItem,
  FanClubMember,
  JoinedClubRecord,
} from './types';

interface FanClubProfileViewProps {
  club: FanClubItem;
  membership: JoinedClubRecord | null;
  activeTab: FanClubDetailTab;
  onTabChange: (tab: FanClubDetailTab) => void;
  onBack?: () => void;
  onOpenJoin: (club: FanClubItem) => void;
  onOpenLeave: (club: FanClubItem) => void;
  onOpenBadge: (club: FanClubItem) => void;
  onPreviewMember: (member: FanClubMember) => void;
}

export const FanClubProfileView: React.FC<FanClubProfileViewProps> = ({
  club,
  membership,
  activeTab,
  onTabChange,
  onBack,
  onOpenJoin,
  onOpenLeave,
  onOpenBadge,
  onPreviewMember,
}) => {
  const [memberSearch, setMemberSearch] = useState('');
  const isJoined = Boolean(membership);

  const effectiveMembers: FanClubMember[] = useMemo(() => {
    if (!membership) return club.members;
    const selfMember: FanClubMember = {
      ...CURRENT_DEMO_FAN_MEMBER,
      badgeTitle: club.badgeLabel,
      badgeLevel: club.clubLevel,
      joinedAgo: 'Today',
    };
    return [selfMember, ...club.members];
  }, [club, membership]);

  const effectiveMemberCount = club.memberCount + (isJoined ? 1 : 0);

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return effectiveMembers;
    return effectiveMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.handle.toLowerCase().includes(q) ||
        m.badgeTitle.toLowerCase().includes(q)
    );
  }, [effectiveMembers, memberSearch]);

  return (
    <div data-testid={`fan-club-profile-${club.id}`} className="space-y-4">
      {/* Cover + Host Header Card */}
      <div className="rounded-3xl bg-[#16092D]/95 border border-purple-400/25 overflow-hidden shadow-xl">
        <div className="relative h-36 sm:h-44 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={club.coverImageUrl}
            alt={club.name}
            className="w-full h-full object-cover brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#16092D] via-[#16092D]/40 to-transparent" />

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              data-testid="fan-club-profile-back"
              className="lg:hidden absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-xs font-bold text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Discovery</span>
            </button>
          )}

          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-amber-300/40 text-[11px] font-black text-amber-300">
              Level {club.clubLevel}
            </span>
            <span
              data-testid="club-membership-status-pill"
              className={`px-2.5 py-1 rounded-full text-[11px] font-black border backdrop-blur-md ${
                isJoined
                  ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200'
                  : 'bg-black/60 border-white/20 text-purple-100'
              }`}
            >
              {isJoined ? 'Joined' : 'Not Joined'}
            </span>
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-5 -mt-8 relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="flex items-end gap-3 min-w-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-[3px] border-amber-300 bg-[#251348] shadow-xl shrink-0">
                {club.hostAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={club.hostAvatarUrl} alt={club.hostName} className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-lg font-black">
                    {club.hostName.slice(0, 2)}
                  </span>
                )}
              </div>

              <div className="min-w-0 pb-0.5">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white truncate">
                  {club.name}
                </h2>
                <div className="flex items-center gap-1.5 flex-wrap text-xs text-purple-200/80">
                  <span className="font-bold text-white">{club.hostName}</span>
                  {club.hostVerified && <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  <span className="text-purple-200/55">{club.hostHandle}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                data-testid="club-badge-preview-btn"
                leftIcon={<Crown className="w-3.5 h-3.5 text-amber-300" />}
                onClick={() => onOpenBadge(club)}
              >
                Fan Badge
              </Button>

              {isJoined ? (
                <Button
                  variant="primary"
                  size="sm"
                  data-testid="club-view-membership-btn"
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  onClick={() => onTabChange('membership')}
                >
                  View Membership
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  data-testid="club-profile-join-btn"
                  onClick={() => onOpenJoin(club)}
                >
                  Join Fan Club
                </Button>
              )}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-purple-100/85 leading-relaxed">{club.description}</p>

          <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1.5 text-xs text-purple-200/75">
            <span className="inline-flex items-center gap-1.5 font-bold text-white" data-testid="club-member-count">
              <Users className="w-3.5 h-3.5 text-[#FF4D8D]" />
              {effectiveMemberCount.toLocaleString()} fans
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-300/30 text-[11px] text-amber-300 font-bold">
              Badge: {club.badgeLabel}
            </span>
            <span className="text-purple-200/70">{club.hostRole}</span>
          </div>

          {/* Detail Navigation Tabs */}
          <div
            role="tablist"
            aria-label="Fan club sections"
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar sm:grid sm:grid-cols-4 pt-1"
          >
            {(
              [
                { id: 'overview', label: 'Overview' },
                { id: 'membership', label: 'Membership' },
                { id: 'members', label: `Members (${effectiveMembers.length})` },
                { id: 'updates', label: `Updates (${club.updates.length})` },
              ] as const
            ).map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  data-testid={`club-detail-tab-${t.id}`}
                  onClick={() => onTabChange(t.id)}
                  className={`py-2 px-3.5 sm:px-2 rounded-full text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-gradient-to-r from-[#FF1A6C] to-[#D946EF] text-white shadow-glow-pink'
                      : 'bg-[#211042] text-purple-100/80 hover:bg-[#2B1754]'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* TAB 1: OVERVIEW (Matches 08_06_fan_club.png Emblem + Benefits) */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="rounded-3xl bg-[#16092D]/95 border border-purple-400/20 p-5 sm:p-6 text-center space-y-3">
            <div className="w-24 h-24 rounded-full mx-auto bg-[#7028B8] border border-purple-300/30 shadow-xl flex items-center justify-center">
              <Sparkles className="w-11 h-11 text-amber-300 fill-amber-300" />
            </div>
            <h3 className="text-base sm:text-lg font-black tracking-wide text-white uppercase">
              {club.name}
            </h3>
            <p className="text-xs text-purple-200/70">
              {effectiveMemberCount.toLocaleString()} fans · Level {club.clubLevel}
            </p>
            <div className="pt-1">
              {isJoined ? (
                <button
                  type="button"
                  onClick={() => onTabChange('membership')}
                  className="w-full max-w-xs py-3 px-6 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-sm font-black transition-all hover:bg-emerald-500/30"
                >
                  Member Active · View Membership
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="overview-join-cta"
                  onClick={() => onOpenJoin(club)}
                  className="w-full max-w-xs py-3 px-6 rounded-full bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] text-white text-sm font-black shadow-glow-pink hover:brightness-110 active:scale-95 transition-all"
                >
                  Join Fan Club
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-sm sm:text-base font-black text-white px-1">Fan Club benefits</h3>
            {club.benefits.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl bg-[#16092D]/95 border border-purple-400/20 p-3.5 sm:p-4 flex items-center gap-3.5"
              >
                <div className="w-10 h-10 rounded-full bg-[#241046] border border-white/10 flex items-center justify-center shrink-0">
                  {b.iconKey === 'crown' ? (
                    <Crown className="w-5 h-5 text-amber-300" />
                  ) : b.iconKey === 'sparkle' ? (
                    <Sparkles className="w-5 h-5 text-amber-300" />
                  ) : (
                    <Heart className="w-5 h-5 text-[#FF4D8D]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-extrabold text-white">{b.title}</div>
                  <div className="text-xs text-purple-200/65">{b.subtitle}</div>
                </div>
                {b.iconKey === 'crown' && (
                  <button
                    type="button"
                    onClick={() => onOpenBadge(club)}
                    className="px-3 py-1 rounded-full bg-[#241046] hover:bg-[#31165E] border border-amber-300/35 text-[11px] font-bold text-amber-300 shrink-0"
                  >
                    Preview
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: MEMBERSHIP SCREEN */}
      {activeTab === 'membership' && (
        <div
          data-testid="fan-club-membership-panel"
          className="rounded-3xl bg-[#16092D]/95 border border-purple-400/20 p-5 space-y-4"
        >
          {membership ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[10px] font-black uppercase text-emerald-300">
                    Active Membership
                  </span>
                  <h3 className="text-lg font-black text-white mt-2">{membership.clubName}</h3>
                  <p className="text-xs text-purple-200/70">Host: {club.hostName} · Level {club.clubLevel}</p>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenBadge(club)}
                  className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400/20 to-pink-500/20 border border-amber-300/45 text-xs font-black text-amber-200 inline-flex items-center gap-1.5 shrink-0"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>{club.badgeLabel}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl bg-[#110624] border border-white/10 p-3 flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-[#FF4D8D] shrink-0" />
                  <div>
                    <div className="text-purple-200/55 text-[10px] uppercase font-bold">Join Date</div>
                    <div className="font-bold text-white">{membership.joinedDateLabel}</div>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#110624] border border-white/10 p-3 flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-amber-300 shrink-0" />
                  <div>
                    <div className="text-purple-200/55 text-[10px] uppercase font-bold">Member Badge</div>
                    <div className="font-bold text-white">{club.badgeLabel} · Lv.{club.clubLevel}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-extrabold text-white">Your Member Benefits</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {club.benefits.map((b) => (
                    <div
                      key={b.id}
                      className="rounded-2xl bg-[#110624] border border-white/10 p-3 space-y-1"
                    >
                      <div className="text-xs font-bold text-white">{b.title}</div>
                      <div className="text-[11px] text-purple-200/60">{b.subtitle}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
                <span className="text-[11px] text-purple-200/60">
                  Demo session membership • Leave anytime cleanly
                </span>
                <Button
                  variant="danger"
                  size="sm"
                  data-testid="leave-fan-club-btn"
                  leftIcon={<LogOut className="w-3.5 h-3.5" />}
                  onClick={() => onOpenLeave(club)}
                >
                  Leave Fan Club
                </Button>
              </div>
            </>
          ) : (
            <div data-testid="membership-tab-join-empty">
              <EmptyState
                icon={<Crown className="w-7 h-7" />}
                title="No Active Membership in This Club"
                description={`Join ${club.name} to display the ${club.badgeLabel} fan badge and follow host updates.`}
                actionLabel="Join Fan Club"
                onAction={() => onOpenJoin(club)}
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MEMBER LIST */}
      {activeTab === 'members' && (
        <div
          data-testid="fan-club-members-panel"
          className="rounded-3xl bg-[#16092D]/95 border border-purple-400/20 p-4 sm:p-5 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-white">
                Club Members ({effectiveMembers.length} shown · {effectiveMemberCount.toLocaleString()} total)
              </h3>
              <p className="text-[11px] text-purple-200/60">
                Tap any fan to preview their Popo Live profile card
              </p>
            </div>
            <div className="w-full sm:w-60">
              <SearchBar
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                onClear={() => setMemberSearch('')}
                placeholder="Search members..."
                data-testid="member-search-input"
              />
            </div>
          </div>

          {filteredMembers.length === 0 ? (
            <div data-testid="no-members-empty-state">
              <EmptyState
                icon={<SearchIcon className="w-7 h-7" />}
                title="No members found"
                description={
                  memberSearch
                    ? `No member matched "${memberSearch}" in ${club.name}.`
                    : 'This Fan Club currently has no listed members.'
                }
                actionLabel={memberSearch ? 'Clear Search' : undefined}
                onAction={memberSearch ? () => setMemberSearch('') : undefined}
              />
            </div>
          ) : (
            <div className="space-y-2.5" data-testid="club-members-list">
              {filteredMembers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  data-testid={`club-member-row-${m.id}`}
                  onClick={() => onPreviewMember(m)}
                  className="w-full text-left rounded-2xl bg-[#110624] hover:bg-[#1A0A35] border border-white/10 p-3 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-purple-300/35 bg-[#251348] flex items-center justify-center">
                        {m.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          <span
                            className={`w-full h-full flex items-center justify-center text-xs font-black text-white bg-gradient-to-br ${m.avatarColor}`}
                          >
                            {m.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {m.isOnline && (
                        <span
                          title="Online"
                          className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#110624]"
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-extrabold text-white truncate">
                          {m.name}
                        </span>
                        {m.isCurrentDemoUser && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#FF1A6C]/20 text-[9px] font-bold text-[#FF6BA3]">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-purple-200/60 truncate">
                        {m.roleLabel} · Joined {m.joinedAgo}
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-300/35 text-[10px] font-black text-amber-200 inline-flex items-center gap-1 shrink-0">
                    <Crown className="w-3 h-3 text-amber-300 fill-amber-300" />
                    {m.badgeTitle}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MEMBER UPDATES */}
      {activeTab === 'updates' && (
        <div
          data-testid="fan-club-updates-panel"
          className="rounded-3xl bg-[#16092D]/95 border border-purple-400/20 p-4 sm:p-5 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-black text-white">Official Host Updates</h3>
            <span className="text-[11px] text-purple-200/55">{club.updates.length} updates</span>
          </div>

          {club.updates.length === 0 ? (
            <div data-testid="no-updates-empty-state">
              <EmptyState
                icon={<MessageSquare className="w-7 h-7" />}
                title="No Fan Club updates"
                description={`${club.hostName} hasn't posted announcements in ${club.name} yet. Check back soon!`}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {club.updates.map((upd) => (
                <article
                  key={upd.id}
                  data-testid={`club-update-${upd.id}`}
                  className="rounded-2xl bg-[#110624] border border-white/10 p-3.5 sm:p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-300/50 bg-[#251348] shrink-0">
                        {upd.authorAvatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={upd.authorAvatarUrl}
                            alt={upd.authorName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center text-xs font-bold">
                            {upd.authorName[0]}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-white truncate">{upd.authorName}</div>
                        <div className="text-[10px] text-purple-200/55">
                          {upd.publishedDate} · {upd.timestamp}
                        </div>
                      </div>
                    </div>

                    {upd.tag && (
                      <span className="px-2 py-0.5 rounded-full bg-[#FF1A6C]/20 border border-[#FF1A6C]/40 text-[10px] font-bold text-[#FF6BA3] shrink-0">
                        {upd.tag}
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs sm:text-sm font-black text-white">{upd.title}</h4>
                  <p className="text-xs text-purple-100/80 leading-relaxed">{upd.message}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
