'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Globe,
  ArrowLeft,
  X,
  Send,
  Flag,
  FileCheck2,
  Users,
  Gift,
  UserX,
  Lock,
} from 'lucide-react';
import {
  CANONICAL_FAIR_PLAY_RULES,
  PKFairPlayRule,
  PKAbuseReportCategory,
} from '@/lib/pk';

interface PKFairPlayScreenProps {
  battleId?: string;
  currentUserId?: string;
  currentUserName?: string;
  initialLanguage?: 'en' | 'ur';
  onBack?: () => void;
}

export default function PKFairPlayScreen({
  battleId = '00000000-0000-0000-0000-000000000603',
  currentUserId = 'user_viewer_9001',
  currentUserName = 'Ali',
  initialLanguage = 'en',
  onBack,
}: PKFairPlayScreenProps) {
  const router = useRouter();
  const [lang, setLang] = useState<'en' | 'ur'>(initialLanguage);
  const isRtl = lang === 'ur';

  const [rules, setRules] = useState<PKFairPlayRule[]>(CANONICAL_FAIR_PLAY_RULES);
  const [selectedRule, setSelectedRule] = useState<PKFairPlayRule | null>(null);

  // Reporting modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCategory, setReportCategory] = useState<PKAbuseReportCategory>('score_manipulation');
  const [reportDescription, setReportDescription] = useState('');
  const [reportStatus, setReportStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [reportMessage, setReportMessage] = useState('');

  // Fetch live rules from API
  useEffect(() => {
    fetch('/api/pk/security/rules')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.rules && data.rules.length > 0) {
          setRules(data.rules);
        }
      })
      .catch(() => {});
  }, []);

  const handleOpenReport = () => {
    setShowReportModal(true);
    setReportStatus('idle');
    setReportMessage('');
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDescription.trim()) return;

    setReportStatus('submitting');
    try {
      const res = await fetch('/api/pk/security/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          battleId,
          reporterId: currentUserId,
          reporterName: currentUserName,
          reportedUserId: '00000000-0000-0000-0000-000000088202',
          reportedUserName: 'Ayesha',
          category: reportCategory,
          description: reportDescription.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReportStatus('success');
        setReportMessage(
          isRtl
            ? 'آپ کی رپورٹ موصول ہو گئی ہے۔ سیکیورٹی ٹیم اس کا جائزہ لے گی۔'
            : 'Report submitted successfully. Our security team will review it.'
        );
        setTimeout(() => {
          setShowReportModal(false);
          setReportDescription('');
          setReportStatus('idle');
        }, 1800);
      } else {
        setReportStatus('error');
        setReportMessage(data.error || (isRtl ? 'رپورٹ جمع کرنے میں ناکامی' : 'Failed to submit report'));
      }
    } catch {
      setReportStatus('error');
      setReportMessage(isRtl ? 'سرور سے رابطہ ممکن نہیں ہوا' : 'Network error submitting report');
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative w-full max-w-md mx-auto min-h-screen bg-[#070414] text-white flex flex-col justify-between overflow-hidden shadow-2xl font-sans select-none border-x border-[#231b3d]"
    >
      {/* 1. TOP HEADER */}
      <div className="relative z-20 pt-4 px-4 pb-2 flex items-center justify-between">
        {onBack ? (
          <button
            onClick={onBack}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/80"
          >
            <ArrowLeft className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
        ) : (
          <Link
            href="/pk"
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/80"
          >
            <ArrowLeft className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
          </Link>
        )}

        <h1 className="text-xl font-extrabold text-white tracking-wide">
          {isRtl ? 'فیئر پلے' : 'Fair Play'}
        </h1>

        <button
          onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
          className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-pink-400"
          title="Toggle Language"
        >
          <Globe className="w-5 h-5" />
        </button>
      </div>

      {/* 2. HERO SECURITY SHIELD (Exact 1:1 match to 06_09_fair_play_basics.png) */}
      <div className="relative z-10 flex flex-col items-center justify-center pt-2 pb-4">
        {/* Radial Purple Glow Halo */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-36 h-36 rounded-full bg-[#a855f7]/25 blur-2xl animate-pulse" />
          <div className="absolute w-24 h-24 rounded-full bg-[#c084fc]/35 blur-xl" />

          {/* Glowing Purple Shield with White Checkmark */}
          <div className="relative w-28 h-28 rounded-2xl flex items-center justify-center drop-shadow-[0_0_25px_rgba(168,85,247,0.7)]">
            <svg
              className="w-24 h-24 text-[#9333ea] filter drop-shadow-[0_0_12px_#c084fc]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
            </svg>
            {/* White Checkmark in Center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-white stroke-current stroke-[3.5] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 3. FOUR CANONICAL FAIR PLAY CARDS (Exact Match to 06_09) */}
      <div className="relative z-10 px-5 flex-1 flex flex-col justify-start space-y-3.5">
        {rules.map((rule) => {
          const isReportCard = rule.id === 'report_violations';
          return (
            <div
              key={rule.id}
              onClick={() => {
                if (isReportCard) {
                  handleOpenReport();
                } else {
                  setSelectedRule(selectedRule?.id === rule.id ? null : rule);
                }
              }}
              className="group cursor-pointer rounded-2xl bg-[#140f26] border border-[#2e1d4d] hover:border-[#a855f7]/60 hover:bg-[#1a1333] transition-all p-4 flex items-center gap-3.5 shadow-lg active:scale-[0.98]"
            >
              {/* Green Circle Checkmark Icon (Exact match to 06_09_fair_play_basics.png) */}
              <div className="w-8 h-8 rounded-full bg-[#22c55e] flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(34,197,94,0.4)]">
                <svg
                  className="w-4 h-4 text-white stroke-current stroke-[3.5]"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              {/* Title */}
              <div className="flex-1">
                <h3 className="text-base font-extrabold text-white tracking-wide leading-tight">
                  {isRtl ? rule.titleUr : rule.title}
                </h3>
                {selectedRule?.id === rule.id && (
                  <p className="mt-1.5 text-xs text-white/70 leading-relaxed border-t border-white/10 pt-1.5 animate-in fade-in duration-150">
                    {isRtl ? rule.summaryUr : rule.summary}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. BOTTOM WATERMARK BADGE (Exact match to 06_09: "6.9 Fair Play Basics") */}
      <div className="relative z-20 py-4 px-4 flex justify-center bg-gradient-to-t from-[#070414] via-[#070414]/90 to-transparent">
        <div className="w-full max-w-xs py-3 rounded-2xl bg-gradient-to-r from-[#831843] via-[#881337] to-[#9f1239] text-white font-black text-center text-base tracking-wide shadow-[0_4px_20px_rgba(159,18,57,0.4)] border border-pink-500/30">
          {isRtl ? '6.9 فیئر پلے اصول' : '6.9 Fair Play Basics'}
        </div>
      </div>

      {/* 5. INTERACTIVE ABUSE REPORT MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-0 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#130b26] border-t border-[#351b54] rounded-t-3xl p-5 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-[#ff2d78]" />
                <h2 className="text-base font-extrabold text-white">
                  {isRtl ? 'خلاف ورزی کی اطلاع دیں' : 'Report PK Violation'}
                </h2>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1 rounded-full text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitReport} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/70 mb-1">
                  {isRtl ? 'خلاف ورزی کی قسم منتخب کریں:' : 'Select Violation Category:'}
                </label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value as PKAbuseReportCategory)}
                  className="w-full bg-[#1b1035] border border-[#2e1d4d] rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#ff2d78]"
                >
                  <option value="score_manipulation">
                    {isRtl ? 'اسکور میں ہیرا پھیری' : 'Score Manipulation / Tampering'}
                  </option>
                  <option value="fake_traffic">
                    {isRtl ? 'جعلی ٹریفک / بوٹس' : 'Fake Traffic / Bot Viewers'}
                  </option>
                  <option value="gift_abuse">
                    {isRtl ? 'تحائف یا سکوں کا غلط استعمال' : 'Gift / Coin Laundering Abuse'}
                  </option>
                  <option value="multi_account">
                    {isRtl ? 'ملٹی اکاؤنٹ پی کے' : 'Multi-Account Self-Matching'}
                  </option>
                  <option value="cheating">
                    {isRtl ? 'دھوکہ دہی اور خرابیوں کا استحصال' : 'Cheating & Exploit Exploitation'}
                  </option>
                  <option value="invitation_abuse">
                    {isRtl ? 'دعوت ناموں کی بھرمار' : 'Invitation Spam & Flooding'}
                  </option>
                  <option value="spam">
                    {isRtl ? 'چیٹ یا ری ایکشن سپیم' : 'Chat / Reaction Spam'}
                  </option>
                  <option value="other">
                    {isRtl ? 'دیگر خلاف ورزی' : 'Other Violation'}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1">
                  {isRtl ? 'تفصیلات درج کریں:' : 'Description of Violation:'}
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder={
                    isRtl
                      ? 'براہ کرم مشکوک حرکت کی مختصر وضاحت کریں...'
                      : 'Provide details about the suspected behavior...'
                  }
                  rows={3}
                  className="w-full bg-[#1b1035] border border-[#2e1d4d] rounded-xl p-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#ff2d78]"
                />
              </div>

              {/* Status Notice */}
              {reportMessage && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-semibold ${
                    reportStatus === 'success'
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}
                >
                  {reportMessage}
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={reportStatus === 'submitting' || !reportDescription.trim()}
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#ff2d78] to-[#ec4899] text-white font-extrabold text-sm tracking-wide shadow-lg disabled:opacity-50 hover:opacity-95 transition-all"
              >
                {reportStatus === 'submitting'
                  ? isRtl
                    ? 'جمع ہو رہا ہے...'
                    : 'Submitting Report...'
                  : isRtl
                  ? 'رپورٹ جمع کرائیں'
                  : 'Submit Report to Security'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
