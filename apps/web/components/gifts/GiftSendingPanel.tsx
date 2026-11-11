'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Coins,
  Cpu,
  Flame,
  Globe2,
  Heart,
  Minus,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Swords,
  X,
} from 'lucide-react';
import type { GiftCatalogItem, GiftCategoryRecord } from '@/lib/giftCatalog';
import type {
  GiftPreviewQuote,
  GiftRoomHostOption,
  GiftSendingContext,
  GiftTransactionRecord,
} from '@/lib/giftSending';
import LiveGiftAnimationOverlay, { LiveGiftBroadcastEvent } from './LiveGiftAnimationOverlay';

const FALLBACK_IMG = '/assets/gifts/fallback_gift.png';

interface GiftSendingPanelProps {
  variant?: 'stage' | 'drawer';
  roomId?: string | null;
  pkBattleId?: string | null;
  initialGiftId?: string | null;
  previewDemo?: boolean;
  onClose?: () => void;
  onGiftCompleted?: (event: LiveGiftBroadcastEvent) => void;
}

const COPY = {
  en: {
    brand: 'Popo Live',
    sendGiftTo: 'Send Gift to',
    sendGift: 'Send Gift',
    sending: 'Sending...',
    searchPlaceholder: 'Search virtual gifts...',
    coinsLabel: 'Coins',
    topUp: 'Top-up Coins',
    insufficientTitle: 'Insufficient Coin Balance',
    insufficientHint: 'Top up your wallet to continue sending this gift.',
    confirmTitle: 'Confirm Virtual Gift',
    confirmSubtitle: 'Please review gift details before spending your coins',
    giftLabel: 'Gift',
    recipientLabel: 'Recipient Host',
    quantityLabel: 'Quantity',
    totalCostLabel: 'Total Coin Cost',
    currentBalanceLabel: 'Current Balance',
    remainingBalanceLabel: 'Remaining Balance',
    confirmBtn: 'Confirm Send',
    cancelBtn: 'Cancel',
    lowEndOn: 'Lite FX',
    lowEndOff: 'Full FX',
    liveStageLabel: 'LIVE STAGE',
    pkTimerPrefix: 'PK',
    recentTitle: 'Recent Sent Gifts',
    noGiftsMatch: 'No gifts matched your search.',
    footerBadge: 'P7.3 Sending a Gift',
    roomEndedBanner: 'This broadcast has ended. Gift sending is disabled.',
    retryBtn: 'Retry',
  },
  ur: {
    brand: 'پوپو لائیو',
    sendGiftTo: 'تحفہ بھیجیں',
    sendGift: 'تحفہ بھیجیں',
    sending: 'بھیجا جا رہا ہے...',
    searchPlaceholder: 'تحائف تلاش کریں...',
    coinsLabel: 'سکے',
    topUp: 'سکے ری چارج کریں',
    insufficientTitle: 'ناکافی سکے',
    insufficientHint: 'تحفہ بھیجنے کے لیے اپنا والیٹ ری چارج کریں۔',
    confirmTitle: 'تحفے کی تصدیق کریں',
    confirmSubtitle: 'سکے خرچ کرنے سے پہلے تفصیلات چیک کریں',
    giftLabel: 'تحفہ',
    recipientLabel: 'میزبان وصول کنندہ',
    quantityLabel: 'تعداد',
    totalCostLabel: 'کل سکے',
    currentBalanceLabel: 'موجودہ بیلنس',
    remainingBalanceLabel: 'باقی بیلنس',
    confirmBtn: 'تصدیق اور ارسال کریں',
    cancelBtn: 'منسوخ کریں',
    lowEndOn: 'لائٹ ایفیکٹ',
    lowEndOff: 'مکمل ایفیکٹ',
    liveStageLabel: 'لائیو روم',
    pkTimerPrefix: 'پی کے',
    recentTitle: 'حالیہ بھیجے گئے تحائف',
    noGiftsMatch: 'کوئی تحفہ نہیں ملا۔',
    footerBadge: 'P7.3 Sending a Gift',
    roomEndedBanner: 'یہ لائیو سیشن ختم ہو چکا ہے۔ اب تحائف نہیں بھیجے جا سکتے۔',
    retryBtn: 'دوبارہ کوشش کریں',
  },
};

function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function buildNewIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `gft_${crypto.randomUUID()}`;
  }
  return `gft_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export default function GiftSendingPanel({
  variant = 'stage',
  roomId = null,
  pkBattleId = null,
  initialGiftId = null,
  previewDemo = true,
  onClose,
  onGiftCompleted,
}: GiftSendingPanelProps) {
  const [lang, setLang] = useState<'en' | 'ur'>('en');
  const [lowEndMode, setLowEndMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contextData, setContextData] = useState<GiftSendingContext | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGiftId, setSelectedGiftId] = useState<string>(initialGiftId || 'gift_rose');
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [pkSecondsLeft, setPkSecondsLeft] = useState<number>(272);

  // Modal & Transaction states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [previewQuote, setPreviewQuote] = useState<GiftPreviewQuote | null>(null);
  const [sendingInFlight, setSendingInFlight] = useState(false);
  const [pendingIdempotencyKey, setPendingIdempotencyKey] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<{
    message: string;
    shortfallCoins?: number;
    topUpUrl?: string;
    isInsufficient?: boolean;
  } | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Real-Time Animation Queue & History
  const [animQueue, setAnimQueue] = useState<LiveGiftBroadcastEvent[]>([]);
  const [activeAnimation, setActiveAnimation] = useState<LiveGiftBroadcastEvent | null>(null);
  const [recentHistory, setRecentHistory] = useState<GiftTransactionRecord[]>([]);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const t = COPY[lang];
  const isUrdu = lang === 'ur';

  const enqueueAnimation = useCallback((evt: LiveGiftBroadcastEvent) => {
    setAnimQueue((prev) => [...prev, evt]);
  }, []);

  useEffect(() => {
    if (!activeAnimation && animQueue.length > 0) {
      const [next, ...rest] = animQueue;
      setActiveAnimation(next);
      setAnimQueue(rest);
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
      animTimerRef.current = setTimeout(
        () => {
          setActiveAnimation(null);
        },
        lowEndMode ? 2400 : 3400
      );
    }
  }, [activeAnimation, animQueue, lowEndMode]);

  useEffect(() => {
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, []);

  const loadContext = useCallback(async () => {
    try {
      const qs = new URLSearchParams();
      if (pkBattleId) qs.set('pkBattleId', pkBattleId);
      else if (roomId) qs.set('roomId', roomId);
      if (previewDemo) qs.set('preview', 'demo');

      const res = await fetch(`/api/gifts/send/context?${qs.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorBanner({ message: data.error || 'Failed to load gift stage.' });
        setLoading(false);
        return;
      }

      setContextData(data);
      if (data.pkRemainingSeconds) {
        setPkSecondsLeft(data.pkRemainingSeconds);
      }

      const hosts: GiftRoomHostOption[] = data.hosts || [];
      if (hosts.length > 0) {
        setSelectedRecipientId((prev) =>
          hosts.some((h) => h.hostId === prev) ? prev : hosts[0].hostId
        );
      }

      const gifts: GiftCatalogItem[] = data.gifts || [];
      if (gifts.length > 0) {
        setSelectedGiftId((prev) => {
          if (initialGiftId && gifts.some((g) => g.giftId === initialGiftId)) return initialGiftId;
          if (gifts.some((g) => g.giftId === prev)) return prev;
          return gifts[0].giftId;
        });
      }

      setErrorBanner(null);
    } catch (err: any) {
      setErrorBanner({ message: err?.message || 'Unable to load gift panel.' });
    } finally {
      setLoading(false);
    }
  }, [pkBattleId, roomId, previewDemo, initialGiftId]);

  const loadRecentHistory = useCallback(async () => {
    try {
      const qs = new URLSearchParams({ limit: '5' });
      if (previewDemo) qs.set('preview', 'demo');
      const res = await fetch(`/api/gifts/transactions?${qs.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.transactions)) {
          setRecentHistory(data.transactions);
        }
      }
    } catch {}
  }, [previewDemo]);

  useEffect(() => {
    loadContext();
    loadRecentHistory();
  }, [loadContext, loadRecentHistory]);

  // Countdown tick for PK Timer visual continuity
  useEffect(() => {
    if (!contextData || contextData.mode !== 'pk_battle' || !contextData.isLive) return;
    const timer = setInterval(() => {
      setPkSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [contextData]);

  // Real-time SSE Listener (balance updates + public room gift animations + PK score sync)
  useEffect(() => {
    if (!contextData?.roomScope) return;
    const qs = new URLSearchParams({ roomScope: contextData.roomScope });
    if (contextData.pkBattleId) qs.set('pkBattleId', contextData.pkBattleId);
    else if (contextData.liveRoomId) qs.set('roomId', contextData.liveRoomId);
    if (previewDemo) qs.set('preview', 'demo');

    const es = new EventSource(`/api/gifts/live/events?${qs.toString()}`);

    es.addEventListener('gift:state_sync', (ev: any) => {
      try {
        const payload = JSON.parse(ev.data);
        setContextData((prev) =>
          prev
            ? {
                ...prev,
                pkHostAScore:
                  typeof payload.pkHostAScore === 'number' ? payload.pkHostAScore : prev.pkHostAScore,
                pkHostBScore:
                  typeof payload.pkHostBScore === 'number' ? payload.pkHostBScore : prev.pkHostBScore,
                senderWallet:
                  typeof payload.senderAvailableCoins === 'number'
                    ? { ...prev.senderWallet, availableCoins: payload.senderAvailableCoins }
                    : prev.senderWallet,
              }
            : prev
        );
      } catch {}
    });

    es.addEventListener('gift:coin_balance_updated', (ev: any) => {
      try {
        const payload = JSON.parse(ev.data);
        if (typeof payload.availableCoins === 'number') {
          setContextData((prev) =>
            prev
              ? {
                  ...prev,
                  senderWallet: {
                    ...prev.senderWallet,
                    availableCoins: payload.availableCoins,
                    totalSpentCoins: payload.totalSpentCoins ?? prev.senderWallet.totalSpentCoins,
                  },
                }
              : prev
          );
        }
      } catch {}
    });

    es.addEventListener('gift:animation_broadcast', (ev: any) => {
      try {
        const payload = JSON.parse(ev.data);
        const broadcastEvt: LiveGiftBroadcastEvent = {
          id: `${payload.giftTransactionId || Date.now()}_${Math.random()}`,
          giftTransactionId: payload.giftTransactionId,
          senderNickname: payload.senderNickname || 'Supporter',
          recipientNickname: payload.recipientNickname || 'Host',
          pkHostSide: payload.pkHostSide || null,
          giftId: payload.giftId,
          giftName: payload.giftName,
          giftNameUr: payload.giftNameUr,
          thumbnailUrl: payload.thumbnailUrl,
          imageUrl: payload.imageUrl,
          animationUrl: payload.animationUrl,
          assetType: payload.assetType,
          giftType: payload.giftType,
          quantity: payload.quantity || 1,
          totalCoinAmount: payload.totalCoinAmount || 0,
        };
        enqueueAnimation(broadcastEvt);
        if (onGiftCompleted) onGiftCompleted(broadcastEvt);

        if (typeof payload.pkHostAScore === 'number' || typeof payload.pkHostBScore === 'number') {
          setContextData((prev) =>
            prev
              ? {
                  ...prev,
                  pkHostAScore: payload.pkHostAScore ?? prev.pkHostAScore,
                  pkHostBScore: payload.pkHostBScore ?? prev.pkHostBScore,
                }
              : prev
          );
        }
      } catch {}
    });

    return () => {
      es.close();
    };
  }, [contextData?.roomScope, contextData?.pkBattleId, contextData?.liveRoomId, previewDemo, enqueueAnimation, onGiftCompleted]);

  const categories: GiftCategoryRecord[] = contextData?.categories || [];
  const allGifts: GiftCatalogItem[] = contextData?.gifts || [];

  const filteredGifts = useMemo(() => {
    return allGifts.filter((g) => {
      if (activeCategory !== 'all') {
        if (activeCategory === 'popular') {
          if (!g.isPopular && g.usageCount < 5000) return false;
        } else if (g.categoryId !== activeCategory) {
          return false;
        }
      }
      if (searchTerm.trim()) {
        const s = searchTerm.trim().toLowerCase();
        return (
          g.name.toLowerCase().includes(s) ||
          g.nameUr.toLowerCase().includes(s) ||
          (g.categoryName || '').toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [allGifts, activeCategory, searchTerm]);

  const selectedGift = useMemo(
    () => allGifts.find((g) => g.giftId === selectedGiftId) || filteredGifts[0] || allGifts[0] || null,
    [allGifts, filteredGifts, selectedGiftId]
  );

  const selectedHost = useMemo(
    () =>
      contextData?.hosts.find((h) => h.hostId === selectedRecipientId) ||
      contextData?.hosts[0] ||
      null,
    [contextData?.hosts, selectedRecipientId]
  );

  const giftMinQty = contextData?.quantityRules?.minQuantity ?? 1;
  const giftMaxQty = Math.min(
    contextData?.quantityRules?.maxQuantity ?? 99,
    selectedGift?.maxQuantity ?? 99
  );
  const allowedPresets = useMemo(() => {
    const raw = selectedGift?.allowedQuantities || [1, 5, 10, 66, 99];
    return raw.filter((q) => q >= giftMinQty && q <= giftMaxQty);
  }, [selectedGift, giftMinQty, giftMaxQty]);

  useEffect(() => {
    if (quantity > giftMaxQty) setQuantity(giftMaxQty);
    if (quantity < giftMinQty) setQuantity(giftMinQty);
  }, [giftMaxQty, giftMinQty, quantity]);

  const estimatedTotalCoins = (selectedGift?.coinPrice || 0) * quantity;
  const availableCoins = contextData?.senderWallet?.availableCoins ?? 0;
  const isLocallyInsufficient = availableCoins < estimatedTotalCoins;

  const openConfirmationModal = async () => {
    if (!selectedGift || !selectedHost || !contextData?.isLive) return;
    setErrorBanner(null);
    setConfirmLoading(true);
    setConfirmOpen(true);
    setPendingIdempotencyKey(buildNewIdempotencyKey());

    try {
      const res = await fetch('/api/gifts/send/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giftId: selectedGift.giftId,
          quantity,
          recipientHostId: selectedHost.hostId,
          liveRoomId: contextData.liveRoomId,
          pkBattleId: contextData.pkBattleId,
          preview: previewDemo ? 'demo' : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setConfirmOpen(false);
        setErrorBanner({ message: data.error || 'Could not preview gift.' });
        return;
      }
      setPreviewQuote(data.preview);
    } catch (err: any) {
      setConfirmOpen(false);
      setErrorBanner({ message: err?.message || 'Network error while preparing confirmation.' });
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleConfirmSend = async () => {
    if (!selectedGift || !selectedHost || !contextData || sendingInFlight) return;
    setSendingInFlight(true);
    setErrorBanner(null);

    try {
      const idempotencyKey = pendingIdempotencyKey || buildNewIdempotencyKey();
      const res = await fetch('/api/gifts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giftId: selectedGift.giftId,
          quantity,
          recipientHostId: selectedHost.hostId,
          liveRoomId: contextData.liveRoomId,
          pkBattleId: contextData.pkBattleId,
          idempotencyKey,
          preview: previewDemo ? 'demo' : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setConfirmOpen(false);
        setErrorBanner({
          message: data.error || data.message || 'Gift sending failed.',
          isInsufficient: Boolean(data.topUpRecommended || data.errorCode === 'INSUFFICIENT_COINS'),
          shortfallCoins: data.shortfallCoins,
          topUpUrl: data.topUpUrl || '/wallet',
        });
        if (typeof data.updatedSenderWallet?.availableCoins === 'number') {
          setContextData((prev) =>
            prev
              ? {
                  ...prev,
                  senderWallet: {
                    ...prev.senderWallet,
                    availableCoins: data.updatedSenderWallet.availableCoins,
                  },
                }
              : prev
          );
        }
        return;
      }

      setConfirmOpen(false);
      setPendingIdempotencyKey(null);

      // Update balance and PK scores immediately
      setContextData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          pkHostAScore: data.updatedHostStats?.pkHostAScore ?? prev.pkHostAScore,
          pkHostBScore: data.updatedHostStats?.pkHostBScore ?? prev.pkHostBScore,
          senderWallet: data.updatedSenderWallet
            ? {
                ...prev.senderWallet,
                availableCoins: data.updatedSenderWallet.availableCoins,
                totalSpentCoins: data.updatedSenderWallet.totalSpentCoins,
              }
            : prev.senderWallet,
        };
      });

      const tx: GiftTransactionRecord | undefined = data.transaction;
      if (tx) {
        setRecentHistory((prev) => [tx, ...prev.filter((p) => p.giftTransactionId !== tx.giftTransactionId)].slice(0, 6));
      }

      setSuccessToast(
        isUrdu
          ? `${selectedHost.nickname} کو ${selectedGift.nameUr || selectedGift.name} x${quantity} بھیجا گیا!`
          : `Sent ${selectedGift.name} x${quantity} to ${selectedHost.nickname}!`
      );
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      setConfirmOpen(false);
      setErrorBanner({ message: err?.message || 'Failed to execute gift transaction.' });
    } finally {
      setSendingInFlight(false);
    }
  };

  if (loading && !contextData) {
    return (
      <div className="min-h-[420px] flex flex-col items-center justify-center bg-[#0c0518] text-purple-200 gap-3 p-6 rounded-3xl border border-purple-500/20">
        <RefreshCw className="w-7 h-7 animate-spin text-[#ff2e83]" />
        <p className="text-sm font-medium">{isUrdu ? 'تحائف لوڈ ہو رہے ہیں...' : 'Loading live gift engine...'}</p>
      </div>
    );
  }

  const hosts = contextData?.hosts || [];
  const hostA = hosts[0];
  const hostB = hosts[1];
  const isPkMode = contextData?.mode === 'pk_battle' && Boolean(hostB);
  const totalPkScore = Math.max(1, (contextData?.pkHostAScore || 0) + (contextData?.pkHostBScore || 0));
  const pkPercentA = Math.min(88, Math.max(12, Math.round(((contextData?.pkHostAScore || 0) / totalPkScore) * 100)));

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className={
        variant === 'drawer'
          ? 'relative w-full max-w-[460px] mx-auto rounded-t-3xl bg-gradient-to-b from-[#17092b] via-[#100620] to-[#090313] border border-pink-500/35 text-white shadow-2xl overflow-hidden'
          : 'relative w-full max-w-[440px] md:max-w-[960px] mx-auto bg-gradient-to-b from-[#130626] via-[#0d041b] to-[#080212] text-white md:rounded-3xl md:border md:border-purple-500/25 shadow-2xl overflow-hidden'
      }
    >
      {/* Top Bar — 1:1 with 07_03_sending_a_gift.png */}
      <div className="flex items-center justify-between gap-2 px-3.5 sm:px-4 pt-3.5 pb-2 border-b border-white/10 bg-[#18082f]/80 backdrop-blur-md">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#ff2e83] to-[#9b2cff] flex items-center justify-center shadow-[0_0_12px_rgba(255,46,131,0.65)] flex-shrink-0">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
          <span
            className={`font-extrabold tracking-tight text-white whitespace-nowrap ${
              variant === 'drawer' ? 'text-sm' : 'text-base'
            }`}
          >
            {t.brand}
          </span>
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-[10px] font-semibold text-purple-200 whitespace-nowrap">
            {contextData?.mode === 'pk_battle' ? 'PK GIFT' : t.liveStageLabel}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Coin Balance Pill */}
          <Link
            href="/wallet"
            data-testid="gift-wallet-balance-pill"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#241042] border border-amber-400/35 text-xs font-bold text-amber-300 hover:border-amber-300 transition"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{availableCoins.toLocaleString()}</span>
          </Link>

          {/* Low-End Device Animation Quality Toggle */}
          <button
            type="button"
            data-testid="low-end-toggle"
            onClick={() => setLowEndMode((v) => !v)}
            className={`px-2 py-1 rounded-full border text-[10px] font-bold flex items-center gap-1 transition ${
              lowEndMode
                ? 'bg-emerald-500/20 border-emerald-400/45 text-emerald-200'
                : 'bg-white/10 border-white/15 text-purple-100 hover:bg-white/15'
            }`}
            title="Toggle Low-End Device Animation Quality"
          >
            <Cpu className="w-3 h-3" />
            <span>{lowEndMode ? t.lowEndOn : t.lowEndOff}</span>
          </button>

          {/* Language EN / UR Toggle */}
          <button
            type="button"
            data-testid="lang-toggle"
            onClick={() => setLang((l) => (l === 'en' ? 'ur' : 'en'))}
            className="px-2 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold text-white hover:bg-white/20 flex items-center gap-1 transition"
          >
            <Globe2 className="w-3 h-3 text-pink-300" />
            <span>{lang === 'en' ? 'UR' : 'EN'}</span>
          </button>

          {variant === 'drawer' && onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-purple-200">
              <Bell className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>

      {/* Stage Area (Shown in standalone stage variant to match 07_03_sending_a_gift.png) */}
      {variant === 'stage' && (
        <div className="relative bg-gradient-to-b from-[#1e0b36] to-[#120624] px-3 pt-2.5 pb-2 border-b border-white/10">
          {isPkMode && hostA && hostB ? (
            <>
              {/* PK Timer & Dual Score Bar */}
              <div className="flex items-center justify-between gap-2 mb-2 px-1">
                <span className="text-xs font-extrabold text-amber-300 tabular-nums">
                  {contextData!.pkHostAScore.toLocaleString()}
                </span>
                <div className="px-3 py-0.5 rounded-full bg-gradient-to-r from-[#ff2e83] to-[#a238ff] text-[11px] font-extrabold tracking-wide shadow-[0_0_12px_rgba(255,46,131,0.5)] flex items-center gap-1.5">
                  <Swords className="w-3 h-3" />
                  <span>{t.pkTimerPrefix} {formatClock(pkSecondsLeft)}</span>
                </div>
                <span className="text-xs font-extrabold text-cyan-300 tabular-nums">
                  {contextData!.pkHostBScore.toLocaleString()}
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-[#2a1447] overflow-hidden flex mb-2.5">
                <div
                  className="h-full bg-gradient-to-r from-[#ff2e83] to-[#ff6aa5] transition-all duration-500"
                  style={{ width: `${pkPercentA}%` }}
                />
                <div
                  className="h-full bg-gradient-to-r from-[#5856d6] to-[#2ac8ff] transition-all duration-500 flex-1"
                />
              </div>

              {/* Dual Host Portraits + Center VS */}
              <div className="relative grid grid-cols-2 gap-1.5 rounded-2xl overflow-hidden border border-purple-400/20">
                <div className="relative h-36 sm:h-44 bg-[#1c0c34]">
                  <img
                    src={hostA.avatarUrl}
                    alt={hostA.nickname}
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_IMG;
                    }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] font-bold">
                    <span className="truncate">{hostA.nickname}</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#ff2e83]/85 text-[9px]">A</span>
                  </div>
                </div>
                <div className="relative h-36 sm:h-44 bg-[#1c0c34]">
                  <img
                    src={hostB.avatarUrl}
                    alt={hostB.nickname}
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_IMG;
                    }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] font-bold">
                    <span className="truncate">{hostB.nickname}</span>
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/85 text-[9px]">B</span>
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="px-2.5 py-1 rounded-full bg-black/70 border border-pink-400/60 text-xs font-black italic tracking-wider text-amber-300 shadow-lg">
                    VS
                  </div>
                </div>

                {/* Non-blocking Floating Gift Animation Overlay */}
                <div className="pointer-events-none absolute top-2 left-2 right-2 z-20">
                  <LiveGiftAnimationOverlay
                    activeGift={activeAnimation}
                    queueCount={animQueue.length}
                    lowEndMode={lowEndMode}
                    isUrdu={isUrdu}
                    placement="stage-top"
                  />
                </div>
              </div>
            </>
          ) : hostA ? (
            <div className="relative h-36 sm:h-44 rounded-2xl overflow-hidden border border-purple-400/25 bg-[#1c0c34]">
              <img
                src={hostA.avatarUrl}
                alt={hostA.nickname}
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_IMG;
                }}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-[#ff2e83] text-[10px] font-extrabold uppercase tracking-wider shadow">
                  LIVE • {contextData?.roomNumber || '880219'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-black/55 border border-white/15 text-[10px] font-semibold">
                  {contextData?.roomTitle}
                </span>
              </div>
              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
                <span className="text-sm font-bold text-white">{hostA.nickname}</span>
                <span className="text-xs font-bold text-amber-300">
                  {hostA.score.toLocaleString()} {t.coinsLabel}
                </span>
              </div>
              <div className="pointer-events-none absolute top-10 left-2 right-2 z-20">
                <LiveGiftAnimationOverlay
                  activeGift={activeAnimation}
                  queueCount={animQueue.length}
                  lowEndMode={lowEndMode}
                  isUrdu={isUrdu}
                  placement="stage-top"
                />
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Drawer Floating Animation Banner when inside ViewerRoomScreen */}
      {variant === 'drawer' && activeAnimation && (
        <div className="px-3 pt-2.5">
          <LiveGiftAnimationOverlay
            activeGift={activeAnimation}
            queueCount={animQueue.length}
            lowEndMode={lowEndMode}
            isUrdu={isUrdu}
            placement="stage-top"
          />
        </div>
      )}

      {/* Main Gift Sending Controls */}
      <div className="p-3.5 sm:p-4 space-y-3">
        {/* Ended Room / PK Battle Banner */}
        {contextData && !contextData.isLive && (
          <div className="rounded-xl bg-red-500/15 border border-red-400/40 px-3 py-2 text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-300" />
            <span>{t.roomEndedBanner}</span>
          </div>
        )}

        {/* Toast / Error Banners */}
        {successToast && (
          <div
            data-testid="gift-success-toast"
            className="rounded-xl bg-emerald-500/20 border border-emerald-400/45 px-3 py-2 text-xs font-semibold text-emerald-200 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-300" />
            <span>{successToast}</span>
          </div>
        )}

        {errorBanner && (
          <div
            data-testid="gift-error-banner"
            className="rounded-xl bg-rose-500/20 border border-rose-400/45 px-3 py-2.5 text-xs text-rose-100 flex items-center justify-between gap-2"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-300 mt-0.5" />
              <div>
                <p className="font-bold">{errorBanner.message}</p>
                {errorBanner.isInsufficient && (
                  <p className="text-[11px] text-rose-200/85 mt-0.5">
                    {errorBanner.shortfallCoins ? `Need ${errorBanner.shortfallCoins} more coins. ` : ''}
                    {t.insufficientHint}
                  </p>
                )}
              </div>
            </div>
            {errorBanner.isInsufficient ? (
              <Link
                href={errorBanner.topUpUrl || '/wallet'}
                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#ff2e83] to-[#ff6aa5] text-white font-bold whitespace-nowrap text-[11px] shadow"
              >
                {t.topUp}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setErrorBanner(null)}
                className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* "Send Gift to" Recipient Host Selector (1:1 with 07_03_sending_a_gift.png) */}
        <div>
          <p className="text-xs font-bold text-purple-200/90 mb-2">{t.sendGiftTo}</p>
          <div className={`grid gap-2.5 ${hosts.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {hosts.map((host) => {
              const isSelected = selectedHost?.hostId === host.hostId;
              return (
                <button
                  key={host.hostId}
                  type="button"
                  data-testid={`recipient-card-${host.side}`}
                  onClick={() => setSelectedRecipientId(host.hostId)}
                  className={`flex items-center gap-2.5 rounded-2xl px-3 py-2 text-left transition-all border ${
                    isSelected
                      ? 'bg-[#2a0f44] border-[#ff3d8d] shadow-[0_0_16px_rgba(255,46,131,0.45)]'
                      : 'bg-[#1a0b31]/90 border-white/15 hover:border-purple-400/45'
                  }`}
                >
                  <img
                    src={host.avatarUrl}
                    alt={host.nickname}
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_IMG;
                    }}
                    className={`w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 ${
                      isSelected ? 'border-[#ff3d8d]' : 'border-purple-300/35'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-extrabold text-white truncate">{host.nickname}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-pink-200/80">
                      ({host.badge})
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Tabs + Search Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => {
              const active = activeCategory === cat.categoryId;
              return (
                <button
                  key={cat.categoryId}
                  type="button"
                  onClick={() => setActiveCategory(cat.categoryId)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border ${
                    active
                      ? 'bg-gradient-to-r from-[#ff2e83] to-[#b429f9] border-pink-300/60 text-white shadow'
                      : 'bg-[#1b0b32] border-white/10 text-purple-200/80 hover:text-white'
                  }`}
                >
                  {isUrdu ? cat.shortNameUr || cat.nameUr : cat.shortName || cat.name}
                </button>
              );
            })}
          </div>

          <div className="relative sm:w-44">
            <Search className="w-3.5 h-3.5 text-purple-300/70 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-8 pr-3 py-1 rounded-full bg-[#1a0a30] border border-purple-400/25 text-xs text-white placeholder:text-purple-300/50 focus:outline-none focus:border-[#ff3d8d]"
            />
          </div>
        </div>

        {/* Virtual Gift Grid */}
        {filteredGifts.length === 0 ? (
          <div className="py-8 text-center text-xs text-purple-200/70 bg-[#17092a]/70 rounded-2xl border border-white/10">
            {t.noGiftsMatch}
          </div>
        ) : (
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-[210px] overflow-y-auto pr-1">
            {filteredGifts.map((gift) => {
              const active = selectedGift?.giftId === gift.giftId;
              return (
                <button
                  key={gift.giftId}
                  type="button"
                  data-testid={`gift-tile-${gift.giftId}`}
                  onClick={() => setSelectedGiftId(gift.giftId)}
                  className={`relative flex flex-col items-center justify-between p-2 rounded-2xl border transition-all ${
                    active
                      ? 'bg-gradient-to-b from-[#331052] to-[#1f0a38] border-[#ff3d8d] shadow-[0_0_16px_rgba(255,61,141,0.45)]'
                      : 'bg-[#180a2d]/90 border-white/10 hover:border-purple-400/45'
                  }`}
                >
                  {gift.isPopular && (
                    <span className="absolute top-1 right-1 text-[9px] text-amber-300" title="Popular">
                      <Flame className="w-3 h-3" />
                    </span>
                  )}
                  <img
                    src={gift.thumbnailUrl || gift.imageUrl || FALLBACK_IMG}
                    alt={gift.name}
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_IMG;
                    }}
                    className="w-11 h-11 object-contain my-0.5"
                  />
                  <span className="text-[11px] font-bold text-white truncate w-full text-center">
                    {isUrdu ? gift.nameUr : gift.name}
                  </span>
                  <span className="flex items-center gap-0.5 text-[10px] font-extrabold text-amber-300 mt-0.5">
                    <Coins className="w-2.5 h-2.5 text-amber-400" />
                    {gift.coinPrice.toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected Gift + Quantity Presets + Stepper Bar (1:1 with 07_03_sending_a_gift.png) */}
        {selectedGift && (
          <div className="rounded-2xl bg-[#190a2f] border border-purple-400/25 p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={selectedGift.thumbnailUrl || selectedGift.imageUrl || FALLBACK_IMG}
                  alt={selectedGift.name}
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_IMG;
                  }}
                  className="w-8 h-8 object-contain rounded-lg bg-[#110622] p-0.5"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-white truncate">
                    <span>{isUrdu ? selectedGift.nameUr : selectedGift.name}</span>
                    <span className="text-pink-300">x{quantity}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span data-testid="selected-total-coins">{estimatedTotalCoins.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Quantity Stepper (- qty +) */}
              <div className="flex items-center gap-1 bg-[#100520] border border-white/15 rounded-full px-1.5 py-1">
                <button
                  type="button"
                  data-testid="qty-decrement"
                  onClick={() => setQuantity((q) => Math.max(giftMinQty, q - 1))}
                  disabled={quantity <= giftMinQty}
                  className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-35 flex items-center justify-center"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span data-testid="qty-value" className="w-7 text-center text-xs font-extrabold tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  data-testid="qty-increment"
                  onClick={() => setQuantity((q) => Math.min(giftMaxQty, q + 1))}
                  disabled={quantity >= giftMaxQty}
                  className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-35 flex items-center justify-center"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Backend-Configured Preset Quantities */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                {allowedPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQuantity(preset)}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition ${
                      quantity === preset
                        ? 'bg-[#ff2e83] border-pink-300 text-white'
                        : 'bg-[#100520] border-white/15 text-purple-200 hover:border-pink-400/50'
                    }`}
                  >
                    x{preset}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-purple-200/70">
                Max: {giftMaxQty}
              </span>
            </div>

            {/* Insufficient balance quick notice + Top-up CTA OR Send Gift CTA */}
            {isLocallyInsufficient && (
              <div className="flex items-center justify-between gap-2 rounded-xl bg-amber-500/15 border border-amber-400/40 px-2.5 py-1.5 text-[11px]">
                <span className="text-amber-200 font-semibold">
                  {t.insufficientTitle} ({availableCoins.toLocaleString()} / {estimatedTotalCoins.toLocaleString()})
                </span>
                <Link
                  href="/wallet"
                  className="px-2.5 py-0.5 rounded-full bg-amber-400 text-[#1b0830] font-extrabold text-[10px] hover:bg-amber-300"
                >
                  {t.topUp}
                </Link>
              </div>
            )}

            <button
              type="button"
              data-testid="open-confirm-gift-btn"
              disabled={!contextData?.isLive || !selectedGift || !selectedHost || sendingInFlight}
              onClick={openConfirmationModal}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#ff267e] via-[#ff3e91] to-[#ff2b84] hover:brightness-110 active:scale-[0.99] disabled:opacity-45 disabled:cursor-not-allowed text-white font-extrabold text-sm tracking-wide shadow-[0_0_24px_rgba(255,46,131,0.6)] transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{sendingInFlight ? t.sending : t.sendGift}</span>
            </button>
          </div>
        )}

        {/* Recent Sent Gifts Mini Strip (Stage variant) */}
        {variant === 'stage' && recentHistory.length > 0 && (
          <div className="rounded-2xl bg-[#140826] border border-white/10 p-3">
            <p className="text-[11px] font-bold text-purple-200/80 mb-2">{t.recentTitle}</p>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {recentHistory.slice(0, 4).map((item) => (
                <div
                  key={item.giftTransactionId}
                  className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-xl bg-[#1c0c34]/80 border border-white/5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={item.thumbnailUrl || item.imageUrl || FALLBACK_IMG}
                      alt={item.giftNameSnapshot}
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMG;
                      }}
                      className="w-5 h-5 object-contain flex-shrink-0"
                    />
                    <span className="font-bold text-white truncate">
                      {item.giftNameSnapshot} x{item.quantity}
                    </span>
                    <span className="text-purple-200/70 truncate">→ {item.recipientNickname}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        item.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : item.status === 'reversed'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="font-bold text-amber-300">-{item.totalCoinAmount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prompt Watermark */}
        <div className="pt-1 flex items-center justify-between text-[11px] text-purple-300/60">
          <span>{t.footerBadge}</span>
          <span>
            {contextData?.mode === 'pk_battle'
              ? `PK • ${contextData.pkBattleId?.slice(0, 8)}`
              : `Room • ${contextData?.roomNumber || '880219'}`}
          </span>
        </div>
      </div>

      {/* Mandatory Gift Confirmation Modal */}
      {confirmOpen && (
        <div
          data-testid="gift-confirmation-modal"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#210b3e] to-[#120624] border border-[#ff3d8d]/50 p-5 text-white shadow-[0_0_36px_rgba(255,46,131,0.4)] space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-white">{t.confirmTitle}</h3>
                <p className="text-[11px] text-purple-200/80 mt-0.5">{t.confirmSubtitle}</p>
              </div>
              <button
                type="button"
                disabled={sendingInFlight}
                onClick={() => setConfirmOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {confirmLoading || !previewQuote ? (
              <div className="py-8 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 animate-spin text-[#ff3d8d]" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 rounded-2xl bg-[#180830] border border-white/10 p-3">
                  <img
                    src={previewQuote.imageUrl || previewQuote.thumbnailUrl || FALLBACK_IMG}
                    alt={previewQuote.giftName}
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_IMG;
                    }}
                    className="w-14 h-14 object-contain rounded-xl bg-[#0e041d] p-1"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-white">
                      {isUrdu ? previewQuote.giftNameUr : previewQuote.giftName}
                    </p>
                    <p className="text-xs text-pink-300 font-bold">
                      {t.quantityLabel}: x{previewQuote.quantity} ({previewQuote.unitCoinPrice.toLocaleString()} / ea)
                    </p>
                    <p className="text-[11px] text-purple-200/80 mt-0.5 truncate">
                      {t.recipientLabel}: {previewQuote.recipientNickname}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 rounded-2xl bg-[#130627] border border-white/10 p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-200/80">{t.totalCostLabel}</span>
                    <span className="font-extrabold text-amber-300 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />
                      {previewQuote.totalCoinAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-200/80">{t.currentBalanceLabel}</span>
                    <span className="font-bold text-white">
                      {previewQuote.currentCoinBalance.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t border-white/10 pt-2 flex items-center justify-between">
                    <span className="text-purple-200/80">{t.remainingBalanceLabel}</span>
                    <span
                      data-testid="confirm-remaining-balance"
                      className={`font-extrabold ${
                        previewQuote.insufficientBalance ? 'text-rose-400' : 'text-emerald-300'
                      }`}
                    >
                      {previewQuote.insufficientBalance
                        ? `-${previewQuote.shortfallCoins.toLocaleString()}`
                        : previewQuote.remainingCoinBalance.toLocaleString()}
                    </span>
                  </div>
                </div>

                {previewQuote.insufficientBalance ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmOpen(false)}
                      className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold"
                    >
                      {t.cancelBtn}
                    </button>
                    <Link
                      href="/wallet"
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-[#1d0932] text-center text-xs font-extrabold"
                    >
                      {t.topUp}
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={sendingInFlight}
                      onClick={() => setConfirmOpen(false)}
                      className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold disabled:opacity-50"
                    >
                      {t.cancelBtn}
                    </button>
                    <button
                      type="button"
                      data-testid="confirm-send-gift-btn"
                      disabled={sendingInFlight}
                      onClick={handleConfirmSend}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#ff267e] to-[#ff4e9b] hover:brightness-110 disabled:opacity-50 text-xs font-extrabold shadow-[0_0_16px_rgba(255,46,131,0.55)]"
                    >
                      {sendingInFlight ? t.sending : t.confirmBtn}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
