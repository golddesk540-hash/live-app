'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import {
  ArrowLeft,
  LifeBuoy,
  Send,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  X,
  Ticket,
  ExternalLink,
  ShieldCheck,
  Info,
} from 'lucide-react';

interface TicketForm {
  fullName: string;
  email: string;
  poppoId: string;
  category: string;
  subject: string;
  description: string;
  attachmentUrl: string;
}

function ContactSupportContent() {
  const router = useRouter();
  const { isUr } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<TicketForm>({
    fullName: '',
    email: '',
    poppoId: '',
    category: 'account_issues',
    subject: '',
    description: '',
    attachmentUrl: '',
  });

  const [loadingUser, setLoadingUser] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Success state
  const [createdTicket, setCreatedTicket] = useState<{
    ticketId: string;
    ticketNumber: string;
  } | null>(null);

  // Prefill if logged in
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/profile/me');
        if (res.ok) {
          const data = await res.json();
          if (data?.authenticated && data?.user) {
            setForm((prev) => ({
              ...prev,
              fullName: prev.fullName || data.user.nickname || '',
              email: prev.email || data.user.email || '',
              poppoId: prev.poppoId || data.user.poppoId || '',
            }));
          }
        }
      } catch (err) {
        // Guest user is permitted to file tickets as well
      } finally {
        setLoadingUser(false);
      }
    }
    fetchUser();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB)
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
        throw new Error(data.error || 'Failed to upload attachment.');
      }

      setUploadProgress(100);
      setForm((prev) => ({ ...prev, attachmentUrl: data.url }));
      setAttachmentName(file.name);
      setTimeout(() => setUploadProgress(null), 1000);
    } catch (err: any) {
      setUploadProgress(null);
      setErrorMsg(err.message || 'Attachment upload failed.');
    }
  };

  const removeAttachment = () => {
    setForm((prev) => ({ ...prev, attachmentUrl: '' }));
    setAttachmentName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (!form.fullName.trim()) {
      setErrorMsg(isUr ? 'براہ کرم اپنا پورا نام درج کریں۔' : 'Please provide your full name.');
      return;
    }

    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setErrorMsg(isUr ? 'براہ کرم ایک درست ای میل ایڈریس درج کریں۔' : 'Please provide a valid email address.');
      return;
    }

    if (form.poppoId.trim() && !/^\d{4,12}$/.test(form.poppoId.trim())) {
      setErrorMsg(isUr ? 'پوپو لائیو یوزر آئی ڈی عددی ہونی چاہیے۔' : 'Popo Live User ID must be a numeric ID.');
      return;
    }

    if (!form.subject.trim() || form.subject.trim().length < 4) {
      setErrorMsg(isUr ? 'عنوان کم از کم 4 حروف پر مشتمل ہونا چاہیے۔' : 'Subject must be at least 4 characters long.');
      return;
    }

    if (!form.description.trim() || form.description.trim().length < 10) {
      setErrorMsg(isUr ? 'براہ کرم کم از کم 10 حروف کی تفصیل فراہم کریں۔' : 'Please provide a detailed description (at least 10 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/help/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit support ticket.');
      }

      setCreatedTicket({
        ticketId: data.ticketId,
        ticketNumber: data.ticketNumber,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = [
    { id: 'account_issues', en: 'Account Issues', ur: 'اکاؤنٹ کے مسائل' },
    { id: 'login_problems', en: 'Login Problems', ur: 'لاگ ان کے مسائل' },
    { id: 'profile_problems', en: 'Profile Problems', ur: 'پروفائل کے مسائل' },
    { id: 'security_issues', en: 'Security Issues', ur: 'سیکیورٹی کے مسائل' },
    { id: 'payments_recharge', en: 'Payment and Recharge', ur: 'ادائیگی اور ریچارج' },
    { id: 'coins_gifts', en: 'Coins and Gifts', ur: 'کوائنز اور تحائف' },
    { id: 'live_streaming', en: 'Live Streaming', ur: 'لائیو اسٹریمنگ' },
    { id: 'agency_support', en: 'Agency Support', ur: 'ایجنسی سپورٹ' },
    { id: 'other', en: 'Other', ur: 'دیگر' },
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
            aria-label="Back to Help Center"
          >
            <ArrowLeft className={`w-5 h-5 ${isUr ? 'rotate-180' : ''}`} />
          </button>

          <h1 className="text-base sm:text-lg font-bold text-white tracking-wide">
            {isUr ? 'سپورٹ ٹکٹ درج کریں' : 'Submit Support Ticket'}
          </h1>

          <Link
            href="/help/my-tickets"
            className="text-xs font-semibold text-pink-400 hover:text-pink-300 transition-colors"
          >
            {isUr ? 'میری ٹکٹس' : 'My Tickets'}
          </Link>
        </div>
      </header>

      <div className="relative z-10 max-w-xl mx-auto px-4 pt-4 sm:pt-6">

        {/* SUCCESS CONFIRMATION MODAL / SCREEN */}
        {createdTicket ? (
          <div className="p-6 sm:p-8 rounded-3xl bg-[#140f2b] border border-pink-500/40 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white">
              {isUr ? 'ٹکٹ کامیابی کے ساتھ جمع ہو گئی ہے!' : 'Support Ticket Submitted!'}
            </h2>

            <p className="text-xs text-white/70 leading-relaxed max-w-sm mx-auto">
              {isUr
                ? 'ہماری کسٹمر سپورٹ ٹیم نے آپ کی درخواست وصول کر لی ہے اور جلد ہی آپ سے ای میل یا ان-ایپ میسج کے ذریعے رابطہ کرے گی۔'
                : 'Our customer care team has received your inquiry. A confirmation receipt has been generated.'}
            </p>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <span className="text-xs text-white/60">{isUr ? 'ٹکٹ نمبر:' : 'Ticket Number:'}</span>
              <span className="text-sm font-mono font-bold text-pink-400 tracking-wider">
                {createdTicket.ticketNumber}
              </span>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <Link
                href={`/help/ticket/${createdTicket.ticketId}`}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-xs font-bold text-white shadow-lg shadow-pink-600/30 transition-all text-center"
              >
                {isUr ? 'ٹکٹ کی تفصیلات دیکھیں' : 'View Ticket Details'}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setCreatedTicket(null);
                  setForm({
                    fullName: '',
                    email: '',
                    poppoId: '',
                    category: 'account_issues',
                    subject: '',
                    description: '',
                    attachmentUrl: '',
                  });
                  setAttachmentName(null);
                }}
                className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors"
              >
                {isUr ? 'ایک اور ٹکٹ جمع کریں' : 'Submit Another Ticket'}
              </button>
            </div>
          </div>
        ) : (
          /* SUPPORT TICKET FORM */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 rounded-3xl bg-[#140f2b]/90 border border-white/10 shadow-2xl space-y-4">

            {/* Banner note */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-2.5 text-xs text-white/70">
              <Info className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
              <span>
                {isUr
                  ? 'براہ کرم درست معلومات فراہم کریں تاکہ ہم آپ کے مسئلے کو تیزی سے حل کر سکیں۔'
                  : 'Please provide exact details so our team can resolve your inquiry promptly.'}
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                {isUr ? 'پورا نام' : 'Full Name'} <span className="text-pink-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder={isUr ? 'اپنا نام درج کریں' : 'Enter your name'}
                className="w-full py-2.5 px-3.5 rounded-xl bg-white/5 border border-white/15 focus:border-pink-500 focus:outline-none text-xs sm:text-sm text-white placeholder:text-white/30"
              />
            </div>

            {/* Email Address & Popo User ID row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">
                  {isUr ? 'ای میل ایڈریس' : 'Email Address'} <span className="text-pink-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full py-2.5 px-3.5 rounded-xl bg-white/5 border border-white/15 focus:border-pink-500 focus:outline-none text-xs sm:text-sm text-white placeholder:text-white/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">
                  {isUr ? 'پوپو یوزر آئی ڈی (اختیاری)' : 'Popo User ID (Optional)'}
                </label>
                <input
                  type="text"
                  value={form.poppoId}
                  onChange={(e) => setForm({ ...form, poppoId: e.target.value })}
                  placeholder="e.g. 10001234"
                  className="w-full py-2.5 px-3.5 rounded-xl bg-white/5 border border-white/15 focus:border-pink-500 focus:outline-none text-xs sm:text-sm text-white placeholder:text-white/30"
                />
              </div>
            </div>

            {/* Inquiry Category */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                {isUr ? 'انکوائری کی قسم' : 'Inquiry Category'} <span className="text-pink-400">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full py-2.5 px-3.5 rounded-xl bg-[#1d163d] border border-white/15 focus:border-pink-500 focus:outline-none text-xs sm:text-sm text-white"
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-[#181135]">
                    {isUr ? opt.ur : opt.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                {isUr ? 'موضوع / مسئلہ کا عنوان' : 'Subject'} <span className="text-pink-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder={isUr ? 'مسئلے کا مختصر خلاصہ' : 'Brief summary of the issue'}
                className="w-full py-2.5 px-3.5 rounded-xl bg-white/5 border border-white/15 focus:border-pink-500 focus:outline-none text-xs sm:text-sm text-white placeholder:text-white/30"
              />
            </div>

            {/* Detailed Description */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                {isUr ? 'تفصیلی وضاحت' : 'Detailed Description'} <span className="text-pink-400">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={
                  isUr
                    ? 'براہ کرم اپنے مسئلے کی مکمل تفصیلات بیان کریں، بشمول تاریخ، وقت اور ٹرانزیکشن نمبر (اگر قابل اطلاق ہو)...'
                    : 'Describe what happened in detail, including steps to reproduce, timestamps, or transaction IDs...'
                }
                className="w-full py-2.5 px-3.5 rounded-xl bg-white/5 border border-white/15 focus:border-pink-500 focus:outline-none text-xs sm:text-sm text-white placeholder:text-white/30 resize-y"
              />
            </div>

            {/* Attachment (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                {isUr ? 'منسلک فائل یا اسکرین شاٹ (اختیاری)' : 'Attachment (Optional)'}
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />

              {form.attachmentUrl ? (
                <div className="p-3 rounded-xl bg-white/5 border border-pink-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="w-4 h-4 text-pink-400 shrink-0" />
                    <span className="text-xs text-white/90 truncate max-w-[200px]">
                      {attachmentName || 'Attachment Uploaded'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeAttachment}
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
                  <span>{isUr ? 'اسکرین شاٹ یا PDF منتخب کریں (زیادہ سے زیادہ 5MB)' : 'Upload screenshot or PDF (Max 5MB)'}</span>
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
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-xs sm:text-sm font-bold text-white shadow-lg shadow-pink-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isUr ? 'جمع کیا جا رہا ہے...' : 'Submitting Ticket...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{isUr ? 'سپورٹ ٹکٹ جمع کروائیں' : 'Submit Support Ticket'}</span>
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

export default function ContactSupportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070514] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      }
    >
      <ContactSupportContent />
    </Suspense>
  );
}
