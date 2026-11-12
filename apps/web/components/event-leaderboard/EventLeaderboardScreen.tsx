'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpDown,
  Bell,
  Calendar,
  ChevronRight,
  Crown,
  Heart,
  Info,
  MoreVertical,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { useUnreadNotificationsCount } from '@/components/notifications/useUnreadNotificationsCount';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EventDetailsView } from './EventDetailsView';
import { EventEmptyState } from './EventEmptyState';
import { FeaturedEventCard, getEventStatusStyle } from './FeaturedEventCard';
import { MyEventRankingCard } from './MyEventRankingCard';
import { ParticipantDetailView } from './ParticipantDetailView';
import { TopThreeParticipantsPodium } from './TopThreeParticipantsPodium';
import {
  CURRENT_EVENT_PARTICIPANT_ID,
  createInitialEventLeaderboardRecords,
  formatEventPoints,
} from './mockEventLeaderboardData';
import {
  EventEmptyKind,
  EventParticipantRecord,
  EventRecord,
  EventSortDirection,
  EventStatusFilter,
  LeaderboardFilterTab,
} from './types';

type ScreenSubView = 'dashboard' | 'event_details' | 'participant_detail';

export const EventLeaderboardScreen: React.FC = () => {
  const unreadNotifications = useUnreadNotificationsCount();
  const leaderboardSectionRef = useRef<HTMLElement | null>(null);

  const [events, setEvents] = useState<EventRecord[]>(createInitialEventLeaderboardRecords);
  const [statusFilter, setStatusFilter] = useState<EventStatusFilter>('all');
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>('evt_star_creator');

  const [leaderboardTab, setLeaderboardTab] = useState<LeaderboardFilterTab>('overall');
  const [sortDirection, setSortDirection] = useState<EventSortDirection>('points_desc');
  const [participantSearchQuery, setParticipantSearchQuery] = useState('');

  const [subView, setSubView] = useState<ScreenSubView>('dashboard');
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [hideMyEventRanking, setHideMyEventRanking] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  };

  const filteredEvents = useMemo(() => {
    const q = eventSearchQuery.trim().toLowerCase();
    return events.filter((ev) => {
      if (statusFilter !== 'all' && ev.status !== statusFilter) return false;
      if (q) {
        const hay = `${ev.title} ${ev.category} ${ev.shortDescription}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [events, statusFilter, eventSearchQuery]);

  const activeEvent = useMemo(() => {
    if (filteredEvents.length === 0) return null;
    return filteredEvents.find((ev) => ev.id === selectedEventId) ?? filteredEvents[0];
  }, [filteredEvents, selectedEventId]);

  const activeParticipants = useMemo(() => activeEvent?.participants ?? [], [activeEvent]);

  const topThreeParticipants = useMemo(
    () => activeParticipants.slice(0, 3),
    [activeParticipants]
  );

  const maxEventPoints = useMemo(() => {
    if (activeParticipants.length === 0) return 1;
    return Math.max(...activeParticipants.map((p) => p.eventPoints), 1);
  }, [activeParticipants]);

  const visibleParticipants = useMemo(() => {
    const q = participantSearchQuery.trim().toLowerCase();
    const filtered = activeParticipants.filter((p) => {
      if (!q) return true;
      const hay = `${p.username} ${p.handle} ${p.countryLabel}`.toLowerCase();
      return hay.includes(q);
    });

    return [...filtered].sort((a, b) =>
      sortDirection === 'points_desc'
        ? b.eventPoints - a.eventPoints
        : a.eventPoints - b.eventPoints
    );
  }, [activeParticipants, participantSearchQuery, sortDirection]);

  const myEventEntry = useMemo(() => {
    if (!activeEvent || hideMyEventRanking || activeParticipants.length === 0) return null;
    return (
      activeParticipants.find((p) => p.participantId === CURRENT_EVENT_PARTICIPANT_ID) ?? null
    );
  }, [activeEvent, activeParticipants, hideMyEventRanking]);

  const selectedParticipant = useMemo(
    () => activeParticipants.find((p) => p.id === selectedParticipantId) ?? null,
    [activeParticipants, selectedParticipantId]
  );

  const eventsEmptyKind: EventEmptyKind = useMemo(() => {
    if (eventSearchQuery.trim()) return 'no_search_results';
    if (events.length === 0) return 'no_events';
    if (statusFilter === 'upcoming') return 'no_upcoming';
    if (statusFilter === 'live') return 'no_live';
    if (statusFilter === 'completed') return 'no_completed';
    return 'no_events';
  }, [eventSearchQuery, events.length, statusFilter]);

  const handleRestoreDefaults = () => {
    setEvents(createInitialEventLeaderboardRecords());
    setStatusFilter('all');
    setEventSearchQuery('');
    setSelectedEventId('evt_star_creator');
    setLeaderboardTab('overall');
    setSortDirection('points_desc');
    setParticipantSearchQuery('');
    setSubView('dashboard');
    setSelectedParticipantId(null);
    setHideMyEventRanking(false);
    setShowOptionsMenu(false);
  };

  const handlePreviewEmptyEvents = () => {
    setEvents([]);
    setEventSearchQuery('');
    setSubView('dashboard');
    setShowOptionsMenu(false);
  };

  const handlePreviewEmptyStatus = (status: 'live' | 'upcoming' | 'completed') => {
    const fresh = createInitialEventLeaderboardRecords().filter((ev) => ev.status !== status);
    setEvents(fresh);
    setStatusFilter(status);
    setEventSearchQuery('');
    setSubView('dashboard');
    setShowOptionsMenu(false);
  };

  const handlePreviewNoParticipants = () => {
    const fresh = createInitialEventLeaderboardRecords().map((ev, index) =>
      index === 0 ? { ...ev, participants: [], participantCount: 0, totalEventPoints: 0 } : ev
    );
    setEvents(fresh);
    setStatusFilter('all');
    setSelectedEventId('evt_star_creator');
    setParticipantSearchQuery('');
    setSubView('dashboard');
    setShowOptionsMenu(false);
  };

  const handlePreviewMyRankingUnavailable = () => {
    setEvents(createInitialEventLeaderboardRecords());
    setHideMyEventRanking(true);
    setSubView('dashboard');
    setShowOptionsMenu(false);
  };

  const handleSelectEvent = (ev: EventRecord) => {
    setSelectedEventId(ev.id);
    setParticipantSearchQuery('');
    setSelectedParticipantId(null);
  };

  const handleOpenEventDetails = (ev: EventRecord) => {
    setSelectedEventId(ev.id);
    setSubView('event_details');
    scrollToTop();
  };

  const handleOpenParticipantDetails = (participant: EventParticipantRecord) => {
    setSelectedParticipantId(participant.id);
    setSubView('participant_detail');
    scrollToTop();
  };

  const handleJumpToLeaderboard = (ev: EventRecord) => {
    setSelectedEventId(ev.id);
    setSubView('dashboard');
    if (leaderboardSectionRef.current) {
      leaderboardSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const renderMovementBadge = (p: EventParticipantRecord) => {
    if (p.movement === 'up') {
      return (
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[10px] font-extrabold text-emerald-300">
          <TrendingUp className="w-3 h-3" />+{p.movementDelta}
        </span>
      );
    }
    if (p.movement === 'down') {
      return (
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-400/30 text-[10px] font-extrabold text-rose-300">
          <TrendingDown className="w-3 h-3" />-{p.movementDelta}
        </span>
      );
    }
    if (p.movement === 'new') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#FF1A6C]/20 border border-[#FF1A6C]/40 text-[10px] font-extrabold text-pink-200 uppercase">
          New
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-purple-200/60">
        —
      </span>
    );
  };

  return (
    <div
      data-testid="event-leaderboard-screen"
      className="min-h-screen bg-[#0D031B] text-white flex flex-col pb-10"
    >
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-purple-400/20 bg-[#120624]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (subView !== 'dashboard') {
                  setSubView('dashboard');
                  setSelectedParticipantId(null);
                } else if (typeof window !== 'undefined' && window.history.length > 1) {
                  window.history.back();
                } else if (typeof window !== 'undefined') {
                  window.location.href = '/profile';
                }
              }}
              data-testid="event-leaderboard-back-btn"
              aria-label="Back"
              className="p-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-purple-100/90 transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <Link href="/live" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-full bg-[#1F0B3B] border-2 border-[#FF1A6C] flex items-center justify-center shadow-glow-pink">
                <div className="w-2.5 h-2.5 rounded-full bg-white" />
              </div>
              <div className="leading-tight flex items-center gap-1.5">
                <span className="font-black text-sm tracking-tight text-white">Popo Live</span>
                <span className="hidden xs:inline-block px-1.5 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/35 text-[9px] font-extrabold text-amber-300 uppercase tracking-wider">
                  Phase 9.6
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav aria-label="Event Leaderboard Navigation" className="hidden lg:flex items-center gap-1.5">
            {[
              { href: '/live', label: 'Home', active: false },
              { href: '/event-leaderboard', label: 'Event Leaderboard', active: true },
              { href: '/host-rankings', label: 'Host Rankings', active: false },
              { href: '/new-host-pack', label: 'New-Host Pack', active: false },
              { href: '/daily-tasks', label: 'Daily Host Tasks', active: false },
              { href: '/profile', label: 'Profile', active: false },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  item.active
                    ? 'bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] text-white shadow-glow-pink'
                    : 'text-purple-200/75 hover:text-white hover:bg-[#1E0E3D]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative p-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-purple-100/85 transition-colors"
            >
              <Bell className="w-4 h-4 text-[#FF6BA3]" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#FF1A6C] text-white text-[9px] font-black flex items-center justify-center border border-[#120624]">
                  {unreadNotifications}
                </span>
              )}
            </Link>

            <Link
              href="/fan-club"
              aria-label="Fan Club"
              className="p-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-purple-100/85 transition-colors"
            >
              <Heart className="w-4 h-4 text-[#FF6BA3]" />
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowOptionsMenu((prev) => !prev)}
                data-testid="event-leaderboard-options-btn"
                aria-label="Event Empty State Presets"
                className="p-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-purple-100/85 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showOptionsMenu && (
                <div
                  data-testid="event-leaderboard-options-menu"
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#180A31] border border-purple-400/25 shadow-2xl p-2 z-50 space-y-1"
                >
                  <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-200/60">
                    Event Empty States
                  </p>
                  <button
                    type="button"
                    onClick={handleRestoreDefaults}
                    data-testid="menu-restore-events"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-purple-100 hover:bg-purple-500/20 flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#FF6BA3]" />
                    <span>Restore Sample Events</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePreviewEmptyEvents}
                    data-testid="menu-empty-no-events"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-purple-500/20"
                  >
                    Preview No Events Available
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePreviewEmptyStatus('upcoming')}
                    data-testid="menu-empty-no-upcoming"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-purple-500/20"
                  >
                    Preview No Upcoming Events
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePreviewEmptyStatus('live')}
                    data-testid="menu-empty-no-live"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-purple-500/20"
                  >
                    Preview No Live Events
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePreviewEmptyStatus('completed')}
                    data-testid="menu-empty-no-completed"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-purple-500/20"
                  >
                    Preview No Completed Events
                  </button>
                  <button
                    type="button"
                    onClick={handlePreviewNoParticipants}
                    data-testid="menu-empty-no-participants"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-purple-500/20"
                  >
                    Preview No Leaderboard Participants
                  </button>
                  <button
                    type="button"
                    onClick={handlePreviewMyRankingUnavailable}
                    data-testid="menu-empty-my-event-ranking"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-purple-500/20"
                  >
                    Preview My Event Ranking Unavailable
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-5 space-y-5">
        {/* Heading + Event Search */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Event Leaderboard
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/70 mt-1">
              Creator event rankings · Sample event preview
            </p>
          </div>

          <div className="w-full sm:w-80">
            <Input
              value={eventSearchQuery}
              onChange={(e) => {
                setEventSearchQuery(e.target.value);
                setSubView('dashboard');
              }}
              placeholder="Search events by title or category..."
              aria-label="Search events"
              data-testid="event-search-input"
              leftIcon={<Search className="w-4 h-4 text-purple-300/70" />}
              rightIcon={
                eventSearchQuery ? (
                  <button
                    type="button"
                    onClick={() => setEventSearchQuery('')}
                    aria-label="Clear event search"
                    className="text-purple-300 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : undefined
              }
              className="bg-[#15082B] border-purple-400/25 focus:border-[#FF2E74]"
            />
          </div>
        </div>

        {/* Event Status Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Event Status Filters"
            className="inline-flex flex-wrap items-center gap-1.5 rounded-full bg-[#16082E] border border-purple-400/25 p-1"
          >
            {(
              [
                { id: 'all', label: 'All Events' },
                { id: 'live', label: 'Live' },
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'completed', label: 'Completed' },
              ] as { id: EventStatusFilter; label: string }[]
            ).map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setSubView('dashboard');
                  }}
                  data-testid={`event-status-tab-${tab.id}`}
                  className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-black transition-all whitespace-nowrap ${
                    active
                      ? 'bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] text-white shadow-glow-pink'
                      : 'text-purple-200/75 hover:text-white hover:bg-[#220F42]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <span className="text-xs font-bold text-purple-200/70">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} available
          </span>
        </div>

        {/* Responsive 12-Col Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Main Column */}
          <div className="lg:col-span-8 space-y-5">
            {!activeEvent ? (
              <EventEmptyState kind={eventsEmptyKind} searchQuery={eventSearchQuery} onAction={handleRestoreDefaults} />
            ) : subView === 'event_details' ? (
              <EventDetailsView
                event={activeEvent}
                onOpenLeaderboard={() => setSubView('dashboard')}
                onBack={() => setSubView('dashboard')}
              />
            ) : subView === 'participant_detail' && selectedParticipant ? (
              <ParticipantDetailView
                participant={selectedParticipant}
                eventTitle={activeEvent.title}
                onBack={() => {
                  setSubView('dashboard');
                  setSelectedParticipantId(null);
                }}
              />
            ) : (
              <>
                {/* Featured / Selected Event Banner Card */}
                <FeaturedEventCard
                  event={activeEvent}
                  onViewDetails={handleOpenEventDetails}
                  onJumpToLeaderboard={handleJumpToLeaderboard}
                />

                {/* Multiple Event Selector Cards */}
                <section aria-label="Browse Sample Events" className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-black uppercase tracking-wider text-purple-100">
                      Creator Events ({filteredEvents.length})
                    </h2>
                    <span className="text-[11px] text-purple-200/65">
                      Select an event to switch leaderboard
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredEvents.map((ev) => {
                      const isSelected = ev.id === activeEvent.id;
                      const badge = getEventStatusStyle(ev.status);
                      return (
                        <div
                          key={ev.id}
                          data-testid={`event-list-card-${ev.id}`}
                          className={`rounded-2xl border p-4 transition-all space-y-2.5 ${
                            isSelected
                              ? 'bg-[#251047] border-[#FF2E74]/55 shadow-[0_0_22px_rgba(255,46,116,0.16)]'
                              : 'bg-[#130728] hover:bg-[#1B0B36] border-purple-400/20'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${badge.classes}`}
                            >
                              {badge.label}
                            </span>
                            <span className="text-[11px] text-purple-200/65 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {ev.participantCount}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-sm font-black text-white truncate">{ev.title}</h3>
                            <p className="text-[11px] text-purple-200/65 mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#FF6BA3]" />
                              <span>
                                {ev.startDate} – {ev.endDate}
                              </span>
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleSelectEvent(ev)}
                              data-testid={`select-event-btn-${ev.id}`}
                              className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border transition-colors ${
                                isSelected
                                  ? 'bg-[#FF1A6C] border-[#FF1A6C] text-white'
                                  : 'bg-[#1C0D38] border-purple-400/30 text-purple-100 hover:bg-[#27114D]'
                              }`}
                            >
                              {isSelected ? 'Viewing Leaderboard' : 'View Leaderboard'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEventDetails(ev)}
                              data-testid={`event-card-details-${ev.id}`}
                              className="text-xs font-bold text-[#FF6BA3] hover:text-pink-200"
                            >
                              Details →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Mobile & Tablet My Event Ranking Card */}
                <div className="lg:hidden">
                  <MyEventRankingCard
                    myEntry={myEventEntry}
                    eventTitle={activeEvent.title}
                    onInspectMyRanking={handleOpenParticipantDetails}
                    onRestoreMyRanking={() => setHideMyEventRanking(false)}
                    testIdPrefix="mobile-"
                  />
                </div>

                {/* Event Leaderboard Section */}
                {activeParticipants.length === 0 ? (
                  <EventEmptyState kind="no_participants" onAction={handleRestoreDefaults} />
                ) : (
                  <div className="space-y-5">
                    {/* Top Three Participants Podium */}
                    <TopThreeParticipantsPodium
                      participants={topThreeParticipants}
                      onSelectParticipant={handleOpenParticipantDetails}
                    />

                    {/* Leaderboard List & Filters */}
                    <section
                      ref={leaderboardSectionRef}
                      data-testid="event-full-leaderboard-section"
                      aria-label="Event Participants Leaderboard"
                      className="rounded-3xl bg-[#130728] border border-purple-400/20 p-4 sm:p-5 space-y-4 shadow-xl"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-amber-300" />
                            <h2 className="text-base sm:text-lg font-black text-white">
                              Top participants
                            </h2>
                          </div>
                          <p className="text-xs text-purple-200/65 mt-0.5">
                            {activeEvent.title} · {visibleParticipants.length} participants shown
                          </p>
                        </div>

                        {/* Overall vs By Points tabs + Sort Direction */}
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="inline-flex items-center gap-1 rounded-full bg-[#190A33] border border-purple-400/25 p-1">
                            {(
                              [
                                { id: 'overall', label: 'Overall' },
                                { id: 'by_points', label: 'By Points' },
                              ] as { id: LeaderboardFilterTab; label: string }[]
                            ).map((tab) => {
                              const active = leaderboardTab === tab.id;
                              return (
                                <button
                                  key={tab.id}
                                  type="button"
                                  onClick={() => setLeaderboardTab(tab.id)}
                                  data-testid={`leaderboard-tab-${tab.id}`}
                                  className={`px-3.5 py-1 rounded-full text-xs font-black transition-all whitespace-nowrap ${
                                    active
                                      ? 'bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] text-white shadow-glow-pink'
                                      : 'text-purple-200/75 hover:text-white'
                                  }`}
                                >
                                  {tab.label}
                                </button>
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setSortDirection((prev) =>
                                prev === 'points_desc' ? 'points_asc' : 'points_desc'
                              )
                            }
                            data-testid="event-sort-points-btn"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#190A33] hover:bg-[#230E46] border border-purple-400/25 text-purple-100 transition-colors whitespace-nowrap"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5 text-[#FF6BA3]" />
                            <span>
                              {sortDirection === 'points_desc' ? 'High → Low' : 'Low → High'}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Participant Search */}
                      <Input
                        value={participantSearchQuery}
                        onChange={(e) => setParticipantSearchQuery(e.target.value)}
                        placeholder="Search participants by name or @handle..."
                        aria-label="Search event participants"
                        data-testid="participant-search-input"
                        leftIcon={<Search className="w-4 h-4 text-purple-300/70" />}
                        rightIcon={
                          participantSearchQuery ? (
                            <button
                              type="button"
                              onClick={() => setParticipantSearchQuery('')}
                              aria-label="Clear participant search"
                              className="text-purple-300 hover:text-white"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          ) : undefined
                        }
                        className="bg-[#190A33] border-purple-400/20 focus:border-[#FF2E74]"
                      />

                      {visibleParticipants.length === 0 ? (
                        <EventEmptyState
                          kind="no_search_results"
                          searchQuery={participantSearchQuery}
                          onAction={() => setParticipantSearchQuery('')}
                          actionLabel="Reset Participant Search"
                        />
                      ) : (
                        <div data-testid="event-participant-rows" className="space-y-2">
                          {visibleParticipants.map((p) => {
                            const rankStyle =
                              p.rank === 1
                                ? 'text-amber-300 bg-amber-400/15 border-amber-400/35'
                                : p.rank === 2
                                ? 'text-slate-200 bg-slate-300/15 border-slate-300/35'
                                : p.rank === 3
                                ? 'text-amber-500 bg-amber-600/15 border-amber-500/35'
                                : 'text-purple-200/75 bg-[#1C0D38] border-purple-400/20';

                            const sharePct = Math.max(
                              6,
                              Math.round((p.eventPoints / maxEventPoints) * 100)
                            );

                            return (
                              <div
                                key={p.id}
                                data-testid={`event-participant-row-${p.rank}`}
                                className={`rounded-2xl border p-3 sm:px-4 sm:py-3 transition-all space-y-2 ${
                                  p.isCurrentUser
                                    ? 'bg-gradient-to-r from-[#26104B] to-[#1A0B35] border-[#FF2E74]/45'
                                    : 'bg-[#190A33]/85 hover:bg-[#220E45] border-purple-400/15'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 sm:gap-3">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenParticipantDetails(p)}
                                    className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 text-left focus:outline-none"
                                  >
                                    <span
                                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border text-xs font-black flex items-center justify-center shrink-0 ${rankStyle}`}
                                    >
                                      {p.rank}
                                    </span>

                                    <Avatar
                                      src={p.avatarUrl}
                                      alt={p.username}
                                      size="sm"
                                      ring={
                                        p.rank === 1
                                          ? 'vip'
                                          : p.isCurrentUser
                                          ? 'pink'
                                          : 'none'
                                      }
                                    />

                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                                        <p className="text-xs sm:text-sm font-extrabold text-white truncate">
                                          {p.username}
                                        </p>
                                        {p.verified && (
                                          <ShieldCheck
                                            aria-label="Verified Participant"
                                            className="w-3.5 h-3.5 text-sky-400 shrink-0"
                                          />
                                        )}
                                        {p.isCurrentUser && (
                                          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full bg-[#FF1A6C]/25 border border-[#FF1A6C]/45 text-[9px] font-black text-pink-200 shrink-0">
                                            YOU
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-purple-200/65 truncate">
                                        {p.handle} · {p.countryLabel}
                                      </p>
                                    </div>
                                  </button>

                                  <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                                    <div className="hidden sm:block">{renderMovementBadge(p)}</div>

                                    <div className="text-right">
                                      <p className="text-xs sm:text-sm font-black text-amber-300 whitespace-nowrap">
                                        {formatEventPoints(p.eventPoints)}
                                      </p>
                                    </div>

                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                                      onClick={() => handleOpenParticipantDetails(p)}
                                      data-testid={`event-participant-profile-${p.rank}`}
                                      aria-label={`View ${p.username}`}
                                      className="border-purple-400/30 bg-[#1B0C36] hover:bg-[#2B1454] text-[11px] px-2 sm:px-2.5 py-1.5 h-auto whitespace-nowrap"
                                    >
                                      <span className="hidden sm:inline">View Profile</span>
                                    </Button>
                                  </div>
                                </div>

                                {leaderboardTab === 'by_points' && (
                                  <div
                                    data-testid={`participant-points-bar-${p.rank}`}
                                    className="space-y-1 pt-0.5"
                                  >
                                    <div className="w-full h-1.5 rounded-full bg-[#110623] overflow-hidden">
                                      <div
                                        className="h-full rounded-full bg-gradient-to-r from-[#FF1A6C] via-[#F43F5E] to-[#FCD34D]"
                                        style={{ width: `${sharePct}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Sticky Sidebar */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
            {activeEvent && (
              <div className="hidden lg:block">
                <MyEventRankingCard
                  myEntry={myEventEntry}
                  eventTitle={activeEvent.title}
                  onInspectMyRanking={handleOpenParticipantDetails}
                  onRestoreMyRanking={() => setHideMyEventRanking(false)}
                />
              </div>
            )}

            {/* Quick Cross-Module Links */}
            <section className="rounded-3xl bg-[#130728] border border-purple-400/20 p-5 space-y-3.5 shadow-xl">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-300" />
                <h2 className="text-xs font-black uppercase tracking-wider text-purple-100">
                  Creator Hub Shortcuts
                </h2>
              </div>

              <div className="space-y-2">
                <Link href="/host-rankings" className="block">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    leftIcon={<Trophy className="w-3.5 h-3.5 text-amber-300" />}
                    className="w-full justify-start border-purple-400/25 bg-[#1B0C36] hover:bg-[#27114D]"
                  >
                    Open Host Rankings
                  </Button>
                </Link>
                <Link href="/task-level" className="block">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    leftIcon={<Sparkles className="w-3.5 h-3.5 text-[#FF6BA3]" />}
                    className="w-full justify-start border-purple-400/25 bg-[#1B0C36] hover:bg-[#27114D]"
                  >
                    Open Task Level
                  </Button>
                </Link>
              </div>

              <div className="rounded-2xl bg-[#1A0B35]/80 border border-purple-400/20 p-3 flex items-start gap-2 text-[11px] text-purple-200/75 leading-relaxed">
                <Info className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
                <span>
                  Event Leaderboards use local frontend mock data only and remain separate from
                  general Host Rankings, official gifts, or reward calculations.
                </span>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};
