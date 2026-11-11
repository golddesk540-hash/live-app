'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Bell,
  Coins,
  Crown,
  Gift,
  Globe2,
  RefreshCw,
  ShieldAlert,
  Sliders,
  Sparkles,
  Swords,
  Volume2,
  VolumeX,
  Wifi,
} from 'lucide-react';
import type {
  AnimationPriorityConfigItem,
  AnimationQueueItem,
  GiftAnimationConfigItem,
  HostEntranceEffectItem,
  HostEntranceEligibility,
  UserAnimationPreferences,
} from '@/lib/animations';
import AnimationStageOverlay from './AnimationStageOverlay';
import AnimationSettingsModal from './AnimationSettingsModal';

const DEFAULT_PK_ID = '00000000-0000-0000-0000-000000000606';
const DEFAULT_ROOM_ID = '880219';
const SARA_HOST_ID = '00000000-0000-0000-0000-000000088201';
const AYESHA_HOST_ID = '00000000-0000-0000-0000-000000088202';
const ORDINARY_USER_ID = 'user_wallet_demo_701';

const DEFAULT_PREFS: UserAnimationPreferences = {
  userId: ORDINARY_USER_ID,
  enableLargeAnimations: true,
  enableSoundEffects: true,
  reduceAnimations: false,
  respectDeviceReducedMotion: true,
  updatedAt: '',
};

export default function AnimationsAndEntrancesScreen({
  initialPkBattleId = DEFAULT_PK_ID,
  initialRoomId = DEFAULT_ROOM_ID,
  previewDemo = true,
}: {
  initialPkBattleId?: string;
  initialRoomId?: string;
  previewDemo?: boolean;
}) {
  const [lang, setLang] = useState<'en' | 'ur'>('en');
  const isUrdu = lang === 'ur';

  const [stageMode, setStageMode] = useState<'pk' | 'live'>('pk');
  const [pkSideTarget, setPkSideTarget] = useState<'host_a' | 'host_b'>('host_a');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const [stageData, setStageData] = useState<any>(null);
  const [giftAnimations, setGiftAnimations] = useState<GiftAnimationConfigItem[]>([]);
  const [entranceEffects, setEntranceEffects] = useState<HostEntranceEffectItem[]>([]);
  const [priorityConfigs, setPriorityConfigs] = useState<AnimationPriorityConfigItem[]>([]);
  const [hostEligibility, setHostEligibility] = useState<HostEntranceEligibility | null>(null);
  const [preferences, setPreferences] = useState<UserAnimationPreferences>(DEFAULT_PREFS);

  const [activeAnimations, setActiveAnimations] = useState<AnimationQueueItem[]>([]);
  const [queuedAnimations, setQueuedAnimations] = useState<AnimationQueueItem[]>([]);
  const [activeEntrances, setActiveEntrances] = useState<AnimationQueueItem[]>([]);
  const [pkScoreA, setPkScoreA] = useState<number>(12500);
  const [pkScoreB, setPkScoreB] = useState<number>(8840);
  const [senderCoins, setSenderCoins] = useState<number | null>(null);

  const [sseConnected, setSseConnected] = useState(false);
  const [reconnectSeq, setReconnectSeq] = useState(0);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const seenQueueIdsRef = useRef<Set<string>>(new Set());

  const activeScope =
    stageMode === 'pk'
      ? `pk:${initialPkBattleId}`
      : `room:${stageData?.liveRoomId || initialRoomId}`;

  const loadConfig = useCallback(async () => {
    try {
      const qs =
        stageMode === 'pk'
          ? `pkBattleId=${encodeURIComponent(initialPkBattleId)}&hostUserId=${SARA_HOST_ID}`
          : `roomId=${encodeURIComponent(initialRoomId)}`;
      const res = await fetch(
        `/api/animations/config?${qs}&userId=${ORDINARY_USER_ID}&preview=${previewDemo ? 'demo' : '0'}`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      if (!data.success) return;

      setStageData(data.stage || null);
      setGiftAnimations(data.catalog?.giftAnimations || []);
      setEntranceEffects(data.catalog?.entranceEffects || []);
      setPriorityConfigs(data.catalog?.priorityConfigs || []);
      setHostEligibility(data.hostEligibility || null);

      if (data.stateSync) {
        if (data.stateSync.preferences) setPreferences(data.stateSync.preferences);
        if (data.stateSync.pkScores) {
          setPkScoreA(data.stateSync.pkScores.hostAScore);
          setPkScoreB(data.stateSync.pkScores.hostBScore);
        }
        const playing: AnimationQueueItem[] = data.stateSync.activeAnimations || [];
        setActiveAnimations(playing.filter((a) => a.eventCategory === 'gift'));
        setActiveEntrances(playing.filter((a) => a.eventCategory === 'host_entrance'));
        setQueuedAnimations(data.stateSync.queuedAnimations || []);
      }

      // Read-only balance snapshot from Module 7.3 context
      const ctxRes = await fetch(
        `/api/gifts/send/context?${
          stageMode === 'pk' ? `pkBattleId=${initialPkBattleId}` : `roomId=${initialRoomId}`
        }&userId=${ORDINARY_USER_ID}&preview=demo`,
        { cache: 'no-store' }
      ).catch(() => null);
      if (ctxRes?.ok) {
        const ctxJson = await ctxRes.json();
        if (typeof ctxJson?.senderWallet?.availableCoins === 'number') {
          setSenderCoins(ctxJson.senderWallet.availableCoins);
        }
      }
    } catch {}
  }, [stageMode, initialPkBattleId, initialRoomId, previewDemo]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // SSE subscription supporting state sync, deduplication, and reconnect recovery
  useEffect(() => {
    const scopeParam =
      stageMode === 'pk'
        ? `pkBattleId=${encodeURIComponent(initialPkBattleId)}`
        : `roomId=${encodeURIComponent(initialRoomId)}`;
    const es = new EventSource(
      `/api/animations/events?${scopeParam}&userId=${ORDINARY_USER_ID}&preview=${
        previewDemo ? 'demo' : '0'
      }&r=${reconnectSeq}`
    );

    es.onopen = () => setSseConnected(true);
    es.onerror = () => setSseConnected(false);

    const handleStart = (ev: any) => {
      try {
        const item: AnimationQueueItem = JSON.parse(ev.data);
        if (!item?.queueId || seenQueueIdsRef.current.has(`play_${item.queueId}`)) return;
        seenQueueIdsRef.current.add(`play_${item.queueId}`);

        if (item.eventCategory === 'host_entrance') {
          setActiveEntrances((prev) =>
            prev.some((x) => x.queueId === item.queueId) ? prev : [item, ...prev].slice(0, 2)
          );
        } else {
          setActiveAnimations((prev) =>
            prev.some((x) => x.queueId === item.queueId) ? prev : [...prev, item].slice(-3)
          );
        }
      } catch {}
    };

    es.addEventListener('animation:state_sync', (ev: any) => {
      try {
        const sync = JSON.parse(ev.data);
        setSseConnected(true);
        const playing: AnimationQueueItem[] = sync.activeAnimations || [];
        setActiveAnimations(playing.filter((a) => a.eventCategory === 'gift'));
        setActiveEntrances(playing.filter((a) => a.eventCategory === 'host_entrance'));
        setQueuedAnimations(sync.queuedAnimations || []);
        if (sync.preferences) setPreferences(sync.preferences);
        if (sync.pkScores) {
          setPkScoreA(sync.pkScores.hostAScore);
          setPkScoreB(sync.pkScores.hostBScore);
        }
      } catch {}
    });

    es.addEventListener('animation:gift_received', (ev: any) => {
      try {
        const payload = JSON.parse(ev.data);
        if (payload.pkScores) {
          setPkScoreA(payload.pkScores.hostAScore);
          setPkScoreB(payload.pkScores.hostBScore);
        }
      } catch {}
    });

    es.addEventListener('animation:gift_started', handleStart);
    es.addEventListener('animation:host_entrance', handleStart);

    es.addEventListener('animation:gift_completed', (ev: any) => {
      try {
        const payload = JSON.parse(ev.data);
        setActiveAnimations((prev) => prev.filter((a) => a.queueId !== payload.queueId));
      } catch {}
    });

    es.addEventListener('animation:host_entrance_completed', (ev: any) => {
      try {
        const payload = JSON.parse(ev.data);
        setActiveEntrances((prev) => prev.filter((a) => a.queueId !== payload.queueId));
      } catch {}
    });

    es.addEventListener('animation:gift_queue_updated', (ev: any) => {
      try {
        const payload = JSON.parse(ev.data);
        if (Array.isArray(payload.playing)) {
          const playing: AnimationQueueItem[] = payload.playing;
          setActiveAnimations(playing.filter((a) => a.eventCategory === 'gift'));
          setActiveEntrances(playing.filter((a) => a.eventCategory === 'host_entrance'));
        }
        if (Array.isArray(payload.queued)) {
          setQueuedAnimations(payload.queued);
        }
      } catch {}
    });

    return () => {
      setSseConnected(false);
      es.close();
    };
  }, [stageMode, initialPkBattleId, initialRoomId, previewDemo, reconnectSeq]);

  const handleCompletePlayback = useCallback(async (queueId: string) => {
    setActiveAnimations((prev) => prev.filter((a) => a.queueId !== queueId));
    setActiveEntrances((prev) => prev.filter((a) => a.queueId !== queueId));
    try {
      await fetch('/api/animations/gift/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueId }),
      });
    } catch {}
  }, []);

  // Send a real gift via Module 7.3 -> automatically triggers Module 7.4 animation queue
  const handleSendRealGift = async (giftId: string, quantity = 1) => {
    setBusyAction(`gift_${giftId}`);
    setNotice(null);
    try {
      const targetHost =
        stageMode === 'pk'
          ? pkSideTarget === 'host_b'
            ? stageData?.hosts?.[1]?.hostId || AYESHA_HOST_ID
            : stageData?.hosts?.[0]?.hostId || SARA_HOST_ID
          : stageData?.hosts?.[0]?.hostId || SARA_HOST_ID;

      const res = await fetch('/api/gifts/send?preview=demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `anim_demo_${giftId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        },
        body: JSON.stringify({
          senderUserId: ORDINARY_USER_ID,
          senderNickname: 'Sunny',
          recipientHostId: targetHost,
          giftId,
          quantity,
          ...(stageMode === 'pk' ? { pkBattleId: initialPkBattleId } : { roomId: initialRoomId }),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setNotice({
          type: 'err',
          text: data.message || data.error || 'Gift send declined (no animation played).',
        });
        return;
      }
      if (typeof data.updatedSenderWallet?.availableCoins === 'number') {
        setSenderCoins(data.updatedSenderWallet.availableCoins);
      }
      if (typeof data.updatedHostStats?.pkHostAScore === 'number') {
        setPkScoreA(data.updatedHostStats.pkHostAScore);
      }
      if (typeof data.updatedHostStats?.pkHostBScore === 'number') {
        setPkScoreB(data.updatedHostStats.pkHostBScore);
      }
      setNotice({
        type: 'ok',
        text: isUrdu
          ? `${data.transaction?.giftName} کامیابی سے بھیجا گیا اور اینیمیشن قطار میں شامل ہوئی!`
          : `Confirmed ${data.transaction?.giftName} sent -> Animation queued safely!`,
      });
    } catch (e: any) {
      setNotice({ type: 'err', text: e?.message || 'Failed to send gift.' });
    } finally {
      setBusyAction(null);
    }
  };

  // Send 3 gifts rapidly to demonstrate priority queuing + concurrency limit
  const handleQueueBurstDemo = async () => {
    setBusyAction('burst');
    setNotice(null);
    try {
      await Promise.all([
        handleSendRealGift('gift_rose', 1),
        handleSendRealGift('gift_crown', 1),
        handleSendRealGift('gift_castle', 1),
      ]);
      await loadConfig();
    } finally {
      setBusyAction(null);
    }
  };

  const handleTriggerEntrance = async (
    entranceType: 'standard' | 'premium' | 'vip' | 'special_event',
    hostUserId: string
  ) => {
    setBusyAction(`ent_${entranceType}_${hostUserId}`);
    setNotice(null);
    try {
      const res = await fetch('/api/animations/entrance/trigger?preview=demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostUserId,
          entranceType,
          ...(stageMode === 'pk' ? { pkBattleId: initialPkBattleId } : { roomId: initialRoomId }),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setNotice({
          type: 'err',
          text: `${data.code || 'BLOCKED'}: ${data.error || 'Entrance denied by backend VIP check.'}`,
        });
        return;
      }
      if (data.queueItem) {
        setActiveEntrances((prev) =>
          prev.some((e) => e.queueId === data.queueItem.queueId) ? prev : [data.queueItem, ...prev]
        );
      }
      setNotice({
        type: 'ok',
        text: `${data.eligibility?.nickname} (${entranceType.toUpperCase()}) entrance broadcast live!`,
      });
    } catch (e: any) {
      setNotice({ type: 'err', text: e?.message || 'Failed to trigger entrance.' });
    } finally {
      setBusyAction(null);
    }
  };

  const handleSavePreferences = async (next: {
    enableLargeAnimations: boolean;
    enableSoundEffects: boolean;
    reduceAnimations: boolean;
    respectDeviceReducedMotion: boolean;
  }) => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/animations/preferences?preview=demo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: ORDINARY_USER_ID,
          ...next,
        }),
      });
      const data = await res.json();
      if (data.success && data.preferences) {
        setPreferences(data.preferences);
      }
      setSettingsOpen(false);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleQuickSoundToggle = () => {
    handleSavePreferences({
      enableLargeAnimations: preferences.enableLargeAnimations,
      enableSoundEffects: !preferences.enableSoundEffects,
      reduceAnimations: preferences.reduceAnimations,
      respectDeviceReducedMotion: preferences.respectDeviceReducedMotion,
    });
  };

  const hostA = stageData?.hosts?.[0] || {
    hostId: SARA_HOST_ID,
    nickname: 'Host Sara',
    avatarUrl: '/assets/following/host1@2x.png',
  };
  const hostB = stageData?.hosts?.[1] || {
    hostId: AYESHA_HOST_ID,
    nickname: 'Host Ayesha',
    avatarUrl: '/assets/following/host2@2x.png',
  };

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#0c031b] text-white flex flex-col items-center px-3 py-4 pb-16"
    >
      {/* Mobile-first Framed Container matching 07_04_animations_and_entrances.png */}
      <div className="w-full max-w-[430px] md:max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Left/Main Visual Stage Column */}
        <div className="md:col-span-6 w-full rounded-[32px] bg-gradient-to-b from-[#1a0736] via-[#130428] to-[#0a0217] border border-[#3c1a72] overflow-hidden shadow-[0_0_50px_rgba(147,51,234,0.28)]">
          {/* Top Bar */}
          <header className="px-4 py-3 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#ff007f] to-[#9333ea] flex items-center justify-center font-black text-xs shadow">
                P
              </div>
              <span className="font-black text-base tracking-tight">
                {isUrdu ? 'پوپو لائیو' : 'Popo Live'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setLang((prev) => (prev === 'en' ? 'ur' : 'en'))}
                data-testid="toggle-language-btn"
                className="px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[10px] font-bold flex items-center gap-1"
              >
                <Globe2 className="w-3 h-3 text-pink-300" />
                {lang.toUpperCase()}
              </button>
              <button
                type="button"
                onClick={handleQuickSoundToggle}
                aria-label="Toggle Sound"
                data-testid="quick-sound-toggle"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              >
                {preferences.enableSoundEffects ? (
                  <Volume2 className="w-4 h-4 text-amber-300" />
                ) : (
                  <VolumeX className="w-4 h-4 text-purple-300" />
                )}
              </button>
              <button
                type="button"
                data-testid="open-settings-btn"
                onClick={() => setSettingsOpen(true)}
                className="relative w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                title="Animation Settings"
              >
                <Bell className="w-4 h-4 text-purple-100" />
                {queuedAnimations.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#ff007f] text-[9px] font-bold flex items-center justify-center">
                    {queuedAnimations.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                aria-label="Open Animation Settings"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              >
                <Sliders className="w-4 h-4 text-purple-100" />
              </button>
            </div>
          </header>

          {/* Live / PK Arena Stage Card */}
          <div className="relative h-[445px] w-full bg-[#110424] overflow-hidden">
            {stageMode === 'pk' ? (
              <div className="grid grid-cols-2 h-[265px] relative">
                {/* PK Timer Pill */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1 rounded-full bg-[#331a12]/90 border border-amber-400/50 text-amber-200 text-xs font-extrabold italic tracking-wide shadow">
                  PK 04:32
                </div>

                {/* Vertical Gold Divider */}
                <div className="absolute top-0 bottom-0 left-1/2 w-[2px] -translate-x-1/2 bg-gradient-to-b from-amber-300 via-yellow-400 to-transparent z-10 shadow-[0_0_12px_rgba(251,191,36,0.85)]" />

                {/* Left Host (Host A) */}
                <div className="relative h-full overflow-hidden">
                  <img
                    src={hostA.avatarUrl || '/assets/following/zara_live@2x.png'}
                    alt={hostA.nickname}
                    onError={(e) => {
                      e.currentTarget.src = '/assets/following/zara_live@2x.png';
                    }}
                    className="w-full h-full object-cover object-top brightness-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#130428] via-transparent to-black/30" />
                  <div className="absolute bottom-2 left-3 z-10 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-black/55 border border-pink-400/40 text-xs font-black text-white shadow">
                      {pkScoreA.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-pink-200 drop-shadow">
                      {hostA.nickname}
                    </span>
                  </div>
                </div>

                {/* Right Host (Host B) */}
                <div className="relative h-full overflow-hidden">
                  <img
                    src={hostB.avatarUrl || '/assets/following/alina@2x.png'}
                    alt={hostB.nickname}
                    onError={(e) => {
                      e.currentTarget.src = '/assets/following/alina@2x.png';
                    }}
                    className="w-full h-full object-cover object-top brightness-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#130428] via-transparent to-black/30" />
                  <div className="absolute bottom-2 right-3 z-10 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-purple-200 drop-shadow">
                      {hostB.nickname}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-black/55 border border-amber-400/40 text-xs font-black text-amber-200 shadow">
                      {pkScoreB.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative h-[265px] w-full overflow-hidden">
                <img
                  src="/assets/viewer/sample_viewer_broadcast.png"
                  alt={hostA.nickname}
                  onError={(e) => {
                    e.currentTarget.src = '/assets/studio/host_zara_avatar.png';
                  }}
                  className="w-full h-full object-cover object-top brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#130428] via-transparent to-black/30" />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 border border-pink-400/50 text-[11px] font-bold">
                  LIVE ROOM {initialRoomId} • {hostA.nickname}
                </div>
              </div>
            )}

            {/* Lower Dark Ambient Backdrop matching 07_04 */}
            <div className="h-[180px] bg-gradient-to-b from-[#170632] via-[#120426] to-[#0a0217]" />

            {/* Lightweight Non-Blocking Animation + Entrance Stage Overlay */}
            <AnimationStageOverlay
              activeAnimations={activeAnimations}
              activeEntrances={activeEntrances}
              queuedAnimations={queuedAnimations}
              preferences={preferences}
              isUrdu={isUrdu}
              stageMode={stageMode}
              onAnimationComplete={handleCompletePlayback}
              fallbackShowcaseGift={{
                senderNickname: 'Sunny',
                senderAvatarUrl: '/assets/chat/avatar_bilal.png',
                giftName: 'Castle',
                giftNameUr: 'قلعہ',
                recipientNickname: hostA.nickname,
                quantity: 1,
                imageUrl: '/assets/gifts/castle.png',
              }}
            />
          </div>

          {/* Bottom Module Title Watermark matching 07_04_animations_and_entrances.png */}
          <div className="px-4 py-4 flex flex-col items-center gap-2 border-t border-white/5 bg-[#0d031d]">
            <span className="px-4 py-1 rounded-full bg-gradient-to-r from-[#ff007f] to-[#ec4899] text-white text-xs font-black tracking-wide shadow-[0_0_18px_rgba(255,0,127,0.55)]">
              P7.4
            </span>
            <h1 className="text-lg font-extrabold tracking-tight text-center">
              {isUrdu ? 'تحائف کی اینیمیشن اور آمد کے اثرات' : 'Animations and Entrances'}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-purple-300">
              <span className="inline-flex items-center gap-1">
                <Wifi className={`w-3 h-3 ${sseConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
                {sseConnected ? 'SSE Live' : 'Reconnecting...'}
              </span>
              <span>•</span>
              <span>Scope: {activeScope}</span>
              {senderCoins !== null && (
                <>
                  <span>•</span>
                  <span className="text-amber-300 font-bold inline-flex items-center gap-1">
                    <Coins className="w-3 h-3" /> {senderCoins.toLocaleString()}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right / Interactive Controls Panel */}
        <div className="md:col-span-6 w-full space-y-4">
          {notice && (
            <div
              data-testid="animation-status-notice"
              className={`rounded-2xl border px-4 py-3 text-xs font-semibold flex items-center gap-2 ${
                notice.type === 'ok'
                  ? 'bg-emerald-950/60 border-emerald-400/40 text-emerald-200'
                  : 'bg-rose-950/70 border-rose-400/50 text-rose-200'
              }`}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{notice.text}</span>
            </div>
          )}

          {/* Stage & PK Target Switcher */}
          <div className="rounded-3xl bg-[#16072f] border border-[#3a196e] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-purple-200">
                1. Stage & PK Recipient Placement
              </h2>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  data-testid="mode-pk-btn"
                  onClick={() => setStageMode('pk')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 ${
                    stageMode === 'pk'
                      ? 'bg-[#ff007f] text-white'
                      : 'bg-[#230c47] text-purple-300'
                  }`}
                >
                  <Swords className="w-3.5 h-3.5" /> PK Battle
                </button>
                <button
                  type="button"
                  data-testid="mode-live-btn"
                  onClick={() => setStageMode('live')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold ${
                    stageMode === 'live'
                      ? 'bg-[#ff007f] text-white'
                      : 'bg-[#230c47] text-purple-300'
                  }`}
                >
                  Live Room 880219
                </button>
              </div>
            </div>

            {stageMode === 'pk' && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  data-testid="target-host-a"
                  onClick={() => setPkSideTarget('host_a')}
                  className={`rounded-2xl border p-2.5 text-left text-xs ${
                    pkSideTarget === 'host_a'
                      ? 'bg-[#ff007f]/20 border-[#ff007f] text-white'
                      : 'bg-[#200a42] border-[#3d1c74] text-purple-200'
                  }`}
                >
                  <p className="font-bold">Host A (Left Side)</p>
                  <p className="text-[11px] text-purple-300 truncate">{hostA.nickname}</p>
                </button>
                <button
                  type="button"
                  data-testid="target-host-b"
                  onClick={() => setPkSideTarget('host_b')}
                  className={`rounded-2xl border p-2.5 text-left text-xs ${
                    pkSideTarget === 'host_b'
                      ? 'bg-[#ff007f]/20 border-[#ff007f] text-white'
                      : 'bg-[#200a42] border-[#3d1c74] text-purple-200'
                  }`}
                >
                  <p className="font-bold">Host B (Right Side)</p>
                  <p className="text-[11px] text-purple-300 truncate">{hostB.nickname}</p>
                </button>
              </div>
            )}
          </div>

          {/* Gift Animation Triggers (Backed by real Module 7.3 txns) */}
          <div className="rounded-3xl bg-[#16072f] border border-[#3a196e] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-[#ff2e93]" />
                2. Real Gift Animations (Module 7.2 Catalog)
              </h2>
              <button
                type="button"
                disabled={busyAction !== null}
                data-testid="burst-queue-btn"
                onClick={handleQueueBurstDemo}
                className="px-2.5 py-1 rounded-xl bg-amber-400/20 border border-amber-400/50 text-amber-200 text-[11px] font-bold hover:bg-amber-400/30"
              >
                Queue 3x Gifts
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {giftAnimations.slice(0, 8).map((anim) => (
                <button
                  key={anim.giftId}
                  type="button"
                  disabled={busyAction !== null}
                  data-testid={`send-anim-gift-${anim.giftId}`}
                  onClick={() => handleSendRealGift(anim.giftId, 1)}
                  className="rounded-2xl bg-[#200a42] hover:bg-[#2b1058] border border-[#3e1a76] p-2.5 flex flex-col items-center gap-1 text-center transition"
                >
                  <img
                    src={anim.imageUrl}
                    alt={anim.giftName}
                    className="w-10 h-10 object-contain"
                  />
                  <span className="text-[11px] font-bold text-white truncate w-full">
                    {isUrdu ? anim.giftNameUr : anim.giftName}
                  </span>
                  <span className="text-[10px] text-amber-300 font-semibold">
                    {anim.coinPrice} • {anim.animationTier.replace('_', ' ')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Host Entrance Effects & Strict VIP Validation */}
          <div className="rounded-3xl bg-[#16072f] border border-[#3a196e] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                3. Host Entrance Effects & VIP Gating
              </h2>
              {hostEligibility && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/40 font-bold">
                  {hostEligibility.nickname}: {hostEligibility.vipBadgeLabel || 'No VIP'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {entranceEffects.map((eff) => (
                <button
                  key={eff.entranceId}
                  type="button"
                  disabled={busyAction !== null}
                  data-testid={`trigger-entrance-${eff.entranceType}`}
                  onClick={() => handleTriggerEntrance(eff.entranceType, SARA_HOST_ID)}
                  className="rounded-2xl bg-[#200a42] hover:bg-[#2a0f55] border border-[#3e1a76] p-2.5 flex items-center gap-2 text-left text-xs"
                >
                  <img
                    src={eff.previewImageUrl}
                    alt={eff.name}
                    className="w-8 h-8 rounded-lg object-contain flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">
                      {isUrdu ? eff.nameUr : eff.name}
                    </p>
                    <p className="text-[10px] text-purple-300">
                      VIP Lv {eff.requiredVipLevel}+ • {eff.durationMs}ms
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={busyAction !== null}
              data-testid="test-ordinary-vip-blocked"
              onClick={() => handleTriggerEntrance('vip', ORDINARY_USER_ID)}
              className="w-full rounded-2xl bg-rose-950/60 hover:bg-rose-950/80 border border-rose-500/40 px-3 py-2 text-xs font-bold text-rose-200 flex items-center justify-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Test Ordinary Non-VIP User Claiming VIP Entrance (Must Reject 403)
            </button>
          </div>

          {/* Live Queue & Priority Status + Reconnect Recovery */}
          <div className="rounded-3xl bg-[#16072f] border border-[#3a196e] p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-purple-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-300" />
                Live Priority Queue ({activeAnimations.length} playing / {queuedAnimations.length} queued)
              </h2>
              <button
                type="button"
                data-testid="reconnect-sse-btn"
                onClick={() => {
                  setReconnectSeq((n) => n + 1);
                  loadConfig();
                }}
                className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-bold flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Sync / Reconnect
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {priorityConfigs.map((cfg) => (
                <span
                  key={cfg.configKey}
                  className="px-2 py-0.5 rounded-lg bg-[#220d46] border border-[#3b1970] text-[10px] text-purple-200"
                >
                  {cfg.configKey}: wt {cfg.priorityWeight} (max {cfg.maxConcurrent})
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
              <Link
                href="/gifts/send?roomId=880219&preview=demo"
                className="px-3 py-1.5 rounded-xl bg-[#270f4f] border border-[#4a2288] text-pink-200 font-bold"
              >
                Open Gift Panel
              </Link>
              <Link
                href="/admin/gifts"
                className="px-3 py-1.5 rounded-xl bg-[#270f4f] border border-[#4a2288] text-amber-200 font-bold"
              >
                Admin Animations
              </Link>
              <Link
                href="/wallet?preview=demo"
                className="px-3 py-1.5 rounded-xl bg-[#270f4f] border border-[#4a2288] text-purple-200 font-bold"
              >
                Wallet
              </Link>
            </div>
          </div>
        </div>
      </div>

      <AnimationSettingsModal
        open={settingsOpen}
        preferences={preferences}
        isUrdu={isUrdu}
        saving={savingSettings}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSavePreferences}
      />
    </div>
  );
}
