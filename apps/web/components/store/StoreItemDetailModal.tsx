'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  Coins,
  Clock,
  ShieldCheck,
  Crown,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
} from 'lucide-react';
import type { StoreItemRecord } from '@/lib/store';

interface StoreItemDetailModalProps {
  item: StoreItemRecord | null;
  walletCoins: number | null;
  isRtl: boolean;
  onClose: () => void;
  onPurchaseSuccess: (payload: { purchase: any; inventory: any; wallet: any }) => void;
  previewDemo?: boolean;
}

export function StoreItemDetailModal({
  item,
  walletCoins,
  isRtl,
  onClose,
  onPurchaseSuccess,
  previewDemo = false,
}: StoreItemDetailModalProps) {
  const [purchasing, setPurchasing] = useState(false);
  const [autoEquip, setAutoEquip] = useState(true);
  const [animatePreview, setAnimatePreview] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!item) return null;

  const elig = item.userEligibility;
  const hasEnoughCoins = walletCoins === null || walletCoins >= item.coinPrice;
  const canPurchase = (!elig || elig.eligible) && hasEnoughCoins && !purchasing;

  const displayName = isRtl && item.nameUr ? item.nameUr : item.name;
  const displayDesc = isRtl && item.descriptionUr ? item.descriptionUr : item.description;
  const displayCat = isRtl && item.categoryNameUr ? item.categoryNameUr : item.categoryName || item.categoryId;
  const displayDur = isRtl && item.durationLabelUr ? item.durationLabelUr : item.durationLabel;

  const handleConfirmPurchase = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setPurchasing(true);
    try {
      const idempKey = `web_pur_${item.itemId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const qs = previewDemo ? '?preview=demo' : '';
      const res = await fetch(`/api/store/purchase${qs}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-idempotency-key': idempKey,
        },
        body: JSON.stringify({
          itemId: item.itemId,
          quantity: 1,
          idempotencyKey: idempKey,
          autoEquip: item.isEquippable && autoEquip,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || (isRtl ? 'خریداری مکمل نہیں ہو سکی۔' : 'Purchase could not be completed.'));
      } else {
        setSuccessMsg(
          isRtl
            ? 'آئٹم کامیابی سے خریدا اور انوینٹری میں شامل ہو گیا!'
            : 'Purchased successfully and added to your inventory!'
        );
        onPurchaseSuccess({
          purchase: data.purchase,
          inventory: data.inventory,
          wallet: data.wallet,
        });
      }
    } catch {
      setErrorMsg(isRtl ? 'نیٹ ورک خرابی۔ دوبارہ کوشش کریں۔' : 'Network error during purchase.');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
      dir={isRtl ? 'rtl' : 'ltr'}
      data-testid="store-detail-modal"
    >
      <div className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#200c44] via-[#15072f] to-[#0e0422] border border-pink-500/35 shadow-[0_0_60px_rgba(255,46,116,0.3)] overflow-hidden">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-purple-500/25 border border-purple-400/35 text-purple-100">
            {displayCat}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Visual Showcase & Non-Deduction Preview Player */}
        <div className="px-5 py-2">
          <div
            className={`relative rounded-2xl bg-[#100526] border border-purple-400/25 p-5 flex flex-col items-center justify-center overflow-hidden ${
              animatePreview ? 'ring-2 ring-[#ff2e74] shadow-[0_0_40px_rgba(255,46,116,0.5)]' : ''
            }`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,46,116,0.18),transparent_70%)] pointer-events-none" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={animatePreview && item.animationAssetUrl ? item.animationAssetUrl : item.previewImageUrl}
              alt={displayName}
              className={`w-36 h-36 object-contain relative z-10 transition-transform duration-500 ${
                animatePreview ? 'scale-110 animate-pulse' : ''
              }`}
            />

            <button
              type="button"
              data-testid="store-preview-btn"
              onClick={() => setAnimatePreview((v) => !v)}
              className="mt-3 relative z-10 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-bold text-white"
            >
              <Play className="w-3.5 h-3.5 text-[#ff2e74] fill-[#ff2e74]" />
              <span>
                {animatePreview
                  ? isRtl
                    ? 'پریویو روکیں (مفت)'
                    : 'Stop Preview (Free)'
                  : isRtl
                  ? 'مفت پریویو دیکھیں'
                  : 'Preview Effect (0 Coins)'}
              </span>
            </button>
          </div>
        </div>

        {/* Item Info */}
        <div className="px-5 pt-2 pb-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white leading-tight">{displayName}</h2>
              <p className="text-xs text-white/65 mt-1 leading-relaxed">{displayDesc}</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-400/15 border border-amber-400/35 flex-shrink-0">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-base font-black text-amber-300 tabular-nums">
                {item.coinPrice.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Duration, Slot & Current Coin Balance */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-white/[0.04] border border-white/10 p-2.5 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-300 flex-shrink-0" />
              <div>
                <div className="text-[10px] text-white/50">{isRtl ? 'مدت' : 'Duration'}</div>
                <div className="font-bold text-white">{displayDur}</div>
              </div>
            </div>
            <div className="rounded-xl bg-white/[0.04] border border-white/10 p-2.5 flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div>
                <div className="text-[10px] text-white/50">{isRtl ? 'موجودہ بیلنس' : 'Your Balance'}</div>
                <div className="font-bold text-amber-300 tabular-nums">
                  {walletCoins !== null ? `${walletCoins.toLocaleString()} Coins` : 'Sign in'}
                </div>
              </div>
            </div>
          </div>

          {/* Eligibility Badges */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3 space-y-1.5">
            <div className="text-[11px] font-extrabold text-purple-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isRtl ? 'اہلیت اور شرائط' : 'Eligibility & Limits'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {(item.vipOnly || item.requiredVipLevel > 0) && (
                <span
                  className={`px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 border ${
                    elig?.vipMet !== false
                      ? 'bg-amber-500/20 border-amber-400/40 text-amber-200'
                      : 'bg-rose-500/20 border-rose-400/40 text-rose-200'
                  }`}
                >
                  <Crown className="w-3 h-3" />
                  VIP Lv.{Math.max(1, item.requiredVipLevel)}+
                </span>
              )}
              {item.minWealthLevel > 1 && (
                <span
                  className={`px-2 py-0.5 rounded-full font-bold border ${
                    elig?.wealthMet !== false
                      ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-200'
                      : 'bg-rose-500/20 border-rose-400/40 text-rose-200'
                  }`}
                >
                  Wealth Lv.{item.minWealthLevel}+
                </span>
              )}
              {item.minShiningLevel > 1 && (
                <span
                  className={`px-2 py-0.5 rounded-full font-bold border ${
                    elig?.shiningMet !== false
                      ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-200'
                      : 'bg-rose-500/20 border-rose-400/40 text-rose-200'
                  }`}
                >
                  Shining Lv.{item.minShiningLevel}+
                </span>
              )}
              {item.minHonorLevel > 1 && (
                <span
                  className={`px-2 py-0.5 rounded-full font-bold border ${
                    elig?.honorMet !== false
                      ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-200'
                      : 'bg-rose-500/20 border-rose-400/40 text-rose-200'
                  }`}
                >
                  Honor Lv.{item.minHonorLevel}+
                </span>
              )}
              {item.usageLimitPerUser !== null && (
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 font-bold">
                  {isRtl ? `حد: ${item.usageLimitPerUser}` : `Limit: ${item.usageLimitPerUser}/user`}
                </span>
              )}
              {!item.vipOnly &&
                item.requiredVipLevel === 0 &&
                item.minWealthLevel <= 1 &&
                item.minShiningLevel <= 1 &&
                item.minHonorLevel <= 1 &&
                item.usageLimitPerUser === null && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-bold">
                    {isRtl ? 'تمام صارفین کے لیے دستیاب' : 'Open to all verified users'}
                  </span>
                )}
            </div>
            {elig && !elig.eligible && elig.reasons.length > 0 && (
              <p className="text-[11px] text-rose-300 font-semibold pt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{elig.reasons[0]}</span>
              </p>
            )}
          </div>

          {item.isEquippable && item.equipSlot !== 'none' && (
            <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoEquip}
                onChange={(e) => setAutoEquip(e.target.checked)}
                className="accent-[#ff2e74] w-4 h-4"
              />
              <span>{isRtl ? 'خریداری کے فوراً بعد فعال (Equip) کریں' : 'Equip immediately after purchase'}</span>
            </label>
          )}

          {errorMsg && (
            <div className="rounded-xl bg-rose-500/15 border border-rose-400/40 px-3 py-2 text-xs text-rose-200 font-semibold flex items-center justify-between gap-2">
              <span>{errorMsg}</span>
              {!hasEnoughCoins && (
                <Link href="/recharge" className="text-amber-300 underline font-bold flex-shrink-0">
                  {isRtl ? 'ٹاپ اپ' : 'Top-up'}
                </Link>
              )}
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl bg-emerald-500/15 border border-emerald-400/40 px-3 py-2 text-xs text-emerald-200 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-xs font-extrabold text-white/80"
            >
              {isRtl ? 'بند کریں' : 'Close'}
            </button>
            <button
              type="button"
              data-testid="store-confirm-purchase-btn"
              disabled={!canPurchase}
              onClick={handleConfirmPurchase}
              className={`flex-1 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                canPurchase
                  ? 'bg-gradient-to-r from-[#ff2e74] to-[#ec4899] text-white shadow-[0_0_24px_rgba(255,46,116,0.5)] hover:brightness-110 active:scale-95'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {purchasing
                  ? isRtl
                    ? 'پروسیس ہو رہا ہے...'
                    : 'Purchasing...'
                  : !hasEnoughCoins
                  ? isRtl
                    ? 'ناکافی سکے (Top-up کریں)'
                    : 'Insufficient Coins'
                  : isRtl
                  ? `${item.coinPrice.toLocaleString()} سکوں میں خریدیں`
                  : `Purchase • ${item.coinPrice.toLocaleString()} Coins`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
