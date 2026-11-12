'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  INITIAL_SYSTEM_NOTICES,
  NOTICE_CATEGORIES,
} from './mockNoticesData';
import { NoticeCategoryId, SystemNoticeItem } from './types';
import { NoticeCard } from './NoticeCard';
import { NoticeDetailView } from './NoticeDetailView';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ArrowLeft,
  Search,
  Bell,
  MoreVertical,
  CheckCheck,
  Filter,
  RotateCcw,
  Trash2,
  BellOff,
  SearchX,
  FolderOpen,
  Inbox as InboxIcon,
  Home,
  Compass,
  Camera,
  User,
  Sparkles,
} from 'lucide-react';

export const SystemNoticesScreen: React.FC = () => {
  const [notices, setNotices] = useState<SystemNoticeItem[]>(INITIAL_SYSTEM_NOTICES);
  const [selectedCategory, setSelectedCategory] = useState<NoticeCategoryId>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(
    INITIAL_SYSTEM_NOTICES[0]?.id || null
  );
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const unreadCountTotal = useMemo(
    () => notices.filter((n) => !n.isRead).length,
    [notices]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<NoticeCategoryId, number> = {
      all: notices.length,
      account: 0,
      security_safety: 0,
      platform: 0,
      feature: 0,
      wallet_gift: 0,
      important: 0,
    };
    for (const n of notices) {
      counts[n.category] = (counts[n.category] || 0) + 1;
    }
    return counts;
  }, [notices]);

  const filteredNotices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return notices.filter((n) => {
      if (selectedCategory !== 'all' && n.category !== selectedCategory) return false;
      if (unreadOnly && n.isRead) return false;
      if (!q) return true;
      return (
        n.title.toLowerCase().includes(q) ||
        n.shortDescription.toLowerCase().includes(q) ||
        n.categoryBadge.toLowerCase().includes(q) ||
        n.referenceCode.toLowerCase().includes(q)
      );
    });
  }, [notices, selectedCategory, unreadOnly, searchQuery]);

  const selectedNotice = useMemo(
    () => notices.find((n) => n.id === selectedNoticeId) || null,
    [notices, selectedNoticeId]
  );

  const handleOpenNotice = (notice: SystemNoticeItem) => {
    setSelectedNoticeId(notice.id);
    setMobileDetailOpen(true);
    if (!notice.isRead) {
      setNotices((prev) =>
        prev.map((n) => (n.id === notice.id ? { ...n, isRead: true } : n))
      );
    }
  };

  const handleToggleReadStatus = (noticeId: string) => {
    setNotices((prev) =>
      prev.map((n) => {
        if (n.id !== noticeId) return n;
        const next = !n.isRead;
        showToast(next ? 'Marked notice as read' : 'Marked notice as unread');
        return { ...n, isRead: next };
      })
    );
  };

  const handleMarkAllRead = () => {
    setNotices((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast('All system notices marked as read');
  };

  const handleDismissNotice = (noticeId: string) => {
    const remaining = notices.filter((n) => n.id !== noticeId);
    setNotices(remaining);
    if (selectedNoticeId === noticeId) {
      setSelectedNoticeId(remaining[0]?.id || null);
      setMobileDetailOpen(false);
    }
    showToast('Notice dismissed locally');
  };

  const handleClearAllNotices = () => {
    setNotices([]);
    setSelectedNoticeId(null);
    setMobileDetailOpen(false);
    showToast('All notices cleared for preview');
  };

  const handleRestoreNotices = () => {
    setNotices(INITIAL_SYSTEM_NOTICES);
    setSelectedCategory('all');
    setUnreadOnly(false);
    setSearchQuery('');
    setSelectedNoticeId(INITIAL_SYSTEM_NOTICES[0]?.id || null);
    showToast('System notices restored');
  };

  const renderEmptyState = () => {
    if (notices.length === 0) {
      return (
        <EmptyState
          icon={<BellOff className="w-7 h-7" />}
          title="No Notices Available"
          description="You are completely caught up. Official Popo Live system announcements will appear here."
          actionLabel="Restore Sample Notices"
          onAction={handleRestoreNotices}
          className="bg-[#160B2C]/80 border-purple-400/15 py-10 mt-3"
        />
      );
    }

    if (searchQuery.trim().length > 0) {
      return (
        <EmptyState
          icon={<SearchX className="w-7 h-7" />}
          title="No Search Results"
          description={`No system notices matched "${searchQuery}". Try another keyword or reset filters.`}
          actionLabel="Clear Search"
          onAction={() => setSearchQuery('')}
          className="bg-[#160B2C]/80 border-purple-400/15 py-10 mt-3"
        />
      );
    }

    if (unreadOnly) {
      return (
        <EmptyState
          icon={<CheckCheck className="w-7 h-7" />}
          title="No Unread Notices"
          description="Every notice in this view has already been read."
          actionLabel="Show All Notices"
          onAction={() => setUnreadOnly(false)}
          className="bg-[#160B2C]/80 border-purple-400/15 py-10 mt-3"
        />
      );
    }

    const activeCategoryLabel =
      NOTICE_CATEGORIES.find((c) => c.id === selectedCategory)?.label || 'this category';
    return (
      <EmptyState
        icon={<FolderOpen className="w-7 h-7" />}
        title={`No Notices in ${activeCategoryLabel}`}
        description="There are currently no notices filed under this category."
        actionLabel="View All Categories"
        onAction={() => setSelectedCategory('all')}
        className="bg-[#160B2C]/80 border-purple-400/15 py-10 mt-3"
      />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#130626] via-[#0B0418] to-[#070312] text-white flex flex-col pb-20 lg:pb-8">
      {/* Top Bar (Matches 08_02_system_notices.png) */}
      <header className="sticky top-0 z-40 bg-[#120624]/92 backdrop-blur-xl border-b border-purple-400/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/inbox"
              aria-label="Back to Inbox"
              className="p-2 rounded-full bg-[#1E0F3B] hover:bg-[#2A1652] text-purple-100 border border-white/10 transition-colors"
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
            <Link
              href="/square"
              data-testid="notices-square-link"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-xs font-bold text-purple-100 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF4D8D]" />
              <span>Square</span>
            </Link>

            <Link
              href="/inbox"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-xs font-bold text-purple-100 transition-colors"
            >
              <InboxIcon className="w-3.5 h-3.5 text-[#FF4D8D]" />
              <span>Inbox</span>
            </Link>

            <button
              type="button"
              onClick={() => setShowMobileSearch((v) => !v)}
              data-testid="notices-search-toggle"
              aria-label="Toggle notice search"
              className={`p-2 rounded-full border transition-colors ${
                showMobileSearch || searchQuery
                  ? 'bg-[#FF1A6C]/20 border-[#FF1A6C] text-[#FF4D8D]'
                  : 'bg-[#1C0D38] hover:bg-[#28154D] border-white/10 text-purple-100/85'
              }`}
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setUnreadOnly((v) => !v)}
              data-testid="notices-unread-toggle"
              title={unreadOnly ? 'Showing unread notices only' : 'Show unread notices only'}
              aria-label="Toggle unread filter"
              className={`p-2 rounded-full border transition-colors relative ${
                unreadOnly
                  ? 'bg-[#FF1A6C] border-[#FF1A6C] text-white shadow-glow-pink'
                  : 'bg-[#1C0D38] hover:bg-[#28154D] border-white/10 text-purple-100/85'
              }`}
            >
              <Bell className="w-4 h-4" />
              {unreadCountTotal > 0 && !unreadOnly && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#FF1A6C] ring-2 ring-[#120624]" />
              )}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowHeaderMenu((v) => !v)}
                data-testid="notices-header-menu-btn"
                aria-label="System Notices options"
                className="p-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-purple-100/85 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showHeaderMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#100521] border border-purple-400/25 shadow-2xl p-1.5 z-50 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      handleMarkAllRead();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-[#FF4D8D]" /> Mark All as Read
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      setUnreadOnly((v) => !v);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Filter className="w-3.5 h-3.5 text-amber-400" />
                    {unreadOnly ? 'Show All Notices' : 'Filter Unread Only'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      handleRestoreNotices();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-cyan-400" /> Restore Sample Notices
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      handleClearAllNotices();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-red-300 hover:bg-red-500/15 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear All (Preview Empty)
                  </button>
                  <Link
                    href="/inbox"
                    onClick={() => setShowHeaderMenu(false)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <InboxIcon className="w-3.5 h-3.5 text-[#FF4D8D]" /> Open Inbox
                  </Link>
                  <Link
                    href="/notifications"
                    onClick={() => setShowHeaderMenu(false)}
                    data-testid="notices-menu-notifications-link"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Bell className="w-3.5 h-3.5 text-[#FF4D8D]" /> Activity Notifications
                  </Link>
                  <Link
                    href="/square"
                    onClick={() => setShowHeaderMenu(false)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Square Posts Feed
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-[440px_1fr] gap-6 items-start">
          {/* LEFT PANE: Heading + Filters + Notice List */}
          <section
            data-testid="notices-list-panel"
            className={`${
              mobileDetailOpen ? 'hidden lg:flex' : 'flex'
            } flex-col rounded-3xl bg-[#110523]/90 border border-purple-400/20 p-4 sm:p-5 shadow-2xl`}
          >
            {/* Title + Mark All Read */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-[28px] font-black tracking-tight text-white">
                  System Notices
                </h1>
                <p className="text-xs sm:text-sm text-purple-200/70 mt-0.5">
                  Updates from Popo Live
                </p>
              </div>

              {unreadCountTotal > 0 ? (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  data-testid="mark-all-read-btn"
                  className="px-3 py-1.5 rounded-full bg-[#FF1A6C]/20 hover:bg-[#FF1A6C]/30 border border-[#FF1A6C]/45 text-[#FF4D8D] hover:text-white text-[11px] font-extrabold transition-all shrink-0 inline-flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark All Read ({unreadCountTotal})</span>
                </button>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold shrink-0">
                  All Read
                </span>
              )}
            </div>

            {/* Category Pills (All 7 required categories) */}
            <div
              role="tablist"
              aria-label="System notice categories"
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 mt-4"
            >
              {NOTICE_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                const count = categoryCounts[cat.id] || 0;
                const isImportantTab = cat.id === 'important';
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    data-testid={`notice-cat-${cat.id}`}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all inline-flex items-center gap-1.5 shrink-0 ${
                      isActive
                        ? isImportantTab
                          ? 'bg-gradient-to-r from-[#FFB800] to-[#F59E0B] text-black shadow-glow-gold'
                          : 'bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] text-white shadow-glow-pink'
                        : 'bg-[#201040] hover:bg-[#2B1754] text-purple-100/80 border border-white/10'
                    }`}
                  >
                    <span>{cat.shortLabel}</span>
                    <span
                      className={`text-[10px] px-1.5 rounded-full font-extrabold ${
                        isActive
                          ? isImportantTab
                            ? 'bg-black/20 text-black'
                            : 'bg-white/25 text-white'
                          : 'bg-white/10 text-purple-200/75'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search & Unread Quick Filter Bar */}
            <div className={`${showMobileSearch ? 'block' : 'hidden lg:block'} mt-3 space-y-2`}>
              <SearchBar
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
                data-testid="notices-search-input"
                placeholder="Search notices by keyword or code..."
                className="bg-[#180C32] border-purple-400/20 text-xs py-2"
              />
            </div>

            <div className="flex items-center justify-between gap-2 mt-3 text-[11px]">
              <button
                type="button"
                onClick={() => setUnreadOnly((v) => !v)}
                data-testid="notices-unread-chip"
                className={`px-3 py-1 rounded-full font-bold border transition-all inline-flex items-center gap-1.5 ${
                  unreadOnly
                    ? 'bg-[#FF1A6C] text-white border-[#FF1A6C] shadow-glow-pink'
                    : 'bg-[#1B0D35] text-purple-200/80 border-white/10 hover:text-white'
                }`}
              >
                <Filter className="w-3 h-3" />
                <span>Unread Only ({unreadCountTotal})</span>
              </button>

              <span className="text-purple-200/55">
                Showing {filteredNotices.length} of {notices.length}
              </span>
            </div>

            {/* Notice List Cards or Empty State */}
            <div className="mt-4 space-y-3">
              {filteredNotices.length === 0
                ? renderEmptyState()
                : filteredNotices.map((notice) => (
                    <NoticeCard
                      key={notice.id}
                      notice={notice}
                      isSelected={selectedNotice?.id === notice.id}
                      onSelect={handleOpenNotice}
                    />
                  ))}
            </div>
          </section>

          {/* RIGHT PANE: Notice Detail Screen */}
          <section className={`${mobileDetailOpen ? 'block' : 'hidden lg:block'}`}>
            <NoticeDetailView
              notice={selectedNotice}
              onBackMobile={() => setMobileDetailOpen(false)}
              onToggleReadStatus={handleToggleReadStatus}
              onDismissNotice={handleDismissNotice}
            />
          </section>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      {!mobileDetailOpen && (
        <nav
          aria-label="Mobile navigation"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#100422]/95 backdrop-blur-xl border-t border-purple-400/20 h-16 px-4 flex items-center justify-around"
        >
          <Link href="/" className="flex flex-col items-center gap-1 text-purple-200/55 hover:text-white">
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Home</span>
          </Link>
          <Link href="/live" className="flex flex-col items-center gap-1 text-purple-200/55 hover:text-white">
            <Compass className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Discover</span>
          </Link>
          <Link
            href="/live/setup"
            aria-label="Go Live"
            className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#FF1A6C] to-[#9333EA] flex items-center justify-center text-white shadow-glow-pink"
          >
            <Camera className="w-5 h-5" />
          </Link>
          <Link href="/inbox" className="flex flex-col items-center gap-1 text-[#FF1A6C]">
            <InboxIcon className="w-5 h-5" />
            <span className="text-[10px] font-extrabold">Inbox</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-1 text-purple-200/55 hover:text-white">
            <User className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Me</span>
          </Link>
        </nav>
      )}

      {/* Toast Feedback */}
      {toast && (
        <div
          data-testid="notices-toast"
          className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#1F0E3D]/95 border border-[#FF1A6C]/50 text-white text-xs font-bold shadow-glow-pink backdrop-blur-md whitespace-nowrap"
        >
          {toast}
        </div>
      )}
    </div>
  );
};
