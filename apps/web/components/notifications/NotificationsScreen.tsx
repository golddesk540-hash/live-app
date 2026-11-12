'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  INITIAL_ACTIVITY_NOTIFICATIONS,
  INITIAL_FOLLOWED_BACK_IDS,
  NOTIFICATION_CATEGORIES,
} from './mockNotificationsData';
import {
  clearLocalNotificationsState,
  loadLocalFollowBacks,
  loadLocalNotificationPreferences,
  loadLocalNotifications,
  saveLocalFollowBacks,
  saveLocalNotificationPreferences,
  saveLocalNotifications,
} from './notificationsLocalStore';
import {
  ActivityNotificationItem,
  NotificationCategoryId,
  NotificationPreferenceState,
  NotificationType,
} from './types';
import { NotificationCard } from './NotificationCard';
import { NotificationDetailView } from './NotificationDetailView';
import { NotificationSettingsModal } from './NotificationSettingsModal';
import { InvitePreviewModal, LivePreviewModal } from './NotificationPreviewModals';
import { ProfilePreviewModal } from '@/components/inbox/ProfilePreviewModal';
import { InboxUserProfile } from '@/components/inbox/types';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ArrowLeft,
  AtSign,
  Bell,
  BellOff,
  CheckCheck,
  Compass,
  Crown,
  Filter,
  Heart,
  Home,
  MessageCircle,
  MoreVertical,
  PlusSquare,
  Radio,
  RotateCcw,
  Search,
  SearchX,
  Settings,
  ShieldAlert,
  Sparkles,
  Trash2,
  User,
  UserPlus,
} from 'lucide-react';

const CATEGORY_EMPTY_CONFIG: Record<
  NotificationCategoryId,
  { title: string; description: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  all: {
    title: 'No notifications',
    description: 'You do not have any activity notifications right now. Check back later!',
    Icon: BellOff,
  },
  likes: {
    title: 'No likes notifications',
    description: 'When friends like your Square posts or highlights, they will appear here.',
    Icon: Heart,
  },
  comments: {
    title: 'No comments notifications',
    description: 'No recent comments on your posts yet. Share a post in Square to spark replies!',
    Icon: MessageCircle,
  },
  followers: {
    title: 'No followers notifications',
    description: 'New followers and Follow Back suggestions will show up right here.',
    Icon: UserPlus,
  },
  mentions: {
    title: 'No mentions notifications',
    description: 'Nobody has tagged @you in a Square post or comment yet.',
    Icon: AtSign,
  },
  fan_club: {
    title: 'No Fan Club notifications',
    description: 'Host announcements and Fan Club updates will appear here.',
    Icon: Crown,
  },
  invites: {
    title: 'No invitations right now',
    description: 'Party room and social invitations from friends will appear here.',
    Icon: Sparkles,
  },
  live: {
    title: 'No live activity notifications',
    description: 'Alerts when followed Popo Live hosts go live will show up here.',
    Icon: Radio,
  },
};

export const NotificationsScreen: React.FC = () => {
  const [notifications, setNotifications] = useState<ActivityNotificationItem[]>(
    INITIAL_ACTIVITY_NOTIFICATIONS
  );
  const [preferences, setPreferences] = useState<NotificationPreferenceState>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );
  const [followedBackIds, setFollowedBackIds] = useState<string[]>(INITIAL_FOLLOWED_BACK_IDS);

  const [selectedCategory, setSelectedCategory] = useState<NotificationCategoryId>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(
    INITIAL_ACTIVITY_NOTIFICATIONS[0]?.id || null
  );
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [previewUser, setPreviewUser] = useState<InboxUserProfile | null>(null);
  const [inviteModalItem, setInviteModalItem] = useState<ActivityNotificationItem | null>(null);
  const [liveModalItem, setLiveModalItem] = useState<ActivityNotificationItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const loadedItems = loadLocalNotifications();
    setNotifications(loadedItems);
    setPreferences(loadLocalNotificationPreferences());
    setFollowedBackIds(loadLocalFollowBacks());
    if (loadedItems.length > 0) {
      setSelectedId((prev) => prev || loadedItems[0].id);
    }
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const unreadTotal = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const categoryUnreadCounts = useMemo(() => {
    const map: Record<NotificationCategoryId, number> = {
      all: 0,
      likes: 0,
      comments: 0,
      followers: 0,
      mentions: 0,
      fan_club: 0,
      invites: 0,
      live: 0,
    };
    for (const item of notifications) {
      if (!item.isRead) {
        map.all += 1;
        map[item.type] += 1;
      }
    }
    return map;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return notifications.filter((n) => {
      if (selectedCategory !== 'all' && n.type !== selectedCategory) return false;
      if (unreadOnly && n.isRead) return false;
      if (!q) return true;
      return (
        n.sender.name.toLowerCase().includes(q) ||
        n.sender.handle.toLowerCase().includes(q) ||
        n.title.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        n.categoryLabel.toLowerCase().includes(q) ||
        (n.postPreviewText && n.postPreviewText.toLowerCase().includes(q)) ||
        (n.clubName && n.clubName.toLowerCase().includes(q))
      );
    });
  }, [notifications, selectedCategory, unreadOnly, searchQuery]);

  const selectedItem = useMemo(
    () => notifications.find((n) => n.id === selectedId) || null,
    [notifications, selectedId]
  );

  const followedBackSet = useMemo(() => new Set(followedBackIds), [followedBackIds]);

  const updateNotifications = (
    updater: (prev: ActivityNotificationItem[]) => ActivityNotificationItem[]
  ) => {
    setNotifications((prev) => {
      const next = updater(prev);
      saveLocalNotifications(next);
      return next;
    });
  };

  const markAsReadIfNeeded = (id: string) => {
    updateNotifications((prev) =>
      prev.map((n) => (n.id === id && !n.isRead ? { ...n, isRead: true } : n))
    );
  };

  const handleOpenNotification = (item: ActivityNotificationItem) => {
    markAsReadIfNeeded(item.id);
    setSelectedId(item.id);
    setMobileDetailOpen(true);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handleToggleRead = (id: string) => {
    let becameRead = true;
    updateNotifications((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        becameRead = !n.isRead;
        return { ...n, isRead: !n.isRead };
      })
    );
    showToast(becameRead ? 'Marked as read' : 'Marked as unread');
  };

  const handleMarkAllRead = () => {
    if (unreadTotal === 0) {
      showToast('All notifications are already read');
      return;
    }
    updateNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast('All activity notifications marked as read');
  };

  const handleDeleteNotification = (id: string) => {
    const remaining = notifications.filter((n) => n.id !== id);
    setNotifications(remaining);
    saveLocalNotifications(remaining);
    if (selectedId === id) {
      setSelectedId(remaining[0]?.id || null);
      setMobileDetailOpen(false);
    }
    showToast('Notification deleted');
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    saveLocalNotifications([]);
    setSelectedId(null);
    setMobileDetailOpen(false);
    showToast('Cleared all notifications (preview empty state)');
  };

  const handleClearCurrentCategory = () => {
    if (selectedCategory === 'all') {
      handleClearAllNotifications();
      return;
    }
    const remaining = notifications.filter((n) => n.type !== selectedCategory);
    setNotifications(remaining);
    saveLocalNotifications(remaining);
    if (selectedItem?.type === selectedCategory) {
      setSelectedId(remaining[0]?.id || null);
      setMobileDetailOpen(false);
    }
    showToast(`Cleared ${selectedCategory.replace('_', ' ')} notifications`);
  };

  const handleRestoreNotifications = () => {
    clearLocalNotificationsState();
    setNotifications(INITIAL_ACTIVITY_NOTIFICATIONS);
    saveLocalNotifications(INITIAL_ACTIVITY_NOTIFICATIONS);
    setFollowedBackIds(INITIAL_FOLLOWED_BACK_IDS);
    saveLocalFollowBacks(INITIAL_FOLLOWED_BACK_IDS);
    setSelectedCategory('all');
    setUnreadOnly(false);
    setSearchQuery('');
    setSelectedId(INITIAL_ACTIVITY_NOTIFICATIONS[0]?.id || null);
    setMobileDetailOpen(false);
    showToast('Sample activity notifications restored');
  };

  const handleToggleFollowBack = (item: ActivityNotificationItem) => {
    const targetId = item.sender.id;
    setFollowedBackIds((prev) => {
      const exists = prev.includes(targetId);
      const next = exists ? prev.filter((id) => id !== targetId) : [...prev, targetId];
      saveLocalFollowBacks(next);
      showToast(
        exists
          ? `Unfollowed ${item.sender.name}`
          : `Followed back ${item.sender.name} locally!`
      );
      return next;
    });
    markAsReadIfNeeded(item.id);
  };

  const handleTogglePreference = (key: NotificationType) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveLocalNotificationPreferences(next);
      showToast(
        `${key.replace('_', ' ')} notifications turned ${next[key] ? 'ON' : 'OFF'} locally`
      );
      return next;
    });
  };

  const handleResetPreferences = () => {
    setPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
    saveLocalNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
    showToast('All notification preferences reset to ON');
  };

  const emptyStateMeta = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      return {
        testId: 'empty-notifications-search',
        title: 'No search results',
        description: `No activity notification matched "${searchQuery}". Try searching another name or keyword.`,
        Icon: SearchX,
        actionLabel: 'Clear Search',
        onAction: () => setSearchQuery(''),
      };
    }

    if (unreadOnly && unreadTotal === 0) {
      return {
        testId: 'empty-notifications-unread',
        title: 'No unread notifications',
        description: 'You are completely caught up! Turn off Unread filter to view read activity.',
        Icon: CheckCheck,
        actionLabel: 'Show All Notifications',
        onAction: () => setUnreadOnly(false),
      };
    }

    if (unreadOnly) {
      return {
        testId: 'empty-notifications-unread',
        title: 'No unread notifications',
        description: 'No unread items match the selected category right now.',
        Icon: CheckCheck,
        actionLabel: 'Show All',
        onAction: () => {
          setUnreadOnly(false);
          setSelectedCategory('all');
        },
      };
    }

    const catMeta = CATEGORY_EMPTY_CONFIG[selectedCategory];
    return {
      testId: `empty-notifications-${selectedCategory}`,
      title: catMeta.title,
      description: catMeta.description,
      Icon: catMeta.Icon,
      actionLabel: notifications.length === 0 ? 'Restore Sample Activity' : 'View All Categories',
      onAction:
        notifications.length === 0
          ? handleRestoreNotifications
          : () => setSelectedCategory('all'),
    };
  }, [searchQuery, unreadOnly, unreadTotal, selectedCategory, notifications.length]);

  const EmptyIcon = emptyStateMeta.Icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#130626] via-[#0B0418] to-[#070312] text-white flex flex-col pb-20 lg:pb-10">
      {/* Top Bar matching 08_07_notifications.png & Popo Live identity */}
      <header className="sticky top-0 z-40 bg-[#120624]/95 backdrop-blur-xl border-b border-purple-400/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/live"
              aria-label="Back to Live Discovery"
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
            {/* Separate System Notices shortcut (Module 8.2) */}
            <Link
              href="/system-notices"
              data-testid="notifications-system-notices-link"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-amber-400/25 text-xs font-bold text-amber-200 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>System Notices</span>
            </Link>

            {/* Search Toggle */}
            <button
              type="button"
              onClick={() => setShowMobileSearch((v) => !v)}
              data-testid="notifications-search-toggle"
              aria-label="Search notifications"
              className={`p-2 rounded-full border transition-colors ${
                showMobileSearch || searchQuery
                  ? 'bg-[#FF1A6C]/20 border-[#FF1A6C] text-[#FF4D8D]'
                  : 'bg-[#1C0D38] hover:bg-[#28154D] border-white/10 text-purple-100/85'
              }`}
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Heart / Unread Quick Filter */}
            <button
              type="button"
              onClick={() => setUnreadOnly((v) => !v)}
              data-testid="notifications-unread-filter-btn"
              aria-label="Filter unread notifications"
              title={unreadOnly ? 'Showing unread notifications only' : 'Show unread only'}
              className={`p-2 rounded-full border transition-colors relative ${
                unreadOnly
                  ? 'bg-[#FF1A6C] border-[#FF1A6C] text-white shadow-glow-pink'
                  : 'bg-[#1C0D38] hover:bg-[#28154D] border-white/10 text-purple-100/85'
              }`}
            >
              <Heart className={`w-4 h-4 ${unreadOnly ? 'fill-white' : ''}`} />
              {unreadTotal > 0 && !unreadOnly && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#FF1A6C] ring-2 ring-[#120624]" />
              )}
            </button>

            {/* Notification Settings Shortcut */}
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              data-testid="open-notification-settings-btn"
              aria-label="Notification settings"
              className="p-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-purple-100/85 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* More Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowHeaderMenu((v) => !v)}
                data-testid="notifications-header-menu-btn"
                aria-label="Notifications options"
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
                    {unreadOnly ? 'Show All Activity' : 'Filter Unread Only'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      setSettingsOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Settings className="w-3.5 h-3.5 text-cyan-400" /> Notification Settings
                  </button>
                  <button
                    type="button"
                    data-testid="menu-clear-category-btn"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      handleClearCurrentCategory();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-amber-200 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {selectedCategory === 'all'
                      ? 'Clear All (Preview Empty)'
                      : `Clear ${selectedCategory.replace('_', ' ')}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      handleRestoreNotifications();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-400" /> Restore Demo Activity
                  </button>
                  <Link
                    href="/system-notices"
                    onClick={() => setShowHeaderMenu(false)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-amber-200 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Bell className="w-3.5 h-3.5 text-amber-400" /> Official System Notices
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
          {/* LEFT PANE: Heading + Search + Categories + Notification List */}
          <section
            data-testid="notifications-list-panel"
            className={`${
              mobileDetailOpen ? 'hidden lg:flex' : 'flex'
            } flex-col rounded-3xl bg-[#110523]/90 border border-purple-400/20 p-4 sm:p-5 shadow-2xl`}
          >
            {/* Title + Mark All Read */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-[28px] font-black tracking-tight text-white">
                  Notifications
                </h1>
                <p className="text-xs sm:text-sm text-purple-200/70 mt-0.5">
                  Activity from people you follow
                </p>
              </div>

              <button
                type="button"
                data-testid="mark-all-read-btn"
                onClick={handleMarkAllRead}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all inline-flex items-center gap-1.5 shrink-0 ${
                  unreadTotal > 0
                    ? 'bg-[#FF1A6C]/20 border-[#FF1A6C]/45 text-[#FF6BA3] hover:bg-[#FF1A6C] hover:text-white'
                    : 'bg-[#1D0D39] border-white/10 text-purple-200/60'
                }`}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark All Read</span>
              </button>
            </div>

            {/* Unread Summary Pill Bar */}
            <div className="mt-3 flex items-center justify-between gap-2 text-xs">
              <div className="inline-flex items-center gap-2">
                <span
                  data-testid="notifications-total-unread"
                  className={`px-2.5 py-0.5 rounded-full font-extrabold border ${
                    unreadTotal > 0
                      ? 'bg-[#FF1A6C]/20 border-[#FF1A6C]/45 text-[#FF6BA3]'
                      : 'bg-emerald-500/15 border-emerald-400/35 text-emerald-200'
                  }`}
                >
                  {unreadTotal > 0 ? `${unreadTotal} Unread` : '0 Unread · All Caught Up'}
                </span>

                {unreadOnly && (
                  <button
                    type="button"
                    onClick={() => setUnreadOnly(false)}
                    className="px-2 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold text-purple-100 hover:bg-white/20"
                  >
                    Unread Filter Active ×
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="text-[11px] font-bold text-purple-200/70 hover:text-white inline-flex items-center gap-1"
              >
                <Settings className="w-3 h-3" />
                <span>Settings</span>
              </button>
            </div>

            {/* Collapsible Search Bar */}
            {(showMobileSearch || searchQuery) && (
              <div className="mt-3">
                <SearchBar
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClear={() => setSearchQuery('')}
                  placeholder="Search notifications, users, posts..."
                  data-testid="notifications-search-input"
                />
              </div>
            )}

            {/* Category Filter Tabs (Matches 08_07_notifications.png Neon Pink Highlight) */}
            <div
              role="tablist"
              aria-label="Notification categories"
              className="mt-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1"
            >
              {NOTIFICATION_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                const catUnread = categoryUnreadCounts[cat.id];
                const isPaused = cat.id !== 'all' && !preferences[cat.id];

                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    data-testid={`notif-tab-${cat.id}`}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] text-white shadow-glow-pink'
                        : 'bg-[#211042] text-purple-100/80 border border-purple-400/20 hover:bg-[#2B1754]'
                    }`}
                  >
                    <span>{cat.label}</span>
                    {catUnread > 0 && (
                      <span
                        data-testid={`notif-tab-unread-${cat.id}`}
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                          isActive
                            ? 'bg-white text-[#FF1A6C]'
                            : 'bg-[#FF1A6C]/25 text-[#FF6BA3]'
                        }`}
                      >
                        {catUnread}
                      </span>
                    )}
                    {isPaused && (
                      <span className="text-[9px] font-extrabold uppercase text-amber-300">
                        OFF
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Category Preference Notice if user muted current tab */}
            {selectedCategory !== 'all' && !preferences[selectedCategory] && (
              <div
                data-testid="category-muted-banner"
                className="mt-3 rounded-2xl bg-amber-500/10 border border-amber-400/30 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs"
              >
                <span className="text-amber-200 font-semibold">
                  {selectedCategory.replace('_', ' ')} notifications are switched OFF in Settings.
                </span>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="text-amber-300 font-extrabold underline shrink-0"
                >
                  Settings
                </button>
              </div>
            )}

            {/* Notification Cards List or Empty State */}
            <div className="mt-4 space-y-2.5" data-testid="notifications-list">
              {filteredNotifications.length === 0 ? (
                <div
                  data-testid={emptyStateMeta.testId}
                  className="rounded-3xl bg-[#16092D]/90 border border-purple-400/20 p-5"
                >
                  <EmptyState
                    icon={<EmptyIcon className="w-7 h-7" />}
                    title={emptyStateMeta.title}
                    description={emptyStateMeta.description}
                    actionLabel={emptyStateMeta.actionLabel}
                    onAction={emptyStateMeta.onAction}
                  />
                </div>
              ) : (
                filteredNotifications.map((item) => (
                  <NotificationCard
                    key={item.id}
                    item={item}
                    isSelected={selectedItem?.id === item.id}
                    isFollowedBack={followedBackSet.has(item.sender.id)}
                    onOpen={handleOpenNotification}
                    onToggleRead={handleToggleRead}
                    onDelete={handleDeleteNotification}
                    onToggleFollowBack={handleToggleFollowBack}
                    onOpenProfile={(n) => setPreviewUser(n.sender)}
                    onOpenInvite={(n) => {
                      markAsReadIfNeeded(n.id);
                      setInviteModalItem(n);
                    }}
                    onOpenLivePreview={(n) => {
                      markAsReadIfNeeded(n.id);
                      setLiveModalItem(n);
                    }}
                  />
                ))
              )}
            </div>
          </section>

          {/* RIGHT PANE: Notification Detail View */}
          <section className={`${mobileDetailOpen ? 'block' : 'hidden lg:block'}`}>
            <NotificationDetailView
              item={selectedItem}
              isFollowedBack={selectedItem ? followedBackSet.has(selectedItem.sender.id) : false}
              onBackMobile={() => setMobileDetailOpen(false)}
              onToggleRead={handleToggleRead}
              onDelete={handleDeleteNotification}
              onToggleFollowBack={handleToggleFollowBack}
              onOpenProfile={(n) => setPreviewUser(n.sender)}
              onOpenInvite={(n) => {
                markAsReadIfNeeded(n.id);
                setInviteModalItem(n);
              }}
              onOpenLivePreview={(n) => {
                markAsReadIfNeeded(n.id);
                setLiveModalItem(n);
              }}
            />
          </section>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar matching 08_07_notifications.png */}
      {!mobileDetailOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#100422]/95 backdrop-blur-xl border-t border-purple-400/20 px-3 py-2 flex items-center justify-around"
        >
          <Link
            href="/"
            className="flex flex-col items-center gap-0.5 text-purple-200/60 hover:text-white"
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Home</span>
          </Link>
          <Link
            href="/live"
            className="flex flex-col items-center gap-0.5 text-purple-200/60 hover:text-white"
          >
            <Compass className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Discover</span>
          </Link>
          <Link
            href="/square/create"
            aria-label="Create Post"
            className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF1A6C] to-[#9333EA] flex items-center justify-center text-white shadow-glow-pink"
          >
            <PlusSquare className="w-5 h-5" />
          </Link>
          <Link
            href="/inbox"
            className="flex flex-col items-center gap-0.5 text-purple-200/60 hover:text-white"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Inbox</span>
          </Link>
          <Link
            href="/profile"
            className="flex flex-col items-center gap-0.5 text-[#FF1A6C]"
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-extrabold">Me</span>
          </Link>
        </nav>
      )}

      {/* Toast Feedback */}
      {toast && (
        <div
          data-testid="notifications-toast"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#1F0E3D]/95 border border-[#FF1A6C]/50 text-white text-xs font-bold shadow-glow-pink backdrop-blur-md whitespace-nowrap pointer-events-none"
        >
          {toast}
        </div>
      )}

      {/* Settings Modal */}
      <NotificationSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        preferences={preferences}
        onTogglePreference={handleTogglePreference}
        onResetDefaults={handleResetPreferences}
      />

      {/* Invite Preview Modal */}
      <InvitePreviewModal
        item={inviteModalItem}
        onClose={() => setInviteModalItem(null)}
        onShowToast={showToast}
      />

      {/* Live Preview Modal */}
      <LivePreviewModal
        item={liveModalItem}
        onClose={() => setLiveModalItem(null)}
      />

      {/* Sender Profile Preview Modal */}
      <ProfilePreviewModal
        user={previewUser}
        isOpen={Boolean(previewUser)}
        onClose={() => setPreviewUser(null)}
        onMessageUser={(u) => {
          setPreviewUser(null);
          showToast(`Open Inbox to message ${u.name}`);
        }}
      />
    </div>
  );
};
