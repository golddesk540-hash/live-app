'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Lock,
  KeyRound,
  ShieldAlert,
  Loader2,
  X,
  Eye,
  EyeOff,
  User,
  Clock,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';

interface AccountInfo {
  id: string;
  poppoId: string;
  nickname: string;
  avatarUrl: string;
  email: string | null;
  phone: string | null;
  status: string;
}

interface SecurityInfo {
  hasPassword: boolean;
  isPinEnabled: boolean;
}

const CLOSURE_REASONS = [
  {
    id: 'no_longer_use',
    label_en: 'I no longer use Popo Live',
    label_ur: 'اب پوپو لائیو استعمال نہیں کرتا',
    desc_en: 'Taking a break or switched to another platform',
    desc_ur: 'وقفہ لے رہا ہوں یا کسی دوسرے پلیٹ فارم پر منتقل ہو گیا ہوں',
  },
  {
    id: 'privacy_concerns',
    label_en: 'Privacy or data security concerns',
    label_ur: 'رازداری یا ڈیٹا کے تحفظ کے خدشات',
    desc_en: 'Concerns about personal information or visibility',
    desc_ur: 'ذاتی معلومات یا عوامی نمائش سے متعلق خدشات',
  },
  {
    id: 'technical_problems',
    label_en: 'Technical issues or app bugs',
    label_ur: 'تکنیکی مسائل یا ایپلیکیشن کی خرابیاں',
    desc_en: 'Frequent crashes, stream lag, or device incompatibility',
    desc_ur: 'بار بار کریش ہونا یا اسٹریمنگ میں رکاوٹ',
  },
  {
    id: 'create_new_account',
    label_en: 'Want to create a fresh new account',
    label_ur: 'نیا اکاؤنٹ بنانا چاہتا ہوں',
    desc_en: 'Resetting identity, nickname, or linked credentials',
    desc_ur: 'نئی شناخت یا الگ اکاؤنٹ کا آغاز کرنا چاہتا ہوں',
  },
  {
    id: 'unhappy_with_platform',
    label_en: 'Unhappy with platform features or moderation',
    label_ur: 'پلیٹ فارم فیچرز یا پالیسیوں سے غیر مطمئن',
    desc_en: 'Rules, pricing, community policies, or support experience',
    desc_ur: 'قوانین، کوائن قیمتیں یا سپورٹ کا تجربہ',
  },
  {
    id: 'other',
    label_en: 'Other reasons',
    label_ur: 'کوئی اور وجہ',
    desc_en: 'A different reason not listed above',
    desc_ur: 'کوئی دوسری وجہ جو فہرست میں نہیں ہے',
  },
];

function AccountClosureContent() {
  const router = useRouter();
  const { lang, toggleLang } = useLanguage();
  const isUr = lang === 'ur';

  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [security, setSecurity] = useState<SecurityInfo | null>(null);
  const [activeRequest, setActiveRequest] = useState<any | null>(null);

  // Form states
  const [selectedReason, setSelectedReason] = useState<string>('no_longer_use');
  const [additionalExplanation, setAdditionalExplanation] = useState<string>('');
  const [acknowledged, setAcknowledged] = useState<boolean>(false);

  // Confirmation Modal states
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [authCredential, setAuthCredential] = useState<string>('');
  const [showCredential, setShowCredential] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // 1. Fetch user account info
        const accRes = await fetch('/api/account');
        if (!accRes.ok) {
          if (accRes.status === 401) {
            router.push('/login?redirect=/account/close');
            return;
          }
          throw new Error('Failed to load account details');
        }
        const accData = await accRes.json();
        setAccount(accData.account);
        setSecurity(accData.security);

        // 2. Fetch existing closure status
        const statusRes = await fetch('/api/account/closure/status');
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.hasRequest && ['pending', 'under_review'].includes(statusData.request?.status)) {
            setActiveRequest(statusData.request);
          }
        }
      } catch (err: any) {
        console.error('Error loading closure data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!acknowledged) {
      setSubmitError(isUr ? 'براہ کرم تمام شرائط اور انتباہات کو قبول کریں۔' : 'Please acknowledge the account closure terms.');
      return;
    }

    if (!selectedReason) {
      setSubmitError(isUr ? 'براہ کرم بندش کی وجہ منتخب کریں۔' : 'Please select a reason for closure.');
      return;
    }

    if (!authCredential.trim()) {
      setSubmitError(
        security?.hasPassword
          ? isUr ? 'اکاؤنٹ کا پاس ورڈ درج کرنا لازمی ہے۔' : 'Account password is required to verify identity.'
          : isUr ? 'سیکیورٹی پن درج کرنا لازمی ہے۔' : 'Security PIN is required to verify identity.'
      );
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/account/closure/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: selectedReason,
          additionalExplanation: additionalExplanation.trim() || undefined,
          confirmationAcknowledged: acknowledged,
          password: security?.hasPassword ? authCredential : undefined,
          pin: !security?.hasPassword && security?.isPinEnabled ? authCredential : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit closure request');
      }

      // Success -> Redirect to status page
      router.push('/account/close/status?submitted=1');
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong while processing your request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070514] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF2E74]" />
          <p className="text-xs text-white/60">
            {isUr ? 'اکاؤنٹ کی تفصیلات لوڈ ہو رہی ہیں...' : 'Loading account closure system...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main
      className="min-h-screen bg-[#070514] text-white flex flex-col items-center py-6 px-4 sm:px-6 relative selection:bg-[#FF2E74] selection:text-white"
      dir={isUr ? 'rtl' : 'ltr'}
    >
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-gradient-to-b from-pink-600/15 via-purple-700/10 to-transparent blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] bg-red-600/10 blur-[130px] rounded-full" />
      </div>

      {/* Main Container styled matching the reference phone card */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <Link
            href="/account"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft className={`w-4 h-4 ${isUr ? 'rotate-180' : ''}`} />
            <span>{isUr ? 'اکاؤنٹ پر واپس' : 'Back to Account'}</span>
          </Link>

          <button
            type="button"
            onClick={toggleLang}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white/80 transition-colors"
          >
            {isUr ? 'English' : 'اردو'}
          </button>
        </div>

        {/* Active Request Alert if pending */}
        {activeRequest && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-3 shadow-lg">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-300">
                  {isUr ? 'بندش کی درخواست زیرِ جائزہ ہے' : 'Active Closure Request Under Review'}
                </h4>
                <p className="text-[11px] text-white/70 mt-0.5">
                  {isUr
                    ? `درخواست نمبر #${activeRequest.requestNumber} جمع ہو چکی ہے۔`
                    : `Request #${activeRequest.requestNumber} is currently queued for verification.`}
                </p>
              </div>
            </div>
            <Link
              href="/account/close/status"
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shrink-0 transition-colors"
            >
              {isUr ? 'حیثیت دیکھیں' : 'View Status'}
            </Link>
          </div>
        )}

        {/* CARD HERO SECTION - 1:1 MATCH WITH 02_10_account_closure.png */}
        <div className="rounded-[32px] bg-[#120f26]/90 border border-white/10 shadow-2xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
          
          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-extrabold text-white text-center tracking-tight">
            {isUr ? 'اکاؤنٹ بندش کی درخواست' : 'Request Account Closure'}
          </h1>

          {/* Hero Triangle Warning Graphic */}
          <div className="flex justify-center pt-2">
            <div className="relative group">
              {/* Outer soft glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#FF2E74] to-[#FF4B8B] blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" />
              
              {/* Soft Triangle Shape matching reference */}
              <div className="relative w-28 h-24 sm:w-32 sm:h-28 flex items-center justify-center">
                <svg
                  viewBox="0 0 100 90"
                  className="w-full h-full filter drop-shadow-[0_10px_20px_rgba(255,46,116,0.35)]"
                >
                  <defs>
                    <linearGradient id="pinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FF4B8B" />
                      <stop offset="50%" stopColor="#FF2E74" />
                      <stop offset="100%" stopColor="#E60050" />
                    </linearGradient>
                  </defs>
                  {/* Rounded polygon triangle */}
                  <path
                    d="M 50 8
                       C 54 8, 57 12, 59 16
                       L 95 72
                       C 97 76, 96 82, 91 84
                       C 89 85, 87 85, 85 85
                       L 15 85
                       C 10 85, 5 82, 4 77
                       C 3 75, 4 73, 6 69
                       L 41 16
                       C 43 12, 46 8, 50 8 Z"
                    fill="url(#pinkGrad)"
                  />
                  {/* Exclamation mark */}
                  <rect x="47.5" y="32" width="5" height="24" rx="2.5" fill="#FFFFFF" />
                  <circle cx="50" cy="67" r="3.2" fill="#FFFFFF" />
                </svg>
              </div>
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-center text-sm font-medium text-white/80">
            {isUr ? 'آپ اپنا اکاؤنٹ بند کرنے کی درخواست دے سکتے ہیں۔' : 'You can request to close your account.'}
          </p>

          {/* Three Warning Bullet Items (Direct match to reference image) */}
          <div className="space-y-4 pt-2">
            
            {/* Warning 1 */}
            <div className="flex items-start gap-3.5">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#FF2E74] to-[#FF4B8B] flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-pink-500/20">
                <CheckCircle2 className="w-3.5 h-3.5 text-white stroke-[2.5]" />
              </div>
              <p className="text-xs sm:text-[13px] text-white/85 leading-relaxed">
                {isUr
                  ? 'بندش کے بعد آپ کی پروفائل، مواد اور ڈیٹا کو حذف کیا جا سکتا ہے۔'
                  : 'Your profile, content and data may be deleted after closure.'}
              </p>
            </div>

            {/* Warning 2 */}
            <div className="flex items-start gap-3.5">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#FF2E74] to-[#FF4B8B] flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-pink-500/20">
                <CheckCircle2 className="w-3.5 h-3.5 text-white stroke-[2.5]" />
              </div>
              <p className="text-xs sm:text-[13px] text-white/85 leading-relaxed">
                {isUr
                  ? 'یہ عمل مستقل ہے اور اسے واپس نہیں لیا جا سکتا۔'
                  : 'This action is permanent and cannot be undone.'}
              </p>
            </div>

            {/* Warning 3 */}
            <div className="flex items-start gap-3.5">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#FF2E74] to-[#FF4B8B] flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-pink-500/20">
                <CheckCircle2 className="w-3.5 h-3.5 text-white stroke-[2.5]" />
              </div>
              <p className="text-xs sm:text-[13px] text-white/85 leading-relaxed">
                {isUr
                  ? 'اگر آپ کے پاس کوائنز یا انعامات باقی ہیں تو بندش کی درخواست سے قبل انہیں کلیئر کر لیں۔'
                  : 'If you have coins or pending rewards, please resolve them before requesting closure.'}
              </p>
            </div>

          </div>

          {/* Account Summary Mini-Card */}
          {account && (
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/10 overflow-hidden">
                  {account.avatarUrl ? (
                    <img src={account.avatarUrl} alt={account.nickname} className="w-full h-full object-cover" />
                  ) : (
                    account.nickname?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    {account.nickname}
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 font-semibold uppercase">
                      {account.status}
                    </span>
                  </h3>
                  <p className="text-[10px] text-white/50 font-mono">ID: {account.poppoId}</p>
                </div>
              </div>
              <span className="text-[10px] text-white/40">Popo Live User</span>
            </div>
          )}

          {/* Reason Selection Section */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-white/90">
              {isUr ? 'بندش کی بنیادی وجہ منتخب کریں:' : 'Select reason for closure:'}
            </label>
            <div className="space-y-2">
              {CLOSURE_REASONS.map((r) => {
                const isSelected = selectedReason === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedReason(r.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-[#FF2E74]/15 border-[#FF2E74] text-white shadow-sm'
                        : 'bg-white/5 border-white/5 hover:bg-white/[0.08] text-white/80'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected ? 'border-[#FF2E74] bg-[#FF2E74]' : 'border-white/30'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold">{isUr ? r.label_ur : r.label_en}</div>
                      <div className="text-[10px] text-white/50">{isUr ? r.desc_ur : r.desc_en}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Additional Explanation Optional */}
            <div className="pt-2">
              <label className="block text-[11px] font-medium text-white/70 mb-1">
                {isUr ? 'اضافی وضاحت یا رائے (اختیاری):' : 'Additional explanation (optional):'}
              </label>
              <textarea
                rows={2}
                value={additionalExplanation}
                onChange={(e) => setAdditionalExplanation(e.target.value)}
                placeholder={
                  isUr
                    ? 'ہمیں بتائیں کہ ہم اپنے پلیٹ فارم کو کیسے بہتر بنا سکتے ہیں...'
                    : 'Tell us how we could have made your experience better...'
                }
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF2E74] resize-none"
              />
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-white/30 text-[#FF2E74] focus:ring-[#FF2E74] focus:ring-offset-0 bg-white/5 cursor-pointer accent-[#FF2E74]"
              />
              <span className="text-[11px] text-white/70 leading-relaxed">
                {isUr
                  ? 'میں تصدیق کرتا ہوں کہ میں نے تمام انتباہات پڑھ لیے ہیں اور میں 30 دن کی مہلت کے بعد اپنے اکاؤنٹ کی مستقل بندش کی درخواست کرنا چاہتا ہوں۔'
                  : 'I acknowledge that my account and associated data will be permanently queued for closure after the standard 30-day grace period.'}
              </span>
            </label>
          </div>

          {/* Action CTA Buttons */}
          <div className="space-y-3 pt-2">
            {/* Request Closure Button (Styled exactly like reference) */}
            <button
              type="button"
              disabled={!acknowledged || (activeRequest && ['pending', 'under_review'].includes(activeRequest.status))}
              onClick={() => {
                setSubmitError('');
                setShowConfirmModal(true);
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#FF2E74] via-[#FF3B7F] to-[#FF4B8B] hover:brightness-110 active:scale-[0.99] text-white font-bold text-sm shadow-xl shadow-pink-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isUr ? 'بندش کی درخواست دیں' : 'Request Closure'}
            </button>

            {/* Cancel Button */}
            <Link
              href="/account"
              className="w-full block py-3 text-center rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold transition-colors"
            >
              {isUr ? 'منسوخ کریں اور واپس جائیں' : 'Cancel & Return to Account'}
            </Link>
          </div>

          {/* Status Check Link */}
          <div className="text-center pt-1 border-t border-white/10">
            <Link
              href="/account/close/status"
              className="inline-flex items-center gap-1.5 text-xs text-[#FF4B8B] hover:text-pink-300 font-medium transition-colors"
            >
              <span>{isUr ? 'موجودہ درخواست کی حیثیت چیک کریں →' : 'Check Existing Closure Request Status →'}</span>
            </Link>
          </div>

        </div>

      </div>

      {/* CONFIRMATION / IDENTITY VERIFICATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-[#15102a] border border-white/15 p-6 shadow-2xl relative space-y-4">
            
            {/* Close button */}
            <button
              type="button"
              onClick={() => {
                setShowConfirmModal(false);
                setSubmitError('');
                setAuthCredential('');
              }}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header with lock icon */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {isUr ? 'شناخت کی تصدیق لازمی ہے' : 'Verify Your Identity'}
                </h3>
                <p className="text-[11px] text-white/50">
                  {isUr ? 'حتمی تصدیق کے لیے سیکیورٹی پاس ورڈ درج کریں' : 'Security verification is required to proceed'}
                </p>
              </div>
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Verification Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white/80">
                {security?.hasPassword
                  ? isUr ? 'اکاؤنٹ کا پاس ورڈ' : 'Account Password'
                  : isUr ? '6 ہندسوں کا سیکیورٹی پن' : '6-digit Security PIN'}
              </label>
              <div className="relative">
                <input
                  type={showCredential ? 'text' : 'password'}
                  value={authCredential}
                  onChange={(e) => setAuthCredential(e.target.value)}
                  placeholder={
                    security?.hasPassword
                      ? isUr ? 'اپنا موجودہ پاس ورڈ درج کریں' : 'Enter current account password'
                      : isUr ? 'اپنا 6 ہندسوں کا پن درج کریں' : 'Enter your 6-digit PIN'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF2E74] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCredential(!showCredential)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showCredential ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-white/40">
                {isUr
                  ? 'یہ قدم آپ کے اکاؤنٹ کو غیر مجاز بندش سے محفوظ رکھنے کے لیے ضروری ہے۔'
                  : 'This ensures only the legitimate account owner can initiate closure.'}
              </p>
            </div>

            {/* Warning confirmation notice */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] text-white/70">
              <span className="text-[#FF2E74] font-bold">
                {isUr ? 'نوٹ: ' : 'Note: '}
              </span>
              {isUr
                ? 'درخواست کے بعد 30 دن کی مہلت ہوگی جس کے دوران آپ کسی بھی وقت بندش منسوخ کر سکتے ہیں۔'
                : 'A 30-day grace period will start upon approval, during which you can cancel at any time.'}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setSubmitError('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-xs font-semibold transition-colors"
              >
                {isUr ? 'واپس جائیں' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={submitting || !authCredential}
                onClick={handleSubmitRequest}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 hover:brightness-110 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isUr ? 'تصدیق ہو رہی ہے...' : 'Verifying...'}</span>
                  </>
                ) : (
                  <span>{isUr ? 'حتمی تصدیق کریں' : 'Confirm Closure'}</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}

export default function AccountClosurePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070514] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF2E74]" />
        </div>
      }
    >
      <AccountClosureContent />
    </Suspense>
  );
}
