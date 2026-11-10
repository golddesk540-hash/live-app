'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Heart,
  Gift,
  Send,
  Sparkles,
  Wifi,
  WifiOff,
  Flame,
  Globe,
  Plus,
  MoreHorizontal,
  Clock,
  Trophy,
  Shield,
  Volume2,
} from 'lucide-react';
import {
  PKBattleScoreTimerData,
  PKBattleComment,
  PKScoreEvent,
  formatPKTime,
  determinePKTimerState,
  calculatePKScoreRatios,
} from '@/lib/pk';
import PKResultScreen from '@/components/pk/PKResultScreen';

interface FloatingDelta {
  id: string;
  side: 'host_a' | 'host_b';
  points: number;
  x: number;
}

interface FloatingHeart {
  id: string;
  side: 'host_a' | 'host_b';
  left: number;
}

interface PKScoreTimerScreenProps {
  battleId?: string;
  currentUserId?: string;
  currentUserName?: string;
  isHost?: boolean;
  hostSide?: 'host_a' | 'host_b';
  onBack?: () => void;
  initialLanguage?: 'en' | 'ur';
}

export default function PKScoreTimerScreen({
  battleId = '00000000-0000-0000-0000-000000000603',
  currentUserId = 'user_viewer_9001',
  currentUserName = 'Ali',
  isHost = false,
  hostSide = 'host_a',
  onBack,
  initialLanguage = 'en',
}: PKScoreTimerScreenProps) {
  const [lang, setLang] = useState<'en' | 'ur'>(initialLanguage);
  const [battleData, setBattleData] = useState<PKBattleScoreTimerData | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(298);
  const [scoreA, setScoreA] = useState<number>(12430);
  const [scoreB, setScoreB] = useState<number>(9870);
  const [ratioA, setRatioA] = useState<number>(55.7);
  const [ratioB, setRatioB] = useState<number>(44.3);
  const [leadingSide, setLeadingSide] = useState<'host_a' | 'host_b' | 'tie'>('host_a');

  const [comments, setComments] = useState<PKBattleComment[]>([
    {
      id: 'c1',
      battleId,
      userId: 'user_ali_101',
      userName: 'Ali',
      content: 'Go Sara! 🔥',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'c2',
      battleId,
      userId: 'user_raza_102',
      userName: 'Raza',
      content: 'Nice battle!',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'c3',
      battleId,
      userId: 'user_sana_103',
      userName: 'Sana',
      content: '💕💕',
      createdAt: new Date().toISOString(),
    },
  ]);

  const [commentInput, setCommentInput] = useState('');
  const [floatingDeltas, setFloatingDeltas] = useState<FloatingDelta[]>([]);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [selectedSideForGift, setSelectedSideForGift] = useState<'host_a' | 'host_b'>('host_a');
  const [isSendingScore, setIsSendingScore] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const commentsEndRef = useRef<HTMLDivElement>(null);
  const isRtl = lang === 'ur';

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Fetch server-authoritative score and timer state
  const fetchBattleState = useCallback(async () => {
    try {
      const res = await fetch(`/api/pk/battle/${battleId}/score-timer`);
      if (res.ok) {
        const data: PKBattleScoreTimerData = await res.json();
        setBattleData(data);
        setRemainingSeconds(data.timer.remainingSeconds);
        setScoreA(data.hostA.score);
        setScoreB(data.hostB.score);
        setRatioA(data.ratioA);
        setRatioB(data.ratioB);
        setLeadingSide(data.leadingSide);
        if (data.recentComments && data.recentComments.length > 0) {
          setComments(data.recentComments);
        }
        setIsConnected(true);
      }
    } catch (err) {
      console.warn('PK battle state fetch error, retrying...', err);
      setIsConnected(false);
    }
  }, [battleId]);

  // Initial load
  useEffect(() => {
    fetchBattleState();
  }, [fetchBattleState]);

  // 2. Client-side authoritative clock interpolation
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. Periodic Server Resync (every 4 seconds) to guarantee zero clock drift
  useEffect(() => {
    const syncInterval = setInterval(() => {
      fetchBattleState();
    }, 4000);
    return () => clearInterval(syncInterval);
  }, [fetchBattleState]);

  // 4. SSE real-time stream listener for push updates
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/pk/battle/${battleId}/events`);
      eventSource.onopen = () => setIsConnected(true);
      eventSource.onerror = () => setIsConnected(false);

      eventSource.addEventListener('pk:timer_sync', (event: any) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload && typeof payload.remainingSeconds === 'number') {
            setRemainingSeconds(payload.remainingSeconds);
            setIsConnected(true);
          }
        } catch (e) {}
      });

      eventSource.addEventListener('pk:score_updated', (event: any) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload && typeof payload.scoreA === 'number') {
            setScoreA(payload.scoreA);
            setScoreB(payload.scoreB);
            setRatioA(payload.ratioA);
            setRatioB(payload.ratioB);
            setLeadingSide(payload.scoreA > payload.scoreB ? 'host_a' : payload.scoreB > payload.scoreA ? 'host_b' : 'tie');

            // Trigger floating animation
            if (payload.event) {
              triggerScoreDelta(payload.event.hostSide, payload.event.points);
            }
          }
        } catch (e) {}
      });

      eventSource.addEventListener('pk:result_calculated', (event: any) => {
        try {
          setShowResultModal(true);
        } catch (e) {}
      });

      eventSource.addEventListener('pk:battle_ended', () => {
        try {
          setShowResultModal(true);
        } catch (e) {}
      });
    } catch (e) {}

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [battleId]);

  // Scroll to bottom when comments arrive
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  // Floating score delta trigger
  const triggerScoreDelta = (side: 'host_a' | 'host_b', points: number) => {
    const id = `delta_${Date.now()}_${Math.random()}`;
    const x = side === 'host_a' ? 25 + Math.random() * 20 : 55 + Math.random() * 20;
    setFloatingDeltas((prev) => [...prev, { id, side, points, x }]);
    setTimeout(() => {
      setFloatingDeltas((prev) => prev.filter((d) => d.id !== id));
    }, 1800);
  };

  // Floating heart trigger
  const triggerHeart = (side: 'host_a' | 'host_b') => {
    const id = `heart_${Date.now()}_${Math.random()}`;
    const left = side === 'host_a' ? 20 + Math.random() * 20 : 60 + Math.random() * 20;
    setFloatingHearts((prev) => [...prev, { id, side, left }]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 2000);
  };

  // Submit Score Points via API
  const handleSendPoints = async (points: number, giftName: string) => {
    if (remainingSeconds <= 0) {
      showToast(lang === 'ur' ? 'مقابلہ ختم ہوچکا ہے، اسکور بند ہے!' : 'Battle time expired! Scores are locked.');
      return;
    }

    setIsSendingScore(true);
    const targetHostId =
      selectedSideForGift === 'host_a'
        ? battleData?.hostA.id || '00000000-0000-0000-0000-000000088201'
        : battleData?.hostB.id || '00000000-0000-0000-0000-000000088202';

    const idempotencyKey = `pk_gift_${battleId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    try {
      const res = await fetch(`/api/pk/battle/${battleId}/score/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostSide: selectedSideForGift,
          targetHostId,
          senderId: currentUserId,
          senderName: currentUserName,
          points,
          giftName,
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setScoreA(data.scoreA);
        setScoreB(data.scoreB);
        setRatioA(data.ratioA);
        setRatioB(data.ratioB);
        setLeadingSide(data.leadingSide);
        triggerScoreDelta(selectedSideForGift, points);
        setGiftModalOpen(false);
        showToast(
          lang === 'ur'
            ? `+${points.toLocaleString()} پوائنٹس بھیج دیے گئے!`
            : `+${points.toLocaleString()} points added to ${selectedSideForGift === 'host_a' ? 'Sara' : 'Ayesha'}!`
        );
      } else {
        showToast(data.error || 'Failed to send points');
      }
    } catch (err) {
      showToast('Network error sending score');
    } finally {
      setIsSendingScore(false);
    }
  };

  // Send Live Comment
  const handleSendComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentInput.trim()) return;

    const newCommentContent = commentInput.trim();
    setCommentInput('');

    try {
      const res = await fetch(`/api/pk/battle/${battleId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          userName: currentUserName,
          content: newCommentContent,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setComments((prev) => [...prev, data.comment]);
      }
    } catch (err) {
      // optimistic fallback
      setComments((prev) => [
        ...prev,
        {
          id: `opt_${Date.now()}`,
          battleId,
          userId: currentUserId,
          userName: currentUserName,
          content: newCommentContent,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const timerVisualState = determinePKTimerState(remainingSeconds);
  const formattedCountdown = formatPKTime(remainingSeconds);

  // Timer pill styling based on state
  const isUrgent = timerVisualState === 'warning_10s';
  const isWarning = timerVisualState === 'warning_60s';
  const isExpired = timerVisualState === 'time_expired';

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative w-full max-w-md mx-auto min-h-screen bg-[#0d091a] text-white flex flex-col justify-between overflow-hidden shadow-2xl font-sans select-none border-x border-[#231b3d]"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#180f2e] via-[#0d091a] to-[#080512] pointer-events-none" />

      {/* Floating Score Deltas */}
      {floatingDeltas.map((delta) => (
        <div
          key={delta.id}
          style={{ left: `${delta.x}%`, top: '42%' }}
          className="absolute z-50 pointer-events-none animate-float-up-fade font-black text-2xl tracking-wider drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
        >
          <span
            className={
              delta.side === 'host_a'
                ? 'text-[#ff2d78] bg-black/60 px-2.5 py-0.5 rounded-full border border-[#ff2d78]/50'
                : 'text-[#00c2ff] bg-black/60 px-2.5 py-0.5 rounded-full border border-[#00c2ff]/50'
            }
          >
            +{delta.points.toLocaleString()}
          </span>
        </div>
      ))}

      {/* Floating Hearts */}
      {floatingHearts.map((heart) => (
        <div
          key={heart.id}
          style={{ left: `${heart.left}%`, bottom: '15%' }}
          className="absolute z-50 pointer-events-none animate-float-heart text-[#ff2d78] drop-shadow-md"
        >
          <Heart className="w-7 h-7 fill-[#ff2d78]" />
        </div>
      ))}

      {/* Reconnection Status Banner */}
      {!isConnected && (
        <div className="absolute top-14 left-0 right-0 z-50 bg-amber-500/90 text-black px-4 py-1.5 text-xs font-bold text-center flex items-center justify-center gap-2 backdrop-blur-md">
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          <span>{isRtl ? 'دوبارہ منسلک ہو رہا ہے... اسکور محفوظ ہے' : 'Reconnecting to battle server... Synchronizing'}</span>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-[#251b42]/95 border border-[#ff2d78]/50 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg backdrop-blur-md animate-fade-in flex items-center gap-2 whitespace-nowrap">
          <Sparkles className="w-3.5 h-3.5 text-[#ff2d78]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER (Sara Live vs Ayesha) */}
      <div className="relative z-30 pt-3 pb-2 px-3.5 flex items-center justify-between">
        {/* Left Host: Sara Live */}
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1 -ml-1 text-white/70 hover:text-white transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80"
              alt="Sara Live"
              className="w-10 h-10 rounded-full object-cover border-2 border-[#a855f7] shadow-md"
            />
            <span className="absolute -bottom-1 -right-1 bg-[#ff2d78] text-[9px] font-black px-1 rounded-full text-white">
              PK
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-white drop-shadow">
                {isRtl ? 'سارہ لائیو' : 'Sara Live'}
              </span>
              <span className="text-xs">🇵🇰</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-white/80 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#ff2d78] inline-block"></span>
              <span>32.5K</span>
            </div>
          </div>
        </div>

        {/* Right Host: Ayesha + Follow Button */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              <span className="text-xs">🇵🇰</span>
              <span className="text-sm font-bold tracking-tight text-white drop-shadow">
                {isRtl ? 'عائشہ' : 'Ayesha'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-white/80 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#ff2d78] inline-block"></span>
              <span>28.7K</span>
            </div>
          </div>

          {/* Plus / Follow Button */}
          <button
            onClick={() => showToast(isRtl ? 'میزبان فالو کر لیا گیا!' : 'Host followed!')}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#ff2d78] to-[#ff5388] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            title="Follow"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Language Toggle Pill */}
          <button
            onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
            className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/90 border border-white/10 flex items-center gap-1"
            title="Toggle Language"
          >
            <Globe className="w-3 h-3 text-[#ff2d78]" />
            <span>{lang === 'en' ? 'اردو' : 'EN'}</span>
          </button>
        </div>
      </div>

      {/* MAIN BATTLE SPLIT CONTAINER */}
      <div className="relative z-20 flex-1 flex flex-col justify-start">
        {/* Split Video Frames */}
        <div className="relative w-full aspect-[4/3.3] flex overflow-hidden rounded-t-2xl shadow-2xl bg-black border-y border-[#302450]">
          {/* Host A Video Half (Left) */}
          <div className="relative w-1/2 h-full overflow-hidden bg-gradient-to-br from-[#2a133d] to-[#120822] flex items-center justify-center">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=85"
              alt="Sara Live Stream"
              className="w-full h-full object-cover"
            />
            {/* Live Camera Feed Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

            {/* Host Tag Overlay */}
            <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm text-[10px] text-white/90">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>ID: 88201</span>
            </div>
          </div>

          {/* Host B Video Half (Right) */}
          <div className="relative w-1/2 h-full overflow-hidden bg-gradient-to-br from-[#121c3d] to-[#081224] flex items-center justify-center">
            <img
              src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=85"
              alt="Ayesha Live Stream"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

            {/* Host Tag Overlay */}
            <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm text-[10px] text-white/90">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>ID: 88202</span>
            </div>
          </div>

          {/* Central Split Line Divider */}
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1.5px] bg-gradient-to-b from-transparent via-white/40 to-transparent z-20 pointer-events-none" />

          {/* BATTLE TIMER CAPSULE PILL (Centered Over Top Border) */}
          <div
            onClick={() => {
              if (isExpired || remainingSeconds === 0) {
                setShowResultModal(true);
              }
            }}
            className={`absolute top-2 left-1/2 -translate-x-1/2 z-30 ${
              isExpired || remainingSeconds === 0 ? 'cursor-pointer' : ''
            }`}
          >
            <div
              className={`flex items-center shadow-[0_4px_16px_rgba(0,0,0,0.6)] rounded-full overflow-hidden border ${
                isUrgent
                  ? 'border-red-500/80 animate-pulse scale-105'
                  : isWarning
                  ? 'border-amber-400/80'
                  : 'border-white/20'
              }`}
            >
              {/* PK Tag */}
              <div
                className={`px-3 py-1 font-black text-xs tracking-wider flex items-center gap-1 text-white ${
                  isUrgent
                    ? 'bg-gradient-to-r from-red-600 to-rose-600'
                    : isWarning
                    ? 'bg-gradient-to-r from-amber-600 to-orange-500'
                    : 'bg-gradient-to-r from-[#ff2d78] to-[#e61e68]'
                }`}
              >
                <span>PK</span>
              </div>

              {/* Countdown Digits */}
              <div
                className={`px-3 py-1 font-extrabold text-xs tracking-widest text-white backdrop-blur-md ${
                  isUrgent
                    ? 'bg-red-950/90 text-red-200'
                    : isWarning
                    ? 'bg-amber-950/90 text-amber-200'
                    : 'bg-[#1b1339]/90'
                }`}
              >
                <span>{formattedCountdown}</span>
              </div>
            </div>
          </div>
        </div>

        {/* AUTHORITATIVE CENTRAL SCORE COMPARISON BAR */}
        <div className="relative w-full h-11 flex items-stretch overflow-hidden shadow-xl z-20">
          {/* Host A Score Bar (Left - Neon Pink) */}
          <div
            style={{ width: `${ratioA}%` }}
            className="relative h-full bg-gradient-to-r from-[#e6005c] to-[#ff2d78] flex items-center justify-start pl-4 transition-all duration-500 ease-out"
          >
            <div className="flex items-center gap-1.5 text-white font-black text-lg tracking-tight drop-shadow-md">
              <span>{scoreA.toLocaleString()}</span>
              {leadingSide === 'host_a' && (
                <Flame className="w-4 h-4 text-amber-200 fill-amber-300 inline animate-bounce" />
              )}
            </div>
          </div>

          {/* Central Slanted VS Divider */}
          <div className="relative z-30 flex items-center justify-center -mx-3 pointer-events-none">
            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-[#ff2d78] to-[#0099ff] border-2 border-[#120822] shadow-lg">
              <span className="italic font-black text-white text-xs tracking-wider">Vs</span>
            </div>
          </div>

          {/* Host B Score Bar (Right - Electric Blue) */}
          <div
            style={{ width: `${ratioB}%` }}
            className="relative h-full bg-gradient-to-l from-[#0077ff] to-[#00aaff] flex items-center justify-end pr-4 transition-all duration-500 ease-out"
          >
            <div className="flex items-center gap-1.5 text-white font-black text-lg tracking-tight drop-shadow-md">
              {leadingSide === 'host_b' && (
                <Flame className="w-4 h-4 text-amber-200 fill-amber-300 inline animate-bounce" />
              )}
              <span>{scoreB.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* LIVE COMMENTS & AUDIENCE CHAT OVERLAY */}
        <div className="relative z-20 px-3.5 pt-3 pb-2 flex-1 flex flex-col justify-end max-h-[190px] overflow-y-auto space-y-1.5 scrollbar-none">
          {comments.slice(-6).map((comment) => (
            <div
              key={comment.id}
              className="flex items-center justify-between bg-black/40 hover:bg-black/55 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 transition-all w-fit max-w-[85%]"
            >
              <div className="flex items-center gap-2 text-xs">
                {/* User Avatar / Badge */}
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#6366f1] to-[#a855f7] flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                  {comment.userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white/90">{comment.userName}:</span>
                  <span className="text-white/85 font-medium">{comment.content}</span>
                </div>
              </div>
              <button className="text-white/40 hover:text-white/80 p-0.5 ml-2">
                <MoreHorizontal className="w-3 h-3" />
              </button>
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="relative z-30 px-3.5 py-2.5 bg-[#0f0b1f]/95 border-t border-[#231b3d] flex items-center gap-2">
        {/* Chat Input Pill */}
        <form onSubmit={handleSendComment} className="flex-1 flex items-center">
          <div className="relative w-full flex items-center">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder={isRtl ? 'کچھ کہیں...' : 'Say something...'}
              className="w-full bg-[#1e1738] hover:bg-[#251e44] focus:bg-[#251e44] text-xs text-white placeholder-white/40 px-3.5 py-2 rounded-full border border-white/10 focus:outline-none focus:border-[#ff2d78] transition-all"
            />
            {commentInput.trim() && (
              <button
                type="submit"
                className="absolute right-2 text-[#ff2d78] hover:text-[#ff5388] p-1"
                title="Send comment"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </form>

        {/* Gift Present Box Button */}
        <button
          onClick={() => setGiftModalOpen(true)}
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#ff2d78] to-[#ff5388] text-white flex items-center justify-center shadow-[0_2px_12px_rgba(255,45,120,0.5)] active:scale-90 transition-transform"
          title="Send Points / Gift"
        >
          <Gift className="w-5 h-5 fill-white/20 stroke-[2]" />
        </button>

        {/* Like Heart Button */}
        <button
          onClick={() => triggerHeart(leadingSide === 'host_b' ? 'host_b' : 'host_a')}
          className="w-10 h-10 rounded-full bg-[#1e1738] hover:bg-[#281f4a] border border-white/10 text-[#ff2d78] flex items-center justify-center shadow-md active:scale-90 transition-transform"
          title="Like"
        >
          <Heart className="w-5 h-5 fill-[#ff2d78]" />
        </button>
      </div>

      {/* BOTTOM WATERMARK BADGE (Exact match: "6.3 Score and Timer") */}
      <div className="relative z-30 px-4 pt-1 pb-3 flex justify-center bg-[#0d091a]">
        <div className="w-full py-2.5 rounded-2xl bg-[#8c1b64] text-white text-center font-extrabold text-sm tracking-wide shadow-lg border border-[#a82a7a]/50">
          <span>{isRtl ? '6.3 اسکور اور ٹائمر' : '6.3 Score and Timer'}</span>
        </div>
      </div>

      {/* QUICK GIFT / SCORE MODAL */}
      {giftModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end p-4 animate-fade-in">
          <div className="bg-[#18112c] rounded-2xl p-4 border border-[#3b2b5f] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-[#ff2d78]" />
                <h3 className="text-sm font-bold text-white">
                  {isRtl ? 'پوائنٹس بھیجیں (اسکور سسٹم)' : 'Send Battle Points'}
                </h3>
              </div>
              <button
                onClick={() => setGiftModalOpen(false)}
                className="text-white/60 hover:text-white text-xs px-2 py-1 rounded-md bg-white/5"
              >
                ✕
              </button>
            </div>

            {/* Select Host Target */}
            <div>
              <label className="text-[11px] font-semibold text-white/70 mb-1.5 block">
                {isRtl ? 'میزبان منتخب کریں:' : 'Select Target Host:'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSideForGift('host_a')}
                  className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${
                    selectedSideForGift === 'host_a'
                      ? 'border-[#ff2d78] bg-[#ff2d78]/20 shadow-md'
                      : 'border-white/10 bg-[#21183c]'
                  }`}
                >
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                    alt="Sara"
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <div className="text-left">
                    <div className="text-xs font-bold text-white">Sara Live</div>
                    <div className="text-[10px] text-[#ff2d78] font-semibold">{scoreA.toLocaleString()} pts</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSideForGift('host_b')}
                  className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${
                    selectedSideForGift === 'host_b'
                      ? 'border-[#00c2ff] bg-[#00c2ff]/20 shadow-md'
                      : 'border-white/10 bg-[#21183c]'
                  }`}
                >
                  <img
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80"
                    alt="Ayesha"
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <div className="text-left">
                    <div className="text-xs font-bold text-white">Ayesha</div>
                    <div className="text-[10px] text-[#00c2ff] font-semibold">{scoreB.toLocaleString()} pts</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Point Bundles */}
            <div className="grid grid-cols-3 gap-2">
              <button
                disabled={isSendingScore}
                onClick={() => handleSendPoints(100, 'Rose')}
                className="p-3 rounded-xl bg-[#231b40] hover:bg-[#2e2354] border border-white/10 text-center space-y-1 active:scale-95 transition-all"
              >
                <div className="text-lg">🌹</div>
                <div className="text-xs font-bold text-white">+100</div>
                <div className="text-[10px] text-white/50">Rose</div>
              </button>

              <button
                disabled={isSendingScore}
                onClick={() => handleSendPoints(500, 'Diamond Star')}
                className="p-3 rounded-xl bg-[#231b40] hover:bg-[#2e2354] border border-[#ff2d78]/40 text-center space-y-1 active:scale-95 transition-all shadow-md"
              >
                <div className="text-lg">⭐</div>
                <div className="text-xs font-bold text-[#ff2d78]">+500</div>
                <div className="text-[10px] text-white/50">Star</div>
              </button>

              <button
                disabled={isSendingScore}
                onClick={() => handleSendPoints(1000, 'Super Rocket')}
                className="p-3 rounded-xl bg-[#231b40] hover:bg-[#2e2354] border border-cyan-400/40 text-center space-y-1 active:scale-95 transition-all shadow-md"
              >
                <div className="text-lg">🚀</div>
                <div className="text-xs font-bold text-cyan-400">+1,000</div>
                <div className="text-[10px] text-white/50">Rocket</div>
              </button>
            </div>

            <div className="text-center text-[10px] text-white/40">
              {isRtl
                ? 'تمام پوائنٹس سرور پر توثیق شدہ اور ڈپلیکیٹ محفوظ ہیں۔'
                : 'Server-authoritative scoring with deduplication.'}
            </div>
          </div>
        </div>
      )}

      {/* RESULT MODAL (Module 6.4: PK Battle Result) */}
      {showResultModal && (
        <div className="absolute inset-0 z-50 animate-fade-in bg-black">
          <PKResultScreen
            battleId={battleId}
            onClose={() => setShowResultModal(false)}
            initialLanguage={lang}
          />
        </div>
      )}
    </div>
  );
}
