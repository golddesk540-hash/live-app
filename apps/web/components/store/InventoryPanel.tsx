'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck,
  Sparkles,
  XCircle,
  History,
  Coins,
} from 'lucide-react';
import type {
  StorePurchaseRecord,
  UserEquippedStoreLoadout,
  UserStoreInventoryRecord,
} from '@/lib/store';

interface InventoryPanelProps {
  items: UserStoreInventoryRecord[];
  purchaseHistory: StorePurchaseRecord[];
  equipped: UserEquippedStoreLoadout | null;
  isRtl: boolean;
  onEquip: (inventoryId: string) => Promise<void>;
  onUnequip: (inventoryId: string) => Promise<void>;
  busyInventoryId: string | null;
}

export function InventoryPanel({
  items,
  purchaseHistory,
  equipped,
  isRtl,
  onEquip,
  onUnequip,
  busyInventoryId,
}: InventoryPanelProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'equipped' | 'expired' | 'history'>('all');

  const filteredItems = items.filter((item) => {
    if (filterStatus === 'active') return item.status === 'active';
    if (filterStatus === 'equipped') return item.status === 'active' && item.isEquipped;
    if (filterStatus === 'expired') return item.status === 'expired';
    return true;
  });

  const activeCount = items.filter((i) => i.status === 'active').length;
  const expiredCount = items.filter((i) => i.status === 'expired').length;
  const equippedSlotsCount = equipped ? Object.keys(equipped.itemsBySlot || {}).length : 0;

  return (
    <div className="space-y-4" dir={isRtl ? 'rtl' : 'ltr'} data-testid="store-inventory-panel">
      {/* Equipped Summary Ribbon */}
      <div className="rounded-3xl bg-gradient-to-r from-[#230e4a] to-[#170933] border border-pink-500/25 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ff2e74] to-[#a855f7] flex items-center justify-center shadow-lg">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-black text-white">
              {isRtl ? 'میری انوینٹری اور فعال سجاوٹ' : 'My Inventory & Active Loadout'}
            </div>
            <div className="text-[11px] text-white/60">
              {isRtl
                ? `فعال: ${activeCount} • آراستہ (Equipped): ${equippedSlotsCount} • ختم شدہ: ${expiredCount}`
                : `Active: ${activeCount} • Equipped Slots: ${equippedSlotsCount} • Expired: ${expiredCount}`}
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-[11px] font-bold text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{isRtl ? 'سرور سے تصدیق شدہ' : 'Server-Verified Ownership'}</span>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'all', en: `All (${items.length})`, ur: `سب (${items.length})` },
            { id: 'active', en: `Active (${activeCount})`, ur: `فعال (${activeCount})` },
            { id: 'equipped', en: `Equipped (${equippedSlotsCount})`, ur: `منتخب (${equippedSlotsCount})` },
            { id: 'expired', en: `Expired (${expiredCount})`, ur: `ختم (${expiredCount})` },
            { id: 'history', en: `Purchase History (${purchaseHistory.length})`, ur: `خریداری ہسٹری (${purchaseHistory.length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-testid={`inv-filter-${tab.id}`}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all border ${
              filterStatus === tab.id
                ? 'bg-gradient-to-r from-[#ff2e74] to-[#ec4899] border-pink-400 text-white shadow-[0_0_16px_rgba(255,46,116,0.4)]'
                : 'bg-white/[0.04] border-white/10 text-white/70 hover:text-white'
            }`}
          >
            {isRtl ? tab.ur : tab.en}
          </button>
        ))}
      </div>

      {/* Purchase History Table */}
      {filterStatus === 'history' ? (
        <div className="rounded-3xl bg-[#14082b] border border-purple-500/25 overflow-hidden">
          {purchaseHistory.length === 0 ? (
            <div className="p-8 text-center text-xs text-white/55">
              {isRtl ? 'ابھی تک کوئی خریداری ریکارڈ نہیں ملی۔' : 'No store purchase records yet.'}
            </div>
          ) : (
            <div className="divide-y divide-purple-500/15">
              {purchaseHistory.map((pur) => (
                <div key={pur.purchaseId} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <History className="w-4 h-4 text-pink-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-white truncate">{pur.itemNameSnapshot}</div>
                      <div className="text-[10px] text-white/50 font-mono truncate">
                        {pur.purchaseId} • {new Date(pur.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-black text-amber-300 flex items-center justify-end gap-1">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span>{pur.totalCoins.toLocaleString()}</span>
                    </div>
                    <span
                      className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        pur.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : pur.status === 'refunded' || pur.status === 'reversed'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {pur.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-3xl bg-[#14082b] border border-purple-500/25 p-8 text-center">
          <Sparkles className="w-8 h-8 text-pink-400/60 mx-auto mb-2" />
          <p className="text-sm font-bold text-white/80">
            {isRtl ? 'اس فلٹر میں کوئی آئٹم موجود نہیں ہے۔' : 'No items match this inventory filter.'}
          </p>
          <p className="text-xs text-white/50 mt-1">
            {isRtl
              ? 'اسٹور سے نئے فریمز، چیٹ ببلز یا انٹری ایفیکٹس خریدیں!'
              : 'Browse the Virtual Store to unlock frames, chat bubbles, badges & effects.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredItems.map((inv) => {
            const isBusy = busyInventoryId === inv.inventoryId;
            const isActive = inv.status === 'active';
            const displayName = isRtl && inv.itemNameUr ? inv.itemNameUr : inv.itemName;
            const displayCat = isRtl && inv.categoryNameUr ? inv.categoryNameUr : inv.categoryName || inv.categoryId;

            return (
              <div
                key={inv.inventoryId}
                data-testid={`inv-card-${inv.inventoryId}`}
                className={`rounded-3xl p-4 border transition-all ${
                  inv.isEquipped && isActive
                    ? 'bg-gradient-to-b from-[#2b1057] to-[#180736] border-[#ff2e74]/60 shadow-[0_0_24px_rgba(255,46,116,0.28)]'
                    : 'bg-[#160833] border-purple-500/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-[#0d0420] border border-white/10 p-1.5 flex items-center justify-center flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={inv.thumbnailUrl} alt={displayName} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-purple-200/75 truncate">{displayCat}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          inv.isEquipped && isActive
                            ? 'bg-[#ff2e74] text-white'
                            : isActive
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-white/10 text-white/50'
                        }`}
                      >
                        {inv.isEquipped && isActive
                          ? isRtl
                            ? 'منتخب (Equipped)'
                            : 'Equipped'
                          : isActive
                          ? isRtl
                            ? 'فعال'
                            : 'Active'
                          : inv.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-white truncate mt-0.5">{displayName}</h3>
                    <div className="text-[10px] text-white/55 mt-1 space-y-0.5">
                      <div>
                        {isRtl ? 'خریداری: ' : 'Purchased: '}
                        {new Date(inv.purchasedAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-300" />
                        <span>
                          {inv.expiresAt
                            ? `${isRtl ? 'ختم: ' : 'Expires: '}${new Date(inv.expiresAt).toLocaleDateString()}`
                            : isRtl
                            ? 'مدت: مستقل'
                            : 'Duration: Permanent'}
                        </span>
                      </div>
                      <div>
                        {isRtl ? `تعداد: ${inv.quantity}` : `Qty: ${inv.quantity}`} •{' '}
                        <span className="font-mono text-purple-200">{inv.equipSlot}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  {inv.isEquippable && inv.equipSlot !== 'none' && isActive ? (
                    inv.isEquipped ? (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onUnequip(inv.inventoryId)}
                        className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-extrabold text-white flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5 text-pink-300" />
                        <span>{isBusy ? '...' : isRtl ? 'ان ایکوئپ کریں (Unequip)' : 'Unequip Item'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onEquip(inv.inventoryId)}
                        className="w-full py-2 rounded-xl bg-gradient-to-r from-[#ff2e74] to-[#ec4899] hover:brightness-110 text-xs font-extrabold text-white flex items-center justify-center gap-1.5 shadow-[0_0_16px_rgba(255,46,116,0.35)]"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isBusy ? '...' : isRtl ? 'فعال کریں (Equip)' : 'Equip / Replace'}</span>
                      </button>
                    )
                  ) : (
                    <div className="w-full py-2 rounded-xl bg-white/5 text-center text-[11px] font-bold text-white/45">
                      {!isActive
                        ? isRtl
                          ? 'میعاد ختم / غیر فعال آئٹم'
                          : 'Expired or revoked — cannot equip'
                        : isRtl
                        ? 'کلیکٹیبل آئٹم'
                        : 'Collectible item'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
