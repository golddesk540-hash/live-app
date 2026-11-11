'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCircle2,
  Coins,
  Crown,
  Download,
  FileText,
  Globe,
  History,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Timer,
  X,
  XCircle,
} from 'lucide-react';
import type { PaymentProviderRecord } from '@/lib/topup';
import type {
  ActiveUserVipProfile,
  VipBenefitRecord,
  VipOrderRecord,
  VipPlanRecord,
  VipReceiptRecord,
} from '@/lib/vip';

interface VipMembershipScreenProps {
  previewMode?: boolean;
}

const DEFAULT_BENEFIT_ROWS = [
  {
    key: 'vip_profile_badge',
    icon: '⭐',
    en: 'VIP Badge & Special Look',
    ur: 'وی آئی پی بیج اور خاص پہچان',
    accent: 'from-pink-500 to-rose-400',
  },
  {
    key: 'vip_gift_effects',
    icon: '✨',
    en: 'More Effects & Gifts',
    ur: 'مزید ایفیکٹس اور تحائف',
    accent: 'from-fuchsia-500 to-purple-400',
  },
  {
    key: 'special_vip_identity',
    icon: '👑',
    en: 'Higher Room Priority',
    ur: 'لائیو روم میں اعلیٰ ترجیح',
    accent: 'from-violet-500 to-indigo-400',
  },
  {
    key: 'vip_exclusive_features',
    icon: '🎁',
    en: 'Exclusive VIP Gifts',
    ur: 'خصوصی وی آئی پی تحائف',
    accent: 'from-amber-400 to-yellow-300',
  },
];

const STATUS_BADGE_STYLE: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
  pending: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
  expired: 'bg-slate-500/20 text-slate-300 border-slate-400/40',
  cancelled: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
  suspended: 'bg-red-500/25 text-red-200 border-red-400/50',
  refunded: 'bg-purple-500/20 text-purple-200 border-purple-400/40',
  none: 'bg-white/10 text-purple-200/80 border-white/15',
};

export function VipMembershipScreen({ previewMode = false }: VipMembershipScreenProps) {
  const [lang, setLang] = useState<'en' | 'ur'>('en');
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<VipPlanRecord[]>([]);
  const [benefitCatalog, setBenefitCatalog] = useState<VipBenefitRecord[]>([]);
  const [providers, setProviders] = useState<PaymentProviderRecord[]>([]);
  const [vipProfile, setVipProfile] = useState<ActiveUserVipProfile | null>(null);
  const [authUser, setAuthUser] = useState<any>(null);

  const [selectedPlanId, setSelectedPlanId] = useState<string>('vip_gold');
  const [selectedProvider, setSelectedProvider] = useState<string>('sandbox_verified');
  const [autoRenewConsent, setAutoRenewConsent] = useState<boolean>(false);
  const [showCompareMatrix, setShowCompareMatrix] = useState<boolean>(false);

  const [busyAction, setBusyAction] = useState<boolean>(false);
  const [pendingOrder, setPendingOrder] = useState<VipOrderRecord | null>(null);
  const [latestReceipt, setLatestReceipt] = useState<VipReceiptRecord | null>(null);
  const [liveNotifications, setLiveNotifications] = useState<string[]>([]);
  const [showAlertsDrawer, setShowAlertsDrawer] = useState<boolean>(false);
  const [bannerMsg, setBannerMsg] = useState<{ type: 'ok' | 'err' | 'info'; text: string } | null>(
    null
  );

  const sseRef = useRef<EventSource | null>(null);
  const isUr = lang === 'ur';
  const querySuffix = previewMode ? '?preview=demo' : '';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sessRes, catalogRes] = await Promise.all([
        fetch('/api/auth/session'),
        fetch('/api/vip/plans'),
      ]);
      const sessData = await sessRes.json().catch(() => ({}));
      const catalogData = await catalogRes.json().catch(() => ({}));
      setAuthUser(sessData?.user || null);

      const loadedPlans: VipPlanRecord[] = catalogData?.plans || [];
      setPlans(loadedPlans);
      setBenefitCatalog(catalogData?.benefitCatalog || []);
      setProviders(catalogData?.providers || []);

      if (loadedPlans.length > 0 && !loadedPlans.some((p) => p.planId === selectedPlanId)) {
        const popular = loadedPlans.find((p) => p.isPopular) || loadedPlans[0];
        setSelectedPlanId(popular.planId);
      }

      const statusRes = await fetch(`/api/vip/status${sessData?.user ? '' : querySuffix}`);
      if (statusRes.ok) {
        const statusData = await statusRes.json().catch(() => ({}));
        setVipProfile(statusData?.vip || null);
      }
    } catch (err) {
      console.error('VIP load error:', err);
    } finally {
      setLoading(false);
    }
  }, [querySuffix, selectedPlanId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time SSE connection for VIP lifecycle events
  useEffect(() => {
    if (!authUser && !previewMode) return;
    const url = `/api/vip/events${authUser ? '' : '?preview=demo'}`;
    const es = new EventSource(url);
    sseRef.current = es;

    const pushNote = (msg: string) => {
      setLiveNotifications((prev) => [msg, ...prev].slice(0, 8));
    };

    es.addEventListener('vip:state_sync', (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data);
        if (data?.vip) setVipProfile(data.vip);
      } catch {
        // ignore
      }
    });

    const handleLifecycle = (label: string) => (ev: MessageEvent) => {
      try {
        const payload = JSON.parse(ev.data);
        pushNote(`${label}: ${payload.planName || payload.membershipId || ''}`.trim());
        loadData();
      } catch {
        loadData();
      }
    };

    es.addEventListener('vip:purchase_pending', handleLifecycle('Pending Payment'));
    es.addEventListener('vip:purchase_completed', handleLifecycle('Payment Verified'));
    es.addEventListener('vip:membership_activated', handleLifecycle('VIP Activated'));
    es.addEventListener('vip:membership_renewed', handleLifecycle('VIP Renewed'));
    es.addEventListener('vip:membership_expired', handleLifecycle('VIP Expired'));
    es.addEventListener('vip:membership_cancelled', handleLifecycle('VIP Cancelled/Refunded'));
    es.addEventListener('vip:benefits_updated', () => loadData());

    return () => {
      es.close();
      sseRef.current = null;
    };
  }, [authUser, previewMode, loadData]);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.planId === selectedPlanId) || plans[0] || null,
    [plans, selectedPlanId]
  );

  const selectedProviderObj = useMemo(
    () => providers.find((p) => p.providerKey === selectedProvider) || null,
    [providers, selectedProvider]
  );

  const canRenewCurrent = Boolean(
    vipProfile &&
      vipProfile.membershipId &&
      vipProfile.status !== 'refunded' &&
      vipProfile.status !== 'suspended' &&
      (vipProfile.hasActiveVip || vipProfile.status === 'expired' || vipProfile.status === 'cancelled')
  );

  const startVipCheckout = async (orderType: 'purchase' | 'renewal') => {
    if (!selectedPlan) return;
    setBusyAction(true);
    setBannerMsg(null);
    try {
      const endpoint = orderType === 'renewal' ? '/api/vip/renew' : '/api/vip/purchase';
      const res = await fetch(`${endpoint}${authUser ? '' : querySuffix}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.planId,
          providerKey: selectedProvider,
          platform: 'web',
          membershipId: orderType === 'renewal' ? vipProfile?.membershipId : undefined,
          autoRenewConsent,
          idempotencyKey: `ui_vip_${orderType}_${selectedPlan.planId}_${Date.now()}`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBannerMsg({
          type: 'err',
          text: `${data.errorCode || 'ERROR'}: ${data.error || 'Could not start VIP checkout.'}`,
        });
        return;
      }

      if (data.activatedImmediately && data.receipt) {
        setLatestReceipt(data.receipt);
        setBannerMsg({ type: 'ok', text: data.message || 'VIP Membership activated!' });
        await loadData();
      } else if (data.order) {
        setPendingOrder(data.order);
        setBannerMsg({
          type: 'info',
          text: isUr
            ? 'آرڈر زیر التوا ہے — ادائیگی کی تصدیق ہونے تک VIP فعال نہیں ہوگا۔'
            : `Order ${data.order.orderId} is Pending. Complete verified payment to activate VIP.`,
        });
      }
    } catch (err: any) {
      setBannerMsg({ type: 'err', text: err?.message || 'VIP checkout request failed.' });
    } finally {
      setBusyAction(false);
    }
  };

  const handleSandboxConfirm = async (outcome: 'succeed' | 'fail') => {
    if (!pendingOrder) return;
    setBusyAction(true);
    setBannerMsg(null);
    try {
      const res = await fetch(`/api/vip/sandbox/complete${authUser ? '' : querySuffix}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: pendingOrder.orderId,
          outcome,
        }),
      });
      const data = await res.json().catch(() => ({}));
      setPendingOrder(null);
      if (outcome === 'fail' || !res.ok || !data.success) {
        setBannerMsg({
          type: 'err',
          text:
            data.message ||
            data.error ||
            'Payment failed verification. Zero VIP benefits were activated.',
        });
      } else {
        if (data.receipt) setLatestReceipt(data.receipt);
        setBannerMsg({
          type: 'ok',
          text: data.message || 'Verified payment received! VIP Membership & benefits are now active.',
        });
      }
      await loadData();
    } catch (err: any) {
      setBannerMsg({ type: 'err', text: err?.message || 'Verification call failed.' });
    } finally {
      setBusyAction(false);
    }
  };

  const handleCancelVip = async () => {
    if (!vipProfile?.membershipId) return;
    setBusyAction(true);
    try {
      const res = await fetch(`/api/vip/cancel${authUser ? '' : querySuffix}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipId: vipProfile.membershipId,
          cancelMode: 'immediate',
          reason: 'Cancelled from VIP Membership screen',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBannerMsg({ type: 'err', text: data.error || 'Could not cancel membership.' });
      } else {
        setBannerMsg({
          type: 'info',
          text: isUr
            ? 'VIP رکنیت منسوخ کر دی گئی اور تمام VIP مراعات ہٹا دی گئیں۔'
            : 'VIP membership cancelled and active VIP benefits revoked cleanly.',
        });
        await loadData();
      }
    } finally {
      setBusyAction(false);
    }
  };

  return (
    <div
      dir={isUr ? 'rtl' : 'ltr'}
      className="min-h-screen bg-gradient-to-b from-[#0C071E] via-[#130829] to-[#080412] text-white pb-12"
      data-testid="vip-membership-screen"
    >
      {/* Top Glow Backdrop */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.28),transparent_65%)]" />

      <div className="relative mx-auto max-w-4xl px-3 sm:px-6 pt-3">
        {/* Top Bar matching 07_07_vip.png */}
        <header className="flex items-center justify-between gap-2 py-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={previewMode ? '/wallet?preview=demo' : '/wallet'}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0 transition"
              title="Back to Wallet"
            >
              <ArrowLeft className="w-4 h-4 text-purple-200" />
            </Link>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#F43F5E] via-[#C026D3] to-[#7C3AED] flex items-center justify-center shadow-[0_0_16px_rgba(236,36,143,0.45)] shrink-0">
              <span className="font-black text-white text-sm">P</span>
            </div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-white truncate">
              Popo Live
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAlertsDrawer((v) => !v)}
              className="relative w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 border border-purple-400/20 flex items-center justify-center transition"
              title="Real-time VIP Notifications"
            >
              <Bell className="w-4 h-4 text-purple-100" />
              {liveNotifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#EC248F]" />
              )}
            </button>

            <button
              type="button"
              data-testid="vip-lang-toggle"
              onClick={() => setLang((prev) => (prev === 'en' ? 'ur' : 'en'))}
              className="px-2.5 h-9 rounded-full bg-white/10 hover:bg-white/15 border border-purple-400/25 flex items-center gap-1 text-xs font-bold text-purple-100 transition"
            >
              <Globe className="w-3.5 h-3.5 text-amber-300" />
              <span>{lang === 'en' ? 'اردو' : 'EN'}</span>
            </button>

            <Link
              href={`/vip/history${previewMode ? '?preview=demo' : ''}`}
              data-testid="vip-history-link"
              className="w-9 h-9 sm:w-auto sm:px-3 h-9 rounded-full bg-white/10 hover:bg-white/15 border border-purple-400/25 flex items-center justify-center gap-1.5 text-xs font-semibold text-purple-100 transition"
              title={isUr ? 'وی آئی پی تاریخ' : 'VIP History'}
            >
              <History className="w-4 h-4 text-purple-200" />
              <span className="hidden sm:inline">{isUr ? 'تاریخ' : 'History'}</span>
            </Link>
          </div>
        </header>

        {/* Live Notification Strip */}
        {showAlertsDrawer && (
          <div className="mb-3 rounded-2xl bg-[#1A103D] border border-purple-400/30 p-3 text-xs space-y-1">
            <div className="flex items-center justify-between font-bold text-purple-200">
              <span>{isUr ? 'ریئل ٹائم VIP اطلاعات' : 'Real-Time VIP Event Stream'}</span>
              <button type="button" onClick={() => setShowAlertsDrawer(false)}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {liveNotifications.length === 0 ? (
              <p className="text-purple-300/70">
                {isUr ? 'SSE براہِ راست منسلک ہے — نئی سرگرمی کا انتظار۔' : 'SSE stream connected. Listening for live VIP events.'}
              </p>
            ) : (
              liveNotifications.map((n, i) => (
                <div key={i} className="text-emerald-300 font-medium">
                  • {n}
                </div>
              ))
            )}
          </div>
        )}

        {/* Hero Gold VIP Crown Crest matching 07_07_vip.png */}
        <section className="flex flex-col items-center text-center pt-2 pb-5">
          <div className="relative w-32 h-32 flex items-center justify-center mb-2">
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.45)_0%,rgba(168,85,247,0.3)_45%,transparent_72%)] animate-pulse" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-b from-[#2E1659] to-[#140A2C] border-2 border-amber-400/70 shadow-[0_0_32px_rgba(251,191,36,0.4)] flex flex-col items-center justify-center">
              <Crown className="w-11 h-11 text-amber-300 drop-shadow-[0_2px_10px_rgba(251,191,36,0.8)]" />
              <span className="mt-0.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 text-[#1D0F03] text-[10px] font-black tracking-widest">
                {vipProfile?.hasActiveVip ? vipProfile.badgeLabel || 'VIP' : 'VIP'}
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {isUr ? 'وی آئی پی بنیں' : 'Become a VIP'}
          </h1>
          <p className="text-xs sm:text-sm text-purple-200/75 mt-1 max-w-md">
            {isUr
              ? 'منظور شدہ وی آئی پی بیج، پروفائل فریم، آمد اینیمیشن اور خاص پہچان ان لاک کریں۔'
              : 'Unlock verified VIP crown badges, profile frames, royal room entrances, and exclusive visual look.'}
          </p>
        </section>

        {/* Feedback Banner */}
        {bannerMsg && (
          <div
            data-testid="vip-status-banner"
            className={`mb-4 rounded-2xl border px-4 py-3 text-xs sm:text-sm flex items-start justify-between gap-2 ${
              bannerMsg.type === 'ok'
                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                : bannerMsg.type === 'err'
                ? 'bg-rose-500/15 border-rose-400/40 text-rose-200'
                : 'bg-amber-500/15 border-amber-400/40 text-amber-100'
            }`}
          >
            <span>{bannerMsg.text}</span>
            <button type="button" onClick={() => setBannerMsg(null)} className="shrink-0 opacity-70 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Current Membership Status Strip */}
        <section
          data-testid="current-vip-status-card"
          className="mb-5 rounded-3xl bg-[#160D35]/90 border border-purple-500/30 p-4 shadow-xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* VIP Profile Frame Preview around Avatar */}
              <div
                className={`relative w-12 h-12 rounded-full p-[3px] ${
                  vipProfile?.hasActiveVip
                    ? 'bg-gradient-to-tr from-amber-400 via-[#EC248F] to-yellow-300 shadow-[0_0_20px_rgba(251,191,36,0.65)]'
                    : 'bg-white/15'
                }`}
              >
                <div className="w-full h-full rounded-full bg-[#0F0823] flex items-center justify-center text-sm font-black">
                  {vipProfile?.hasActiveVip ? (
                    <Crown className="w-5 h-5 text-amber-300" />
                  ) : (
                    <Star className="w-5 h-5 text-purple-300/60" />
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-extrabold text-white">
                    {vipProfile?.hasActiveVip
                      ? vipProfile.planName || 'Active VIP'
                      : isUr
                      ? 'اسٹینڈرڈ ممبر'
                      : 'Standard Member'}
                  </span>
                  <span
                    data-testid="vip-current-status-pill"
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      STATUS_BADGE_STYLE[vipProfile?.status || 'none'] || STATUS_BADGE_STYLE.none
                    }`}
                  >
                    {vipProfile?.hasActiveVip ? 'Active' : vipProfile?.status || 'None'}
                  </span>
                  {vipProfile?.hasActiveVip && vipProfile.badgeLabel && (
                    <span
                      data-testid="vip-active-badge-label"
                      className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 text-[#1D0F03] text-[10px] font-black"
                    >
                      {vipProfile.badgeLabel}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-purple-200/75 mt-0.5">
                  {vipProfile?.hasActiveVip && vipProfile.expiryDate ? (
                    <>
                      <Timer className="inline w-3 h-3 mr-1 text-amber-300" />
                      {isUr ? 'میعاد ختم:' : 'Expires:'}{' '}
                      <span data-testid="vip-expiry-date">
                        {new Date(vipProfile.expiryDate).toLocaleDateString()}
                      </span>{' '}
                      ({vipProfile.daysRemaining} {isUr ? 'دن باقی' : 'days left'})
                    </>
                  ) : vipProfile?.status && vipProfile.status !== 'none' ? (
                    <span>
                      {isUr ? 'حالیہ حیثیت:' : 'Latest status:'} {vipProfile.status.toUpperCase()} —{' '}
                      {isUr ? 'فعال مراعات موجود نہیں' : 'No active VIP benefits'}
                    </span>
                  ) : isUr ? (
                    'نیچے اپنا پسندیدہ VIP پلان منتخب کریں'
                  ) : (
                    'Select an approved VIP plan below to unlock crown privileges'
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {vipProfile?.hasActiveVip && (
                <button
                  type="button"
                  data-testid="vip-cancel-btn"
                  disabled={busyAction}
                  onClick={handleCancelVip}
                  className="px-3 py-1.5 rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/35 text-[11px] font-bold text-rose-200 transition"
                >
                  {isUr ? 'منسوخ کریں' : 'Cancel VIP'}
                </button>
              )}
              <button
                type="button"
                onClick={() => loadData()}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                title="Refresh VIP status"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-purple-200 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Main 2-column Responsive Layout on Desktop, clean 1:1 Stack on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left/Top: Plan Cards & Signature 07_07_vip.png Benefits Glass Card */}
          <div className="lg:col-span-7 space-y-4">
            {/* Configurable Backend VIP Plans Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-purple-200/80">
                  {isUr ? 'منظور شدہ VIP پلانز' : 'Approved VIP Plans'}
                </h2>
                <button
                  type="button"
                  data-testid="vip-compare-toggle"
                  onClick={() => setShowCompareMatrix((v) => !v)}
                  className="text-xs font-bold text-amber-300 hover:text-amber-200 underline underline-offset-2"
                >
                  {showCompareMatrix
                    ? isUr
                      ? 'موازنہ بند کریں'
                      : 'Hide Comparison'
                    : isUr
                    ? 'تمام پلانز کا موازنہ'
                    : 'Compare Benefits'}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {plans.map((plan) => {
                  const isSel = plan.planId === selectedPlan?.planId;
                  return (
                    <button
                      key={plan.planId}
                      type="button"
                      data-testid={`vip-plan-card-${plan.planId}`}
                      onClick={() => setSelectedPlanId(plan.planId)}
                      className={`relative text-left rounded-2xl p-3 border transition-all ${
                        isSel
                          ? 'bg-gradient-to-br from-[#2B155D] to-[#1B0D3F] border-amber-400 shadow-[0_0_22px_rgba(251,191,36,0.28)]'
                          : 'bg-[#150C31]/85 border-purple-500/25 hover:border-purple-400/50'
                      }`}
                    >
                      {plan.isPopular && (
                        <span className="absolute -top-2 right-2 px-2 py-0.5 rounded-full bg-[#EC248F] text-white text-[9px] font-black uppercase">
                          {isUr ? 'مقبول' : 'Popular'}
                        </span>
                      )}
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black">
                          {plan.badgeLabel}
                        </span>
                        <span className="text-[10px] text-purple-200/70">
                          {plan.durationDays}d
                        </span>
                      </div>
                      <div className="font-extrabold text-sm text-white truncate">
                        {isUr ? plan.planNameUr : plan.planName}
                      </div>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-base font-black text-amber-300">
                          ${plan.priceAmount.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-purple-300/70">{plan.currency}</span>
                      </div>
                      {plan.allowCoinPurchase && plan.coinPrice ? (
                        <div className="mt-1 text-[10px] font-bold text-yellow-200 flex items-center gap-1">
                          <Coins className="w-3 h-3 text-amber-400" />
                          <span>{plan.coinPrice.toLocaleString()} Coins</span>
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Signature Benefits Glass Card matching 07_07_vip.png */}
            <div
              data-testid="vip-benefits-card"
              className="rounded-3xl bg-[#160D35]/90 border border-purple-400/30 p-4 sm:p-5 shadow-2xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white">
                  {selectedPlan
                    ? isUr
                      ? `${selectedPlan.planNameUr} مراعات`
                      : `${selectedPlan.planName} Benefits`
                    : 'VIP Privileges'}
                </h3>
                {selectedPlan && (
                  <span className="text-[11px] font-semibold text-amber-300">
                    {selectedPlan.benefits.length} {isUr ? 'منظور شدہ فوائد' : 'Approved Perks'}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {(selectedPlan?.benefits?.length
                  ? selectedPlan.benefits.slice(0, 6)
                  : DEFAULT_BENEFIT_ROWS.map((d, i) => ({
                      benefitKey: d.key,
                      title: d.en,
                      titleUr: d.ur,
                      description: '',
                      descriptionUr: '',
                      minVipLevel: i + 1,
                    }))
                ).map((b: any, idx: number) => {
                  const visual = DEFAULT_BENEFIT_ROWS[idx % DEFAULT_BENEFIT_ROWS.length];
                  return (
                    <div key={b.benefitKey} className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${visual.accent} flex items-center justify-center text-sm shadow-md shrink-0`}
                      >
                        {visual.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white leading-snug">
                          {isUr ? b.titleUr || b.title : b.title}
                        </div>
                        {b.description && (
                          <p className="text-[11px] text-purple-200/70 leading-snug">
                            {isUr ? b.descriptionUr || b.description : b.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="pt-2 border-t border-white/10 text-[10px] text-purple-300/70 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  {isUr
                    ? 'VIP مراعات صرف شناخت اور بصری فوائد ہیں؛ یہ مالی انعامات یا 70/30 ہوسٹ شیئر تبدیل نہیں کرتیں۔'
                    : 'Purely non-financial visual & identity perks. Never modifies gift points or the 70%/30% host share.'}
                </span>
              </p>
            </div>

            {/* Plan Comparison Table (Expandable) */}
            {showCompareMatrix && benefitCatalog.length > 0 && (
              <div
                data-testid="vip-comparison-matrix"
                className="rounded-3xl bg-[#140B2F]/95 border border-purple-500/30 p-4 overflow-x-auto"
              >
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-300 mb-3">
                  {isUr ? 'تمام VIP درجات کا موازنہ' : 'Full Plan Benefit Comparison'}
                </h4>
                <table className="w-full text-[11px] text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-purple-200/80">
                      <th className="py-2 pr-3">{isUr ? 'مراعات' : 'Benefit'}</th>
                      {plans.map((p) => (
                        <th key={p.planId} className="py-2 px-2 text-center font-extrabold">
                          {p.badgeLabel}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {benefitCatalog.map((b) => (
                      <tr key={b.benefitKey} className="border-b border-white/5">
                        <td className="py-2 pr-3 font-medium text-white">
                          {isUr ? b.titleUr : b.title}
                        </td>
                        {plans.map((p) => {
                          const hasIt = p.benefitKeys.includes(b.benefitKey);
                          return (
                            <td key={p.planId} className="py-2 px-2 text-center">
                              {hasIt ? (
                                <Check className="inline w-4 h-4 text-emerald-400" />
                              ) : (
                                <span className="text-white/25">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right/Bottom: Payment Methods, Checkout Summary, Renewal & Upgrade CTA */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl bg-[#160D35]/95 border border-purple-400/30 p-4 sm:p-5 space-y-4 shadow-xl">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-200/85">
                {isUr ? 'ادائیگی کا طریقہ منتخب کریں' : 'Payment Method'}
              </h3>

              <div className="space-y-2">
                {providers.map((prov) => {
                  const isSel = selectedProvider === prov.providerKey;
                  const ready = prov.isReadyForPayment;
                  return (
                    <button
                      key={prov.providerKey}
                      type="button"
                      data-testid={`vip-provider-${prov.providerKey}`}
                      onClick={() => setSelectedProvider(prov.providerKey)}
                      className={`w-full flex items-center justify-between gap-2 rounded-2xl px-3.5 py-2.5 border text-left transition ${
                        isSel
                          ? 'bg-[#261456] border-[#EC248F] shadow-[0_0_14px_rgba(236,36,143,0.3)]'
                          : 'bg-white/[0.04] border-white/10 hover:border-purple-400/40'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {isUr ? prov.displayNameUr || prov.displayName : prov.displayName}
                        </div>
                        <div className="text-[10px] text-purple-200/70">
                          {ready
                            ? isUr
                              ? 'تصدیق شدہ سینڈ باکس ادائیگی'
                              : 'HMAC-Verified Checkout Ready'
                            : isUr
                            ? 'مرچنٹ کیز زیر التوا ہیں'
                            : 'Live Credentials Pending'}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
                          ready
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                            : 'bg-amber-500/15 text-amber-200 border border-amber-400/30'
                        }`}
                      >
                        {ready ? 'READY' : 'PENDING KEY'}
                      </span>
                    </button>
                  );
                })}

                {selectedPlan?.allowCoinPurchase && selectedPlan.coinPrice ? (
                  <button
                    type="button"
                    data-testid="vip-provider-wallet_coins"
                    onClick={() => setSelectedProvider('wallet_coins')}
                    className={`w-full flex items-center justify-between gap-2 rounded-2xl px-3.5 py-2.5 border text-left transition ${
                      selectedProvider === 'wallet_coins'
                        ? 'bg-[#261456] border-amber-400'
                        : 'bg-white/[0.04] border-white/10'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-amber-200">
                        {isUr ? 'والٹ سکے استعمال کریں' : 'Popo Coins Wallet (Approved)'}
                      </div>
                      <div className="text-[10px] text-amber-300/80">
                        {selectedPlan.coinPrice.toLocaleString()} Coins
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 text-[9px] font-black">
                      COINS
                    </span>
                  </button>
                ) : null}
              </div>

              {/* Recurring billing consent checkbox (never forced or pre-checked) */}
              <label className="flex items-start gap-2 rounded-xl bg-black/25 border border-white/10 p-2.5 text-[11px] text-purple-200/85 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRenewConsent}
                  onChange={(e) => setAutoRenewConsent(e.target.checked)}
                  className="mt-0.5 accent-[#EC248F]"
                />
                <span>
                  {isUr
                    ? 'اختیاری تجدید کی رضامندی: صرف تب فعال جب ادائیگی فراہم کنندہ سپورٹ کرے۔'
                    : 'Optional auto-renewal consent (enabled only where supported by an approved provider).'}
                </span>
              </label>

              {/* Selected Summary */}
              {selectedPlan && (
                <div className="rounded-2xl bg-black/30 border border-white/10 p-3 text-xs space-y-1">
                  <div className="flex justify-between text-purple-200/80">
                    <span>{isUr ? 'منتخب پلان' : 'Selected Plan'}</span>
                    <span className="font-bold text-white">
                      {selectedPlan.planName} ({selectedPlan.badgeLabel})
                    </span>
                  </div>
                  <div className="flex justify-between text-purple-200/80">
                    <span>{isUr ? 'مدت' : 'Duration'}</span>
                    <span className="font-bold text-white">{selectedPlan.durationDays} Days</span>
                  </div>
                  <div className="flex justify-between text-purple-200/80">
                    <span>{isUr ? 'اصل قیمت' : 'Approved Price'}</span>
                    <span className="font-black text-amber-300">
                      {selectedPlan.currency} ${selectedPlan.priceAmount.toFixed(2)}
                    </span>
                  </div>
                  {canRenewCurrent && (
                    <div className="flex justify-between text-emerald-300">
                      <span>{isUr ? 'تجدید قیمت' : 'Renewal Price'}</span>
                      <span className="font-black">
                        ${selectedPlan.renewalPriceAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Primary Warm Gold Upgrade VIP Pill matching 07_07_vip.png */}
              <button
                type="button"
                data-testid="vip-upgrade-btn"
                disabled={busyAction || !selectedPlan}
                onClick={() => startVipCheckout('purchase')}
                className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#F59E0B] via-[#FDE047] to-[#F59E0B] text-[#1A0D02] font-black text-base shadow-[0_8px_28px_rgba(245,158,11,0.45)] hover:brightness-105 active:scale-[0.99] transition disabled:opacity-50"
              >
                {busyAction
                  ? isUr
                    ? 'عمل جاری ہے...'
                    : 'Processing...'
                  : isUr
                  ? 'وی آئی پی اپ گریڈ کریں'
                  : 'Upgrade VIP'}
              </button>

              {canRenewCurrent && (
                <button
                  type="button"
                  data-testid="vip-renew-btn"
                  disabled={busyAction}
                  onClick={() => startVipCheckout('renewal')}
                  className="w-full py-2.5 px-5 rounded-full bg-[#EC248F]/20 hover:bg-[#EC248F]/30 border border-[#EC248F]/60 text-pink-100 font-bold text-xs transition"
                >
                  {isUr
                    ? 'موجودہ VIP رکنیت کی تجدید کریں'
                    : `Renew Membership ($${selectedPlan?.renewalPriceAmount.toFixed(2) || '0.00'})`}
                </button>
              )}

              {!selectedProviderObj?.isReadyForPayment && selectedProvider !== 'wallet_coins' && (
                <p className="text-[11px] text-amber-200/85 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                  <span>
                    {isUr
                      ? 'یہ ادائیگی طریقہ کار لائیو کلیدوں کا منتظر ہے۔ ٹیسٹنگ کے لیے Sandbox منتخب کریں۔'
                      : 'External live provider keys pending. Choose Payment Sandbox for QA checkout.'}
                  </span>
                </p>
              )}
            </div>

            {/* Quick Cross-Links */}
            <div className="flex flex-wrap gap-2 text-[11px] justify-center">
              <Link
                href={`/vip/history${previewMode ? '?preview=demo' : ''}`}
                className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-purple-200"
              >
                {isUr ? 'VIP خریداری کی تاریخ' : 'VIP History & Receipts'}
              </Link>
              <Link
                href={previewMode ? '/animations?preview=demo' : '/animations'}
                className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-purple-200"
              >
                {isUr ? 'VIP آمد اینیمیشن' : 'VIP Entrances (7.4)'}
              </Link>
              <Link
                href={previewMode ? '/profile?preview=demo' : '/profile'}
                className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-purple-200"
              >
                {isUr ? 'میرا پروفائل' : 'Profile Badge Preview'}
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Module Watermark matching 07_07_vip.png */}
        <footer className="mt-8 flex flex-col items-center gap-1.5 pb-4">
          <span
            data-testid="vip-module-watermark"
            className="px-5 py-1 rounded-full bg-[#EC248F] text-white font-black text-xs tracking-wider shadow-[0_0_20px_rgba(236,36,143,0.6)]"
          >
            P7.7
          </span>
          <span className="text-xs font-black tracking-widest uppercase text-white/90">VIP</span>
        </footer>
      </div>

      {/* Sandbox Checkout Verification Modal */}
      {pendingOrder && (
        <div
          data-testid="vip-sandbox-modal"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-3xl bg-[#180E3B] border border-amber-400/40 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-300" />
                <h3 className="text-base font-black text-white">
                  {isUr ? 'تصدیق شدہ سینڈ باکس ادائیگی' : 'Verified Sandbox VIP Checkout'}
                </h3>
              </div>
              <button type="button" onClick={() => setPendingOrder(null)}>
                <X className="w-4 h-4 text-purple-200" />
              </button>
            </div>

            <div className="rounded-2xl bg-black/35 border border-white/10 p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-purple-200/70">Order ID</span>
                <span className="font-mono font-bold text-white">{pendingOrder.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-200/70">Plan</span>
                <span className="font-bold text-amber-300">
                  {pendingOrder.planName} ({pendingOrder.durationDays}d)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-200/70">Type</span>
                <span className="uppercase font-bold text-pink-300">{pendingOrder.orderType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-200/70">Charge</span>
                <span className="font-black text-white">
                  {pendingOrder.currency} ${pendingOrder.amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-200/70">Current VIP Status</span>
                <span className="text-amber-300 font-bold">PENDING (0 Active Perks)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                data-testid="vip-sandbox-fail-btn"
                disabled={busyAction}
                onClick={() => handleSandboxConfirm('fail')}
                className="py-2.5 px-3 rounded-full bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-xs font-bold text-rose-200 flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>{isUr ? 'ناکام ادائیگی ٹیسٹ' : 'Simulate Fail'}</span>
              </button>
              <button
                type="button"
                data-testid="vip-sandbox-approve-btn"
                disabled={busyAction}
                onClick={() => handleSandboxConfirm('succeed')}
                className="py-2.5 px-3 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FDE047] text-[#1A0D02] text-xs font-black flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isUr ? 'ادائیگی کی تصدیق کریں' : 'Verify & Activate VIP'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official VIP Receipt Modal */}
      {latestReceipt && (
        <div
          data-testid="vip-receipt-modal"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-3xl bg-[#180E3B] border border-emerald-400/45 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-300">
                <FileText className="w-5 h-5" />
                <h3 className="text-base font-black">
                  {isUr ? 'سرکاری VIP رسید' : 'Official VIP Receipt'}
                </h3>
              </div>
              <button type="button" onClick={() => setLatestReceipt(null)}>
                <X className="w-4 h-4 text-purple-200" />
              </button>
            </div>

            <div className="rounded-2xl bg-black/35 border border-white/10 p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-purple-200/70">Receipt ID</span>
                <span className="font-mono font-bold text-white">{latestReceipt.receiptId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-200/70">Membership ID</span>
                <span className="font-mono text-purple-100">{latestReceipt.membershipId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-200/70">Plan</span>
                <span className="font-bold text-amber-300">{latestReceipt.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-200/70">Paid</span>
                <span className="font-bold text-emerald-300">
                  {latestReceipt.currency} ${latestReceipt.amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-200/70">Expires</span>
                <span className="text-white">
                  {new Date(latestReceipt.expiryDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`/api/vip/receipts/${encodeURIComponent(latestReceipt.receiptId)}?format=txt${
                  authUser ? '' : '&preview=demo'
                }`}
                className="flex-1 py-2.5 px-4 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-xs font-bold text-emerald-200 flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>{isUr ? 'رسید ڈاؤن لوڈ (.TXT)' : 'Download Receipt (.TXT)'}</span>
              </a>
              <button
                type="button"
                onClick={() => setLatestReceipt(null)}
                className="px-4 py-2.5 rounded-full bg-white/10 text-xs font-bold text-white"
              >
                {isUr ? 'بند کریں' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
