'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Globe,
  Coins,
  Sparkles,
  Check,
  AlertCircle,
  Gift,
  Flame,
} from 'lucide-react';
import {
  CANONICAL_PK_REAL_GIFTS,
  PKRealGiftItem,
} from '@/lib/pk';

interface PKRealGiftsScreenProps {
  battleId?: string;
  currentUserId?: string;
  currentUserName?: string;
  initialLanguage?: 'en' | 'ur';
  onBack?: () => void;
}

export default function PKRealGiftsScreen({
  battleId = '00000000-0000-0000-0000-000000000603',
  currentUserId = 'user_viewer_9001',
  currentUserName = 'Ali',
  initialLanguage = 'en',
  onBack,
}: PKRealGiftsScreenProps) {
  const router = useRouter();
  const [lang, setLang] = useState<'en' | 'ur'>(initialLanguage);
  const isRtl = lang === 'ur';

  const [gifts, setGifts] = useState<PKRealGiftItem[]>(CANONICAL_PK_REAL_GIFTS);
  const [selectedGiftId, setSelectedGiftId] = useState<string>('rose');
  const [selectedHostSide, setSelectedHostSide] = useState<'host_a' | 'host_b'>('host_a');
  const [viewerCoins, setViewerCoins] = useState<number>(3600); // 3,600 matching 06_10 reference

  const [isSending, setIsSending] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Active floating gift animation
  const [activeAnimation, setActiveAnimation] = useState<{
    id: string;
    giftName: string;
    side: 'host_a' | 'host_b';
    imageUrl: string;
    coins: number;
  } | null>(null);

  // 1. Fetch Real Gift Catalog & Viewer Wallet
  useEffect(() => {
    fetch(`/api/pk/battle/${battleId}/gifts/catalog`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.gifts && data.gifts.length > 0) {
          setGifts(data.gifts);
        }
      })
      .catch(() => {});

    fetch(`/api/pk/battle/${battleId}/gifts/wallet?userId=${currentUserId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.wallet) {
          setViewerCoins(data.wallet.coins ?? 3600);
        }
      })
      .catch(() => {});
  }, [battleId, currentUserId]);

  const selectedGift = gifts.find((g) => g.id === selectedGiftId) || gifts[0];

  const handleSendGift = async () => {
    if (!selectedGift || isSending) return;

    if (viewerCoins < selectedGift.coinPrice) {
      setStatusNotice({
        type: 'error',
        text: isRtl
          ? 'سکے ناکافی ہیں۔ براہ کرم ریچارج کریں۔'
          : `Insufficient coins. Need ${selectedGift.coinPrice}, have ${viewerCoins}.`,
      });
      setTimeout(() => setStatusNotice(null), 3500);
      return;
    }

    setIsSending(true);
    setStatusNotice(null);

    try {
      const res = await fetch(`/api/pk/battle/${battleId}/gifts/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          battleId,
          senderId: currentUserId,
          senderName: currentUserName,
          receiverSide: selectedHostSide,
          giftId: selectedGift.id,
          quantity: 1,
          idempotencyKey: `gift_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Update local wallet coins
        setViewerCoins(data.sender.remainingCoins);

        // Trigger visual gift burst
        setActiveAnimation({
          id: Date.now().toString(),
          giftName: selectedGift.name,
          side: selectedHostSide,
          imageUrl: selectedGift.imageUrl,
          coins: selectedGift.coinPrice,
        });

        setStatusNotice({
          type: 'success',
          text: isRtl
            ? `${selectedGift.nameUr} کامیابی سے بھیج دیا گیا! (+${data.pkScore.pointsAdded} پی کے اسکور)`
            : `Sent ${selectedGift.name}! (+${data.pkScore.pointsAdded} PK Score to ${data.receiver.name})`,
        });

        setTimeout(() => setActiveAnimation(null), 2500);
        setTimeout(() => setStatusNotice(null), 3000);
      } else {
        setStatusNotice({
          type: 'error',
          text: data.error || (isRtl ? 'تحفہ بھیجنے میں ناکامی' : 'Failed to send gift'),
        });
        setTimeout(() => setStatusNotice(null), 3500);
      }
    } catch {
      setStatusNotice({
        type: 'error',
        text: isRtl ? 'نیٹ ورک کا مسئلہ' : 'Network error sending gift',
      });
      setTimeout(() => setStatusNotice(null), 3500);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative w-full max-w-md mx-auto min-h-screen bg-[#0a0618] text-white flex flex-col justify-between overflow-hidden shadow-2xl font-sans select-none border-x border-[#231b3d]"
    >
      {/* 1. TOP HEADER (Matching 06_10_hand_off_to_real_gifts.png) */}
      <div className="relative z-20 pt-4 px-4 pb-2 flex items-center justify-between">
        {onBack ? (
          <button
            onClick={onBack}
            className="p-1 rounded-full text-white/80 hover:text-white"
          >
            <ArrowLeft className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
        ) : (
          <Link
            href="/pk"
            className="p-1 rounded-full text-white/80 hover:text-white"
          >
            <ArrowLeft className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
          </Link>
        )}

        <h1 className="text-lg font-black text-white tracking-wide">
          {isRtl ? 'تحفہ بھیجیں' : 'Send Gift'}
        </h1>

        <div className="flex items-center gap-1.5">
          <Link
            href={`/gifts/send?pkBattleId=${encodeURIComponent(battleId)}&preview=demo`}
            className="px-2.5 py-1 rounded-full bg-pink-500/20 border border-pink-400/35 text-[10px] font-bold text-pink-200 hover:bg-pink-500/30 transition"
          >
            {isRtl ? 'مکمل فہرست' : 'Full Stage'}
          </Link>
          <button
            onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-pink-400"
            title="Toggle Language"
          >
            <Globe className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. RECIPIENT HOST SELECTOR */}
      <div className="relative z-10 px-5 pt-1 pb-2">
        <div className="flex items-center justify-between p-1.5 rounded-2xl bg-[#140e29] border border-[#2e1d4d]">
          {/* Host A Option */}
          <button
            data-testid="recipient-host-a"
            onClick={() => setSelectedHostSide('host_a')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all ${
              selectedHostSide === 'host_a'
                ? 'bg-gradient-to-r from-[#ff2d78] to-[#ec4899] text-white font-extrabold shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <div className="w-6 h-6 rounded-full overflow-hidden border border-white/50">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80"
                alt="Sara Live"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xs">Sara Live (A)</span>
          </button>

          {/* Host B Option */}
          <button
            data-testid="recipient-host-b"
            onClick={() => setSelectedHostSide('host_b')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all ${
              selectedHostSide === 'host_b'
                ? 'bg-gradient-to-r from-[#2563eb] to-[#06b6d4] text-white font-extrabold shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <div className="w-6 h-6 rounded-full overflow-hidden border border-white/50">
              <img
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80"
                alt="Ayesha"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xs">Ayesha (B)</span>
          </button>
        </div>
      </div>

      {/* 3. 2x3 REAL GIFT GRID (Exact match to 06_10_hand_off_to_real_gifts.png) */}
      <div className="relative z-10 px-5 flex-1 flex flex-col justify-start">
        <div className="grid grid-cols-3 gap-3">
          {gifts.map((gift) => {
            const isSelected = selectedGiftId === gift.id;

            return (
              <div
                key={gift.id}
                data-testid={`gift-card-${gift.id}`}
                onClick={() => setSelectedGiftId(gift.id)}
                className={`relative cursor-pointer rounded-2xl p-3 flex flex-col items-center justify-between transition-all aspect-square ${
                  isSelected
                    ? 'bg-[#1e1338] border-2 border-[#ff2d78] shadow-[0_0_15px_rgba(255,45,120,0.4)] scale-[1.02]'
                    : 'bg-[#150f28] border border-[#2b1b47] hover:border-white/20'
                }`}
              >
                {/* Gift Visual Illustration */}
                <div className="flex-1 w-full flex items-center justify-center p-1">
                  {gift.id === 'rose' && (
                    <span className="text-4xl filter drop-shadow-[0_4px_8px_rgba(225,29,72,0.5)]">
                      🌹
                    </span>
                  )}
                  {gift.id === 'heart' && (
                    <span className="text-4xl filter drop-shadow-[0_4px_8px_rgba(236,72,153,0.5)]">
                      💖
                    </span>
                  )}
                  {gift.id === 'crown' && (
                    <span className="text-4xl filter drop-shadow-[0_4px_8px_rgba(234,179,8,0.5)]">
                      👑
                    </span>
                  )}
                  {gift.id === 'car' && (
                    <span className="text-4xl filter drop-shadow-[0_4px_8px_rgba(244,114,182,0.5)]">
                      🚗
                    </span>
                  )}
                  {gift.id === 'castle' && (
                    <span className="text-4xl filter drop-shadow-[0_4px_8px_rgba(168,85,247,0.5)]">
                      🏰
                    </span>
                  )}
                  {gift.id === 'rocket' && (
                    <span className="text-4xl filter drop-shadow-[0_4px_8px_rgba(59,130,246,0.5)]">
                      🚀
                    </span>
                  )}
                </div>

                {/* Price Pill: (Currency Icon + Price) */}
                <div className="mt-1 flex items-center gap-1">
                  {gift.currencyIcon === 'heart' ? (
                    <span className="text-xs text-pink-400">💗</span>
                  ) : gift.currencyIcon === 'diamond' ? (
                    <span className="text-xs text-cyan-400">💎</span>
                  ) : (
                    <span className="text-xs text-amber-400">🪙</span>
                  )}
                  <span className="text-xs font-black text-white tracking-tight">
                    {gift.coinPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Status Alert Banner */}
        {statusNotice && (
          <div
            className={`mt-3 p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              statusNotice.type === 'success'
                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}
          >
            {statusNotice.type === 'success' ? (
              <Check className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{statusNotice.text}</span>
          </div>
        )}
      </div>

      {/* 4. FLOATING GIFT BURST ANIMATION LAYER */}
      {activeAnimation && (
        <div className="absolute inset-0 z-30 pointer-events-none flex flex-col items-center justify-center">
          <div className="animate-bounce flex flex-col items-center bg-black/70 backdrop-blur-md p-4 rounded-3xl border border-[#ff2d78]/60 shadow-[0_0_30px_#ff2d78]">
            <div className="text-6xl mb-1">
              {activeAnimation.giftName === 'Rose' && '🌹'}
              {activeAnimation.giftName === 'Heart' && '💖'}
              {activeAnimation.giftName === 'Crown' && '👑'}
              {activeAnimation.giftName === 'Sports Car' && '🚗'}
              {activeAnimation.giftName === 'Magic Castle' && '🏰'}
              {activeAnimation.giftName === 'Space Rocket' && '🚀'}
            </div>
            <div className="text-xs font-black text-[#ff2d78] tracking-wider uppercase">
              {activeAnimation.giftName}
            </div>
            <div className="text-[11px] text-white/80 font-bold">
              +{activeAnimation.coins} PK Points
            </div>
          </div>
        </div>
      )}

      {/* 5. BOTTOM BAR (Coin Balance + Send Button, Exact match to 06_10) */}
      <div className="relative z-20 px-5 pt-3 pb-2 flex items-center justify-between">
        {/* Left: Golden Coin circle + Balance: 3,600 */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.5)] border border-yellow-200">
            <span className="text-base select-none">🪙</span>
          </div>
          <span className="text-lg font-black text-white tracking-tight">
            {viewerCoins.toLocaleString()}
          </span>
        </div>

        {/* Right: Rounded Neon Pink Send Button */}
        <button
          data-testid="send-gift-btn"
          onClick={handleSendGift}
          disabled={isSending}
          className="px-8 py-2.5 rounded-full bg-gradient-to-r from-[#e11d48] via-[#f43f5e] to-[#ec4899] text-white font-extrabold text-sm tracking-wide shadow-[0_4px_16px_rgba(244,63,94,0.4)] active:scale-95 hover:opacity-95 transition-all disabled:opacity-50"
        >
          {isSending
            ? isRtl
              ? 'بھیج رہا ہے...'
              : 'Sending...'
            : isRtl
            ? 'بھیجیں'
            : 'Send'}
        </button>
      </div>

      {/* 6. BOTTOM WATERMARK BADGE ("6.10 Hand-off to Real Gifts") */}
      <div className="relative z-20 py-4 px-4 flex justify-center bg-gradient-to-t from-[#0a0618] via-[#0a0618]/90 to-transparent">
        <div className="w-full max-w-xs py-3 rounded-2xl bg-gradient-to-r from-[#831843] via-[#881337] to-[#9f1239] text-white font-black text-center text-sm tracking-wide shadow-[0_4px_20px_rgba(159,18,57,0.4)] border border-pink-500/30">
          {isRtl ? '6.10 اصلی تحائف پر منتقلی' : '6.10 Hand-off to Real Gifts'}
        </div>
      </div>
    </div>
  );
}
