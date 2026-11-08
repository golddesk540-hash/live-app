'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import {
  ArrowLeft,
  AlertTriangle,
  Upload,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  X,
  Monitor,
  Smartphone,
  Tablet,
  Check,
} from 'lucide-react';

interface ReportForm {
  category: string;
  pageOrFeature: string;
  description: string;
  browserInfo: string;
  deviceType: string;
  attachmentUrl: string;
}

function ReportProblemContent() {
  const router = useRouter();
  const { isUr } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ReportForm>({
    category: 'broken_pages',
    pageOrFeature: '',
    description: '',
    browserInfo: '',
    deviceType: 'desktop',
    attachmentUrl: '',
  });

  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Success state
  const [submittedReport, setSubmittedReport] = useState<{
    reportNumber: string;
    message: string;
  } | null>(null);

  // Auto-detect browser & device type safely on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent;
      let browser = 'Unknown Browser';
      if (ua.includes('Firefox')) browser = 'Mozilla Firefox';
      else if (ua.includes('Edg')) browser = 'Microsoft Edge';
      else if (ua.includes('Chrome')) browser = 'Google Chrome';
      else if (ua.includes('Safari')) browser = 'Apple Safari';

      let device = 'desktop';
      if (/Mobi|Android/i.test(ua)) device = 'mobile';
      else if (/Tablet|iPad/i.test(ua)) device = 'tablet';

      setForm((prev) => ({
        ...prev,
        browserInfo: browser,
        deviceType: device,
      }));
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(isUr ? 'فائل کا سائز 5MB سے زیادہ نہیں ہونا چاہیے۔' : 'File size must not exceed 5MB.');
      return;
    }

    try {
      setUploadProgress(20);
      setErrorMsg(null);
      const fd = new FormData();
      fd.append('file', file);

      setUploadProgress(60);
      const res = await fetch('/api/help/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload screenshot.');
      }

      setUploadProgress(100);
      setForm((prev) => ({ ...prev, attachmentUrl: data.url }));
      setAttachmentName(file.name);
      setTimeout(() => setUploadProgress(null), 1000);
    } catch (err: any) {
      setUploadProgress(null);
      setErrorMsg(err.message || 'Screenshot upload failed.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.pageOrFeature.trim()) {
      setErrorMsg(isUr ? 'براہ کرم متاثرہ صفحہ یا فیچر درج کریں۔' : 'Please specify the affected page or feature.');
      return;
    }

    if (!form.description.trim() || form.description.trim().length < 10) {
      setErrorMsg(isUr ? 'براہ کرم کم از کم 10 حروف پر مشتمل خرابی کی تفصیل درج کریں۔' : 'Please describe the problem in detail (at least 10 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/help/report-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit problem report.');
      }

      setSubmittedReport({
        reportNumber: data.reportNumber,
        message: data.message,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Error recording report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { id: 'broken_pages', en: 'Broken Pages / 404', ur: 'خراب صفحات یا لنک' },
    { id: 'login_errors', en: 'Login & Auth Errors', ur: 'لاگ ان اور پاس ورڈ کی خرابی' },
    { id: 'profile_errors', en: 'Profile / Avatar Errors', ur: 'پروفائل یا اوتار کا مسئلہ' },
    { id: 'payment_errors', en: 'Payment & Recharge Errors', ur: 'ادائیگی یا کوائن ریچارج کی خرابی' },
    { id: 'display_problems', en: 'Display / UI Glitches', ur: 'ڈسپلے یا لے آؤٹ کا مسئلہ' },
    { id: 'other', en: 'Other Technical Issues', ur: 'دیگر تکنیکی مسائل' },
  ];

  return (
    <main
      dir={isUr ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-[#070514] text-white selection:bg-[#ff2d55] selection:text-white pb-20 ${
        isUr ? 'font-urdu' : 'font-sans'
      }`}
    >
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-[#b81dff]/20 via-[#ff2d55]/15 to-transparent blur-3xl opacity-75" />
      </div>

      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 bg-[#070514]/90 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/help')}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors text-white"
            aria-label="Back to Help"
          >
            <ArrowLeft className={`w-5 h-5 ${isUr ? 'rotate-180' : ''}`} />
          </button>

          <h1 className="text-base sm:text-lg font-bold text-white tracking-wide">
            {isUr ? 'تکنیکی خرابی کی اطلاع' : 'Report a Problem'}
          </h1>

          <div className="w-9" />
        </div>
      </header>

      <div className="relative z-10 max-w-xl mx-auto px-4 pt-4 sm:pt-6">

        {submittedReport ? (
          /* SUCCESS STATE */
          <div className="p-6 sm:p-8 rounded-3xl bg-[#140f2b] border border-rose-500/40 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center shadow-lg shadow-rose-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white">
              {isUr ? 'خرابی کی رپورٹ موصول ہو گئی ہے!' : 'Problem Report Submitted!'}
            </h2>

            <p className="text-xs text-white/70 leading-relaxed max-w-sm mx-auto">
              {isUr
                ? 'ہماری انجینئرنگ ٹیم کو آپ کی رپورٹ موصول ہو گئی ہے اور وہ جلد اس مسئلے کی جانچ کرے گی۔'
                : 'Our engineering and quality assurance team has logged this incident. Thank you for helping keep Popo Live reliable.'}
            </p>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <span className="text-xs text-white/60">{isUr ? 'رپورٹ نمبر:' : 'Report Reference:'}</span>
              <span className="text-sm font-mono font-bold text-rose-400 tracking-wider">
                {submittedReport.reportNumber}
              </span>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <Link
                href="/help"
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-xs font-bold text-white shadow-lg shadow-pink-600/30 transition-all text-center"
              >
                {isUr ? 'ہیلپ سینٹر پر واپس جائیں' : 'Back to Help Center'}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSubmittedReport(null);
                  setForm((prev) => ({
                    ...prev,
                    pageOrFeature: '',
                    description: '',
                    attachmentUrl: '',
                  }));
                  setAttachmentName(null);
                }}
                className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors"
              >
                {isUr ? 'دوسری رپورٹ جمع کریں' : 'File Another Report'}
              </button>
            </div>
          </div>
        ) : (
          /* REPORT PROBLEM FORM */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 rounded-3xl bg-[#140f2b]/90 border border-white/10 shadow-2xl space-y-4">

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                {isUr ? 'مسئلے کی قسم' : 'Problem Category'} <span className="text-pink-400">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full py-2.5 px-3.5 rounded-xl bg-[#1d163d] border border-white/15 focus:border-pink-500 focus:outline-none text-xs sm:text-sm text-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#181135]">
                    {isUr ? c.ur : c.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Page or Feature */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                {isUr ? 'متاثرہ صفحہ یا فیچر' : 'Page or Feature'} <span className="text-pink-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.pageOrFeature}
                onChange={(e) => setForm({ ...form, pageOrFeature: e.target.value })}
                placeholder="e.g. /profile, /settings, /recharge, Live room"
                className="w-full py-2.5 px-3.5 rounded-xl bg-white/5 border border-white/15 focus:border-pink-500 focus:outline-none text-xs sm:text-sm text-white placeholder:text-white/30"
              />
            </div>

            {/* Problem Description */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                {isUr ? 'خرابی کی تفصیل' : 'Problem Description'} <span className="text-pink-400">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={
                  isUr
                    ? 'خرابی کو دوبارہ پیدا کرنے کے مراحل اور اسکرین پر ظاہر ہونے والے ایرر میسج کی تفصیل بیان کریں...'
                    : 'Describe step-by-step what happened and any error messages shown...'
                }
                className="w-full py-2.5 px-3.5 rounded-xl bg-white/5 border border-white/15 focus:border-pink-500 focus:outline-none text-xs sm:text-sm text-white placeholder:text-white/30 resize-y"
              />
            </div>

            {/* Auto-detected Diagnostics info (Browser & Device) */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-white/70">
              <div className="flex items-center gap-2">
                {form.deviceType === 'mobile' ? (
                  <Smartphone className="w-4 h-4 text-pink-400" />
                ) : (
                  <Monitor className="w-4 h-4 text-pink-400" />
                )}
                <span>{form.deviceType.toUpperCase()} • {form.browserInfo}</span>
              </div>
              <span className="text-[10px] text-white/40">Auto-detected</span>
            </div>

            {/* Screenshot Attachment */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                {isUr ? 'اسکرین شاٹ شامل کریں (اختیاری)' : 'Screenshot Attachment (Optional)'}
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />

              {form.attachmentUrl ? (
                <div className="p-3 rounded-xl bg-white/5 border border-pink-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="w-4 h-4 text-pink-400 shrink-0" />
                    <span className="text-xs text-white/90 truncate max-w-[200px]">
                      {attachmentName || 'Screenshot attached'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, attachmentUrl: '' }));
                      setAttachmentName(null);
                    }}
                    className="p-1 rounded-full text-white/50 hover:text-rose-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-xl border border-dashed border-white/20 hover:border-pink-500/50 bg-white/5 flex items-center justify-center gap-2 text-xs text-white/70 hover:text-white transition-colors"
                >
                  <Upload className="w-4 h-4 text-pink-400" />
                  <span>{isUr ? 'اسکرین شاٹ منتخب کریں (زیادہ سے زیادہ 5MB)' : 'Attach screenshot of the error'}</span>
                </button>
              )}

              {uploadProgress !== null && (
                <div className="mt-2 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-pink-500 to-purple-600 h-1.5 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-xs sm:text-sm font-bold text-white shadow-lg shadow-pink-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isUr ? 'رپورٹ جمع ہو رہی ہے...' : 'Submitting Report...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{isUr ? 'خرابی کی رپورٹ جمع کروائیں' : 'Submit Problem Report'}</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </main>
  );
}

export default function ReportProblemPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070514] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      }
    >
      <ReportProblemContent />
    </Suspense>
  );
}
