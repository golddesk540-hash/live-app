'use client';

import React, { useState, useRef, useEffect } from 'react';
import { InboxAvatar } from './InboxAvatar';
import { CHAT_EMOJI_PALETTE } from './mockInboxData';
import { VideoCallDisabledButton } from '@/components/video-call/VideoCallDisabledButton';
import {
  InboxConversation,
  InboxMessageAttachment,
  InboxUserProfile,
} from './types';
import {
  ArrowLeft,
  MoreVertical,
  Send,
  Smile,
  Paperclip,
  Pin,
  BellOff,
  Bell,
  User,
  Trash2,
  Ban,
  Flag,
  CheckCheck,
  Image as ImageIcon,
  Mic,
  Radio,
  Gift,
  MailOpen,
  X,
  ShieldCheck,
} from 'lucide-react';

interface ChatWindowProps {
  conversation: InboxConversation | null;
  onBackMobile: () => void;
  onSendMessage: (
    conversationId: string,
    text: string,
    attachment?: InboxMessageAttachment
  ) => void;
  onTogglePin: (conversationId: string) => void;
  onToggleMute: (conversationId: string) => void;
  onMarkUnread: (conversationId: string) => void;
  onClearMessages: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  onPreviewProfile: (user: InboxUserProfile) => void;
  onOpenSafetyAction: (user: InboxUserProfile, mode: 'block' | 'report') => void;
}

const DEMO_ATTACHMENTS: Array<{
  id: string;
  label: string;
  text: string;
  icon: React.ReactNode;
  attachment: InboxMessageAttachment;
}> = [
  {
    id: 'photo',
    label: 'Photo Card',
    text: 'Sent a photo',
    icon: <ImageIcon className="w-4 h-4 text-[#FF4D8D]" />,
    attachment: {
      type: 'photo',
      title: 'Live Stage Preview.jpg',
      subtitle: 'Shared locally from gallery preview',
      previewUrl:
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=480&auto=format&fit=crop&q=80',
    },
  },
  {
    id: 'voice',
    label: 'Voice Preview',
    text: 'Sent a voice note (0:14)',
    icon: <Mic className="w-4 h-4 text-cyan-400" />,
    attachment: {
      type: 'voice',
      title: 'Voice Note • 0:14',
      subtitle: 'Audio waveform preview (frontend demo)',
      accentLabel: 'AUDIO',
    },
  },
  {
    id: 'room',
    label: 'Party Invite',
    text: 'Invited you to join a Party Room',
    icon: <Radio className="w-4 h-4 text-emerald-400" />,
    attachment: {
      type: 'room_invite',
      title: 'Popo Chill Lounge #4092',
      subtitle: '9-Seat Audio Room • Tap to preview room',
      accentLabel: 'JOIN ROOM',
    },
  },
  {
    id: 'gift',
    label: 'Gift Sticker',
    text: 'Sent a Celebration Rose sticker',
    icon: <Gift className="w-4 h-4 text-amber-400" />,
    attachment: {
      type: 'gift',
      title: 'Neon Rose Sticker',
      subtitle: 'Demo chat sticker • Zero balance impact',
      accentLabel: 'STICKER',
    },
  },
];

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  onBackMobile,
  onSendMessage,
  onTogglePin,
  onToggleMute,
  onMarkUnread,
  onClearMessages,
  onDeleteConversation,
  onPreviewProfile,
  onOpenSafetyAction,
}) => {
  const [draft, setDraft] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachTray, setShowAttachTray] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setShowEmojiPicker(false);
    setShowAttachTray(false);
    setShowOptionsMenu(false);
  }, [conversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages.length, conversation?.id]);

  if (!conversation) {
    return (
      <div className="hidden lg:flex flex-col items-center justify-center h-full min-h-[540px] rounded-3xl bg-[#130728]/80 border border-purple-400/15 p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF1A6C]/25 to-[#7928CA]/25 border border-[#FF1A6C]/35 flex items-center justify-center mb-4 shadow-glow-pink">
          <Send className="w-7 h-7 text-[#FF4D8D]" />
        </div>
        <h3 className="text-lg font-extrabold text-white">Select a Conversation</h3>
        <p className="text-xs text-purple-200/65 max-w-xs mt-1.5 leading-relaxed">
          Choose a chat on the left, message a contact, or accept an incoming request to start chatting live.
        </p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSendMessage(conversation.id, text);
    setDraft('');
    setShowEmojiPicker(false);
    setShowAttachTray(false);
  };

  const handleEmojiInsert = (emoji: string) => {
    setDraft((prev) => `${prev}${emoji}`);
    inputRef.current?.focus();
  };

  const handleSendAttachment = (item: (typeof DEMO_ATTACHMENTS)[number]) => {
    onSendMessage(conversation.id, item.text, item.attachment);
    setShowAttachTray(false);
  };

  const { user } = conversation;

  return (
    <div
      data-testid="active-chat-window"
      className="flex flex-col h-[calc(100vh-148px)] lg:h-[650px] min-h-[480px] rounded-3xl bg-[#120726]/95 border border-purple-400/20 overflow-hidden shadow-2xl"
    >
      {/* Chat Header */}
      <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 bg-[#170931]/95 border-b border-purple-400/15">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBackMobile}
            data-testid="chat-back-btn"
            aria-label="Back to Inbox"
            className="lg:hidden p-2 -ml-1 rounded-full bg-[#221045] hover:bg-[#2E175C] text-white border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <InboxAvatar
            user={user}
            size="sm"
            onClick={() => onPreviewProfile(user)}
          />

          <button
            type="button"
            onClick={() => onPreviewProfile(user)}
            className="text-left min-w-0 group"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold text-white group-hover:text-[#FF4D8D] transition-colors truncate">
                {user.name}
              </span>
              {user.isOfficial && <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              {conversation.isPinned && <Pin className="w-3 h-3 text-[#FF4D8D] shrink-0" />}
              {conversation.isMuted && <BellOff className="w-3 h-3 text-purple-300/60 shrink-0" />}
            </div>
            <p className="text-[11px] flex items-center gap-1.5 truncate">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  user.status === 'online'
                    ? 'bg-emerald-400'
                    : user.status === 'live'
                    ? 'bg-[#FF1A6C] animate-pulse'
                    : 'bg-zinc-500'
                }`}
              />
              <span
                className={
                  user.status === 'online'
                    ? 'text-emerald-400 font-medium'
                    : user.status === 'live'
                    ? 'text-[#FF4D8D] font-semibold'
                    : 'text-purple-200/55'
                }
              >
                {user.lastSeenText}
              </span>
              <span className="text-purple-200/35 hidden sm:inline">• ID {user.poppoId}</span>
            </p>
          </button>
        </div>

        {/* Chat Actions + Disabled 1-to-1 Video Call Entry (Module 8.9 Default OFF) */}
        <div className="shrink-0 flex items-center gap-2">
          <VideoCallDisabledButton
            variant="icon"
            testId="chat-video-call-off-btn"
            targetName={user.name}
          />
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowOptionsMenu((v) => !v)}
              data-testid="chat-options-btn"
              aria-label="Chat options"
              className="p-2 rounded-full bg-[#221045] hover:bg-[#2E175C] text-purple-100 border border-white/10 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showOptionsMenu && (
              <div
                data-testid="chat-options-menu"
                className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-[#100521] border border-purple-400/25 shadow-2xl p-1.5 z-40 space-y-0.5"
              >
              <button
                type="button"
                onClick={() => {
                  setShowOptionsMenu(false);
                  onPreviewProfile(user);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
              >
                <User className="w-3.5 h-3.5 text-[#FF4D8D]" />
                View Profile Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOptionsMenu(false);
                  onTogglePin(conversation.id);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
              >
                <Pin className="w-3.5 h-3.5 text-amber-400" />
                {conversation.isPinned ? 'Unpin Conversation' : 'Pin Conversation'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOptionsMenu(false);
                  onToggleMute(conversation.id);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
              >
                {conversation.isMuted ? (
                  <>
                    <Bell className="w-3.5 h-3.5 text-emerald-400" /> Unmute Notifications
                  </>
                ) : (
                  <>
                    <BellOff className="w-3.5 h-3.5 text-purple-300" /> Mute Notifications
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOptionsMenu(false);
                  onMarkUnread(conversation.id);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
              >
                <MailOpen className="w-3.5 h-3.5 text-cyan-400" />
                Mark as Unread
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOptionsMenu(false);
                  onClearMessages(conversation.id);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5 text-orange-300" />
                Clear Messages
              </button>
              {!user.isOfficial && (
                <>
                  <div className="my-1 border-t border-white/10" />
                  <button
                    type="button"
                    onClick={() => {
                      setShowOptionsMenu(false);
                      onOpenSafetyAction(user, 'block');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-red-300 hover:bg-red-500/15 flex items-center gap-2"
                  >
                    <Ban className="w-3.5 h-3.5" /> Block User
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowOptionsMenu(false);
                      onOpenSafetyAction(user, 'report');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:bg-amber-500/15 flex items-center gap-2"
                  >
                    <Flag className="w-3.5 h-3.5" /> Report Chat
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowOptionsMenu(false);
                  onDeleteConversation(conversation.id);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-red-300 hover:bg-red-500/15 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Conversation
              </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message History Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-b from-[#0E051E] via-[#120726] to-[#0D041B]">
        {conversation.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <InboxAvatar user={user} size="lg" />
            <p className="text-sm font-bold text-white mt-3">Start a conversation with {user.name}</p>
            <p className="text-xs text-purple-200/60 mt-1 max-w-xs">
              Send a greeting, emoji, or quick party invite card below.
            </p>
          </div>
        ) : (
          conversation.messages.map((msg, idx) => {
            const isMine = msg.senderId === 'me';
            const prev = idx > 0 ? conversation.messages[idx - 1] : null;
            const showDateHeader = msg.dateGroup && msg.dateGroup !== prev?.dateGroup;

            return (
              <React.Fragment key={msg.id}>
                {showDateHeader && (
                  <div className="flex justify-center py-1">
                    <span className="px-3 py-0.5 rounded-full bg-[#1C0D38] border border-white/10 text-[10px] font-semibold text-purple-200/65">
                      {msg.dateGroup}
                    </span>
                  </div>
                )}

                <div
                  data-testid={`chat-bubble-${msg.id}`}
                  className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMine && (
                    <div className="shrink-0 mb-1 hidden sm:block">
                      <InboxAvatar user={user} size="sm" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] sm:max-w-[72%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                      isMine
                        ? 'bg-gradient-to-br from-[#FF1A6C] via-[#E11D84] to-[#A21CAF] text-white rounded-br-md shadow-glow-pink'
                        : 'bg-[#1D0F39] text-purple-50 border border-purple-300/15 rounded-bl-md'
                    }`}
                  >
                    {msg.attachment && (
                      <div className="mb-2 rounded-xl overflow-hidden bg-black/30 border border-white/10">
                        {msg.attachment.previewUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={msg.attachment.previewUrl}
                            alt={msg.attachment.title}
                            className="w-full max-h-40 object-cover"
                          />
                        )}
                        <div className="p-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-white truncate">
                              {msg.attachment.title}
                            </span>
                            {msg.attachment.accentLabel && (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-black shrink-0">
                                {msg.attachment.accentLabel}
                              </span>
                            )}
                          </div>
                          {msg.attachment.subtitle && (
                            <p className="text-[11px] text-white/75 mt-0.5">
                              {msg.attachment.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <p className="text-xs sm:text-[13px] leading-relaxed break-words">{msg.text}</p>

                    <div
                      className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                        isMine ? 'text-white/80' : 'text-purple-200/50'
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {isMine && <CheckCheck className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Optional Popovers above Composer */}
      {showEmojiPicker && (
        <div
          data-testid="chat-emoji-picker"
          className="px-4 py-2.5 bg-[#180A33] border-t border-purple-400/20 flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {CHAT_EMOJI_PALETTE.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleEmojiInsert(emoji)}
                className="w-8 h-8 rounded-xl bg-[#25124B] hover:bg-[#FF1A6C]/30 text-base flex items-center justify-center transition-transform active:scale-90 shrink-0"
              >
                {emoji}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowEmojiPicker(false)}
            aria-label="Close emoji picker"
            className="p-1 text-purple-200/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showAttachTray && (
        <div
          data-testid="chat-attachment-tray"
          className="px-4 py-3 bg-[#180A33] border-t border-purple-400/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-200/70">
              Quick Demo Attachments
            </span>
            <button
              type="button"
              onClick={() => setShowAttachTray(false)}
              aria-label="Close attachment tray"
              className="p-1 text-purple-200/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DEMO_ATTACHMENTS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSendAttachment(item)}
                className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#24114A] hover:bg-[#311863] border border-white/10 text-xs font-semibold text-white transition-all active:scale-95"
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Composer Bar */}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 px-3 sm:px-4 py-3 bg-[#170931] border-t border-purple-400/15 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={() => {
            setShowAttachTray((v) => !v);
            setShowEmojiPicker(false);
          }}
          data-testid="chat-attach-btn"
          aria-label="Open attachments"
          className={`p-2 rounded-full border transition-colors shrink-0 ${
            showAttachTray
              ? 'bg-[#FF1A6C]/20 border-[#FF1A6C] text-[#FF4D8D]'
              : 'bg-[#231147] hover:bg-[#2F185E] border-white/10 text-purple-200'
          }`}
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => {
            setShowEmojiPicker((v) => !v);
            setShowAttachTray(false);
          }}
          data-testid="chat-emoji-btn"
          aria-label="Open emoji picker"
          className={`p-2 rounded-full border transition-colors shrink-0 ${
            showEmojiPicker
              ? 'bg-[#FF1A6C]/20 border-[#FF1A6C] text-[#FF4D8D]'
              : 'bg-[#231147] hover:bg-[#2F185E] border-white/10 text-purple-200'
          }`}
        >
          <Smile className="w-4 h-4" />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          data-testid="chat-message-input"
          placeholder={`Message ${user.name}...`}
          className="flex-1 min-w-0 bg-[#0F0522] hover:bg-[#14072C] focus:bg-[#160830] text-white placeholder:text-purple-200/45 text-xs sm:text-sm rounded-full px-4 py-2.5 border border-purple-400/20 focus:border-[#FF1A6C] outline-none transition-all"
        />

        <button
          type="submit"
          data-testid="chat-send-btn"
          disabled={!draft.trim()}
          aria-label="Send message"
          className="px-4 py-2.5 rounded-full bg-gradient-to-r from-[#FF1A6C] to-[#D946EF] hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold shadow-glow-pink active:scale-95 transition-all inline-flex items-center gap-1.5 shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
};
