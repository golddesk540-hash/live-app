'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart,
  ThumbsUp,
  Flame,
  Gift,
  Send,
  Plus,
  Globe,
  ArrowLeft,
  MoreHorizontal,
  Smile,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  APPROVED_PK_REACTIONS,
  PKReactionType,
  PKReactionTarget,
  formatPKTime,
} from '@/lib/pk';

interface FloatingReactionItem {
  id: string;
  emoji: string;
  reactionType: PKReactionType;
  side: 'host_a' | 'host_b';
  x: number; // percentage from left
  size: number;
}

interface PKReactionsScreenProps {
  battleId?: string;
  currentUserId?: string;
  currentUserName?: string;
  onBack?: () => void;
  initialLanguage?: 'en' | 'ur';
}

export default function PKReactionsScreen({
  battleId = '00000000-0000-0000-0000-000000000603',
  currentUserId = 'user_viewer_9001',
  currentUserName = 'Ali',
  onBack,
  initialLanguage = 'en',
}: PKReactionsScreenProps) {
  const router = useRouter();
  const [lang, setLang] = useState<'en' | 'ur'>(initialLanguage);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReactionItem[]>([]);
  const [showReactionPanel, setShowReactionPanel] = useState(false);
  const [selectedTargetSide, setSelectedTargetSide] = useState<PKReactionTarget>('both');
  const [chatInput, setChatInput] = useState('');
  const [comments, setComments] = useState<Array<{ id: string; user: string; text: string }>>([
    { id: '1', user: 'Ali', text: 'Go Sara! 🔥' },
    { id: '2', user: 'Raza', text: 'Nice battle!' },
    { id: '3', user: 'Sana', text: '💖💖' },
  ]);

  const [counters, setCounters] = useState({
    total: 1256,
    hostA: 684,
    hostB: 572,
  });

  const [remainingSeconds, setRemainingSeconds] = useState(298); // 04:58 matching reference picture
  const isRtl = lang === 'ur';

  // 1. Fetch authorative initial reaction counters
  useEffect(() => {
    fetch(`/api/pk/battle/${battleId}/reaction/counters`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.counters) {
          setCounters({
            total: data.counters.total || counters.total,
            hostA: data.counters.hostA || counters.hostA,
            hostB: data.counters.hostB || counters.hostB,
          });
        }
      })
      .catch(() => {});
  }, [battleId]);

  // 2. Real-Time Countdown Timer Tick (04:58)
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. Connect to Real-time SSE Reactions Stream
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/pk/battle/${battleId}/reaction/events`);

      eventSource.addEventListener('pk:reaction_broadcast', (e) => {
        try {
          const update = JSON.parse(e.data);
          spawnFloatingAnimation(update.emoji, update.reactionType, update.targetHostSide);
        } catch {}
      });

      eventSource.addEventListener('pk:reaction_counter_updated', (e) => {
        try {
          const update = JSON.parse(e.data);
          setCounters({
            total: update.total,
            hostA: update.hostA,
            hostB: update.hostB,
          });
        } catch {}
      });
    } catch {}

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [battleId]);

  // Spawn visual floating emoji/heart animation
  const spawnFloatingAnimation = (
    emoji: string,
    reactionType: PKReactionType,
    targetSide: PKReactionTarget
  ) => {
    const side =
      targetSide === 'both' ? (Math.random() > 0.5 ? 'host_a' : 'host_b') : targetSide;
    const xBase = side === 'host_a' ? 25 : 75;
    const xOffset = (Math.random() - 0.5) * 30;
    const x = Math.max(10, Math.min(90, xBase + xOffset));

    const item: FloatingReactionItem = {
      id: Math.random().toString(36).substring(7),
      emoji,
      reactionType,
      side,
      x,
      size: Math.floor(Math.random() * 8) + 28, // 28px - 36px
    };

    setFloatingReactions((prev) => [...prev.slice(-25), item]);

    // Automatically remove after animation finishes (2.2s)
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== item.id));
    }, 2200);
  };

  // Send Reaction Action
  const handleSendReaction = async (reactionType: PKReactionType, emoji: string) => {
    // 1. Optimistic floating animation
    spawnFloatingAnimation(emoji, reactionType, selectedTargetSide);

    // Update local counter optimistically
    setCounters((prev) => ({
      total: prev.total + 1,
      hostA: selectedTargetSide === 'host_b' ? prev.hostA : prev.hostA + 1,
      hostB: selectedTargetSide === 'host_a' ? prev.hostB : prev.hostB + 1,
    }));

    // 2. Dispatch to backend
    try {
      await fetch(`/api/pk/battle/${battleId}/reaction/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reactionType,
          targetHostSide: selectedTargetSide,
          userId: currentUserId,
          userNickname: currentUserName,
        }),
      });
    } catch {}
  };

  // Ambient spontaneous floating hearts matching 06_08_reactions.png
  useEffect(() => {
    const ambientTimer = setInterval(() => {
      const items = ['❤️', '💖', '👍', '💕'];
      const pick = items[Math.floor(Math.random() * items.length)];
      const type: PKReactionType = pick === '👍' ? 'like' : 'heart';
      spawnFloatingAnimation(pick, type, 'host_b');
    }, 1800);
    return () => clearInterval(ambientTimer);
  }, []);

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setComments((prev) => [
      ...prev,
      { id: Date.now().toString(), user: currentUserName, text: chatInput.trim() },
    ]);
    setChatInput('');
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative w-full max-w-md mx-auto min-h-screen bg-[#070414] text-white flex flex-col justify-between overflow-hidden shadow-2xl font-sans select-none border-x border-[#231b3d]"
    >
      {/* 1. TOP HEADER (Sara Live vs Ayesha, Matching 06_08_reactions.png) */}
      <div className="relative z-30 pt-3 px-3 pb-2 bg-gradient-to-b from-[#140b2b] to-transparent flex items-center justify-between">
        {/* Host A (Left) */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80"
              alt="Sara Live"
              className="w-10 h-10 rounded-full object-cover border-2 border-[#ff2d78]"
            />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white leading-tight">Sara Live</h2>
            <div className="flex items-center gap-1 text-[11px] text-pink-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
              <span>32.5K</span>
            </div>
          </div>
        </div>

        {/* VS / Middle Status */}
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 text-white/40 flex items-center justify-center font-black text-[10px]">
            ⚔️
          </div>
        </div>

        {/* Host B (Right) */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <h2 className="text-sm font-extrabold text-white leading-tight">Ayesha</h2>
            <div className="flex items-center justify-end gap-1 text-[11px] text-cyan-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>28.7K</span>
            </div>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80"
              alt="Ayesha"
              className="w-10 h-10 rounded-full object-cover border-2 border-cyan-400"
            />
          </div>

          {/* Follow '+' Button */}
          <button className="w-7 h-7 rounded-full bg-gradient-to-r from-[#ff2d78] to-[#ec4899] flex items-center justify-center shadow-md hover:scale-105 transition-transform">
            <Plus className="w-4 h-4 text-white stroke-[3]" />
          </button>

          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/90 text-xs"
            title="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5 text-[#ff2d78]" />
          </button>
        </div>
      </div>

      {/* 2. PK SPLIT SCREEN (Exact Match to 06_08_reactions.png) */}
      <div className="relative z-10 w-full flex-1 flex flex-col justify-start">
        {/* Split Video Container */}
        <div className="relative w-full h-[360px] overflow-hidden bg-black flex">
          {/* Host A Video (Left) */}
          <div className="relative w-1/2 h-full border-r border-[#ff2d78]/30 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80"
              alt="Sara Live Stream"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Host B Video (Right) */}
          <div className="relative w-1/2 h-full overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80"
              alt="Ayesha Stream"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Top Center Timer: "PK 04:58" */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
            <div className="px-3 py-1 rounded-full bg-[#180a29]/90 border border-white/20 backdrop-blur-md flex items-center gap-1.5 shadow-lg">
              <span className="text-[11px] font-black text-[#ff2d78]">PK</span>
              <span className="text-xs font-mono font-bold text-white tracking-wider">
                {formatPKTime(remainingSeconds)}
              </span>
            </div>
          </div>

          {/* Bottom Score Bar (12,430 VS 9,870) */}
          <div className="absolute bottom-0 inset-x-0 z-20 h-9 flex items-center shadow-lg">
            {/* Host A Score (Left - Pink) */}
            <div className="flex-1 h-full bg-gradient-to-r from-[#ff2d78] to-[#ec4899] flex items-center px-3 font-extrabold text-sm text-white drop-shadow">
              <span>12,430</span>
            </div>

            {/* Fiery Center VS Badge */}
            <div className="relative z-30 -mx-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#ff4500] via-[#ff2d78] to-[#ff007f] text-white font-black text-xs tracking-tight shadow-[0_0_10px_#ff2d78] border border-white/70">
              VS
            </div>

            {/* Host B Score (Right - Blue) */}
            <div className="flex-1 h-full bg-gradient-to-r from-[#2563eb] to-[#06b6d4] flex items-center justify-end px-3 font-extrabold text-sm text-white drop-shadow">
              <span>9,870</span>
            </div>
          </div>
        </div>

        {/* 3. FLOATING REACTIONS ANIMATION LAYER (Over the video and chat, matching 06_08) */}
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {floatingReactions.map((item) => (
            <div
              key={item.id}
              className="absolute animate-float-reaction flex items-center justify-center filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
              style={{
                left: `${item.x}%`,
                bottom: '120px',
                fontSize: `${item.size}px`,
              }}
            >
              {item.reactionType === 'like' ? (
                <div className="w-9 h-9 rounded-full bg-[#3b82f6] flex items-center justify-center text-white shadow-md border-2 border-white/80">
                  <ThumbsUp className="w-5 h-5 fill-white text-white" />
                </div>
              ) : (
                <span>{item.emoji}</span>
              )}
            </div>
          ))}
        </div>

        {/* 4. LIVE CHAT COMMENTS & REACTION STREAM (Lower Area) */}
        <div className="relative z-20 flex-1 px-4 py-3 flex flex-col justify-end space-y-2 pointer-events-none">
          <div className="space-y-1.5 max-w-[280px]">
            {comments.slice(-4).map((c) => (
              <div
                key={c.id}
                className="px-3 py-1 rounded-full bg-black/45 backdrop-blur-sm border border-white/10 text-xs text-white/90 flex items-center gap-1.5 w-fit"
              >
                <span className="font-extrabold text-[#c084fc]">{c.user}:</span>
                <span className="font-medium text-white">{c.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. BOTTOM INTERACTION BAR (Chat Input + Gift + Reaction Trigger) */}
      <div className="relative z-30 px-3 py-2.5 bg-[#0f0722]/90 backdrop-blur-md border-t border-[#23173d] flex items-center gap-2">
        {/* Chat Input */}
        <form onSubmit={handleSendComment} className="flex-1 relative">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={isRtl ? 'کچھ کہئے...' : 'Say something...'}
            className="w-full bg-[#1b1035] border border-[#2e1d4d] rounded-full py-2 px-4 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#ff2d78]"
          />
        </form>

        {/* Gift Button */}
        <button
          className="w-9 h-9 rounded-full bg-gradient-to-r from-[#ff2d78] to-[#ec4899] flex items-center justify-center shadow-md hover:scale-105 transition-transform"
          title="Send Gift"
        >
          <Gift className="w-4 h-4 text-white" />
        </button>

        {/* Reaction Panel Toggle Button */}
        <button
          onClick={() => setShowReactionPanel(!showReactionPanel)}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            showReactionPanel
              ? 'bg-[#ff2d78] text-white shadow-[0_0_10px_#ff2d78]'
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title="Reactions"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* 6. POPUP EMOJI REACTION PANEL (10 Approved Catalog Reactions) */}
      {showReactionPanel && (
        <div className="relative z-40 px-3 py-3 bg-[#150d2b] border-t border-[#351b54] shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            {/* Target Host Side Selector */}
            <div className="flex items-center gap-1.5 text-[11px] font-bold">
              <span className="text-white/60">{isRtl ? 'ہدف:' : 'Target:'}</span>
              {(['both', 'host_a', 'host_b'] as PKReactionTarget[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTargetSide(t)}
                  className={`px-2 py-0.5 rounded-full transition-all ${
                    selectedTargetSide === t
                      ? 'bg-[#ff2d78] text-white'
                      : 'bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  {t === 'both' ? (isRtl ? 'دونوں' : 'Both') : t === 'host_a' ? 'Sara' : 'Ayesha'}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowReactionPanel(false)}
              className="text-white/50 hover:text-white text-xs p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 10 Reaction Emoji Grid */}
          <div className="grid grid-cols-5 gap-2">
            {APPROVED_PK_REACTIONS.map((r) => (
              <button
                key={r.id}
                onClick={() => handleSendReaction(r.id, r.emoji)}
                className="py-2 rounded-xl bg-white/5 hover:bg-[#ff2d78]/30 active:scale-90 transition-all flex flex-col items-center justify-center border border-white/5 hover:border-[#ff2d78]/50"
              >
                <span className="text-2xl leading-none select-none">{r.emoji}</span>
                <span className="text-[10px] text-white/60 mt-1 font-medium">
                  {isRtl ? r.labelUr : r.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 7. BOTTOM WATERMARK (Exact match to 06_08_reactions.png) */}
      <div className="relative z-30 py-3 px-4 flex justify-center bg-gradient-to-t from-[#070414] via-[#070414]/90 to-transparent">
        <div className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#831843] via-[#9d174d] to-[#be185d] text-white font-bold text-sm tracking-wide shadow-[0_4px_20px_rgba(190,24,93,0.4)] border border-pink-500/30">
          {isRtl ? '6.8 ری ایکشنز' : '6.8 Reactions'}
        </div>
      </div>

      {/* Custom Keyframe Styles for Natural Floating Animation */}
      <style jsx global>{`
        @keyframes floatReaction {
          0% {
            transform: translateY(0) scale(0.6);
            opacity: 0;
          }
          15% {
            opacity: 1;
            transform: translateY(-30px) scale(1.1);
          }
          50% {
            opacity: 0.95;
            transform: translateY(-110px) translateX(6px) scale(1);
          }
          80% {
            opacity: 0.8;
            transform: translateY(-190px) translateX(-6px) scale(0.95);
          }
          100% {
            opacity: 0;
            transform: translateY(-260px) translateX(4px) scale(0.85);
          }
        }
        .animate-float-reaction {
          animation: floatReaction 2.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
