'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { USE_MESSAGE_API } from '@/lib/clientFlags';
import {
  MessageSquare,
  Search,
  Plus,
  Trophy,
  Bell,
  Shield,
  UserPlus,
  Send,
  Smile,
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  Sparkles,
  X,
  Radio,
  ExternalLink,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';
import {
  DesignFixtures,
  FixtureChatThread,
  FixtureOfficialNotice,
  FixtureUserRelation,
} from '@/lib/design/designFixtures';

export interface WebMessagePanelProps {
  isUr?: boolean;
  initialThreadId?: string;
  onOpenLiveRoom?: (roomId: string) => void;
}

interface LocalChatMessage {
  id: string;
  senderId: string;
  senderNickname: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isMe: boolean;
}

export const WebMessagePanel: React.FC<WebMessagePanelProps> = ({
  isUr = false,
  initialThreadId,
  onOpenLiveRoom,
}) => {
  // Navigation / View state
  const [activeThreadId, setActiveThreadId] = useState<string | null>(initialThreadId || null);
  const [activeNoticeCategory, setActiveNoticeCategory] = useState<string | null>(null);

  // Search & New Chat Modal
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  // Chats list state (initialized from DesignFixtures)
  const initialChats = useMemo(() => {
    try {
      return DesignFixtures.inboxChats;
    } catch {
      return [];
    }
  }, []);

  const [chats, setChats] = useState<FixtureChatThread[]>(initialChats);

  // Load conversations from database if USE_MESSAGE_API is enabled
  useEffect(() => {
    if (!USE_MESSAGE_API) return;
    let isCancelled = false;
    async function loadApiConversations() {
      try {
        const res = await fetch('/api/message/conversations');
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.success && Array.isArray(data.conversations)) {
            const mapped: FixtureChatThread[] = data.conversations.map((c: any) => ({
              threadId: c.threadId || c.id,
              peerUserId: c.peerUserId || c.peerId,
              peerNickname: c.peerNickname,
              peerAvatar: c.peerAvatar,
              lastMessage: c.lastMessage || '',
              lastMessageTime: c.lastMessageTime || '',
              unreadCount: c.unreadCount || 0,
              isPinned: Boolean(c.isPinned),
            }));
            setChats(mapped);
          }
        }
      } catch (err) {
        console.warn('API conversations load warning, fallback to fixtures:', err);
      }
    }
    loadApiConversations();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Local message histories per thread (allows in-state message sending)
  const [threadMessages, setThreadMessages] = useState<Record<string, LocalChatMessage[]>>(() => {
    const map: Record<string, LocalChatMessage[]> = {};
    initialChats.forEach((chat) => {
      map[chat.threadId] = [
        {
          id: `msg_prev_${chat.threadId}`,
          senderId: chat.peerUserId,
          senderNickname: chat.peerNickname,
          senderAvatar: chat.peerAvatar,
          text: chat.lastMessage,
          timestamp: chat.lastMessageTime,
          isMe: false,
        },
      ];
    });
    return map;
  });

  const [composerText, setComposerText] = useState('');

  // People row data
  const peopleList = useMemo(() => {
    try {
      return DesignFixtures.followers;
    } catch {
      return [];
    }
  }, []);

  // 4 Official Message Rows
  const officialNotices = useMemo(() => {
    try {
      return DesignFixtures.officialNotices;
    } catch {
      return [];
    }
  }, []);

  // Filtered chats based on search
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const q = searchQuery.toLowerCase();
    return chats.filter(
      (c) =>
        c.peerNickname.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
    );
  }, [chats, searchQuery]);

  // Currently open chat
  const currentChat = useMemo(() => {
    return chats.find((c) => c.threadId === activeThreadId) || null;
  }, [chats, activeThreadId]);

  // Handle selecting chat
  const handleSelectChat = (threadId: string) => {
    setActiveThreadId(threadId);
    setActiveNoticeCategory(null);
    // Mark as read in state
    setChats((prev) =>
      prev.map((c) => (c.threadId === threadId ? { ...c, unreadCount: 0 } : c))
    );
  };

  // Handle sending a message in the active thread
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerText.trim() || !activeThreadId || !currentChat) return;

    const textToSend = composerText.trim();
    setComposerText('');

    if (USE_MESSAGE_API) {
      try {
        const res = await fetch(`/api/message/conversations/${activeThreadId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: textToSend }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.message) {
            const apiMsg: LocalChatMessage = {
              id: data.message.id,
              senderId: data.message.senderId,
              senderNickname: data.message.senderNickname || 'Me',
              senderAvatar: data.message.senderAvatar || '/avatars/default.png',
              text: data.message.text,
              timestamp: data.message.timestamp || 'Just now',
              isMe: true,
            };

            setThreadMessages((prev) => ({
              ...prev,
              [activeThreadId]: [...(prev[activeThreadId] || []), apiMsg],
            }));

            setChats((prev) =>
              prev.map((c) =>
                c.threadId === activeThreadId
                  ? {
                      ...c,
                      lastMessage: textToSend,
                      lastMessageTime: 'Just now',
                    }
                  : c
              )
            );
            return;
          }
        }
      } catch (err) {
        console.warn('API message send failed, fallback to local state:', err);
      }
    }

    const newMsg: LocalChatMessage = {
      id: `local_${Date.now()}`,
      senderId: DesignFixtures.currentUserProfile.userId,
      senderNickname: DesignFixtures.currentUserProfile.nickname,
      senderAvatar: DesignFixtures.currentUserProfile.avatarUrl,
      text: textToSend,
      timestamp: 'Just now',
      isMe: true,
    };

    // Append to thread messages
    setThreadMessages((prev) => ({
      ...prev,
      [activeThreadId]: [...(prev[activeThreadId] || []), newMsg],
    }));

    // Update lastMessage and timestamp in chats list
    setChats((prev) =>
      prev.map((c) =>
        c.threadId === activeThreadId
          ? {
              ...c,
              lastMessage: textToSend,
              lastMessageTime: 'Just now',
            }
          : c
      )
    );
  };

  // Handle quick emoji tap
  const handleAddEmoji = (emoji: string) => {
    setComposerText((prev) => prev + emoji);
  };

  // Start chat with person from People row
  const handleStartChatWithPerson = (person: FixtureUserRelation) => {
    const existing = chats.find(
      (c) => c.peerUserId === person.userId || c.peerNickname === person.nickname
    );
    if (existing) {
      handleSelectChat(existing.threadId);
    } else {
      const newThreadId = `th_${person.userId}`;
      const newChat: FixtureChatThread = {
        threadId: newThreadId,
        senderId: DesignFixtures.currentUserProfile.userId,
        receiverId: person.userId,
        peerUserId: person.userId,
        peerNickname: person.nickname,
        peerAvatar: person.avatarUrl,
        lastMessage: 'Hey! Nice to connect on Popo Live 👋',
        lastMessageTime: 'Just now',
        unreadCount: 0,
        isOnline: person.isOnline,
      };

      setChats((prev) => [newChat, ...prev]);
      setThreadMessages((prev) => ({
        ...prev,
        [newThreadId]: [
          {
            id: `msg_init_${newThreadId}`,
            senderId: person.userId,
            senderNickname: person.nickname,
            senderAvatar: person.avatarUrl,
            text: 'Hey! Nice to connect on Popo Live 👋',
            timestamp: 'Just now',
            isMe: false,
          },
        ],
      }));
      handleSelectChat(newThreadId);
    }
    setShowNewChatModal(false);
  };

  // -------------------------------------------------------------------------
  // VIEW A: OFFICIAL NOTICE SCREEN (Achievements, System, Security, Followers)
  // -------------------------------------------------------------------------
  if (activeNoticeCategory) {
    const notice = officialNotices.find((n) => n.category === activeNoticeCategory);

    const categoryIcons: Record<string, React.ReactNode> = {
      Achievements: <Trophy className="w-6 h-6 text-amber-500" />,
      System: <Bell className="w-6 h-6 text-indigo-500" />,
      'Account Security': <Shield className="w-6 h-6 text-emerald-500" />,
      'New Followers': <UserPlus className="w-6 h-6 text-[#FF1A6C]" />,
    };

    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-in fade-in duration-150" data-testid="official-notice-screen">
        {/* Header */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-200/90 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveNoticeCategory(null)}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              title="Back to Inbox"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-gray-50 border border-gray-100">
                {categoryIcons[activeNoticeCategory] || <Bell className="w-6 h-6 text-gray-600" />}
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-900">
                  {activeNoticeCategory} Notice
                </h2>
                <p className="text-xs text-gray-400">Official verified Popo Live notices</p>
              </div>
            </div>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-pink-50 text-[#FF1A6C] border border-pink-200">
            Verified Notice
          </span>
        </div>

        {/* Notice Content Card */}
        <div className="p-6 rounded-3xl bg-white border border-gray-200/90 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                {notice?.badgeLabel || activeNoticeCategory}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mt-2">
                {notice?.title || `${activeNoticeCategory} Notification`}
              </h3>
            </div>
            <span className="text-xs text-gray-400 shrink-0">{notice?.timestamp}</span>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed">
            {notice?.preview}
          </p>

          {/* Category specific details */}
          {activeNoticeCategory === 'Achievements' && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <Trophy className="w-4 h-4 text-amber-600" />
                <span>Broadcaster Milestone Rewards</span>
              </div>
              <p className="text-xs text-amber-800">
                You have received a special Top Broadcaster profile frame and +5,000 shining points.
              </p>
            </div>
          )}

          {activeNoticeCategory === 'Account Security' && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Security Status: Protected</span>
              </div>
              <p className="text-xs text-emerald-800">
                2-Factor authentication active. All sessions are encrypted with TLS 1.3 standards.
              </p>
            </div>
          )}

          {activeNoticeCategory === 'New Followers' && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-bold text-gray-700">Recent Broadcasters who followed you:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {peopleList.slice(0, 4).map((p) => (
                  <div
                    key={p.userId}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-gray-50 border border-gray-100"
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={p.avatarUrl} alt={p.nickname} className="w-8 h-8 rounded-full object-cover" />
                      <span className="text-xs font-bold text-gray-800">{p.nickname}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleStartChatWithPerson(p)}
                      className="px-2.5 py-1 rounded-lg bg-[#FF1A6C] text-white text-[11px] font-bold"
                    >
                      Chat
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              onClick={() => setActiveNoticeCategory(null)}
              className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-colors"
            >
              Back to Messages
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // VIEW B: INDIVIDUAL CHAT THREAD VIEW
  // -------------------------------------------------------------------------
  if (currentChat) {
    const messages = threadMessages[currentChat.threadId] || [];

    return (
      <div className="max-w-3xl mx-auto flex flex-col h-[640px] rounded-3xl bg-white border border-gray-200/90 shadow-xs overflow-hidden animate-in fade-in duration-150" data-testid="chat-thread-view">
        {/* Chat Thread Header */}
        <div className="p-3.5 sm:p-4 border-b border-gray-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveThreadId(null)}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              title="Back to inbox"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="relative">
              <img
                src={currentChat.peerAvatar}
                alt={currentChat.peerNickname}
                className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-200"
              />
              {currentChat.isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
              )}
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-gray-900">{currentChat.peerNickname}</h3>
              <p className="text-[11px] text-gray-400">
                {currentChat.isOnline ? 'Active now' : 'Offline'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              Direct Chat
            </span>
          </div>
        </div>

        {/* Message Bubbles History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50/50">
          <div className="text-center my-2">
            <span className="text-[10px] font-medium text-gray-400 bg-white px-2.5 py-1 rounded-full border border-gray-100 shadow-2xs">
              End-to-end simulated fixture conversation
            </span>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${msg.isMe ? 'justify-end' : 'justify-start'}`}
            >
              {!msg.isMe && (
                <img
                  src={msg.senderAvatar}
                  alt={msg.senderNickname}
                  className="w-7 h-7 rounded-full object-cover shrink-0 mb-0.5"
                />
              )}

              <div className={`max-w-[75%] space-y-1 ${msg.isMe ? 'items-end' : 'items-start'}`}>
                <div
                  className={`px-4 py-2.5 rounded-2xl text-xs font-medium leading-relaxed shadow-2xs ${
                    msg.isMe
                      ? 'bg-[#FF1A6C] text-white rounded-br-xs'
                      : 'bg-white text-gray-800 border border-gray-200/80 rounded-bl-xs'
                  }`}
                >
                  <p className="break-words">{msg.text}</p>
                </div>
                <div
                  className={`flex items-center gap-1 text-[10px] text-gray-400 px-1 ${
                    msg.isMe ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {msg.isMe && <CheckCheck className="w-3 h-3 text-[#FF1A6C]" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Emoji Bar */}
        <div className="px-4 py-1.5 bg-white border-t border-gray-100 flex items-center gap-2 overflow-x-auto text-sm">
          {['💖', '🌹', '🎶', '🔥', '👏', '😂', '⭐', '☕'].map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleAddEmoji(emoji)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-transform active:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Message Composer */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
          <input
            type="text"
            value={composerText}
            onChange={(e) => setComposerText(e.target.value)}
            placeholder="Write a message..."
            className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#FF1A6C]"
          />
          <button
            type="submit"
            disabled={!composerText.trim()}
            className="p-2.5 rounded-xl bg-[#FF1A6C] hover:bg-[#e0125c] disabled:opacity-40 text-white transition-colors shadow-xs"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // VIEW C: INBOX MAIN SCREEN
  // -------------------------------------------------------------------------
  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in duration-150" data-testid="message-inbox-screen">
      {/* 1. HEADER: Title, Search, Plus Action */}
      <div className="p-5 rounded-3xl bg-white border border-gray-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-center text-[#FF1A6C]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900 tracking-tight">
                {isUr ? 'پیغامات' : 'Messages'}
              </h1>
              <p className="text-xs text-gray-400">
                {chats.length} direct conversations · 4 official categories
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowNewChatModal(true)}
            className="p-2.5 rounded-xl bg-[#FF1A6C] hover:bg-[#e0125c] text-white transition-colors shadow-xs flex items-center gap-1.5 text-xs font-bold"
            title="Start New Chat"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>

        {/* Search Control */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations, creators or messages..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#FF1A6C]"
          />
        </div>
      </div>

      {/* 2. HORIZONTAL PEOPLE ROW */}
      <div className="p-4 rounded-3xl bg-white border border-gray-200/90 shadow-xs space-y-2.5">
        <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
          Broadcasters & Friends
        </span>
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
          {peopleList.map((person) => (
            <div
              key={person.userId}
              onClick={() => handleStartChatWithPerson(person)}
              className="flex flex-col items-center space-y-1 shrink-0 cursor-pointer group select-none"
            >
              <div className="relative">
                <img
                  src={person.avatarUrl}
                  alt={person.nickname}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-[#FF1A6C] transition-all"
                />
                {person.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </div>
              <span className="text-[11px] font-bold text-gray-700 max-w-[64px] truncate text-center group-hover:text-[#FF1A6C]">
                {person.nickname}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. FOUR (4) OFFICIAL MESSAGE ROWS */}
      <div className="p-4 rounded-3xl bg-white border border-gray-200/90 shadow-xs space-y-2">
        <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider px-1">
          Official Channels
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Official 1: Achievements */}
          <div
            onClick={() => setActiveNoticeCategory('Achievements')}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-200/80 hover:border-amber-300 transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-black text-amber-950 truncate">Achievements</h3>
                <p className="text-[11px] text-amber-800/80 truncate">Million Diamond Milestone Unlocked! 🏆</p>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#FF1A6C] shrink-0" />
          </div>

          {/* Official 2: System */}
          <div
            onClick={() => setActiveNoticeCategory('System')}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50/50 border border-indigo-200/80 hover:border-indigo-300 transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bell className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-black text-indigo-950 truncate">System</h3>
                <p className="text-[11px] text-indigo-800/80 truncate">Server Upgrade & Live Stream Enhancements ⚡</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
          </div>

          {/* Official 3: Account Security */}
          <div
            onClick={() => setActiveNoticeCategory('Account Security')}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50/50 border border-emerald-200/80 hover:border-emerald-300 transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Shield className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-black text-emerald-950 truncate">Account Security</h3>
                <p className="text-[11px] text-emerald-800/80 truncate">New Device Sign-in Verified 🛡️</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
          </div>

          {/* Official 4: New Followers */}
          <div
            onClick={() => setActiveNoticeCategory('New Followers')}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-50 to-rose-50/50 border border-pink-200/80 hover:border-pink-300 transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#FF1A6C] text-white flex items-center justify-center shrink-0 shadow-xs">
                <UserPlus className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-black text-pink-950 truncate">New Followers</h3>
                <p className="text-[11px] text-pink-800/80 truncate">24 New Followers This Morning 💖</p>
              </div>
            </div>
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-[#FF1A6C] text-white shrink-0">
              24
            </span>
          </div>
        </div>
      </div>

      {/* 4. TWELVE (12) INDIVIDUAL CHAT CONVERSATIONS */}
      <div className="p-4 rounded-3xl bg-white border border-gray-200/90 shadow-xs space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
            Direct Chats ({filteredChats.length})
          </span>
          <span className="text-[11px] text-gray-400">Tap conversation to chat</span>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredChats.map((chat) => (
            <div
              key={chat.threadId}
              onClick={() => handleSelectChat(chat.threadId)}
              className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-gray-50/80 transition-colors cursor-pointer group select-none gap-3"
              data-testid={`inbox-thread-${chat.threadId}`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <img
                    src={chat.peerAvatar}
                    alt={chat.peerNickname}
                    className="w-12 h-12 rounded-full object-cover ring-1 ring-gray-200"
                  />
                  {chat.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-[#FF1A6C] transition-colors truncate">
                      {chat.peerNickname}
                    </h3>
                    <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                      {chat.lastMessageTime}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                </div>
              </div>

              {chat.unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#FF1A6C] text-white text-[10px] font-black shrink-0">
                  {chat.unreadCount}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 5. NEW CHAT MODAL */}
      {showNewChatModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowNewChatModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-gray-900">New Conversation</h3>
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500">Select a broadcaster or friend to message:</p>

            <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
              {peopleList.map((p) => (
                <div
                  key={p.userId}
                  onClick={() => handleStartChatWithPerson(p)}
                  className="flex items-center justify-between p-2.5 hover:bg-pink-50/50 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <img src={p.avatarUrl} alt={p.nickname} className="w-8 h-8 rounded-full object-cover" />
                    <span className="text-xs font-bold text-gray-800">{p.nickname}</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#FF1A6C]">Chat</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebMessagePanel;
