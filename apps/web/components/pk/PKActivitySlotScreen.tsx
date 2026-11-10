'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  Gift,
  Coins,
  Clock,
  Globe,
  ArrowLeft,
  Flame,
  Swords,
  Users,
  Eye,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Play,
} from 'lucide-react';
import { PKActivitySlot, formatActivityCountdown } from '@/lib/pk';

interface PKActivitySlotScreenProps {
  activityId?: string;
  initialActivity?: PKActivitySlot | null;
  onBack?: () => void;
  initialLanguage?: 'en' | 'ur';
}

export default function PKActivitySlotScreen({
  activityId = '00000000-0000-0000-0000-000000000607',
  initialActivity,
  onBack,
  initialLanguage = 'en',
}: PKActivitySlotScreenProps) {
  const router = useRouter();
  const [lang, setLang] = useState<'en' | 'ur'>(initialLanguage);
  const [activity, setActivity] = useState<PKActivitySlot | null>(initialActivity || null);
  const [linkedBattles, setLinkedBattles] = useState<any[]>([]);
  const [loading, setLoading] = useState(!initialActivity);
  const [joining, setJoining] = useState(false);
  const [isSuccessJoined, setIsSuccessJoined] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const isRtl = lang === 'ur';

  // 1. Fetch Authoritative Activity Data
  const fetchActivity = async () => {
    try {
      const res = await fetch(`/api/pk/activities/${activityId}`);
      const data = await res.json();
      if (data.success && data.activity) {
        setActivity(data.activity);
        setLinkedBattles(data.linkedBattles || []);
      }
    } catch (err) {
      console.error('Error fetching activity details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialActivity) {
      fetchActivity();
    }
  }, [activityId, initialActivity]);

  // 2. Real-Time Countdown Tick
  useEffect(() => {
    const timer = setInterval(() => {
      setActivity((prev) => {
        if (!prev || prev.remainingSeconds <= 0) return prev;
        const newSeconds = prev.remainingSeconds - 1;
        return {
          ...prev,
          remainingSeconds: newSeconds,
          formattedCountdown: formatActivityCountdown(newSeconds, isRtl),
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRtl]);

  // 3. Real-Time SSE Listener
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/pk/activities/events');
      eventSource.addEventListener('pk:activity_updated', (e) => {
        try {
          const update = JSON.parse(e.data);
          if (update.activityId === activityId) {
            setActivity((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                currentBattles: update.currentBattles ?? prev.currentBattles,
                targetBattles: update.targetBattles ?? prev.targetBattles,
                status: update.status ?? prev.status,
                progressPercentage: Math.min(
                  100,
                  Math.round(((update.currentBattles ?? prev.currentBattles) / (update.targetBattles ?? prev.targetBattles)) * 100)
                ),
              };
            });
          }
        } catch {}
      });
    } catch {}

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [activityId]);

  // Handle "Join Now" Action
  const handleJoinNow = async () => {
    setJoining(true);
    try {
      const res = await fetch('/api/pk/activities/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId,
          incrementBy: 1,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsSuccessJoined(true);
        setActivity((prev) =>
          prev
            ? {
                ...prev,
                currentBattles: data.completedBattles,
                progressPercentage: data.progressPercentage,
                isCompleted: data.isCompleted,
              }
            : prev
        );
        setTimeout(() => {
          setIsSuccessJoined(false);
          // Redirect to Starting a Battle Screen (Module 6.2)
          router.push('/pk/start');
        }, 1200);
      }
    } catch (err) {
      console.error('Join activity error:', err);
    } finally {
      setJoining(false);
    }
  };

  const currentBattles = activity?.currentBattles ?? 0;
  const targetBattles = activity?.targetBattles ?? 3;
  const progressPct = Math.min(100, Math.round((currentBattles / targetBattles) * 100));

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative w-full max-w-md mx-auto min-h-screen bg-[#0b071a] text-white flex flex-col justify-between overflow-x-hidden shadow-2xl font-sans select-none border-x border-[#231b3d]"
    >
      {/* Background Ambience with Radiant Purple / Pink Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1c0d38] via-[#0b071a] to-[#070412] pointer-events-none" />

      {/* TOP HEADER */}
      <div className="relative z-30 pt-4 px-4 pb-2 flex items-center justify-between">
        {onBack ? (
          <button
            onClick={onBack}
            className="p-1.5 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <Link
            href="/pk"
            className="p-1.5 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10"
            title="Back to Discovery"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        )}

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#ff2d78]/20 text-[#ff2d78] border border-[#ff2d78]/30 flex items-center gap-1">
            <Flame className="w-3 h-3 fill-[#ff2d78]" />
            <span>{isRtl ? 'سرگرمی فعال' : 'Active Event'}</span>
          </span>
        </div>

        {/* Language Switcher */}
        <button
          onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
          className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 flex items-center gap-1 shadow-sm"
          title="Toggle Language"
        >
          <Globe className="w-3.5 h-3.5 text-[#ff2d78]" />
          <span>{lang === 'en' ? 'اردو' : 'EN'}</span>
        </button>
      </div>

      {/* MAIN ACTIVITY CARD SECTION (Exact match to 06_07_activity_slot.png) */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-5 py-4">
        {/* HERO TROPHY GRAPHIC WITH RADIANT PURPLE GLOW */}
        <div className="relative flex flex-col items-center mb-2">
          {/* Radiant Sunburst Nebula */}
          <div className="absolute -top-12 w-64 h-64 rounded-full bg-gradient-to-r from-[#9333ea]/35 via-[#ec4899]/30 to-[#9333ea]/35 blur-3xl pointer-events-none" />

          {/* Ambient Background Text (PK Activity watermark effect in reference image) */}
          <div className="relative flex items-center justify-center select-none opacity-40 mb-1">
            <span className="text-2xl font-black text-[#c084fc] tracking-widest uppercase drop-shadow-[0_0_12px_#c084fc]">
              PK Activity
            </span>
          </div>

          {/* Golden Trophy Vector Graphic with 3D Bevel & Radiant Glow */}
          <div className="relative z-10 w-24 h-24 flex items-center justify-center drop-shadow-[0_8px_25px_rgba(245,158,11,0.6)]">
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 p-1 flex items-center justify-center shadow-inner">
              <div className="w-full h-full rounded-full bg-gradient-to-b from-[#3b0764] to-[#1e0734] flex items-center justify-center">
                <Trophy className="w-12 h-12 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.9)] animate-bounce" />
              </div>
            </div>
            {/* Sparkles around trophy */}
            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-300 animate-pulse fill-yellow-300" />
            <Sparkles className="absolute bottom-2 -left-2 w-4 h-4 text-amber-300 animate-pulse fill-amber-300" />
          </div>
        </div>

        {/* TITLE & SUBTITLE (Exact text from 06_07_activity_slot.png) */}
        <div className="text-center mt-1 mb-4 space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-md">
            {isRtl ? activity?.titleUr || 'پی کے سرگرمی' : activity?.title || 'PK Activity'}
          </h1>
          <h2 className="text-sm font-extrabold text-white/95">
            {isRtl ? activity?.subtitleUr || 'روزانہ پی کے چیلنج' : activity?.subtitle || 'Daily PK Challenge'}
          </h2>
          <p className="text-xs text-white/60 font-medium max-w-xs mx-auto">
            {isRtl
              ? activity?.descriptionUr || 'پی کے مقابلوں میں حصہ لیں اور انعامات جیتیں!'
              : activity?.description || 'Join PK battles and win rewards!'}
          </p>
        </div>

        {/* PROGRESS BAR SECTION: "0 / 3 Battles" */}
        <div className="w-full max-w-xs space-y-2 mb-5">
          <div className="flex items-center justify-between text-xs font-bold text-white/80 px-1">
            <span>{isRtl ? `${targetBattles} / ${currentBattles} مقابلے` : `${currentBattles} / ${targetBattles} Battles`}</span>
            {activity?.formattedCountdown && (
              <span className="text-[11px] text-[#ff2d78] flex items-center gap-1 font-semibold">
                <Clock className="w-3 h-3" />
                {activity.formattedCountdown}
              </span>
            )}
          </div>

          {/* Glowing Neon Pill Progress Track */}
          <div className="w-full h-3.5 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/15 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#ff2d78] via-[#ec4899] to-[#f43f5e] shadow-[0_0_12px_rgba(255,45,120,0.8)] transition-all duration-500"
              style={{ width: `${Math.max(8, progressPct)}%` }}
            />
          </div>
        </div>

        {/* REWARDS SECTION (Matching 06_07_activity_slot.png) */}
        <div className="w-full max-w-xs space-y-2.5 mb-6">
          <h3 className="text-center text-xs font-bold text-white/70 uppercase tracking-wider">
            {isRtl ? 'انعامات' : 'Rewards'}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {/* Reward Card 1: +50 Points */}
            <div className="bg-[#18112c]/90 border border-[#2e1d4d] rounded-2xl p-3.5 flex flex-col items-center justify-center text-center shadow-lg hover:border-[#ff2d78]/50 transition-all">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center mb-2 border border-pink-500/30">
                <Gift className="w-6 h-6 text-[#ff2d78]" />
              </div>
              <span className="text-sm font-extrabold text-white">
                {isRtl ? `+${activity?.rewardPoints || 50} پوائنٹس` : `+${activity?.rewardPoints || 50} Points`}
              </span>
            </div>

            {/* Reward Card 2: +100 Coins */}
            <div className="bg-[#18112c]/90 border border-[#2e1d4d] rounded-2xl p-3.5 flex flex-col items-center justify-center text-center shadow-lg hover:border-yellow-400/50 transition-all">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center mb-2 border border-amber-500/30">
                <Coins className="w-6 h-6 text-yellow-400" />
              </div>
              <span className="text-sm font-extrabold text-white">
                {isRtl ? `+${activity?.rewardCoins || 100} سکے` : `+${activity?.rewardCoins || 100} Coins`}
              </span>
            </div>
          </div>
        </div>

        {/* CTA BUTTON: "Join Now" (Exact match to 06_07_activity_slot.png) */}
        <div className="w-full max-w-xs space-y-2">
          <button
            onClick={handleJoinNow}
            disabled={joining || isSuccessJoined}
            className={`w-full py-3.5 rounded-full font-black text-sm tracking-wide transition-all duration-300 shadow-[0_4px_25px_rgba(255,45,120,0.5)] flex items-center justify-center gap-2 ${
              isSuccessJoined
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-[#ff2d78] to-[#ec4899] hover:opacity-95 text-white active:scale-95'
            }`}
          >
            {joining ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isSuccessJoined ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{isRtl ? 'شامل ہو گئے!' : 'Joined Successfully!'}</span>
              </>
            ) : (
              <span>{isRtl ? 'ابھی شامل ہوں' : 'Join Now'}</span>
            )}
          </button>

          {/* Secondary Details Toggle */}
          <button
            onClick={() => setShowDetailsModal(true)}
            className="w-full text-center text-[11px] text-white/50 hover:text-white/80 transition-colors py-1 flex items-center justify-center gap-1"
          >
            <span>{isRtl ? 'سرگرمی کی تفصیلات اور منسلک مقابلے دیکھیں' : 'View Activity Details & Linked Battles'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* DETAILS MODAL / DRAWER */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-[#140c28] border border-[#3b1d5e] w-full max-w-md rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-extrabold text-base text-white flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span>{isRtl ? 'سرگرمی کی تفصیلات' : 'Activity Details'}</span>
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-white/60 hover:text-white text-xs px-2 py-1 bg-white/10 rounded-full"
              >
                ✕
              </button>
            </div>

            {/* Description */}
            <div className="text-xs text-white/70 space-y-1">
              <p className="font-semibold text-white">
                {isRtl ? activity?.subtitleUr : activity?.subtitle}
              </p>
              <p>{isRtl ? activity?.descriptionUr : activity?.description}</p>
            </div>

            {/* Linked Active Battles */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white/80 uppercase">
                {isRtl ? 'منسلک پی کے مقابلے' : 'Linked PK Battles'}
              </h4>

              {linkedBattles.length === 0 ? (
                <div className="p-3 bg-white/5 rounded-xl text-center text-xs text-white/40">
                  {isRtl ? 'کوئی منسلک مقابلہ نہیں ملا' : 'No linked battles active right now'}
                </div>
              ) : (
                linkedBattles.map((b) => (
                  <div
                    key={b.id}
                    className="p-2.5 bg-[#1b1035] rounded-xl border border-white/10 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Swords className="w-4 h-4 text-[#ff2d78]" />
                      <div>
                        <p className="font-bold text-white">
                          {b.host_a_nickname} vs {b.host_b_nickname}
                        </p>
                        <p className="text-[10px] text-white/50">
                          {b.host_a_score} pts • {b.viewer_count || 0} viewers
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/pk/battle/${b.id}`}
                      className="px-2.5 py-1 bg-[#ff2d78] text-white rounded-full font-bold text-[10px] flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>{isRtl ? 'دیکھیں' : 'Watch'}</span>
                    </Link>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowDetailsModal(false)}
              className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold"
            >
              {isRtl ? 'بند کریں' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM WATERMARK (Exact match to 06_07_activity_slot.png) */}
      <div className="relative z-30 py-4 px-4 flex justify-center bg-gradient-to-t from-[#090514] via-[#090514]/90 to-transparent">
        <div className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#831843] via-[#9d174d] to-[#be185d] text-white font-bold text-sm tracking-wide shadow-[0_4px_20px_rgba(190,24,93,0.4)] border border-pink-500/30">
          {isRtl ? '6.7 ایکٹیویٹی سلاٹ' : '6.7 Activity Slot'}
        </div>
      </div>
    </div>
  );
}
