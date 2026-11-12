'use client';

import React, { useState } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { InboxAvatar } from './InboxAvatar';
import { InboxConversation, InboxUserProfile } from './types';
import {
  MessageSquareOff,
  SearchX,
  MoreVertical,
  Pin,
  BellOff,
  Bell,
  MailOpen,
  Trash2,
  User,
  Ban,
  Flag,
  ShieldCheck,
} from 'lucide-react';

interface ChatsListPanelProps {
  conversations: InboxConversation[];
  allConversationsCount: number;
  selectedConversationId: string | null;
  searchQuery: string;
  onClearSearch: () => void;
  onSelectConversation: (convId: string) => void;
  onPreviewProfile: (user: InboxUserProfile) => void;
  onTogglePin: (convId: string) => void;
  onToggleMute: (convId: string) => void;
  onToggleReadStatus: (convId: string) => void;
  onDeleteConversation: (convId: string) => void;
  onOpenSafetyAction: (user: InboxUserProfile, mode: 'block' | 'report') => void;
  onRestoreDemo?: () => void;
}

export const ChatsListPanel: React.FC<ChatsListPanelProps> = ({
  conversations,
  allConversationsCount,
  selectedConversationId,
  searchQuery,
  onClearSearch,
  onSelectConversation,
  onPreviewProfile,
  onTogglePin,
  onToggleMute,
  onToggleReadStatus,
  onDeleteConversation,
  onOpenSafetyAction,
  onRestoreDemo,
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (allConversationsCount === 0) {
    return (
      <EmptyState
        icon={<MessageSquareOff className="w-7 h-7" />}
        title="No Conversations Yet"
        description="Your active chats will appear here. Visit the Contacts tab to start a new message."
        actionLabel={onRestoreDemo ? 'Restore Demo Chats' : undefined}
        onAction={onRestoreDemo}
        className="bg-[#160B2C]/80 border-purple-400/15 py-10 mt-2"
      />
    );
  }

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={<SearchX className="w-7 h-7" />}
        title="No Search Results"
        description={`No conversations matched "${searchQuery}". Check the spelling or clear your filter.`}
        actionLabel="Clear Search"
        onAction={onClearSearch}
        className="bg-[#160B2C]/80 border-purple-400/15 py-10 mt-2"
      />
    );
  }

  return (
    <div className="divide-y divide-purple-300/10">
      {conversations.map((conv) => {
        const isActive = conv.id === selectedConversationId;
        const menuOpen = openMenuId === conv.id;

        return (
          <div
            key={conv.id}
            data-testid={`conversation-row-${conv.id}`}
            className={`relative group flex items-center gap-3.5 py-3.5 px-2.5 rounded-2xl transition-all cursor-pointer ${
              isActive
                ? 'bg-gradient-to-r from-[#FF1A6C]/20 via-[#7928CA]/20 to-transparent border border-[#FF1A6C]/35'
                : 'hover:bg-[#1C0D36]/80 border border-transparent'
            }`}
            onClick={() => onSelectConversation(conv.id)}
          >
            <InboxAvatar
              user={conv.user}
              size="md"
              onClick={(e) => {
                e.stopPropagation();
                onPreviewProfile(conv.user);
              }}
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[15px] font-extrabold text-white truncate">
                    {conv.user.name}
                  </span>
                  {conv.user.isOfficial && (
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  )}
                  {conv.isPinned && (
                    <Pin className="w-3 h-3 text-[#FF4D8D] shrink-0" />
                  )}
                  {conv.isMuted && (
                    <BellOff className="w-3 h-3 text-purple-200/45 shrink-0" />
                  )}
                </div>

                <span className="text-[11px] font-medium text-purple-200/55 shrink-0">
                  {conv.lastTimestamp}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 mt-1">
                <p
                  className={`text-xs truncate ${
                    conv.unreadCount > 0 ? 'text-purple-50 font-semibold' : 'text-purple-200/60'
                  }`}
                >
                  {conv.lastMessage}
                </p>

                <div className="flex items-center gap-1.5 shrink-0">
                  {conv.unreadCount > 0 && (
                    <span
                      data-testid={`unread-badge-${conv.id}`}
                      className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#FF1A6C] text-white text-[11px] font-black flex items-center justify-center shadow-glow-pink"
                    >
                      {conv.unreadCount}
                    </span>
                  )}

                  <div
                    className="relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenMenuId(menuOpen ? null : conv.id)}
                      data-testid={`conv-menu-btn-${conv.id}`}
                      aria-label={`Options for ${conv.user.name}`}
                      className="p-1 rounded-full text-purple-200/55 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {menuOpen && (
                      <div className="absolute right-0 bottom-full mb-1 w-48 rounded-2xl bg-[#100521] border border-purple-400/25 shadow-2xl p-1.5 z-40 space-y-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onPreviewProfile(conv.user);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                        >
                          <User className="w-3.5 h-3.5 text-[#FF4D8D]" /> View Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onToggleReadStatus(conv.id);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                        >
                          <MailOpen className="w-3.5 h-3.5 text-cyan-400" />
                          {conv.unreadCount > 0 ? 'Mark as Read' : 'Mark as Unread'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onTogglePin(conv.id);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                        >
                          <Pin className="w-3.5 h-3.5 text-amber-400" />
                          {conv.isPinned ? 'Unpin Chat' : 'Pin Chat'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onToggleMute(conv.id);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                        >
                          {conv.isMuted ? (
                            <>
                              <Bell className="w-3.5 h-3.5 text-emerald-400" /> Unmute
                            </>
                          ) : (
                            <>
                              <BellOff className="w-3.5 h-3.5 text-purple-300" /> Mute
                            </>
                          )}
                        </button>
                        {!conv.user.isOfficial && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onOpenSafetyAction(conv.user, 'block');
                              }}
                              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-red-300 hover:bg-red-500/15 flex items-center gap-2"
                            >
                              <Ban className="w-3.5 h-3.5" /> Block
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onOpenSafetyAction(conv.user, 'report');
                              }}
                              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:bg-amber-500/15 flex items-center gap-2"
                            >
                              <Flag className="w-3.5 h-3.5" /> Report
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onDeleteConversation(conv.id);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-red-300 hover:bg-red-500/15 flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Chat
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
