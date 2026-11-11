'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Globe,
  History,
  Lock,
  RefreshCw,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wallet as WalletIcon,
  X,
  XCircle,
} from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';

export interface CoinPackageItem {
  packageId: string;
  packageName: string;
  packageNameUr: string | null;
  baseCoins: number;
  bonusCoins: number;
  totalCoins: number;
  priceAmount: number;
  currency: string;
  iconUrl: string;
  badgeText: string | null;
  isPopular: boolean;
  isActive: boolean;
  displayOrder: number;
}

export interface PaymentProviderItem {
  providerKey: string;
  displayName: string;
  displayNameUr: string | null;
  providerType: string;
  supportedPlatforms: string[];
  configurationStatus: 'ready_sandbox' | 'live_configured' | 'credentials_pending';
  isReadyForPayment: boolean;
  isSandbox: boolean;
  isActive: boolean;
  notes: string | null;
}

export interface TopupOrderItem {
  orderId: string;
  userId: string;
  packageId: string;
  packageName: string;
  providerKey: string;
  platform: string;
  baseCoins: number;
  bonusCoins: number;
  totalCoins: number;
  amount: number;
  currency: string;
  status: string;
  providerPaymentRef: string | null;
  coinTransactionId: string | null;
  receiptId: string | null;
  failureReason: string | null;
  verifiedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface TopupReceiptItem {
  receiptId: string;
  orderId: string;
  userId: string;
  packageId: string;
  packageName: string;
  providerKey: string;
  baseCoins: number;
  bonusCoins: number;
  totalCoins: number;
  amount: number;
  currency: string;
  coinTransactionId: string;
  providerPaymentRef: string | null;
  status: string;
  issuedAt: string;
}

interface TopupRechargeScreenProps {
  previewMode?: boolean;
}

function getProviderBrandBadge(providerKey: string) {
  switch (providerKey) {
    case 'apple_iap':
      return { short: 'Apple Pay', bg: 'bg-white text-black' };
    case 'google_play':
      return { short: 'G Pay', bg: 'bg-white text-slate-900' };
    case 'stripe_card':
      return { short: 'Card', bg: 'bg-gradient-to-r from-[#eb001b] to-[#f79e1b] text-white' };
    case 'sandbox_verified':
      return { short: 'Sandbox', bg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' };
    case 'paypal':
      return { short: 'PayPal', bg: 'bg-[#0070ba] text-white' };
    default:
      return { short: 'Local', bg: 'bg-purple-800/80 text-purple-100 border border-purple-400/30' };
  }
}

export function TopupRechargeScreen({ previewMode = true }: TopupRechargeScreenProps) {
  const { isUr, toggleLang } = useLanguage();
  const isRtl = isUr;

  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<CoinPackageItem[]>([]);
  const [providers, setProviders] = useState<PaymentProviderItem[]>([]);
  const [selectedPkgId, setSelectedPkgId] = useState<string>('pkg_1000');
  const [selectedProviderKey, setSelectedProviderKey] = useState<string>('sandbox_verified');

  const [coinBalance, setCoinBalance] = useState<number>(12500);
  const [walletUserId, setWalletUserId] = useState<string>('user_wallet_demo_701');
  const [historyItems, setHistoryItems] = useState<TopupOrderItem[]>([]);
  const [historyFilter, setHistoryFilter] = useState<string>('all');
  const [sseConnected, setSseConnected] = useState(false);

  const [creatingOrder, setCreatingOrder] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [activeOrder, setActiveOrder] = useState<TopupOrderItem | null>(null);
  const [activeCheckoutProvider, setActiveCheckoutProvider] = useState<PaymentProviderItem | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<TopupReceiptItem | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const historySectionRef = useRef<HTMLDivElement>(null);

  const qs = previewMode ? '?preview=demo' : '';

  const t = useMemo(
    () => ({
      heading: isRtl ? 'سکے ٹاپ اپ کریں' : 'Top-up Coins',
      subheading: isRtl
        ? 'منظور شدہ پیکیجز • تصدیق شدہ ادائیگی کے بعد فوری سکے'
        : 'Backend-Configured Packages • Instant Credit After Verified Payment',
      balanceLabel: isRtl ? 'موجودہ سکے' : 'Current Balance',
      coinsUnit: isRtl ? 'سکے' : 'Coins',
      popular: isRtl ? 'مقبول' : 'Popular',
      bonusLabel: isRtl ? 'بونس سکے' : 'Bonus Coins',
      totalCredit: isRtl ? 'کل سکے' : 'Total to Receive',
      paymentMethods: isRtl ? 'ادائیگی کا طریقہ منتخب کریں' : 'Select Payment Method',
      continueBtn: isRtl ? 'ریچارج جاری رکھیں' : 'Continue to Recharge',
      processing: isRtl ? 'آرڈر تیار ہو رہا ہے...' : 'Creating Order...',
      credentialsPending: isRtl ? 'کریڈینشلز زیر التواء' : 'Credentials Pending',
      sandboxReady: isRtl ? 'سینڈ باکس تصدیق شدہ' : 'Sandbox Ready (HMAC)',
      liveReady: isRtl ? 'لائیو فعال' : 'Live Active',
      badgeTitle: isRtl ? 'ٹاپ اپ' : 'Top-up',
      historyTitle: isRtl ? 'ٹاپ اپ تاریخ اور رسیدیں' : 'Top-up History & Verified Receipts',
      viewReceipt: isRtl ? 'رسید دیکھیں' : 'View Receipt',
      noHistory: isRtl ? 'ابھی تک کوئی ٹاپ اپ آرڈر نہیں ملا۔' : 'No top-up orders recorded yet.',
      securityNote: isRtl
        ? 'اہم: سکے صرف بیک اینڈ کی جانب سے تصدیق شدہ ادائیگی کے بعد شامل ہوتے ہیں۔ ٹاپ اپ پر میزبان پوائنٹس نہیں دیے جاتے۔'
        : 'Server-Verified Billing: Coins are credited strictly after cryptographic provider verification. Top-ups never issue host points.',
      modalTitle: isRtl ? 'محفوظ ادائیگی کی تصدیق' : 'Verified Payment Checkout',
      confirmSandbox: isRtl ? 'ادائیگی کی تصدیق کریں' : 'Confirm Verified Payment',
      failSandbox: isRtl ? 'ناکام ادائیگی کی نقل' : 'Simulate Failed Payment',
      keepPending: isRtl ? 'زیر التواء رکھیں' : 'Keep Order Pending',
      receiptTitle: isRtl ? 'سرکاری ٹاپ اپ رسید' : 'Official Top-up Receipt',
      downloadTxt: isRtl ? 'رسید ڈاؤن لوڈ کریں' : 'Download TXT',
    }),
    [isRtl]
  );

  const loadAll = useCallback(async () => {
    try {
      const [pkgRes, provRes, balRes, histRes] = await Promise.all([
        fetch(`/api/topup/packages${qs}`),
        fetch(`/api/topup/methods?platform=web`),
        fetch(`/api/wallet/balance${qs}${qs ? '&fresh=true' : '?fresh=true'}`),
        fetch(`/api/topup/history${qs}${qs ? '&' : '?'}status=${historyFilter}&limit=15`),
      ]);

      const [pkgData, provData, balData, histData] = await Promise.all([
        pkgRes.json(),
        provRes.json(),
        balRes.json(),
        histRes.json(),
      ]);

      if (pkgData.success && Array.isArray(pkgData.packages)) {
        setPackages(pkgData.packages);
        setSelectedPkgId((prev) => {
          if (pkgData.packages.some((p: CoinPackageItem) => p.packageId === prev)) return prev;
          const pop = pkgData.packages.find((p: CoinPackageItem) => p.isPopular);
          return pop ? pop.packageId : pkgData.packages[0]?.packageId || '';
        });
      }

      if (provData.success && Array.isArray(provData.providers)) {
        setProviders(provData.providers);
      }

      if (balData.success && balData.wallet) {
        setCoinBalance(balData.wallet.coins);
        if (balData.wallet.userId) setWalletUserId(balData.wallet.userId);
      }

      if (histData.success && Array.isArray(histData.items)) {
        setHistoryItems(histData.items);
      }
    } catch {
      setBanner({ type: 'error', text: 'Failed to sync top-up catalog from backend.' });
    } finally {
      setLoading(false);
    }
  }, [qs, historyFilter]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Real-time SSE sync
  useEffect(() => {
    const sseUrl = `/api/topup/events${qs}`;
    const es = new EventSource(sseUrl);

    es.onopen = () => setSseConnected(true);
    es.onerror = () => setSseConnected(false);

    const onSync = (e: MessageEvent) => {
      try {
        const d = JSON.parse(e.data);
        if (typeof d.wallet?.coins === 'number') setCoinBalance(d.wallet.coins);
        setSseConnected(true);
      } catch {}
    };

    const onCredited = (e: MessageEvent) => {
      try {
        const d = JSON.parse(e.data);
        if (typeof d.newCoinBalance === 'number') setCoinBalance(d.newCoinBalance);
        loadAll();
      } catch {}
    };

    const onBalanceUpdated = (e: MessageEvent) => {
      try {
        const d = JSON.parse(e.data);
        if (typeof d.coins === 'number') setCoinBalance(d.coins);
        loadAll();
      } catch {}
    };

    const onStatusChange = () => {
      loadAll();
    };

    es.addEventListener('wallet:topup_state_sync', onSync);
    es.addEventListener('wallet:coins_credited', onCredited);
    es.addEventListener('wallet:balance_updated', onBalanceUpdated);
    es.addEventListener('wallet:payment_successful', onStatusChange);
    es.addEventListener('wallet:payment_failed', onStatusChange);
    es.addEventListener('wallet:topup_refunded', onStatusChange);

    return () => {
      es.close();
    };
  }, [qs, loadAll]);

  const selectedPackage = useMemo(
    () => packages.find((p) => p.packageId === selectedPkgId) || packages[0] || null,
    [packages, selectedPkgId]
  );

  const selectedProvider = useMemo(
    () => providers.find((p) => p.providerKey === selectedProviderKey) || providers[0] || null,
    [providers, selectedProviderKey]
  );

  const handleStartOrder = async () => {
    if (!selectedPackage || !selectedProvider) return;
    setBanner(null);

    if (!selectedProvider.isReadyForPayment) {
      setBanner({
        type: 'info',
        text: `${selectedProvider.displayName}: ${selectedProvider.notes || 'Merchant API credentials required before live billing.'} Switch to Verified Payment Sandbox for testing.`,
      });
      return;
    }

    setCreatingOrder(true);
    try {
      const idemKey = `UI_ORD_${selectedPackage.packageId}_${Date.now()}`;
      const res = await fetch(`/api/topup/orders${qs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPackage.packageId,
          providerKey: selectedProvider.providerKey,
          platform: 'web',
          idempotencyKey: idemKey,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setBanner({ type: 'error', text: data.error || 'Could not initiate top-up order.' });
        return;
      }

      setActiveOrder(data.order);
      setActiveCheckoutProvider(data.provider);
      await loadAll();
    } catch {
      setBanner({ type: 'error', text: 'Network error creating payment order.' });
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleSandboxOutcome = async (outcome: 'succeeded' | 'failed' | 'pending') => {
    if (!activeOrder) return;
    if (outcome === 'pending') {
      setActiveOrder(null);
      setBanner({
        type: 'info',
        text: `Order ${activeOrder.orderId} remains pending verification. Zero coins credited yet.`,
      });
      await loadAll();
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await fetch(`/api/topup/sandbox/complete${qs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeOrder.orderId,
          outcome,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setBanner({ type: 'error', text: data.message || data.error || 'Verification failed.' });
        return;
      }

      if (outcome === 'succeeded') {
        if (typeof data.wallet?.coins === 'number') setCoinBalance(data.wallet.coins);
        setActiveOrder(null);
        if (data.receipt) setActiveReceipt(data.receipt);
        setBanner({
          type: 'success',
          text: `Payment verified! Credited +${data.order?.totalCoins?.toLocaleString()} coins cleanly.`,
        });
      } else {
        setActiveOrder(null);
        setBanner({
          type: 'error',
          text: `Payment ${data.order?.status || 'failed'}. Zero coins credited.`,
        });
      }
      await loadAll();
    } catch {
      setBanner({ type: 'error', text: 'Error finalizing sandbox payment.' });
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleOpenReceipt = async (receiptId: string) => {
    try {
      const res = await fetch(`/api/topup/receipts/${encodeURIComponent(receiptId)}${qs}`);
      const data = await res.json();
      if (data.success && data.receipt) {
        setActiveReceipt(data.receipt);
      } else {
        setBanner({ type: 'error', text: data.error || 'Unable to load receipt.' });
      }
    } catch {
      setBanner({ type: 'error', text: 'Failed to load receipt.' });
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#0c0219] text-white font-sans selection:bg-pink-500/30 pb-14"
    >
      {/* Ambient Radial Aura */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-gradient-to-b from-[#6b15d6]/25 via-[#ff2e83]/10 to-transparent blur-3xl rounded-full" />
      </div>

      {/* Main Content Wrapper */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-4">
        {/* Top Bar matching 07_06 + Phase 7 chrome */}
        <header className="flex items-center justify-between gap-2 rounded-2xl bg-[#190633]/90 border border-purple-500/25 px-3 py-2.5 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={previewMode ? '/wallet?preview=demo' : '/wallet'}
              className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-full bg-white/5 hover:bg-white/10 border border-purple-400/25 flex items-center justify-center transition"
              title="Back to Wallet"
            >
              <ArrowLeft className="w-4 h-4 text-purple-100" />
            </Link>
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-full bg-gradient-to-br from-[#ff2e83] via-[#d926ff] to-[#6f14e8] flex items-center justify-center font-black text-white shadow-[0_0_16px_rgba(255,46,131,0.55)]">
              P
              <span
                title={sseConnected ? 'SSE Live Connected' : 'Syncing'}
                className={`sm:hidden absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#190633] ${
                  sseConnected ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="font-extrabold text-sm sm:text-base tracking-tight">
                  {isRtl ? 'پوپو لائیو' : 'Popo Live'}
                </span>
                <span
                  className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${
                    sseConnected
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/35'
                      : 'bg-purple-500/15 text-purple-200 border-purple-400/30'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {sseConnected ? 'Live' : 'Sync'}
                </span>
              </div>
              <p className="text-[10px] text-purple-300/75 hidden sm:block truncate">
                ID: {walletUserId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => loadAll()}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/10 border border-purple-400/25 flex items-center justify-center transition"
              title="Refresh Coins"
            >
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-200" />
            </button>
            <button
              type="button"
              data-testid="topup-lang-toggle"
              onClick={toggleLang}
              className="px-2 sm:px-2.5 h-8 sm:h-9 rounded-full bg-pink-500/15 hover:bg-pink-500/25 border border-pink-400/35 flex items-center gap-1 text-[11px] sm:text-xs font-bold text-pink-200 transition whitespace-nowrap"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{isRtl ? 'EN' : 'UR'}</span>
            </button>
            <button
              type="button"
              onClick={() => historySectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/10 border border-purple-400/25 flex items-center justify-center transition"
              title="Top-up History"
            >
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-200" />
            </button>
            <Link
              href="/admin/finance"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/10 border border-purple-400/25 flex items-center justify-center transition"
              title="Finance Admin"
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-200" />
            </Link>
          </div>
        </header>

        {/* Centered Mobile-First Phone Showcase Card + Responsive Desktop Split */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: 07_06 Reference Top-Up Card */}
          <div className="lg:col-span-6 mx-auto w-full max-w-md rounded-3xl bg-gradient-to-b from-[#230a45] via-[#180532] to-[#110324] border border-purple-400/30 p-5 shadow-[0_18px_50px_rgba(9,0,28,0.85)]">
            <div className="text-center mb-4">
              <h1 className="text-2xl font-black tracking-tight text-white">{t.heading}</h1>
              <p className="text-xs text-purple-200/75 mt-1">{t.subheading}</p>

              {/* Current Coin Balance Bar */}
              <div
                data-testid="topup-current-balance"
                className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/35 border border-amber-400/35 text-sm font-extrabold text-amber-300 shadow-[0_0_20px_rgba(250,204,21,0.15)]"
              >
                <Coins className="w-4 h-4 text-amber-400" />
                <span>{t.balanceLabel}:</span>
                <span className="text-white">{coinBalance.toLocaleString()}</span>
                <span className="text-amber-300 text-xs">{t.coinsUnit}</span>
              </div>
            </div>

            {banner && (
              <div
                data-testid="topup-banner"
                className={`mb-4 rounded-2xl px-3.5 py-2.5 text-xs font-semibold flex items-start gap-2 border ${
                  banner.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                    : banner.type === 'error'
                    ? 'bg-rose-500/15 border-rose-400/40 text-rose-200'
                    : 'bg-amber-500/15 border-amber-400/40 text-amber-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="flex-1">{banner.text}</span>
                <button type="button" onClick={() => setBanner(null)} className="opacity-70 hover:opacity-100">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Package Rows matching 07_06_top_up.png */}
            <div data-testid="topup-packages-list" className="space-y-3">
              {loading ? (
                <div className="py-10 text-center text-xs text-purple-300 animate-pulse">
                  Loading verified coin packages...
                </div>
              ) : (
                packages.map((pkg) => {
                  const selected = pkg.packageId === selectedPkgId;
                  return (
                    <button
                      key={pkg.packageId}
                      type="button"
                      data-testid={`package-row-${pkg.packageId}`}
                      onClick={() => setSelectedPkgId(pkg.packageId)}
                      className={`relative w-full text-left rounded-2xl px-3.5 py-3 flex items-center justify-between gap-3 transition-all ${
                        selected
                          ? 'bg-gradient-to-r from-[#3a126e] via-[#2c0d57] to-[#230945] border-2 border-amber-400 shadow-[0_0_24px_rgba(250,204,21,0.3)] scale-[1.01]'
                          : 'bg-[#210942]/80 hover:bg-[#2a0d54] border border-purple-400/25'
                      }`}
                    >
                      {(pkg.isPopular || pkg.badgeText === 'Popular') && (
                        <span className="absolute -top-2.5 left-12 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] text-[#21073d] text-[10px] font-black uppercase tracking-wider shadow">
                          {t.popular}
                        </span>
                      )}

                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_16px_rgba(245,158,11,0.45)] shrink-0">
                          <Coins className="w-5 h-5 text-[#3a1600]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-lg font-black text-white">
                              {pkg.baseCoins.toLocaleString()}
                            </span>
                            <span className="text-sm font-semibold text-purple-100/90">
                              {t.coinsUnit}
                            </span>
                          </div>
                          {pkg.bonusCoins > 0 ? (
                            <p className="text-[11px] font-bold text-amber-300 truncate">
                              +{pkg.bonusCoins.toLocaleString()} {t.bonusLabel} ({pkg.totalCoins.toLocaleString()} Total)
                            </p>
                          ) : (
                            <p className="text-[11px] text-purple-300/70 truncate">
                              {isRtl && pkg.packageNameUr ? pkg.packageNameUr : pkg.packageName}
                            </p>
                          )}
                        </div>
                      </div>

                      <span
                        className={`shrink-0 min-w-[78px] text-center px-3.5 py-2 rounded-xl font-black text-sm shadow transition ${
                          selected
                            ? 'bg-gradient-to-r from-[#ff267e] to-[#ff4da0] text-white shadow-[0_0_18px_rgba(255,46,131,0.55)]'
                            : 'bg-[#e61e75] hover:bg-[#ff2e83] text-white'
                        }`}
                      >
                        ${pkg.priceAmount.toFixed(2)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Payment Method Logos Strip (faithful to 07_06_top_up.png + honest readiness) */}
            <div className="mt-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-purple-200/75 text-center mb-2.5">
                {t.paymentMethods}
              </p>
              <div data-testid="payment-methods-list" className="grid grid-cols-3 gap-2">
                {providers.map((prov) => {
                  const active = prov.providerKey === selectedProviderKey;
                  const brand = getProviderBrandBadge(prov.providerKey);
                  return (
                    <button
                      key={prov.providerKey}
                      type="button"
                      data-testid={`provider-btn-${prov.providerKey}`}
                      onClick={() => setSelectedProviderKey(prov.providerKey)}
                      className={`rounded-xl p-2 text-center transition border ${
                        active
                          ? 'border-pink-400 bg-pink-500/20 shadow-[0_0_15px_rgba(255,46,131,0.35)]'
                          : 'border-purple-400/20 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div
                        className={`mx-auto mb-1 rounded-lg px-2 py-1 text-[11px] font-extrabold ${brand.bg}`}
                      >
                        {brand.short}
                      </div>
                      <div className="text-[10px] font-bold text-purple-100 truncate">
                        {isRtl && prov.displayNameUr ? prov.displayNameUr : prov.displayName}
                      </div>
                      <div className="mt-0.5 text-[9px] font-semibold">
                        {prov.isSandbox ? (
                          <span className="text-emerald-300">{t.sandboxReady}</span>
                        ) : prov.isReadyForPayment ? (
                          <span className="text-emerald-300">{t.liveReady}</span>
                        ) : (
                          <span className="text-amber-300">{t.credentialsPending}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Order Summary & Continue CTA */}
            {selectedPackage && (
              <div className="mt-5 rounded-2xl bg-black/30 border border-purple-400/25 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-purple-200">
                  <span>{isRtl && selectedPackage.packageNameUr ? selectedPackage.packageNameUr : selectedPackage.packageName}</span>
                  <span className="font-bold text-white">${selectedPackage.priceAmount.toFixed(2)} {selectedPackage.currency}</span>
                </div>
                <div className="flex justify-between text-amber-300 font-bold">
                  <span>{t.totalCredit}</span>
                  <span>
                    {selectedPackage.totalCoins.toLocaleString()} {t.coinsUnit}
                  </span>
                </div>
                <button
                  type="button"
                  data-testid="continue-topup-btn"
                  disabled={creatingOrder || !selectedProvider}
                  onClick={handleStartOrder}
                  className="w-full mt-1 py-3 rounded-2xl bg-gradient-to-r from-[#ff267e] via-[#ff3e91] to-[#ff2b84] hover:brightness-110 disabled:opacity-50 text-white font-black text-sm tracking-wide shadow-[0_0_24px_rgba(255,46,131,0.55)] transition flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{creatingOrder ? t.processing : t.continueBtn}</span>
                </button>
              </div>
            )}

            {/* Signature P7.6 Badge matching 07_06_top_up.png */}
            <div className="mt-5 flex flex-col items-center">
              <span className="px-5 py-1 rounded-full bg-gradient-to-r from-[#ff267e] to-[#ff4da0] text-white font-black text-sm shadow-[0_0_16px_rgba(255,46,131,0.55)]">
                P7.6
              </span>
              <span className="mt-1.5 text-lg font-black tracking-tight text-white">
                {t.badgeTitle}
              </span>
            </div>
          </div>

          {/* RIGHT: Security Guarantees & Live History / Receipts */}
          <div className="lg:col-span-6 space-y-5">
            {/* Security & Compliance Banner */}
            <div className="rounded-2xl bg-[#190633]/90 border border-emerald-400/30 p-4 flex items-start gap-3">
              <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h2 className="text-sm font-extrabold text-emerald-300">
                  Cryptographic Payment & Wallet Separation
                </h2>
                <p className="text-xs text-purple-100/80 leading-relaxed">{t.securityNote}</p>
                <div className="flex flex-wrap gap-2 pt-1.5 text-[11px]">
                  <Link
                    href={previewMode ? '/wallet?preview=demo' : '/wallet'}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-purple-100 font-bold"
                  >
                    <WalletIcon className="w-3 h-3" /> Dual Wallet
                  </Link>
                  <Link
                    href={previewMode ? '/wallet/coin-history?preview=demo' : '/wallet/coin-history'}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-purple-100 font-bold"
                  >
                    <History className="w-3 h-3" /> Coin Ledger
                  </Link>
                </div>
              </div>
            </div>

            {/* Top-up Order History & Receipts */}
            <div
              ref={historySectionRef}
              id="topup-history"
              data-testid="topup-history-section"
              className="rounded-3xl bg-[#180631]/90 border border-purple-500/25 p-5 shadow-xl"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-pink-400" />
                  <h2 className="text-base font-extrabold">{t.historyTitle}</h2>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {['all', 'successful', 'pending', 'failed', 'refunded'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setHistoryFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                        historyFilter === st
                          ? 'bg-pink-500 text-white'
                          : 'bg-white/5 text-purple-200 hover:bg-white/10'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {historyItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-purple-300/70">{t.noHistory}</div>
              ) : (
                <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                  {historyItems.map((item) => (
                    <div
                      key={item.orderId}
                      className="rounded-2xl bg-black/25 border border-purple-400/20 p-3 flex flex-wrap items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-white">{item.packageName}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              item.status === 'successful'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : item.status === 'pending' || item.status === 'processing'
                                ? 'bg-amber-500/20 text-amber-300'
                                : item.status === 'refunded'
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-purple-300/75 truncate mt-0.5">
                          {item.orderId} • {item.providerKey}
                        </p>
                        <p className="text-[11px] text-amber-300 font-bold mt-0.5">
                          +{item.totalCoins.toLocaleString()} Coins • ${item.amount.toFixed(2)} {item.currency}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.receiptId && (
                          <button
                            type="button"
                            data-testid={`view-receipt-${item.receiptId}`}
                            onClick={() => handleOpenReceipt(item.receiptId!)}
                            className="px-3 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/35 border border-pink-400/40 text-pink-200 text-xs font-bold flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{t.viewReceipt}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Authorized Payment Checkout / Sandbox Verification Modal */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            data-testid="checkout-verification-modal"
            className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#2a0c52] to-[#17052f] border border-pink-400/40 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>{t.modalTitle}</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveOrder(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeCheckoutProvider?.isSandbox && (
              <div className="rounded-xl bg-emerald-500/15 border border-emerald-400/40 px-3 py-2 text-[11px] font-bold text-emerald-200">
                Sandbox Test Mode Only — Cryptographically signed HMAC verification will execute without real card charges.
              </div>
            )}

            <div className="rounded-2xl bg-black/35 border border-purple-400/25 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-purple-200/75">Order ID</span>
                <span className="font-mono font-bold text-white">{activeOrder.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-200/75">Package</span>
                <span className="font-bold text-white">{activeOrder.packageName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-200/75">Base + Bonus</span>
                <span className="font-bold text-amber-300">
                  {activeOrder.baseCoins.toLocaleString()} + {activeOrder.bonusCoins.toLocaleString()} ={' '}
                  {activeOrder.totalCoins.toLocaleString()} Coins
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-200/75">Charge Amount</span>
                <span className="font-black text-pink-400 text-sm">
                  ${activeOrder.amount.toFixed(2)} {activeOrder.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-200/75">Status</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase">
                  {activeOrder.status}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                data-testid="sandbox-confirm-success-btn"
                disabled={submittingPayment}
                onClick={() => handleSandboxOutcome('succeeded')}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 disabled:opacity-50 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t.confirmSandbox}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  data-testid="sandbox-fail-btn"
                  disabled={submittingPayment}
                  onClick={() => handleSandboxOutcome('failed')}
                  className="py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/35 text-rose-200 text-xs font-bold flex items-center justify-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{t.failSandbox}</span>
                </button>
                <button
                  type="button"
                  data-testid="sandbox-pending-btn"
                  disabled={submittingPayment}
                  onClick={() => handleSandboxOutcome('pending')}
                  className="py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-purple-100 text-xs font-bold flex items-center justify-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{t.keepPending}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            data-testid="topup-receipt-modal"
            className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#280b4f] to-[#130428] border border-amber-400/40 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-black text-white">{t.receiptTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-black/40 border border-purple-400/25 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-purple-300/75">Receipt ID</span>
                <span className="font-mono font-bold text-amber-300">{activeReceipt.receiptId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-300/75">Order ID</span>
                <span className="font-mono text-white">{activeReceipt.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-300/75">Coin Ledger TX</span>
                <span className="font-mono text-emerald-300">{activeReceipt.coinTransactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-300/75">Payment Method</span>
                <span className="font-bold text-white">{activeReceipt.providerKey}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-300/75">Base Coins</span>
                <span className="text-white">{activeReceipt.baseCoins.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-300/75">Bonus Coins</span>
                <span className="text-amber-300">+{activeReceipt.bonusCoins.toLocaleString()}</span>
              </div>
              <div className="border-t border-purple-400/20 pt-2 flex justify-between font-black text-sm">
                <span className="text-white">Total Coins Credited</span>
                <span className="text-emerald-300">+{activeReceipt.totalCoins.toLocaleString()} Coins</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-purple-200">Amount Paid</span>
                <span className="text-pink-400">
                  ${Number(activeReceipt.amount).toFixed(2)} {activeReceipt.currency}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-purple-300/75">Status</span>
                <span className="uppercase font-bold text-emerald-300">{activeReceipt.status}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href={`/api/topup/receipts/${encodeURIComponent(activeReceipt.receiptId)}${qs ? `${qs}&` : '?'}format=txt`}
                download={`${activeReceipt.receiptId}.txt`}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#ff267e] to-[#ff4da0] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.downloadTxt}</span>
              </a>
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
