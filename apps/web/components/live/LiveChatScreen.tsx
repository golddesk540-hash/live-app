'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

interface ChatMessage {
  id: string;
  roomId: string;
  senderId?: string;
  senderNickname: string;
  senderAvatarUrl: string;
  senderRole?: 'host' | 'viewer' | 'admin' | 'vip';
  messageText: string;
  emoji?: string;
  fullText?: string;
  isPinned?: boolean;
  createdAt: string;
}

interface AudienceMember {
  id: string;
  nickname: string;
  poppoId: string;
  avatarUrl: string;
  wealthLevel: number;
  isFollowing: boolean;
  country: string;
  flag: string;
  badge?: string | null;
}

interface TopFan {
  rank: number;
  id: string;
  nickname: string;
  avatarUrl: string;
  coinsContributed: number;
  badge?: string | null;
  crownColor?: string | null;
}

const QUICK_EMOJIS = ['💕', '😊', '❤️', '👏', '🔥', '🎉', '✨', '👍', '🌹', '👑', '💃', '🎵'];

export default function LiveChatScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId') || '880219';
  const isPreview = searchParams.get('preview') === 'demo' || !searchParams.get('roomId') || roomId === '880219';

  const [activeTab, setActiveTab] = useState<'chat' | 'audience' | 'top_fans'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [audience, setAudience] = useState<AudienceMember[]>([]);
  const [topFans, setTopFans] = useState<TopFan[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [giftEffect, setGiftEffect] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastFetchedTimeRef = useRef<string | null>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Initial load & Polling messages
  useEffect(() => {
    let isMounted = true;

    async function fetchInitial() {
      try {
        const res = await fetch(`/api/live/chat/messages?roomId=${encodeURIComponent(roomId)}&preview=demo`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.messages) {
            setMessages(data.messages);
            if (data.messages.length > 0) {
              lastFetchedTimeRef.current = data.messages[data.messages.length - 1].createdAt;
            }
            setTimeout(() => scrollToBottom('auto'), 100);
          }
        }
      } catch (err) {
        console.error('Failed to fetch initial messages:', err);
      }
    }

    fetchInitial();

    // Poll for new messages every 2.5 seconds
    const interval = setInterval(async () => {
      if (!isMounted) return;
      try {
        const afterParam = lastFetchedTimeRef.current ? `&after=${encodeURIComponent(lastFetchedTimeRef.current)}` : '';
        const res = await fetch(`/api/live/chat/messages?roomId=${encodeURIComponent(roomId)}${afterParam}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.messages && data.messages.length > 0) {
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const newMsgs = data.messages.filter((m: ChatMessage) => !existingIds.has(m.id));
              if (newMsgs.length === 0) return prev;
              const combined = [...prev, ...newMsgs];
              lastFetchedTimeRef.current = combined[combined.length - 1].createdAt;
              setTimeout(() => scrollToBottom('smooth'), 50);
              return combined;
            });
          }
        }
      } catch (err) {
        // silent polling catch
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [roomId]);

  // Load audience & top-fans data on tab switch
  useEffect(() => {
    if (activeTab === 'audience' && audience.length === 0) {
      fetch(`/api/live/chat/audience?roomId=${encodeURIComponent(roomId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.audience) setAudience(data.audience);
        })
        .catch(console.error);
    } else if (activeTab === 'top_fans' && topFans.length === 0) {
      fetch(`/api/live/chat/top-fans?roomId=${encodeURIComponent(roomId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.topFans) setTopFans(data.topFans);
        })
        .catch(console.error);
    }
  }, [activeTab, roomId, audience.length, topFans.length]);

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend || isSending) return;

    if (textToSend.length > 300) {
      setErrorMessage('Message cannot exceed 300 characters.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    setIsSending(true);
    setErrorMessage(null);
    setShowEmojiPicker(false);

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      roomId,
      senderNickname: 'You',
      senderAvatarUrl: '/assets/studio/host_zara_avatar.png',
      senderRole: 'viewer',
      messageText: textToSend,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');
    setTimeout(() => scrollToBottom('smooth'), 50);

    try {
      const res = await fetch('/api/live/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          text: textToSend,
          senderNickname: 'You',
          senderAvatarUrl: '/assets/studio/host_zara_avatar.png',
          senderRole: 'viewer',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Replace optimistic message with real message
      if (data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? data.message : m))
        );
        lastFetchedTimeRef.current = data.message.createdAt;
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setErrorMessage(err.message || 'Could not send message.');
      setTimeout(() => setErrorMessage(null), 3500);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const triggerGiftReaction = () => {
    const reactions = ['🌹 Rose sent! +10 Coins', '🎁 Lucky Box opened!', '💎 Diamond gift sent!'];
    const randomReact = reactions[Math.floor(Math.random() * reactions.length)];
    setGiftEffect(randomReact);
    setTimeout(() => setGiftEffect(null), 2400);
  };

  return (
    <div className="min-h-screen bg-[#070814] text-white flex flex-col items-center justify-start antialiased selection:bg-pink-500 selection:text-white">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-[420px] min-h-screen bg-[#090b1c] flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-14 px-3 flex items-center justify-between border-b border-white/5 bg-[#0a0c22]/90 backdrop-blur sticky top-0 z-30">
          {/* Back Chevron */}
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Centered Poppo Live Logo */}
          <div className="flex items-center justify-center">
            <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1 font-sans">
              poppo <span className="text-[#a855f7] font-semibold text-base">Live</span>
            </span>
          </div>

          {/* Right Action: Scan/Frame Icon */}
          <button
            onClick={() => router.push(`/live/room/${roomId}`)}
            title="Return to stream video view"
            aria-label="View room video"
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m-2 12h2a2 2 0 002-2v-2" />
            </svg>
          </button>
        </header>

        {/* Tab Segmented Control */}
        <div className="px-4 pt-3 pb-2 bg-[#090b1c]">
          <div className="bg-[#14162e] rounded-full p-1 flex items-center justify-between border border-white/5">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 text-center ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-[#ff2a54] to-[#f43f5e] text-white shadow-md shadow-pink-500/25'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('audience')}
              className={`flex-1 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 text-center ${
                activeTab === 'audience'
                  ? 'bg-gradient-to-r from-[#ff2a54] to-[#f43f5e] text-white shadow-md shadow-pink-500/25'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Audience
            </button>
            <button
              onClick={() => setActiveTab('top_fans')}
              className={`flex-1 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 text-center ${
                activeTab === 'top_fans'
                  ? 'bg-gradient-to-r from-[#ff2a54] to-[#f43f5e] text-white shadow-md shadow-pink-500/25'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Top Fans
            </button>
          </div>
        </div>

        {/* Notification / Toast Banner */}
        {errorMessage && (
          <div className="mx-4 mt-2 px-3 py-1.5 bg-red-500/90 text-white text-xs rounded-lg text-center animate-pulse">
            {errorMessage}
          </div>
        )}

        {giftEffect && (
          <div className="mx-4 mt-2 px-4 py-2 bg-gradient-to-r from-pink-500/90 to-purple-600/90 text-white font-bold text-xs rounded-full text-center shadow-lg shadow-pink-500/40 animate-bounce">
            {giftEffect}
          </div>
        )}

        {/* MAIN BODY AREA */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* TAB 1: CHAT FEED */}
          {activeTab === 'chat' && (
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 custom-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-2.5 group">
                  {/* Sender Avatar */}
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/10 bg-slate-800">
                    <img
                      src={msg.senderAvatarUrl || '/assets/studio/host_zara_avatar.png'}
                      alt={msg.senderNickname}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).setAttribute('src', '/assets/studio/host_zara_avatar.png');
                      }}
                    />
                  </div>

                  {/* Message Bubble Line */}
                  <div className="flex-1 min-w-0 pt-0.5 leading-snug">
                    {msg.senderRole === 'host' && (
                      <span className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full mr-1.5 shadow-sm">
                        HOST
                      </span>
                    )}
                    <span className="text-[#a2a7be] font-medium text-[13px] sm:text-sm mr-1">
                      {msg.senderNickname}:
                    </span>
                    <span className="text-white text-[13px] sm:text-sm font-normal break-words">
                      {msg.messageText}
                    </span>
                    {msg.emoji && (
                      <span className="ml-1 text-sm inline-block">{msg.emoji}</span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} className="h-1" />
            </div>
          )}

          {/* TAB 2: AUDIENCE LIST */}
          {activeTab === 'audience' && (
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 custom-scrollbar">
              <div className="flex items-center justify-between pb-2 border-b border-white/5 text-xs text-white/60">
                <span>Viewers Online: <strong className="text-pink-400">7.6K</strong></span>
                <span>Active Rank</span>
              </div>
              {audience.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#13152c] border border-white/5 hover:border-pink-500/20 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={user.avatarUrl}
                      alt={user.nickname}
                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-semibold text-xs sm:text-sm">{user.nickname}</span>
                        <span>{user.flag}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="bg-gradient-to-r from-amber-400 to-yellow-600 text-[10px] font-bold px-1.5 py-0.2 rounded text-black">
                          Lv.{user.wealthLevel}
                        </span>
                        <span className="text-[11px] text-white/40">ID: {user.poppoId}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                      user.isFollowing
                        ? 'bg-white/10 text-white/70'
                        : 'bg-pink-500 text-white shadow-sm shadow-pink-500/20'
                    }`}
                  >
                    {user.isFollowing ? 'Followed' : '+ Follow'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: TOP FANS */}
          {activeTab === 'top_fans' && (
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 custom-scrollbar">
              <div className="flex items-center justify-between pb-2 border-b border-white/5 text-xs text-white/60">
                <span>Top Supporters Leaderboard</span>
                <span>💎 Total Gifts</span>
              </div>
              {topFans.map((fan) => (
                <div
                  key={fan.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                    fan.rank === 1
                      ? 'bg-gradient-to-r from-[#2a1e12] to-[#15172e] border-amber-500/40'
                      : fan.rank === 2
                      ? 'bg-[#161a32] border-slate-400/30'
                      : 'bg-[#13152c] border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 text-center font-bold text-sm">
                      {fan.rank === 1 ? '🥇' : fan.rank === 2 ? '🥈' : fan.rank === 3 ? '🥉' : `#${fan.rank}`}
                    </div>
                    <img
                      src={fan.avatarUrl}
                      alt={fan.nickname}
                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                    />
                    <div>
                      <span className="text-white font-semibold text-xs sm:text-sm block">{fan.nickname}</span>
                      <span className="text-[11px] text-pink-400 font-medium">
                        💎 {fan.coinsContributed.toLocaleString()} coins
                      </span>
                    </div>
                  </div>
                  {fan.badge && <span className="text-lg">{fan.badge}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Quick Emoji Popover Tray */}
          {showEmojiPicker && (
            <div className="absolute bottom-16 left-4 right-4 bg-[#161833] border border-white/10 rounded-2xl p-2.5 shadow-2xl z-20 backdrop-blur-md">
              <div className="text-[11px] text-white/50 mb-1.5 px-1 font-medium">Quick Emojis:</div>
              <div className="grid grid-cols-6 gap-2 text-center text-xl">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleInsertEmoji(emoji)}
                    className="p-1 hover:bg-white/10 rounded-lg transition active:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Chat Input Bar */}
          <div className="p-3 bg-[#0a0c20]/95 backdrop-blur border-t border-white/5">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              {/* Rounded Input Pill */}
              <div className="flex-1 flex items-center bg-[#171933] border border-white/10 rounded-full px-4 py-2 focus-within:border-pink-500/50 transition">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Say something..."
                  maxLength={300}
                  className="flex-1 bg-transparent text-white placeholder-white/40 text-xs sm:text-sm outline-none"
                />

                {/* Smiley Face Emoji Button */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  aria-label="Insert Emoji"
                  className="text-white/70 hover:text-white p-0.5 ml-1 transition hover:scale-110 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>

                {/* Send Button inside pill when typing */}
                {inputText.trim().length > 0 && (
                  <button
                    type="submit"
                    disabled={isSending}
                    aria-label="Send Message"
                    className="ml-2 w-6 h-6 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white text-xs font-bold hover:scale-105 active:scale-95 transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Pink Circular Gift Button */}
              <button
                type="button"
                onClick={triggerGiftReaction}
                title="Send Gift"
                aria-label="Send Gift"
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#ff2a54] to-[#ff638b] shadow-lg shadow-pink-500/30 flex items-center justify-center text-white flex-shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition"
              >
                <span className="text-xl">🎁</span>
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Banner matching reference: "4.5 Live Chat" */}
        <div className="h-9 bg-[#1a163a] border-t border-white/5 flex items-center justify-center">
          <span className="text-white/90 text-xs sm:text-[13px] font-medium tracking-wide">
            4.5 Live Chat
          </span>
        </div>

      </div>
    </div>
  );
}
