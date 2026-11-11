'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  Crown,
  Flame,
  Gift,
  Languages,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
  X,
} from 'lucide-react';
import type { GiftCatalogItem, GiftCategoryRecord } from '@/lib/giftCatalog';
import GiftAnimationPreview, {
  DEFAULT_FALLBACK_GIFT_IMAGE,
} from './GiftAnimationPreview';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const COPY = {
  en: {
    brand: 'Popo Live',
    title: 'Gift Catalog',
    searchPlaceholder: 'Search gifts by name, type, or Urdu...',
    clear: 'Clear',
    featuredHeading: 'Featured Gifts',
    popularHeading: 'Popular Gifts',
    newHeading: 'New Arrivals',
    allCatalogHeading: 'Explore Catalog',
    loading: 'Loading virtual gifts...',
    emptyTitle: 'No matching gifts found',
    emptySubtitle: 'Try clearing your search filter or choosing another category.',
    loadMore: 'Load More Gifts',
    coins: 'Coins',
    coinBalanceLabel: 'Your Coins',
    previewOnlyNotice: 'Preview only — no coins are deducted in the catalog.',
    selectGift: 'Select Gift',
    giftSelectedToast: 'Gift selected cleanly without deducting coins',
    categoryLabel: 'Category',
    giftTypeLabel: 'Gift Type',
    popularityLabel: 'Popularity',
    statusAvailable: 'Available',
    statusDisabled: 'Unavailable',
    affordable: 'Ready with current coin balance',
    needMoreCoins: 'Need more coins to send',
    walletLink: 'Wallet',
    adminLink: 'Admin Catalog',
    refresh: 'Refresh',
    liveSynced: 'Live Catalog Synced',
    badgeCode: 'P7.2',
    badgeLabel: 'Gift Catalog',
    close: 'Close',
    popularTag: 'Popular',
    newTag: 'New',
    featuredTag: 'Featured',
    usesSuffix: 'sends',
    noSearchMatchReset: 'Reset Filters',
  },
  ur: {
    brand: 'پوپو لائیو',
    title: 'گفٹ کیٹلاگ',
    searchPlaceholder: 'نام یا قسم سے گفٹ تلاش کریں...',
    clear: 'صاف کریں',
    featuredHeading: 'نمایاں تحائف',
    popularHeading: 'مقبول تحائف',
    newHeading: 'نئے تحائف',
    allCatalogHeading: 'تمام تحائف دیکھیں',
    loading: 'تحائف لوڈ ہو رہے ہیں...',
    emptyTitle: 'کوئی گفٹ نہیں ملا',
    emptySubtitle: 'تلاش صاف کریں یا کوئی دوسری کیٹیگری منتخب کریں۔',
    loadMore: 'مزید تحائف لوڈ کریں',
    coins: 'سکے',
    coinBalanceLabel: 'آپ کا بیلنس',
    previewOnlyNotice: 'صرف پیش نظارہ — کیٹلاگ میں سکے منہا نہیں ہوتے۔',
    selectGift: 'گفٹ منتخب کریں',
    giftSelectedToast: 'گفٹ کامیابی سے منتخب ہو گیا (کوئی سکہ منہا نہیں ہوا)',
    categoryLabel: 'کیٹیگری',
    giftTypeLabel: 'گفٹ کی قسم',
    popularityLabel: 'مقبولیت',
    statusAvailable: 'دستیاب',
    statusDisabled: 'غیر دستیاب',
    affordable: 'موجودہ کوائن بیلنس سے بھیجا جا سکتا ہے',
    needMoreCoins: 'بھیجنے کے لیے مزید سکے درکار ہیں',
    walletLink: 'والٹ',
    adminLink: 'ایڈمن کیٹلاگ',
    refresh: 'تازہ کریں',
    liveSynced: 'لائیو کیٹلاگ منسلک',
    badgeCode: 'P7.2',
    badgeLabel: 'گفٹ کیٹلاگ',
    close: 'بند کریں',
    popularTag: 'مقبول',
    newTag: 'نیا',
    featuredTag: 'نمایاں',
    usesSuffix: 'مرتبہ',
    noSearchMatchReset: 'فلٹرز صاف کریں',
  },
} as const;

function GoldCoinIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 text-[#451a03] font-black shadow-[0_0_8px_rgba(251,191,36,0.5)] shrink-0 ${className}`}
      aria-hidden="true"
    >
      <span className="text-[9px] leading-none">$</span>
    </span>
  );
}

function formatCoins(value: number): string {
  return Number(value || 0).toLocaleString('en-US');
}

export default function GiftCatalogScreen() {
  const searchParams = useSearchParams();
  const initialLang = searchParams.get('lang') === 'ur' ? 'ur' : 'en';
  const initialCategory = searchParams.get('category') || 'all';
  const initialQuery = searchParams.get('q') || '';
  const initialGiftId = searchParams.get('giftId') || '';
  const previewMode = searchParams.get('preview') || '';
  const userIdParam = searchParams.get('userId') || '';

  const [lang, setLang] = useState<'en' | 'ur'>(initialLang);
  const t = COPY[lang];
  const isRtl = lang === 'ur';

  const [categories, setCategories] = useState<GiftCategoryRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchInput, setSearchInput] = useState<string>(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState<string>(initialQuery);

  const [gifts, setGifts] = useState<GiftCatalogItem[]>([]);
  const [popularGifts, setPopularGifts] = useState<GiftCatalogItem[]>([]);
  const [newGifts, setNewGifts] = useState<GiftCatalogItem[]>([]);
  const [featuredGifts, setFeaturedGifts] = useState<GiftCatalogItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });

  const [viewerCoinBalance, setViewerCoinBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [detailGift, setDetailGift] = useState<GiftCatalogItem | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedGiftConfirmation, setSelectedGiftConfirmation] =
    useState<GiftCatalogItem | null>(null);
  const [realtimePulse, setRealtimePulse] = useState<boolean>(false);

  const pageRef = useRef<number>(1);

  const buildIdentitySuffix = useCallback(() => {
    const qs = new URLSearchParams();
    if (userIdParam) qs.set('userId', userIdParam);
    if (previewMode) qs.set('preview', previewMode);
    return qs.toString();
  }, [userIdParam, previewMode]);

  // Debounce live search query cleanly
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
    }, 220);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchSectionsAndCategories = useCallback(async () => {
    try {
      const idSuffix = buildIdentitySuffix();
      const suffix = idSuffix ? `?${idSuffix}` : '';
      const [catRes, popRes, newRes, featRes] = await Promise.all([
        fetch('/api/gifts/categories', { cache: 'no-store' }),
        fetch(`/api/gifts/popular?limit=6${idSuffix ? `&${idSuffix}` : ''}`, {
          cache: 'no-store',
        }),
        fetch(`/api/gifts/new?limit=6${idSuffix ? `&${idSuffix}` : ''}`, {
          cache: 'no-store',
        }),
        fetch(`/api/gifts/featured?limit=6${idSuffix ? `&${idSuffix}` : ''}`, {
          cache: 'no-store',
        }),
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        if (Array.isArray(catData.categories)) {
          setCategories(catData.categories);
        }
      }
      if (popRes.ok) {
        const popData = await popRes.json();
        setPopularGifts(Array.isArray(popData.gifts) ? popData.gifts : []);
      }
      if (newRes.ok) {
        const newData = await newRes.json();
        setNewGifts(Array.isArray(newData.gifts) ? newData.gifts : []);
      }
      if (featRes.ok) {
        const featData = await featRes.json();
        setFeaturedGifts(Array.isArray(featData.gifts) ? featData.gifts : []);
      }

      // Read-only balance check via catalog/wallet when preview or user cookie present
      if (suffix) {
        const balRes = await fetch(`/api/wallet/balance${suffix}`, {
          cache: 'no-store',
        });
        if (balRes.ok) {
          const balData = await balRes.json();
          const balVal = balData?.wallet?.coins ?? balData?.wallet?.coinBalance;
          if (typeof balVal === 'number') {
            setViewerCoinBalance(balVal);
          }
        }
      }
    } catch {
      // Non-fatal; main catalog fetch below handles user-facing errors
    }
  }, [buildIdentitySuffix]);

  const fetchCatalogPage = useCallback(
    async (pageNum: number, append: boolean) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setErrorMsg(null);
      try {
        const params = new URLSearchParams();
        if (selectedCategory && selectedCategory !== 'all') {
          params.set('category', selectedCategory);
        }
        if (debouncedQuery) {
          params.set('search', debouncedQuery);
        }
        params.set('page', String(pageNum));
        params.set('limit', '12');
        if (userIdParam) params.set('userId', userIdParam);
        if (previewMode) params.set('preview', previewMode);

        const endpoint =
          debouncedQuery && selectedCategory === 'all'
            ? `/api/gifts/search?${params.toString()}`
            : `/api/gifts/catalog?${params.toString()}`;

        const res = await fetch(endpoint, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Unable to load gift catalog');
        }

        const incoming: GiftCatalogItem[] = Array.isArray(data.gifts) ? data.gifts : [];
        if (append) {
          setGifts((prev) => {
            const existingIds = new Set(prev.map((item) => item.giftId));
            const uniqueNew = incoming.filter((item) => !existingIds.has(item.giftId));
            return [...prev, ...uniqueNew];
          });
        } else {
          setGifts(incoming);
        }

        if (data.pagination) {
          setPagination(data.pagination);
        }
        if (typeof data.viewerCoinBalance === 'number') {
          setViewerCoinBalance(data.viewerCoinBalance);
        }
        pageRef.current = pageNum;
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load gift catalog');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedCategory, debouncedQuery, userIdParam, previewMode]
  );

  useEffect(() => {
    fetchSectionsAndCategories();
  }, [fetchSectionsAndCategories]);

  useEffect(() => {
    fetchCatalogPage(1, false);
  }, [fetchCatalogPage]);

  const openGiftDetail = useCallback(
    async (giftIdOrItem: string | GiftCatalogItem) => {
      const targetId =
        typeof giftIdOrItem === 'string' ? giftIdOrItem : giftIdOrItem.giftId;
      if (typeof giftIdOrItem !== 'string') {
        setDetailGift(giftIdOrItem);
      }
      setDetailLoading(true);
      setDetailError(null);
      try {
        const qs = buildIdentitySuffix();
        const res = await fetch(
          `/api/gifts/${encodeURIComponent(targetId)}${qs ? `?${qs}` : ''}`,
          { cache: 'no-store' }
        );
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Gift unavailable');
        }
        setDetailGift(data.gift);
        if (typeof data.viewerCoinBalance === 'number') {
          setViewerCoinBalance(data.viewerCoinBalance);
        }
      } catch (err) {
        setDetailError(err instanceof Error ? err.message : 'Failed to load gift');
      } finally {
        setDetailLoading(false);
      }
    },
    [buildIdentitySuffix]
  );

  useEffect(() => {
    if (initialGiftId) {
      openGiftDetail(initialGiftId);
    }
  }, [initialGiftId, openGiftDetail]);

  // Real-time SSE listener for admin catalog updates
  useEffect(() => {
    if (typeof EventSource === 'undefined') return;
    const es = new EventSource('/api/gifts/events');
    const handleCatalogChange = () => {
      setRealtimePulse(true);
      fetchSectionsAndCategories();
      fetchCatalogPage(1, false);
      setTimeout(() => setRealtimePulse(false), 1600);
    };

    const eventNames = [
      'gift_catalog:gift_published',
      'gift_catalog:gift_updated',
      'gift_catalog:gift_status_changed',
      'gift_catalog:category_updated',
      'gift_catalog:featured_changed',
    ];
    for (const ev of eventNames) {
      es.addEventListener(ev, handleCatalogChange);
    }
    return () => {
      es.close();
    };
  }, [fetchSectionsAndCategories, fetchCatalogPage]);

  const activeCategories = useMemo(
    () => categories.filter((c) => c.isActive),
    [categories]
  );

  const handleSelectGiftConfirm = (gift: GiftCatalogItem) => {
    setSelectedGiftConfirmation(gift);
    setDetailGift(null);
    setTimeout(() => {
      setSelectedGiftConfirmation((curr) =>
        curr?.giftId === gift.giftId ? null : curr
      );
    }, 4500);
  };

  const renderGiftCard = (gift: GiftCatalogItem) => {
    const label = isRtl && gift.nameUr ? gift.nameUr : gift.name;
    const isSelected = selectedGiftConfirmation?.giftId === gift.giftId;

    return (
      <button
        key={gift.giftId}
        type="button"
        onClick={() => openGiftDetail(gift)}
        data-testid={`gift-card-${gift.giftId}`}
        className={`group relative flex flex-col items-center justify-between rounded-2xl p-2.5 sm:p-3 text-center transition-all duration-200 border bg-gradient-to-b from-[#200c44] to-[#13062b] hover:border-pink-500/80 hover:shadow-[0_0_20px_rgba(236,72,153,0.28)] active:scale-[0.98] ${
          isSelected
            ? 'border-pink-400 shadow-[0_0_24px_rgba(236,72,153,0.45)]'
            : 'border-[#3d1c72]/80'
        }`}
      >
        {/* Top indicator dots / subtle badge */}
        <div className="w-full flex items-center justify-between min-h-[16px] mb-1">
          {gift.isFeatured ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300">
              <Crown className="w-2.5 h-2.5" />
            </span>
          ) : gift.isNew ? (
            <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
              {t.newTag}
            </span>
          ) : gift.isPopular ? (
            <span className="inline-flex items-center rounded-full bg-pink-500/20 border border-pink-400/40 px-1.5 py-0.5 text-[9px] font-semibold text-pink-300">
              <Flame className="w-2.5 h-2.5" />
            </span>
          ) : (
            <span />
          )}

          {(gift.assetType === 'lottie' ||
            gift.assetType === 'gif' ||
            gift.assetType === 'video') && (
            <span
              className="w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_6px_#f472b6]"
              title={gift.assetType.toUpperCase()}
            />
          )}
        </div>

        {/* Gift artwork */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center my-0.5">
          <img
            src={gift.thumbnailUrl || gift.imageUrl || DEFAULT_FALLBACK_GIFT_IMAGE}
            alt={label}
            loading="lazy"
            onError={(e) => {
              const img = e.currentTarget;
              if (!img.dataset.fallbackApplied) {
                img.dataset.fallbackApplied = '1';
                img.src = gift.fallbackImageUrl || DEFAULT_FALLBACK_GIFT_IMAGE;
              }
            }}
            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_6px_14px_rgba(236,72,153,0.32)]"
          />
        </div>

        {/* Name */}
        <p className="mt-1.5 text-[12px] sm:text-[13px] font-semibold text-white truncate w-full">
          {label}
        </p>

        {/* Gold Coin + Price */}
        <div className="mt-1 inline-flex items-center justify-center gap-1 rounded-full bg-[#100422]/85 border border-amber-400/25 px-2 py-0.5">
          <GoldCoinIcon className="w-3.5 h-3.5" />
          <span className="text-[11px] sm:text-xs font-bold text-amber-300 tabular-nums">
            {formatCoins(gift.coinPrice)}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen w-full bg-[#080312] text-white selection:bg-pink-500 selection:text-white"
    >
      {/* Main container cleanly replicates 07_02_gift_catalog mobile density & expands responsively on desktop */}
      <div className="mx-auto max-w-5xl px-3.5 sm:px-6 pt-3 pb-10 flex flex-col min-h-screen bg-gradient-to-b from-[#0e0422] via-[#100527] to-[#080312] border-x border-[#26114d]/60 shadow-[0_0_60px_rgba(109,40,217,0.18)]">
        {/* Top App Bar matching 07_02_gift_catalog */}
        <header className="flex items-center justify-between gap-2 pb-3 border-b border-[#2b1256]/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ff1e8a] via-[#ec4899] to-[#7c3aed] flex items-center justify-center shadow-[0_0_16px_rgba(236,72,153,0.5)]">
              <Gift className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-pink-100 to-purple-200 bg-clip-text text-transparent">
              {t.brand}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Language Switch */}
            <button
              type="button"
              onClick={() => setLang((prev) => (prev === 'en' ? 'ur' : 'en'))}
              aria-label="Toggle Language"
              className="inline-flex items-center gap-1 rounded-full bg-[#1f0d42] border border-[#3e1f73] px-2.5 py-1.5 text-[11px] font-semibold text-purple-100 hover:border-pink-500 transition-colors"
            >
              <Languages className="w-3.5 h-3.5 text-pink-400" />
              <span>{lang === 'en' ? 'اردو' : 'EN'}</span>
            </button>

            {/* Coin Balance / Wallet pill */}
            <Link
              href={previewMode ? `/wallet?preview=${previewMode}` : '/wallet'}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#1f0d42] border border-amber-400/35 px-2.5 py-1.5 text-xs font-bold text-amber-300 hover:border-amber-300 transition-colors"
              title={t.walletLink}
            >
              <GoldCoinIcon className="w-4 h-4" />
              <span className="tabular-nums">
                {viewerCoinBalance !== null
                  ? formatCoins(viewerCoinBalance)
                  : t.walletLink}
              </span>
            </Link>

            {/* Notification / Sync Bell */}
            <button
              type="button"
              onClick={() => {
                fetchSectionsAndCategories();
                fetchCatalogPage(1, false);
              }}
              aria-label={t.refresh}
              className={`relative w-8 h-8 rounded-full bg-[#1f0d42] border flex items-center justify-center transition-colors ${
                realtimePulse
                  ? 'border-pink-400 text-pink-300 shadow-[0_0_12px_rgba(244,114,182,0.5)]'
                  : 'border-[#3e1f73] text-amber-300 hover:border-pink-400'
              }`}
              title={t.liveSynced}
            >
              <Bell className="w-4 h-4" />
              {realtimePulse && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping" />
              )}
            </button>

            {/* Admin link */}
            <Link
              href="/admin/gifts"
              className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#1f0d42] border border-[#3e1f73] px-2.5 py-1.5 text-[11px] font-semibold text-purple-200 hover:border-pink-400 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-pink-400" />
              <span>{t.adminLink}</span>
            </Link>
          </div>
        </header>

        {/* Heading Row: "Gift Catalog >" matching 07_02_gift_catalog */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {t.title}
            </h1>
            <ChevronRight
              className={`w-5 h-5 text-purple-300/80 ${isRtl ? 'rotate-180' : ''}`}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              fetchSectionsAndCategories();
              fetchCatalogPage(1, false);
            }}
            className="inline-flex items-center gap-1 text-xs text-purple-300 hover:text-pink-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t.refresh}</span>
          </button>
        </div>

        {/* Selected confirmation banner (zero coin deduction proof) */}
        {selectedGiftConfirmation && (
          <div
            role="status"
            data-testid="gift-selected-banner"
            className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-gradient-to-r from-emerald-950/90 to-[#1f0d42] border border-emerald-400/50 px-3.5 py-2.5 text-xs text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate font-semibold">
                {isRtl && selectedGiftConfirmation.nameUr
                  ? selectedGiftConfirmation.nameUr
                  : selectedGiftConfirmation.name}{' '}
                ({formatCoins(selectedGiftConfirmation.coinPrice)} {t.coins}) —{' '}
                {t.giftSelectedToast}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedGiftConfirmation(null)}
              className="text-emerald-200 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="mt-3 relative">
          <Search
            className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300 ${
              isRtl ? 'right-3.5' : 'left-3.5'
            }`}
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t.searchPlaceholder}
            data-testid="gift-search-input"
            className={`w-full rounded-2xl bg-[#180a36] border border-[#3a1a70] py-2.5 text-sm text-white placeholder:text-purple-300/60 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors ${
              isRtl ? 'pr-10 pl-16' : 'pl-10 pr-16'
            }`}
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              data-testid="gift-search-clear"
              className={`absolute top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-full bg-[#2b135c] px-2.5 py-1 text-[11px] font-semibold text-pink-200 hover:bg-pink-600 hover:text-white transition-colors ${
                isRtl ? 'left-2.5' : 'right-2.5'
              }`}
            >
              <X className="w-3 h-3" />
              <span>{t.clear}</span>
            </button>
          )}
        </div>

        {/* Category Tabs matching neon-pink active pill in 07_02_gift_catalog */}
        <nav
          aria-label="Gift Categories"
          className="mt-3.5 flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar"
        >
          {activeCategories.map((cat) => {
            const active = selectedCategory === cat.slug;
            const label =
              isRtl && cat.shortNameUr
                ? cat.shortNameUr
                : isRtl && cat.nameUr
                  ? cat.nameUr
                  : cat.shortName || cat.name;
            return (
              <button
                key={cat.categoryId}
                type="button"
                onClick={() => setSelectedCategory(cat.slug)}
                data-testid={`category-tab-${cat.slug}`}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                  active
                    ? 'bg-gradient-to-r from-[#ff007f] via-[#f42a8b] to-[#ff2a85] text-white shadow-[0_0_16px_rgba(255,0,127,0.55)]'
                    : 'bg-[#1a0b38] border border-[#331765] text-purple-200/85 hover:border-pink-500/60 hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </nav>

        {/* Main 3-Column (Mobile) / Responsive (Desktop) Gift Grid immediately visible above fold just like 07_02_gift_catalog */}
        <section className="mt-3.5" aria-label={t.allCatalogHeading}>
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 sm:gap-3.5">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-36 rounded-2xl bg-[#1a0b38] border border-[#311761] animate-pulse"
                />
              ))}
            </div>
          ) : errorMsg ? (
            <div className="rounded-2xl bg-[#1f0b3f] border border-rose-500/50 p-5 text-center">
              <p className="text-sm text-rose-200 font-semibold">{errorMsg}</p>
              <button
                type="button"
                onClick={() => fetchCatalogPage(1, false)}
                className="mt-3 rounded-full bg-pink-600 px-4 py-1.5 text-xs font-bold text-white"
              >
                {t.refresh}
              </button>
            </div>
          ) : gifts.length === 0 ? (
            <div className="rounded-2xl bg-[#180a36] border border-[#341868] p-8 text-center">
              <Sparkles className="w-8 h-8 text-pink-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">{t.emptyTitle}</p>
              <p className="mt-1 text-xs text-purple-300/80">{t.emptySubtitle}</p>
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSelectedCategory('all');
                }}
                className="mt-4 rounded-full bg-gradient-to-r from-[#ff007f] to-[#d946ef] px-4 py-1.5 text-xs font-bold text-white"
              >
                {t.noSearchMatchReset}
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 sm:gap-3.5">
                {gifts.map((gift) => renderGiftCard(gift))}
              </div>

              {pagination.page < pagination.totalPages && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    disabled={loadingMore}
                    onClick={() => fetchCatalogPage(pagination.page + 1, true)}
                    data-testid="load-more-gifts"
                    className="inline-flex items-center gap-2 rounded-full bg-[#241046] border border-pink-500/50 px-5 py-2 text-xs font-bold text-pink-100 hover:bg-pink-600 hover:text-white transition-colors disabled:opacity-60"
                  >
                    {loadingMore ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                    )}
                    <span>
                      {t.loadMore} ({gifts.length}/{pagination.total})
                    </span>
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Highlight Sections (Popular & New & Featured) shown when on default All view without active search */}
        {selectedCategory === 'all' && !debouncedQuery && (
          <div className="mt-6 space-y-5">
            {popularGifts.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="inline-flex items-center gap-1.5 text-sm font-bold text-white">
                    <Flame className="w-4 h-4 text-pink-500" />
                    <span>{t.popularHeading}</span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('popular')}
                    className="text-[11px] font-semibold text-pink-400 hover:underline"
                  >
                    {t.popularTag} →
                  </button>
                </div>
                <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                  {popularGifts.slice(0, 6).map((gift) => (
                    <button
                      key={`pop-${gift.giftId}`}
                      type="button"
                      onClick={() => openGiftDetail(gift)}
                      className="shrink-0 w-28 rounded-2xl bg-[#180a36] border border-[#381a6d] p-2.5 text-center hover:border-pink-500 transition-colors"
                    >
                      <img
                        src={
                          gift.thumbnailUrl ||
                          gift.imageUrl ||
                          DEFAULT_FALLBACK_GIFT_IMAGE
                        }
                        alt={gift.name}
                        className="w-12 h-12 mx-auto object-contain"
                      />
                      <p className="mt-1 text-[11px] font-semibold text-white truncate">
                        {isRtl && gift.nameUr ? gift.nameUr : gift.name}
                      </p>
                      <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold text-amber-300">
                        <GoldCoinIcon className="w-3 h-3" />
                        {formatCoins(gift.coinPrice)}
                      </p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {newGifts.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="inline-flex items-center gap-1.5 text-sm font-bold text-white">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>{t.newHeading}</span>
                  </h2>
                </div>
                <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                  {newGifts.slice(0, 6).map((gift) => (
                    <button
                      key={`new-${gift.giftId}`}
                      type="button"
                      onClick={() => openGiftDetail(gift)}
                      className="shrink-0 w-28 rounded-2xl bg-[#180a36] border border-[#381a6d] p-2.5 text-center hover:border-emerald-400/70 transition-colors"
                    >
                      <img
                        src={
                          gift.thumbnailUrl ||
                          gift.imageUrl ||
                          DEFAULT_FALLBACK_GIFT_IMAGE
                        }
                        alt={gift.name}
                        className="w-12 h-12 mx-auto object-contain"
                      />
                      <p className="mt-1 text-[11px] font-semibold text-white truncate">
                        {isRtl && gift.nameUr ? gift.nameUr : gift.name}
                      </p>
                      <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold text-amber-300">
                        <GoldCoinIcon className="w-3 h-3" />
                        {formatCoins(gift.coinPrice)}
                      </p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {featuredGifts.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="inline-flex items-center gap-1.5 text-sm font-bold text-white">
                    <Star className="w-4 h-4 text-amber-400" />
                    <span>{t.featuredHeading}</span>
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {featuredGifts.slice(0, 3).map((gift) => (
                    <button
                      key={`feat-${gift.giftId}`}
                      type="button"
                      onClick={() => openGiftDetail(gift)}
                      className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#240e4f] to-[#170834] border border-amber-400/30 p-2.5 text-left hover:border-amber-400 transition-colors"
                    >
                      <img
                        src={
                          gift.thumbnailUrl ||
                          gift.imageUrl ||
                          DEFAULT_FALLBACK_GIFT_IMAGE
                        }
                        alt={gift.name}
                        className="w-11 h-11 object-contain shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {isRtl && gift.nameUr ? gift.nameUr : gift.name}
                        </p>
                        <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-bold text-amber-300">
                          <GoldCoinIcon className="w-3 h-3" />
                          {formatCoins(gift.coinPrice)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Bottom Module Watermark Badge matching 07_02_gift_catalog */}
        <footer className="mt-auto pt-6 flex items-center justify-between gap-3 border-t border-[#28114d]/60">
          <div className="flex items-center gap-2.5">
            <span className="rounded-lg bg-gradient-to-r from-[#ff007f] to-[#ff2a85] px-2.5 py-1 text-xs font-black tracking-wide text-white shadow-[0_0_12px_rgba(255,0,127,0.45)]">
              {t.badgeCode}
            </span>
            <span className="text-sm font-semibold text-purple-100">
              {t.badgeLabel}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Link
              href={previewMode ? `/wallet?preview=${previewMode}` : '/wallet'}
              className="inline-flex items-center gap-1 text-purple-300 hover:text-amber-300 transition-colors"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>{t.walletLink}</span>
            </Link>
            <span className="text-purple-700">•</span>
            <Link
              href="/admin/gifts"
              className="inline-flex items-center gap-1 text-purple-300 hover:text-pink-300 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t.adminLink}</span>
            </Link>
          </div>
        </footer>
      </div>

      {/* Gift Detail Preview Modal */}
      {detailGift && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="gift-detail-modal"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
        >
          <div
            dir={isRtl ? 'rtl' : 'ltr'}
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-gradient-to-b from-[#1e0b40] via-[#15072e] to-[#0d031f] border border-[#4a218a] p-5 shadow-[0_0_50px_rgba(236,72,153,0.35)]"
          >
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#341766]">
              <div className="min-w-0">
                <h3 className="text-lg font-extrabold text-white truncate">
                  {isRtl && detailGift.nameUr ? detailGift.nameUr : detailGift.name}
                </h3>
                <p className="text-[11px] text-purple-300">
                  {isRtl && detailGift.categoryNameUr
                    ? detailGift.categoryNameUr
                    : detailGift.categoryName || detailGift.giftType}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailGift(null)}
                data-testid="close-gift-detail"
                className="w-8 h-8 rounded-full bg-[#2a1154] text-purple-200 hover:text-white flex items-center justify-center"
                aria-label={t.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {detailError ? (
              <div className="my-6 rounded-2xl bg-rose-950/60 border border-rose-500/40 p-4 text-center text-xs text-rose-200">
                {detailError}
              </div>
            ) : (
              <>
                <div className="mt-4 flex flex-col items-center">
                  <GiftAnimationPreview
                    name={detailGift.name}
                    imageUrl={detailGift.imageUrl}
                    animationUrl={detailGift.animationUrl}
                    fallbackImageUrl={detailGift.fallbackImageUrl}
                    assetType={detailGift.assetType}
                    showControls
                    playing
                    size="lg"
                  />

                  {/* Official Coin Price Pill */}
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#26104c] border border-amber-400/50 px-4 py-1.5 shadow-[0_0_16px_rgba(251,191,36,0.2)]">
                    <GoldCoinIcon className="w-5 h-5" />
                    <span className="text-base font-black text-amber-300 tabular-nums">
                      {formatCoins(detailGift.coinPrice)} {t.coins}
                    </span>
                  </div>
                </div>

                <p className="mt-3 text-center text-xs text-purple-200/90 leading-relaxed">
                  {isRtl && detailGift.descriptionUr
                    ? detailGift.descriptionUr
                    : detailGift.description}
                </p>

                {/* Metadata Grid */}
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="rounded-xl bg-[#120627] border border-[#31165e] p-2">
                    <p className="text-purple-400">{t.categoryLabel}</p>
                    <p className="mt-0.5 font-bold text-white truncate">
                      {isRtl && detailGift.categoryNameUr
                        ? detailGift.categoryNameUr
                        : detailGift.categoryName || 'Gift'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#120627] border border-[#31165e] p-2">
                    <p className="text-purple-400">{t.popularityLabel}</p>
                    <p className="mt-0.5 font-bold text-pink-300 tabular-nums">
                      {formatCoins(detailGift.usageCount)} {t.usesSuffix}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#120627] border border-[#31165e] p-2">
                    <p className="text-purple-400">{t.statusAvailable}</p>
                    <p
                      className={`mt-0.5 font-bold ${
                        detailGift.isActive ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {detailGift.isActive ? t.statusAvailable : t.statusDisabled}
                    </p>
                  </div>
                </div>

                {/* Read-Only Coin Balance Check from Module 7.1 */}
                {viewerCoinBalance !== null && (
                  <div className="mt-3 rounded-xl bg-[#13062b] border border-[#38196b] px-3 py-2 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 text-purple-200">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      {t.coinBalanceLabel}:{' '}
                      <strong className="text-amber-300 tabular-nums">
                        {formatCoins(viewerCoinBalance)}
                      </strong>
                    </span>
                    <span
                      className={`font-semibold ${
                        viewerCoinBalance >= detailGift.coinPrice
                          ? 'text-emerald-300'
                          : 'text-amber-200'
                      }`}
                    >
                      {viewerCoinBalance >= detailGift.coinPrice
                        ? t.affordable
                        : t.needMoreCoins}
                    </span>
                  </div>
                )}

                <p className="mt-2.5 text-center text-[11px] text-purple-300/80">
                  {t.previewOnlyNotice}
                </p>

                <button
                  type="button"
                  disabled={!detailGift.isActive || detailLoading}
                  onClick={() => handleSelectGiftConfirm(detailGift)}
                  data-testid="select-gift-button"
                  className="mt-3.5 w-full rounded-2xl bg-gradient-to-r from-[#ff007f] via-[#f42a8b] to-[#d946ef] py-3 text-sm font-extrabold text-white shadow-[0_0_24px_rgba(255,0,127,0.45)] hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  {t.selectGift} — {formatCoins(detailGift.coinPrice)} {t.coins}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
