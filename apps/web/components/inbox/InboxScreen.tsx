'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  INITIAL_CONTACTS,
  INITIAL_CONVERSATIONS,
  INITIAL_REQUESTS,
} from './mockInboxData';
import {
  InboxConversation,
  InboxMessage,
  InboxMessageAttachment,
  InboxMessageRequest,
  InboxTab,
  InboxUserProfile,
} from './types';
import { ChatsListPanel } from './ChatsListPanel';
import { ContactsTabPanel } from './ContactsTabPanel';
import { RequestsTabPanel } from './RequestsTabPanel';
import { ChatWindow } from './ChatWindow';
import { ProfilePreviewModal } from './ProfilePreviewModal';
import { ReportBlockModal } from './ReportBlockModal';
import { SearchBar } from '@/components/ui/SearchBar';
import {
  ArrowLeft,
  Search,
  Heart,
  MoreVertical,
  Home,
  Compass,
  Camera,
  MessageCircle,
  User,
  CheckCheck,
  RotateCcw,
  Filter,
  X,
  Bell,
  Sparkles,
  UserPlus,
} from 'lucide-react';

export const InboxScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InboxTab>('chats');
  const [conversations, setConversations] = useState<InboxConversation[]>(INITIAL_CONVERSATIONS);
  const [contacts, setContacts] = useState<InboxUserProfile[]>(INITIAL_CONTACTS);
  const [requests, setRequests] = useState<InboxMessageRequest[]>(INITIAL_REQUESTS);

  // Desktop starts with first conversation visible in split pane; mobile starts on list view
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    INITIAL_CONVERSATIONS[0]?.id || null
  );
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  // Search, filter & menus
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [unreadOnlyFilter, setUnreadOnlyFilter] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  // Profile preview & block/report safety modal
  const [previewUser, setPreviewUser] = useState<InboxUserProfile | null>(null);
  const [safetyModal, setSafetyModal] = useState<{
    user: InboxUserProfile | null;
    mode: 'block' | 'report' | null;
  }>({ user: null, mode: null });
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const totalUnreadChats = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    [conversations]
  );

  // Sort pinned conversations first, then preserve order
  const filteredConversations = useMemo(() => {
    const q = chatSearchQuery.trim().toLowerCase();
    return [...conversations]
      .filter((c) => !blockedUserIds.has(c.user.id))
      .filter((c) => (unreadOnlyFilter ? c.unreadCount > 0 : true))
      .filter((c) => {
        if (!q) return true;
        return (
          c.user.name.toLowerCase().includes(q) ||
          c.user.handle.toLowerCase().includes(q) ||
          c.user.poppoId.toLowerCase().includes(q) ||
          c.lastMessage.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)));
  }, [conversations, chatSearchQuery, unreadOnlyFilter, blockedUserIds]);

  const activeContacts = useMemo(
    () => contacts.filter((c) => !blockedUserIds.has(c.id)),
    [contacts, blockedUserIds]
  );

  const activeRequests = useMemo(
    () => requests.filter((r) => !blockedUserIds.has(r.user.id)),
    [requests, blockedUserIds]
  );

  // Cross-entity quick contact matches when searching from Chats tab
  const crossMatchedContacts = useMemo(() => {
    const q = chatSearchQuery.trim().toLowerCase();
    if (!q || activeTab !== 'chats') return [];
    const existingUserIds = new Set(filteredConversations.map((c) => c.user.id));
    return activeContacts.filter(
      (c) =>
        !existingUserIds.has(c.id) &&
        (c.name.toLowerCase().includes(q) ||
          c.handle.toLowerCase().includes(q) ||
          c.poppoId.toLowerCase().includes(q))
    );
  }, [chatSearchQuery, activeTab, filteredConversations, activeContacts]);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const handleSelectConversation = (convId: string) => {
    setSelectedConversationId(convId);
    setMobileChatOpen(true);
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
    );
  };

  const handleOpenOrCreateChatForUser = (user: InboxUserProfile) => {
    const existing = conversations.find((c) => c.user.id === user.id);
    if (existing) {
      setActiveTab('chats');
      handleSelectConversation(existing.id);
      return;
    }

    const newConv: InboxConversation = {
      id: `conv_${user.id}`,
      user,
      lastMessage: 'Say hello to start chatting',
      lastTimestamp: 'Now',
      unreadCount: 0,
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveTab('chats');
    setSelectedConversationId(newConv.id);
    setMobileChatOpen(true);
  };

  const handleSendMessage = (
    convId: string,
    text: string,
    attachment?: InboxMessageAttachment
  ) => {
    const nowTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const newMsg: InboxMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      senderId: 'me',
      text,
      timestamp: nowTime,
      dateGroup: 'Today',
      status: 'sent',
      attachment,
    };

    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              lastMessage: text,
              lastTimestamp: 'Just now',
              unreadCount: 0,
              messages: [...c.messages, newMsg],
            }
          : c
      );
      const target = updated.find((c) => c.id === convId);
      const others = updated.filter((c) => c.id !== convId);
      return target ? [target, ...others] : updated;
    });
  };

  const handleTogglePin = (convId: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        const nextPinned = !c.isPinned;
        showToast(nextPinned ? `Pinned chat with ${c.user.name}` : `Unpinned ${c.user.name}`);
        return { ...c, isPinned: nextPinned };
      })
    );
  };

  const handleToggleMute = (convId: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        const nextMuted = !c.isMuted;
        showToast(nextMuted ? `Muted ${c.user.name}` : `Unmuted ${c.user.name}`);
        return { ...c, isMuted: nextMuted };
      })
    );
  };

  const handleToggleReadStatus = (convId: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        const nextUnread = c.unreadCount > 0 ? 0 : 1;
        return { ...c, unreadCount: nextUnread };
      })
    );
  };

  const handleMarkUnread = (convId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unreadCount: Math.max(1, c.unreadCount) } : c))
    );
    setMobileChatOpen(false);
    showToast('Conversation marked as unread');
  };

  const handleClearMessages = (convId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? { ...c, messages: [], lastMessage: 'Messages cleared', lastTimestamp: 'Now' }
          : c
      )
    );
    showToast('Messages cleared locally');
  };

  const handleDeleteConversation = (convId: string) => {
    const remaining = conversations.filter((c) => c.id !== convId);
    setConversations(remaining);
    if (selectedConversationId === convId) {
      setSelectedConversationId(remaining[0]?.id || null);
      setMobileChatOpen(false);
    }
    showToast('Conversation removed');
  };

  const handleAcceptRequest = (reqId: string) => {
    const req = requests.find((r) => r.id === reqId);
    if (!req) return;

    setRequests((prev) => prev.filter((r) => r.id !== reqId));

    const newConv: InboxConversation = {
      id: `conv_${req.user.id}`,
      user: req.user,
      lastMessage: req.previewMessage,
      lastTimestamp: 'Just now',
      unreadCount: 0,
      messages: req.messages,
    };

    setConversations((prev) => {
      const exists = prev.some((c) => c.user.id === req.user.id);
      return exists ? prev : [newConv, ...prev];
    });
    setContacts((prev) => (prev.some((u) => u.id === req.user.id) ? prev : [req.user, ...prev]));
    setActiveTab('chats');
    setSelectedConversationId(newConv.id);
    setMobileChatOpen(true);
    showToast(`Accepted request from ${req.user.name}`);
  };

  const handleDeleteRequest = (reqId: string) => {
    const req = requests.find((r) => r.id === reqId);
    setRequests((prev) => prev.filter((r) => r.id !== reqId));
    if (req) showToast(`Deleted request from ${req.user.name}`);
  };

  const handleConfirmBlock = (user: InboxUserProfile) => {
    setBlockedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(user.id)) {
        next.delete(user.id);
        showToast(`Unblocked ${user.name}`);
      } else {
        next.add(user.id);
        showToast(`Blocked ${user.name}`);
      }
      return next;
    });
    setRequests((prev) => prev.filter((r) => r.user.id !== user.id));
    if (selectedConversation?.user.id === user.id) {
      setMobileChatOpen(false);
      setSelectedConversationId(null);
    }
  };

  const handleConfirmReport = (
    user: InboxUserProfile,
    reason: string,
    alsoBlock: boolean
  ) => {
    if (alsoBlock) {
      setBlockedUserIds((prev) => {
        const next = new Set(prev);
        next.add(user.id);
        return next;
      });
    }
    setRequests((prev) => prev.filter((r) => r.user.id !== user.id));
    showToast(`Report submitted for ${user.name} (${reason})`);
  };

  const handleMarkAllRead = () => {
    setConversations((prev) => prev.map((c) => ({ ...c, unreadCount: 0 })));
    showToast('All chats marked as read');
  };

  const handleRestoreDemo = () => {
    setConversations(INITIAL_CONVERSATIONS);
    setContacts(INITIAL_CONTACTS);
    setRequests(INITIAL_REQUESTS);
    setBlockedUserIds(new Set());
    setChatSearchQuery('');
    setContactSearchQuery('');
    setUnreadOnlyFilter(false);
    setSelectedConversationId(INITIAL_CONVERSATIONS[0]?.id || null);
    showToast('Inbox demo state restored');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#130626] via-[#0B0418] to-[#070312] text-white flex flex-col pb-20 lg:pb-8">
      {/* Global Top Navigation Bar (Matches 08_01_inbox.png) */}
      <header className="sticky top-0 z-40 bg-[#120624]/92 backdrop-blur-xl border-b border-purple-400/15">
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
            <Link
              href="/square"
              data-testid="inbox-square-link"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-xs font-bold text-purple-100 transition-colors"
              title="Open Square Community"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF4D8D]" />
              <span>Square</span>
            </Link>

            <Link
              href="/system-notices"
              data-testid="inbox-system-notices-link"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-xs font-bold text-purple-100 transition-colors"
              title="Open System Notices"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Notices</span>
            </Link>

            <button
              type="button"
              onClick={() => setShowMobileSearch((v) => !v)}
              data-testid="inbox-search-toggle"
              aria-label="Toggle inbox search"
              className={`p-2 rounded-full border transition-colors ${
                showMobileSearch || chatSearchQuery || contactSearchQuery
                  ? 'bg-[#FF1A6C]/20 border-[#FF1A6C] text-[#FF4D8D]'
                  : 'bg-[#1C0D38] hover:bg-[#28154D] border-white/10 text-purple-100/85'
              }`}
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setUnreadOnlyFilter((v) => !v);
                setActiveTab('chats');
              }}
              data-testid="inbox-unread-filter-btn"
              title={unreadOnlyFilter ? 'Showing unread chats only' : 'Filter unread chats'}
              aria-label="Filter unread conversations"
              className={`p-2 rounded-full border transition-colors relative ${
                unreadOnlyFilter
                  ? 'bg-[#FF1A6C] border-[#FF1A6C] text-white shadow-glow-pink'
                  : 'bg-[#1C0D38] hover:bg-[#28154D] border-white/10 text-purple-100/85'
              }`}
            >
              <Heart className={`w-4 h-4 ${unreadOnlyFilter ? 'fill-white' : ''}`} />
              {totalUnreadChats > 0 && !unreadOnlyFilter && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#FF1A6C] ring-2 ring-[#120624]" />
              )}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowHeaderMenu((v) => !v)}
                data-testid="inbox-header-menu-btn"
                aria-label="Inbox menu"
                className="p-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-purple-100/85 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showHeaderMenu && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#100521] border border-purple-400/25 shadow-2xl p-1.5 z-50 space-y-0.5">
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
                      setUnreadOnlyFilter((v) => !v);
                      setActiveTab('chats');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Filter className="w-3.5 h-3.5 text-amber-400" />
                    {unreadOnlyFilter ? 'Show All Chats' : 'Show Unread Only'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      handleRestoreDemo();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-cyan-400" /> Restore Demo Data
                  </button>
                  <Link
                    href="/square"
                    onClick={() => setShowHeaderMenu(false)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Square Posts Feed
                  </Link>
                  <Link
                    href="/notifications"
                    onClick={() => setShowHeaderMenu(false)}
                    data-testid="inbox-menu-notifications-link"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Heart className="w-3.5 h-3.5 text-[#FF4D8D]" /> Activity Notifications
                  </Link>
                  <Link
                    href="/invites"
                    onClick={() => setShowHeaderMenu(false)}
                    data-testid="inbox-menu-invites-link"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-pink-300" /> Invite Friends
                  </Link>
                  <Link
                    href="/system-notices"
                    onClick={() => setShowHeaderMenu(false)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Bell className="w-3.5 h-3.5 text-amber-400" /> System Notices
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout: Split View on Desktop / Stack View on Mobile */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-[410px_1fr] gap-6 items-start">
          {/* LEFT PANE: Inbox Main Screen / Lists (Hidden on mobile when chat view is open) */}
          <section
            data-testid="inbox-list-panel"
            className={`${
              mobileChatOpen ? 'hidden lg:flex' : 'flex'
            } flex-col rounded-3xl bg-[#110523]/90 border border-purple-400/20 p-4 sm:p-5 shadow-2xl`}
          >
            {/* Title & Subtitle */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-[28px] font-black tracking-tight text-white">
                  Inbox
                </h1>
                <p className="text-xs sm:text-sm text-purple-200/70 mt-0.5">
                  Your chats and messages
                </p>
              </div>

              {totalUnreadChats > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-[#FF1A6C]/20 border border-[#FF1A6C]/40 text-[#FF4D8D] text-[11px] font-extrabold shrink-0">
                  {totalUnreadChats} Unread
                </span>
              )}
            </div>

            {/* Primary Tabs: Chats / Contacts / Requests (Exact 08_01_inbox.png visual pill bar) */}
            <div
              role="tablist"
              aria-label="Inbox sections"
              className="grid grid-cols-3 gap-2 mt-4"
            >
              {(
                [
                  { id: 'chats', label: 'Chats', count: totalUnreadChats },
                  { id: 'contacts', label: 'Contacts', count: activeContacts.length },
                  { id: 'requests', label: 'Requests', count: activeRequests.length },
                ] as const
              ).map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    data-testid={`inbox-tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-3 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] text-white shadow-glow-pink'
                        : 'bg-[#211042] hover:bg-[#2B1754] text-purple-100/80 border border-white/5'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.id === 'requests' && tab.count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                          isActive ? 'bg-white text-[#FF1A6C]' : 'bg-[#FF1A6C] text-white'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Unread Filter Banner */}
            {unreadOnlyFilter && activeTab === 'chats' && (
              <div className="mt-3 px-3 py-1.5 rounded-full bg-[#FF1A6C]/15 border border-[#FF1A6C]/35 flex items-center justify-between text-xs">
                <span className="text-pink-200 font-semibold">Showing unread conversations only</span>
                <button
                  type="button"
                  onClick={() => setUnreadOnlyFilter(false)}
                  className="text-white hover:text-pink-200 font-bold inline-flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              </div>
            )}

            {/* Search Input (shown on desktop or toggled on mobile, separate for chats tab) */}
            {activeTab === 'chats' && (
              <div className={`${showMobileSearch ? 'block' : 'hidden lg:block'} mt-3.5`}>
                <SearchBar
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  onClear={() => setChatSearchQuery('')}
                  data-testid="inbox-chats-search"
                  placeholder="Search conversations or Popo ID..."
                  className="bg-[#180C32] border-purple-400/20 text-xs py-2"
                />
              </div>
            )}

            {/* Tab Panels */}
            <div className="mt-4">
              {activeTab === 'chats' && (
                <>
                  <ChatsListPanel
                    conversations={filteredConversations}
                    allConversationsCount={conversations.length}
                    selectedConversationId={selectedConversationId}
                    searchQuery={chatSearchQuery}
                    onClearSearch={() => {
                      setChatSearchQuery('');
                      setUnreadOnlyFilter(false);
                    }}
                    onSelectConversation={handleSelectConversation}
                    onPreviewProfile={(u) => setPreviewUser(u)}
                    onTogglePin={handleTogglePin}
                    onToggleMute={handleToggleMute}
                    onToggleReadStatus={handleToggleReadStatus}
                    onDeleteConversation={handleDeleteConversation}
                    onOpenSafetyAction={(u, mode) => setSafetyModal({ user: u, mode })}
                    onRestoreDemo={handleRestoreDemo}
                  />

                  {crossMatchedContacts.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-purple-300/15 space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-purple-200/60 px-1">
                        Matching Contacts
                      </span>
                      {crossMatchedContacts.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleOpenOrCreateChatForUser(c)}
                          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-[#1A0D35] hover:bg-[#241347] border border-white/10 text-left transition-colors"
                        >
                          <span className="text-xs font-bold text-white truncate">
                            {c.name} <span className="text-purple-200/50">({c.handle})</span>
                          </span>
                          <span className="text-[11px] font-bold text-[#FF4D8D]">Message →</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'contacts' && (
                <ContactsTabPanel
                  contacts={activeContacts}
                  searchQuery={contactSearchQuery}
                  onSearchChange={setContactSearchQuery}
                  onMessageContact={handleOpenOrCreateChatForUser}
                  onPreviewProfile={(u) => setPreviewUser(u)}
                  onRestoreDemo={handleRestoreDemo}
                />
              )}

              {activeTab === 'requests' && (
                <RequestsTabPanel
                  requests={activeRequests}
                  onAcceptRequest={handleAcceptRequest}
                  onDeleteRequest={handleDeleteRequest}
                  onPreviewProfile={(u) => setPreviewUser(u)}
                  onOpenSafetyAction={(u, mode) => setSafetyModal({ user: u, mode })}
                  onRestoreDemo={handleRestoreDemo}
                />
              )}
            </div>
          </section>

          {/* RIGHT PANE: Individual Chat Window (Full screen on mobile when chat opened; always rendered in desktop split) */}
          <section className={`${mobileChatOpen ? 'block' : 'hidden lg:block'}`}>
            <ChatWindow
              conversation={selectedConversation}
              onBackMobile={() => setMobileChatOpen(false)}
              onSendMessage={handleSendMessage}
              onTogglePin={handleTogglePin}
              onToggleMute={handleToggleMute}
              onMarkUnread={handleMarkUnread}
              onClearMessages={handleClearMessages}
              onDeleteConversation={handleDeleteConversation}
              onPreviewProfile={(u) => setPreviewUser(u)}
              onOpenSafetyAction={(u, mode) => setSafetyModal({ user: u, mode })}
            />
          </section>
        </div>
      </main>

      {/* Bottom Mobile Navigation Bar (Matches 08_01_inbox.png) */}
      {!mobileChatOpen && (
        <nav
          aria-label="Mobile navigation"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#100422]/95 backdrop-blur-xl border-t border-purple-400/20 h-16 px-4 flex items-center justify-around"
        >
          <Link
            href="/"
            className="flex flex-col items-center gap-1 text-purple-200/55 hover:text-white transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Home</span>
          </Link>

          <Link
            href="/live"
            className="flex flex-col items-center gap-1 text-purple-200/55 hover:text-white transition-colors"
          >
            <Compass className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Discover</span>
          </Link>

          <Link
            href="/live/setup"
            aria-label="Go Live"
            className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#FF1A6C] to-[#9333EA] flex items-center justify-center text-white shadow-glow-pink active:scale-95 transition-transform"
          >
            <Camera className="w-5 h-5" />
          </Link>

          <button
            type="button"
            onClick={() => setActiveTab('chats')}
            className="flex flex-col items-center gap-1 text-[#FF1A6C]"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-[10px] font-extrabold">Inbox</span>
          </button>

          <Link
            href="/profile"
            className="flex flex-col items-center gap-1 text-purple-200/55 hover:text-white transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Me</span>
          </Link>
        </nav>
      )}

      {/* Toast Feedback Banner */}
      {toast && (
        <div
          data-testid="inbox-toast"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#1F0E3D]/95 border border-[#FF1A6C]/50 text-white text-xs font-bold shadow-glow-pink backdrop-blur-md whitespace-nowrap"
        >
          {toast}
        </div>
      )}

      {/* User Profile Preview Modal */}
      <ProfilePreviewModal
        user={previewUser}
        isOpen={Boolean(previewUser)}
        onClose={() => setPreviewUser(null)}
        onMessageUser={handleOpenOrCreateChatForUser}
        onBlockUser={(u) => setSafetyModal({ user: u, mode: 'block' })}
        onReportUser={(u) => setSafetyModal({ user: u, mode: 'report' })}
        isBlocked={previewUser ? blockedUserIds.has(previewUser.id) : false}
      />

      {/* Block & Report Confirmation Modal */}
      <ReportBlockModal
        user={safetyModal.user}
        mode={safetyModal.mode}
        onClose={() => setSafetyModal({ user: null, mode: null })}
        onConfirmBlock={handleConfirmBlock}
        onConfirmReport={handleConfirmReport}
      />
    </div>
  );
};
