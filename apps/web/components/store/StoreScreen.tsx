'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  Globe,
  Search,
  Coins,
  Crown,
  Sparkles,
  ShoppingBag,
  Backpack,
  Flame,
  Clock,
  Lock,
  Wifi,
  WifiOff,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type {
  StoreCategoryRecord,
  StoreItemRecord,
  StorePurchaseRecord,
  UserEquippedStoreLoadout,
  UserStoreInventoryRecord,
} from '@/lib/store';
import { StoreItemDetailModal } from '@/components/store/StoreItemDetailModal';
import { InventoryPanel } from '@/components/store/InventoryPanel';

interface StoreScreenProps {
  initialLanguage?: 'en' | 'ur';
  initialTab?: 'store' | 'inventory';
  previewDemo?: boolean;
}

export default function StoreScreen({
  initialLanguage = 'en',
  initialTab = 'store',
  previewDemo = false,
}: StoreScreenProps) {
  const [lang, setLang] = useState<'en' | 'ur'>(initialLanguage);
  const isRtl = lang === 'ur';

  const [mainTab, setMainTab] = useState<'store' | 'inventory'>(initialTab);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [shelfFilter, setShelfFilter] = useState<'all' | 'featured' | 'popular' | 'new'>('all');
  const [searchInput, setSearchInput] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [categories, setCategories] = useState<StoreCategoryRecord[]>([]);
  const [items, setItems] = useState<StoreItemRecord[]>([]);
  const [featuredItems, setFeaturedItems] = useState<StoreItemRecord[]>([]);
  const [popularItems, setPopularItems] = useState<StoreItemRecord[]>([]);
  const [newArrivals, setNewArrivals] = useState<StoreItemRecord[]>([]);

  const [walletCoins, setWalletCoins] = useState<number | null>(null);
  const [inventoryItems, setInventoryItems] = useState<UserStoreInventoryRecord[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<StorePurchaseRecord[]>([]);
  const [equipped, setEquipped] = useState<UserEquippedStoreLoadout | null>(null);

  const [selectedItem, setSelectedItem] = useState<StoreItemRecord | null>(null);
  const [busyInventoryId, setBusyInventoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sseConnected, setSseConnected] = useState<boolean>(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const sseRef = useRef<EventSource | null>(null);
  const qsPrefix = previewDemo ? 'preview=demo' : '';

  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(searchInput.trim()), 260);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadCatalog = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (previewDemo) params.set('preview', 'demo');
      if (activeCategory !== 'all') params.set('categoryId', activeCategory);
      if (shelfFilter !== 'all') params.set('filter', shelfFilter);
      if (searchTerm) params.set('search', searchTerm);

      const res = await fetch(`/api/store/catalog?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
        setItems(data.items || []);
        setFeaturedItems(data.featuredItems || []);
        setPopularItems(data.popularItems || []);
        setNewArrivals(data.newArrivals || []);
        if (data.wallet && typeof data.wallet.coins === 'number') {
          setWalletCoins(data.wallet.coins);
        }
      }
    } catch (err) {
      console.error('Failed to load store catalog:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, shelfFilter, searchTerm, previewDemo]);

  const loadInventory = useCallback(async () => {
    try {
      const qs = qsPrefix ? `?${qsPrefix}` : '';
      const res = await fetch(`/api/store/inventory${qs}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setInventoryItems(data.items || []);
        setPurchaseHistory(data.purchaseHistory || []);
        setEquipped(data.equipped || null);
      }
    } catch {
      // unauthenticated visitor browsing store anonymously
    }
  }, [qsPrefix]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Real-time SSE updates for purchases, equips, expires & admin catalog updates
  useEffect(() => {
    if (typeof EventSource === 'undefined') return;
    const qs = qsPrefix ? `?${qsPrefix}` : '';
    const es = new EventSource(`/api/store/events${qs}`);
    sseRef.current = es;

    es.onopen = () => setSseConnected(true);
    es.onerror = () => setSseConnected(false);

    const refreshAll = () => {
      loadCatalog();
      loadInventory();
    };

    es.addEventListener('store:purchase_completed', (ev: any) => {
      try {
        const d = JSON.parse(ev.data);
        if (typeof d.coinsBalance === 'number') setWalletCoins(d.coinsBalance);
      } catch {}
      refreshAll();
    });
    es.addEventListener('store:inventory_updated', refreshAll);
    es.addEventListener('store:item_equipped', refreshAll);
    es.addEventListener('store:item_unequipped', refreshAll);
    es.addEventListener('store:item_expired', refreshAll);
    es.addEventListener('store:item_created', loadCatalog);
    es.addEventListener('store:item_updated', loadCatalog);
    es.addEventListener('store:item_disabled', loadCatalog);

    return () => {
      es.close();
      setSseConnected(false);
    };
  }, [qsPrefix, loadCatalog, loadInventory]);

  const handleEquip = async (inventoryId: string) => {
    setBusyInventoryId(inventoryId);
    setNotice(null);
    try {
      const qs = qsPrefix ? `?${qsPrefix}` : '';
      const res = await fetch(`/api/store/equip${qs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventoryId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setNotice({ type: 'error', text: data.error || 'Could not equip item.' });
      } else {
        setEquipped(data.equipped);
        setNotice({
          type: 'success',
          text: isRtl ? 'آئٹم پروفائل پر فعال کر دیا گیا!' : 'Item equipped and synced to your profile!',
        });
        await loadInventory();
      }
    } finally {
      setBusyInventoryId(null);
    }
  };

  const handleUnequip = async (inventoryId: string) => {
    setBusyInventoryId(inventoryId);
    setNotice(null);
    try {
      const qs = qsPrefix ? `?${qsPrefix}` : '';
      const res = await fetch(`/api/store/unequip${qs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventoryId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setNotice({ type: 'error', text: data.error || 'Could not unequip item.' });
      } else {
        setEquipped(data.equipped);
        setNotice({
          type: 'info',
          text: isRtl ? 'آئٹم ہٹا دیا گیا ہے۔' : 'Item unequipped cleanly.',
        });
        await loadInventory();
      }
    } finally {
      setBusyInventoryId(null);
    }
  };

  const openItemPreview = async (item: StoreItemRecord) => {
    setSelectedItem(item);
    try {
      const qs = qsPrefix ? `?${qsPrefix}` : '';
      const res = await fetch(`/api/store/items/${encodeURIComponent(item.itemId)}${qs}`);
      const data = await res.json();
      if (data.success && data.item) {
        setSelectedItem(data.item);
      }
      if (data.wallet && typeof data.wallet.coins === 'number') {
        setWalletCoins(data.wallet.coins);
      }
    } catch {
      // keep initial item card details
    }
  };

  const renderStoreCard = (item: StoreItemRecord, compact = false) => {
    const title = isRtl && item.nameUr ? item.nameUr : item.name;
    const catShort = isRtl && item.categoryShortLabelUr ? item.categoryShortLabelUr : item.categoryShortLabel || item.categoryName;
    const durLabel = isRtl && item.durationLabelUr ? item.durationLabelUr : item.durationLabel;
    const isRestricted = item.vipOnly || item.requiredVipLevel > 0 || item.minWealthLevel > 1 || item.minShiningLevel > 1 || item.minHonorLevel > 1;
    const isBlocked = item.userEligibility && !item.userEligibility.eligible;

    return (
      <div
        key={item.itemId}
        data-testid={`store-item-card-${item.itemId}`}
        onClick={() => openItemPreview(item)}
        className={`group cursor-pointer rounded-3xl bg-gradient-to-b from-[#230e48] to-[#160832] border border-purple-500/25 hover:border-[#ff2e74]/60 p-3 shadow-[0_8px_28px_rgba(10,3,30,0.45)] transition-all hover:-translate-y-0.5 flex flex-col ${
          compact ? 'min-w-[162px] max-w-[175px]' : ''
        }`}
      >
        {/* Top Tag Row */}
        <div className="flex items-center justify-between gap-1 mb-2">
          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-white/[0.07] text-purple-200 truncate">
            {catShort}
          </span>
          <div className="flex items-center gap-1">
            {(item.vipOnly || item.requiredVipLevel > 0) && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center gap-0.5">
                <Crown className="w-2.5 h-2.5" /> VIP
              </span>
            )}
            {isBlocked && <Lock className="w-3 h-3 text-rose-400" />}
          </div>
        </div>

        {/* Center Illustration Card Box */}
        <div className="relative rounded-2xl bg-[#100425] border border-purple-400/20 aspect-square flex items-center justify-center p-3 overflow-hidden mb-2.5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,46,116,0.16),transparent_68%)] opacity-80 group-hover:opacity-100 transition-opacity" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.thumbnailUrl}
            alt={title}
            className="w-24 h-24 object-contain relative z-10 group-hover:scale-105 transition-transform duration-300"
          />
          {item.isNewArrival && (
            <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[8px] font-black bg-[#ff2e74] text-white uppercase">
              NEW
            </span>
          )}
        </div>

        {/* Item Name, Duration & Gold Coin Price */}
        <h3 className="text-sm font-black text-white text-center truncate">{title}</h3>
        <div className="flex items-center justify-center gap-1 text-[10px] text-white/55 mt-0.5">
          <Clock className="w-3 h-3 text-cyan-300" />
          <span>{durLabel}</span>
          {isRestricted && !item.vipOnly && item.minWealthLevel > 1 && <span>• W{item.minWealthLevel}+</span>}
          {isRestricted && !item.vipOnly && item.minShiningLevel > 1 && <span>• S{item.minShiningLevel}+</span>}
          {isRestricted && !item.vipOnly && item.minHonorLevel > 1 && <span>• H{item.minHonorLevel}+</span>}
        </div>

        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1 font-black text-sm text-amber-300 tabular-nums">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{item.coinPrice.toLocaleString()}</span>
          </div>
          <button
            type="button"
            data-testid={`store-buy-btn-${item.itemId}`}
            onClick={(e) => {
              e.stopPropagation();
              openItemPreview(item);
            }}
            className="px-3 py-1 rounded-full bg-gradient-to-r from-[#ff2e74] to-[#ec4899] hover:brightness-110 text-white text-[11px] font-extrabold shadow-[0_0_14px_rgba(255,46,116,0.45)]"
          >
            {isRtl ? 'خریدیں' : 'Buy'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-gradient-to-b from-[#0E0526] via-[#130730] to-[#0A031B] text-white pb-14"
    >
      {/* Ambient Radial Aura */}
      <div className="fixed inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(255,46,116,0.18),transparent_70%)] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 pt-4">
        {/* 1. Top Branded Popo Live Header */}
        <header className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <Link
              href={previewDemo ? '/wallet?preview=demo' : '/wallet'}
              className="w-9 h-9 rounded-full bg-white/[0.07] hover:bg-white/[0.14] border border-white/10 flex items-center justify-center"
            >
              <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#ff2e74] to-amber-400 flex items-center justify-center shadow-[0_0_14px_rgba(255,46,116,0.5)]">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-pink-300 leading-none">POPO LIVE</div>
                <h1 className="text-lg font-black tracking-tight leading-tight">
                  {isRtl ? 'ورچوئل اسٹور' : 'Store'}
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                sseConnected
                  ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-white/50'
              }`}
            >
              {sseConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{sseConnected ? 'LIVE' : 'SYNC'}</span>
            </span>

            <button
              type="button"
              data-testid="store-lang-toggle"
              onClick={() => setLang((l) => (l === 'en' ? 'ur' : 'en'))}
              className="px-2.5 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.14] border border-white/10 text-xs font-extrabold inline-flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5 text-pink-400" />
              <span>{isRtl ? 'EN' : 'اردو'}</span>
            </button>

            <button
              type="button"
              data-testid="store-inventory-shortcut"
              onClick={() => setMainTab((t) => (t === 'store' ? 'inventory' : 'store'))}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5 border transition-all ${
                mainTab === 'inventory'
                  ? 'bg-[#ff2e74] border-pink-300 text-white shadow-[0_0_16px_rgba(255,46,116,0.5)]'
                  : 'bg-white/[0.07] border-white/10 text-white hover:bg-white/[0.12]'
              }`}
            >
              <Backpack className="w-3.5 h-3.5 text-amber-300" />
              <span>
                {isRtl
                  ? `انوینٹری (${inventoryItems.filter((i) => i.status === 'active').length})`
                  : `Inventory (${inventoryItems.filter((i) => i.status === 'active').length})`}
              </span>
            </button>
          </div>
        </header>

        {/* 2. Wallet Coin Balance + Top-up Shortcut + Store/Inventory Switcher */}
        <div className="rounded-3xl bg-gradient-to-r from-[#230e48] via-[#1c0a3a] to-[#260e49] border border-purple-400/25 p-3.5 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 p-0.5 shadow-[0_0_16px_rgba(245,158,11,0.45)] flex items-center justify-center">
              <Coins className="w-5 h-5 text-amber-950" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-200/70">
                {isRtl ? 'آپ کے دستیاب سکے' : 'Available Coin Balance'}
              </div>
              <div data-testid="store-wallet-coins" className="text-xl font-black text-amber-300 tabular-nums">
                {walletCoins !== null ? `${walletCoins.toLocaleString()} Coins` : 'Sign in to purchase'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={previewDemo ? '/recharge?preview=demo' : '/recharge'}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-extrabold text-white"
            >
              {isRtl ? 'ٹاپ اپ' : '+ Top-up'}
            </Link>
            <button
              type="button"
              onClick={() => setMainTab('store')}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all ${
                mainTab === 'store'
                  ? 'bg-gradient-to-r from-[#ff2e74] to-[#ec4899] text-white shadow-md'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              {isRtl ? 'اسٹور' : 'Browse Store'}
            </button>
            <button
              type="button"
              data-testid="store-tab-inventory-btn"
              onClick={() => setMainTab('inventory')}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all ${
                mainTab === 'inventory'
                  ? 'bg-gradient-to-r from-[#ff2e74] to-[#ec4899] text-white shadow-md'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              {isRtl ? 'میری انوینٹری' : 'My Inventory'}
            </button>
          </div>
        </div>

        {notice && (
          <div
            className={`mb-4 rounded-2xl px-4 py-3 text-xs font-bold border flex items-center gap-2 ${
              notice.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                : notice.type === 'error'
                ? 'bg-rose-500/15 border-rose-400/40 text-rose-200'
                : 'bg-cyan-500/15 border-cyan-400/40 text-cyan-200'
            }`}
          >
            {notice.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{notice.text}</span>
          </div>
        )}

        {mainTab === 'inventory' ? (
          <InventoryPanel
            items={inventoryItems}
            purchaseHistory={purchaseHistory}
            equipped={equipped}
            isRtl={isRtl}
            onEquip={handleEquip}
            onUnequip={handleUnequip}
            busyInventoryId={busyInventoryId}
          />
        ) : (
          <>
            {/* 3. Search Bar & Quick Highlight Tabs */}
            <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
              <div className="relative flex-1">
                <Search className={`w-4 h-4 text-white/45 absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-3.5' : 'left-3.5'}`} />
                <input
                  type="text"
                  data-testid="store-search-input"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={isRtl ? 'اسٹور آئٹمز تلاش کریں...' : 'Search frames, bubbles, themes, effects...'}
                  className={`w-full bg-[#170936] border border-purple-500/25 focus:border-[#ff2e74] outline-none rounded-2xl py-2.5 text-xs text-white ${
                    isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'
                  }`}
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto">
                {(
                  [
                    { id: 'all', en: 'All', ur: 'سب' },
                    { id: 'featured', en: 'Featured', ur: 'نمایاں' },
                    { id: 'popular', en: 'Popular', ur: 'مقبول' },
                    { id: 'new', en: 'New Arrivals', ur: 'نئے آئٹمز' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setShelfFilter(f.id)}
                    className={`px-3 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap border transition-all ${
                      shelfFilter === f.id
                        ? 'bg-[#ff2e74]/20 border-[#ff2e74] text-pink-200'
                        : 'bg-white/[0.04] border-white/10 text-white/65 hover:text-white'
                    }`}
                  >
                    {isRtl ? f.ur : f.en}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Configurable Store Categories Bar (From PostgreSQL, matches 07_09_store.png) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide" data-testid="store-categories-bar">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all border ${
                  activeCategory === 'all'
                    ? 'bg-gradient-to-r from-[#ff2e74] to-[#ec4899] border-pink-400 text-white shadow-[0_0_18px_rgba(255,46,116,0.5)]'
                    : 'bg-white/[0.05] border-white/10 text-white/75 hover:text-white'
                }`}
              >
                {isRtl ? 'تمام کیٹیگریز' : 'All'}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.categoryId}
                  type="button"
                  data-testid={`store-cat-${cat.categoryId}`}
                  onClick={() => setActiveCategory(cat.categoryId)}
                  className={`px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all border ${
                    activeCategory === cat.categoryId
                      ? 'bg-gradient-to-r from-[#ff2e74] to-[#ec4899] border-pink-400 text-white shadow-[0_0_18px_rgba(255,46,116,0.5)]'
                      : 'bg-white/[0.05] border-white/10 text-white/75 hover:text-white'
                  }`}
                >
                  {isRtl ? cat.shortLabelUr : cat.shortLabel}
                </button>
              ))}
            </div>

            {/* 5. Featured Shelf */}
            {activeCategory === 'all' && shelfFilter === 'all' && !searchTerm && featuredItems.length > 0 && (
              <section className="mb-6">
                <div className="flex items-center justify-between mb-2.5">
                  <h2 className="text-sm font-black flex items-center gap-1.5 text-white">
                    <Sparkles className="w-4 h-4 text-[#ff2e74]" />
                    <span>{isRtl ? 'نمایاں آئٹمز' : 'Featured Store Highlights'}</span>
                  </h2>
                  <span className="text-[11px] font-bold text-pink-300">
                    {isRtl ? `${featuredItems.length} خاص آئٹمز` : `${featuredItems.length} curated picks`}
                  </span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {featuredItems.map((it) => renderStoreCard(it, true))}
                </div>
              </section>
            )}

            {/* 6. Popular & New Arrivals Pills Banner */}
            {activeCategory === 'all' && shelfFilter === 'all' && !searchTerm && popularItems.length > 0 && (
              <section className="mb-5 rounded-3xl bg-[#160832]/85 border border-purple-500/20 p-3.5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>{isRtl ? 'مقبول اور نئے آئٹمز' : 'Popular & New Arrivals'}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShelfFilter('popular')}
                      className="text-[11px] font-bold text-pink-300 hover:underline"
                    >
                      {isRtl ? 'سب مقبول' : 'Popular →'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShelfFilter('new')}
                      className="text-[11px] font-bold text-cyan-300 hover:underline"
                    >
                      {isRtl ? 'نئے آئٹمز' : 'New →'}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {newArrivals.slice(0, 4).map((it) => (
                    <button
                      key={it.itemId}
                      type="button"
                      onClick={() => openItemPreview(it)}
                      className="flex items-center gap-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 p-2 text-left transition"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={it.thumbnailUrl} alt={it.name} className="w-10 h-10 rounded-xl object-contain bg-[#0c041e] p-1" />
                      <div className="min-w-0">
                        <div className="text-[11px] font-extrabold text-white truncate">
                          {isRtl && it.nameUr ? it.nameUr : it.name}
                        </div>
                        <div className="text-[10px] font-black text-amber-300">{it.coinPrice.toLocaleString()} Coins</div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* 7. Main Store Item Grid */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span>
                    {isRtl ? 'تمام دستیاب ورچوئل آئٹمز' : 'Store Catalog'}
                  </span>
                </h2>
                <span className="text-[11px] text-white/55 font-bold">
                  {items.length} {isRtl ? 'آئٹمز' : 'items'}
                </span>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-64 rounded-3xl bg-white/[0.04] animate-pulse border border-white/10" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-3xl bg-[#160832] border border-purple-500/25 p-8 text-center text-xs text-white/60">
                  {isRtl ? 'اس تلاش یا کیٹیگری میں کوئی آئٹم نہیں ملا۔' : 'No store items found matching your filter.'}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5" data-testid="store-items-grid">
                  {items.map((it) => renderStoreCard(it, false))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Item Detail Preview & Purchase Modal */}
      <StoreItemDetailModal
        item={selectedItem}
        walletCoins={walletCoins}
        isRtl={isRtl}
        previewDemo={previewDemo}
        onClose={() => setSelectedItem(null)}
        onPurchaseSuccess={({ wallet }) => {
          if (wallet && typeof wallet.coins === 'number') setWalletCoins(wallet.coins);
          loadCatalog();
          loadInventory();
        }}
      />
    </div>
  );
}
