'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import {
  ArrowLeft,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  History,
  Loader2,
  User,
  Calendar,
  AlertOctagon,
  ChevronRight,
  ExternalLink,
  Shield,
  FileText,
} from 'lucide-react';

interface ClosureRequestData {
  id: string;
  requestNumber: string;
  poppoId: string;
  nickname: string;
  avatarUrl: string;
  reason: string;
  additionalExplanation?: string | null;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  statusDescription: { en: string; ur: string };
  requestedDate: string;
  reviewedDate?: string | null;
  completedDate?: string | null;
  cancelledDate?: string | null;
  canCancel: boolean;
}

interface AuditRecord {
  id: string;
  action: string;
  previous_status: string | null;
  new_status: string;
  action_date: string;
  user_agent: string;
}

function AccountClosureStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justSubmitted = searchParams.get('submitted') === '1';

  const { lang, toggleLang } = useLanguage();
  const isUr = lang === 'ur';

  const [loading, setLoading] = useState(true);
  const [hasRequest, setHasRequest] = useState(false);
  const [request, setRequest] = useState<ClosureRequestData | null>(null);
  const [auditLog, setAuditLog] = useState<AuditRecord[]>([]);

  // Cancel action state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [actionErrorMsg, setActionErrorMsg] = useState('');

  const loadStatusAndHistory = async () => {
    try {
      setLoading(true);
      // 1. Fetch current status
      const res = await fetch('/api/account/closure/status');
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login?redirect=/account/close/status');
          return;
        }
        throw new Error('Failed to load status');
      }
      const data = await res.json();
      setHasRequest(data.hasRequest);
      setRequest(data.request || null);

      // 2. Fetch history & audit trail
      const histRes = await fetch('/api/account/closure/history');
      if (histRes.ok) {
        const histData = await histRes.json();
        setAuditLog(histData.auditLog || []);
      }
    } catch (err: any) {
      console.error('Error fetching closure status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatusAndHistory();
  }, []);

  const handleCancelRequest = async () => {
    try {
      setCancelling(true);
      setActionErrorMsg('');
      setActionSuccessMsg('');

      const res = await fetch('/api/account/closure/cancel', {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel closure request');
      }

      setShowCancelModal(false);
      setActionSuccessMsg(
        isUr
          ? 'آپ کی اکاؤنٹ بندش کی درخواست کامیابی سے منسوخ کر دی گئی ہے۔ آپ کا اکاؤنٹ فعال ہے۔'
          : 'Your account closure request has been cancelled. Your account remains active and in good standing.'
      );

      // Refresh data
      await loadStatusAndHistory();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Error occurred while cancelling request.');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          bg: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
          icon: Clock,
          label: isUr ? 'درخواست زیرِ جائزہ' : 'Pending Review',
        };
      case 'under_review':
        return {
          bg: 'bg-blue-500/15 border-blue-500/40 text-blue-300',
          icon: Shield,
          label: isUr ? 'سیکیورٹی جائزہ جاری' : 'Under Investigation',
        };
      case 'approved':
        return {
          bg: 'bg-purple-500/15 border-purple-500/40 text-purple-300',
          icon: CheckCircle2,
          label: isUr ? 'منظور شدہ (30 روزہ مہلت)' : 'Approved (30-Day Grace)',
        };
      case 'rejected':
        return {
          bg: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
          icon: XCircle,
          label: isUr ? 'درخواست مسترد' : 'Request Rejected',
        };
      case 'cancelled':
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
          icon: CheckCircle2,
          label: isUr ? 'منسوخ کر دیا گیا (اکاؤنٹ فعال)' : 'Cancelled (Account Active)',
        };
      case 'completed':
        return {
          bg: 'bg-gray-500/15 border-gray-500/40 text-gray-300',
          icon: AlertOctagon,
          label: isUr ? 'اکاؤنٹ مستقل بند' : 'Account Closed',
        };
      default:
        return {
          bg: 'bg-white/10 border-white/20 text-white/80',
          icon: Clock,
          label: status,
        };
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString(isUr ? 'ur-PK' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070514] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF2E74]" />
          <p className="text-xs text-white/60">
            {isUr ? 'حیثیت لوڈ ہو رہی ہے...' : 'Loading closure status...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main
      className="min-h-screen bg-[#070514] text-white flex flex-col items-center py-8 px-4 sm:px-6 relative selection:bg-[#FF2E74] selection:text-white"
      dir={isUr ? 'rtl' : 'ltr'}
    >
      {/* Ambient background lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-gradient-to-b from-purple-700/15 via-pink-600/10 to-transparent blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-xl relative z-10 space-y-6">
        
        {/* Top Bar Navigation */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <Link
            href="/account"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft className={`w-4 h-4 ${isUr ? 'rotate-180' : ''}`} />
            <span>{isUr ? 'اکاؤنٹ ڈیش بورڈ پر واپس' : 'Back to Account Dashboard'}</span>
          </Link>

          <button
            type="button"
            onClick={toggleLang}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white/80 transition-colors"
          >
            {isUr ? 'English' : 'اردو'}
          </button>
        </div>

        {/* Just Submitted Banner */}
        {justSubmitted && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-start gap-3 shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-emerald-300">
                {isUr ? 'درخواست کامیابی کے ساتھ جمع ہو گئی' : 'Closure Request Submitted Successfully'}
              </h4>
              <p className="text-[11px] text-white/80 mt-0.5">
                {isUr
                  ? 'آپ کی اکاؤنٹ بندش کی درخواست درج ہو گئی ہے اور تصدیق کے لیے قطار میں ہے۔'
                  : 'Your request has been queued for verification. You can cancel it anytime during the review process.'}
              </p>
            </div>
          </div>
        )}

        {/* Action feedback banners */}
        {actionSuccessMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-start gap-3 shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-200">{actionSuccessMsg}</p>
          </div>
        )}

        {actionErrorMsg && (
          <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-start gap-3 shadow-lg">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-200">{actionErrorMsg}</p>
          </div>
        )}

        {/* Main Status Card */}
        {!hasRequest || !request ? (
          <div className="p-8 rounded-3xl bg-[#120f26]/90 border border-white/10 shadow-2xl text-center space-y-4 backdrop-blur-xl">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/50">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-white">
              {isUr ? 'کوئی فعال بندش کی درخواست نہیں ہے' : 'No Active Closure Request'}
            </h2>
            <p className="text-xs text-white/60 max-w-sm mx-auto">
              {isUr
                ? 'آپ کا اکاؤنٹ مکمل طور پر فعال اور محفوظ حالت میں ہے۔ آپ نے فی الوقت کوئی بندش کی درخواست نہیں دی ہے۔'
                : 'Your Popo Live account is active and in good standing. You currently have no pending account closure requests.'}
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                href="/account"
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white"
              >
                {isUr ? 'ڈیش بورڈ پر واپس' : 'Return to Account'}
              </Link>
              <Link
                href="/account/close"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-xs font-bold text-white shadow-lg shadow-pink-600/30"
              >
                {isUr ? 'نئی بندش کی درخواست دیں' : 'Request Account Closure'}
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 rounded-3xl bg-[#120f26]/90 border border-white/10 shadow-2xl space-y-6 backdrop-blur-xl">
            
            {/* Header / Request Number & Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/10">
              <div>
                <span className="text-[11px] font-mono text-white/50 uppercase tracking-wider">
                  {isUr ? 'درخواست ریفرنس' : 'Request Reference'}
                </span>
                <h2 className="text-lg font-extrabold text-white font-mono flex items-center gap-2">
                  {request.requestNumber}
                </h2>
              </div>

              {/* Status Badge */}
              {(() => {
                const badge = getStatusBadge(request.status);
                const IconComponent = badge.icon;
                return (
                  <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold shadow-sm ${badge.bg}`}>
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{badge.label}</span>
                  </div>
                );
              })()}
            </div>

            {/* Status Description Box */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
              <h4 className="text-xs font-bold text-white/90 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#FF2E74]" />
                {isUr ? 'موجودہ صورتحال کی تفصیل' : 'Current Status Overview'}
              </h4>
              <p className="text-xs text-white/80 leading-relaxed">
                {isUr ? request.statusDescription.ur : request.statusDescription.en}
              </p>
            </div>

            {/* User Account Info */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-white/40 block">{isUr ? 'صارف' : 'Account'}</span>
                <span className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                  <User className="w-3.5 h-3.5 text-[#FF2E74]" />
                  {request.nickname}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-white/40 block">{isUr ? 'پوپو آئی ڈی' : 'Popo User ID'}</span>
                <span className="text-xs font-mono font-bold text-white mt-0.5 block">{request.poppoId}</span>
              </div>
              <div>
                <span className="text-[10px] text-white/40 block">{isUr ? 'درخواست کی تاریخ' : 'Requested Date'}</span>
                <span className="text-xs text-white/80 mt-0.5 block">{formatDate(request.requestedDate)}</span>
              </div>
              <div>
                <span className="text-[10px] text-white/40 block">{isUr ? 'بندش کی وجہ' : 'Reason'}</span>
                <span className="text-xs text-white/80 mt-0.5 capitalize block">
                  {request.reason.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Additional Explanation if provided */}
            {request.additionalExplanation && (
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-white/50 block mb-1">
                  {isUr ? 'صارف کی اضافی وضاحت:' : 'Provided Explanation:'}
                </span>
                <p className="text-xs text-white/70 italic">&ldquo;{request.additionalExplanation}&rdquo;</p>
              </div>
            )}

            {/* Cancel Action or Navigation CTA */}
            <div className="pt-2 space-y-3">
              {request.canCancel ? (
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 hover:border-emerald-500/50"
                >
                  <RotateCcw className="w-4 h-4 text-emerald-400" />
                  <span>{isUr ? 'بندش کی درخواست منسوخ کریں (اکاؤنٹ بحال رکھیں)' : 'Cancel Closure Request (Keep Account Active)'}</span>
                </button>
              ) : request.status === 'cancelled' || request.status === 'rejected' ? (
                <Link
                  href="/account/close"
                  className="w-full block py-3.5 text-center rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-pink-600/30 transition-all"
                >
                  {isUr ? 'نئی بندش کی درخواست جمع کرائیں' : 'Submit a New Closure Request'}
                </Link>
              ) : null}

              <Link
                href="/account"
                className="w-full block py-3 text-center rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold transition-colors"
              >
                {isUr ? 'ڈیش بورڈ پر واپس جائیں' : 'Return to Account Dashboard'}
              </Link>
            </div>

            {/* Audit Trail Section */}
            {auditLog.length > 0 && (
              <div className="pt-4 border-t border-white/10 space-y-3">
                <h4 className="text-xs font-bold text-white/80 flex items-center gap-2">
                  <History className="w-3.5 h-3.5 text-pink-400" />
                  {isUr ? 'سیکیورٹی اور آڈٹ ٹریل' : 'Security Audit Trail'}
                </h4>
                <div className="space-y-2">
                  {auditLog.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-[11px]"
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold text-white/90 capitalize">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <div className="text-[10px] text-white/40">
                          {log.previous_status ? `${log.previous_status} → ` : ''}
                          <span className="text-pink-400 font-medium">{log.new_status}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-white/40">{formatDate(log.action_date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* CANCEL CONFIRMATION MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-[#15102a] border border-white/15 p-6 shadow-2xl relative space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>

            <h3 className="text-sm font-bold text-white">
              {isUr ? 'بندش کی درخواست منسوخ کریں؟' : 'Cancel Closure Request?'}
            </h3>

            <p className="text-xs text-white/70 leading-relaxed">
              {isUr
                ? 'کیا آپ واقعی اس بندش کی درخواست کو منسوخ کرنا چاہتے ہیں؟ آپ کا اکاؤنٹ بدستور مکمل فعال اور بحال رہے گا۔'
                : 'Are you sure you want to cancel this closure request? Your account will remain active and in full standing with all features intact.'}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-xs font-semibold transition-colors"
              >
                {isUr ? 'نہیں، واپس' : 'No, Keep It'}
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelRequest}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isUr ? 'منسوخ ہو رہا ہے...' : 'Cancelling...'}</span>
                  </>
                ) : (
                  <span>{isUr ? 'ہاں، منسوخ کریں' : 'Yes, Cancel Request'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

export default function AccountClosureStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070514] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF2E74]" />
        </div>
      }
    >
      <AccountClosureStatusContent />
    </Suspense>
  );
}
