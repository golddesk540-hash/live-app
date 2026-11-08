'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import {
  ArrowLeft,
  Edit3,
  Star,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Shield,
  HelpCircle,
} from 'lucide-react';

interface FeedbackForm {
  feedbackType: string;
  subject: string;
  message: string;
  rating: number;
  isAnonymous: boolean;
  contactEmail: string;
}

function FeedbackContent() {
  const router = useRouter();
  const { isUr } = useLanguage();

  const [form, setForm] = useState<FeedbackForm>({
    feedbackType: 'general_feedback',
    subject: '',
    message: '',
    rating: 5,
    isAnonymous: false,
    contactEmail: '',
  });

  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; nickname: string; email: string | null } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Success state
  const [submittedFeedback, setSubmittedFeedback] = useState<{
    feedbackNumber: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/profile/me');
        if (res.ok) {
          const data = await res.json();
          if (data?.authenticated && data?.user) {
            setCurrentUser(data.user);
            setForm((prev) => ({
              ...prev,
              contactEmail: prev.contactEmail || data.user.email || '',
            }));
          }
        }
      } catch (err) {}
    }
    loadUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.subject.trim() || form.subject.trim().length < 3) {
      setErrorMsg(isUr ? 'عنوان کم از کم 3 حروف پر مشتمل ہونا چاہیے۔' : 'Subject must be at least 3 characters long.');
      return;
    }

    if (!form.message.trim() || form.message.trim().length < 5) {
      setErrorMsg(isUr ? 'پیغام کم از کم 5 حروف پر مشتمل ہونا چاہیے۔' : 'Message must be at least 5 characters long.');
      return;
    }

    if (!form.rating || form.rating < 1 || form.rating > 5) {
      setErrorMsg(isUr ? 'براہ کرم 1 سے 5 ستاروں کے درمیان ریٹنگ دیں۔' : 'Please provide a star rating between 1 and 5.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/help/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit feedback.');
      }

      setSubmittedFeedback({
        feedbackNumber: data.feedbackNumber,
        message: data.message,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Error recording feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const feedbackTypes = [
    { id: 'general_feedback', en: 'General Feedback', ur: 'عام تاثرات' },
    { id: 'website_experience', en: 'Website Experience', ur: 'ویب سائٹ کا تجربہ' },
    { id: 'feature_request', en: 'Feature Request', ur: 'نئے فیچر کی درخواست' },
    { id: 'bug_report', en: 'Bug Report', ur: 'بگ یا خرابی کی رپورٹ' },
    { id: 'design_suggestion', en: 'Design Suggestion', ur: 'ڈیزائن اور لے آؤٹ کی تجویز' },
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
            aria-label="Back to Help"
          >
            <ArrowLeft className={`w-5 h-5 ${isUr ? 'rotate-180' : ''}`} />
          </button>

          <h1 className="text-base sm:text-lg font-bold text-white tracking-wide">
            {isUr ? 'تاثرات شیئر کریں' : 'Send Feedback'}
          </h1>

          <div className="w-9" />
        </div>
      </header>

      <div className="relative z-10 max-w-xl mx-auto px-4 pt-4 sm:pt-6">

        {submittedFeedback ? (
          /* SUCCESS STATE */
          <div className="p-6 sm:p-8 rounded-3xl bg-[#140f2b] border border-pink-500/40 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-400 mx-auto flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Sparkles className="w-8 h-8" />
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white">
              {isUr ? 'آپ کے تاثرات کا شکریہ!' : 'Thank You For Your Feedback!'}
            </h2>

            <p className="text-xs text-white/70 leading-relaxed max-w-sm mx-auto">
              {isUr
                ? 'ہم آپ کی تجاویز اور آراء کو بہت قدر کی نگاہ سے دیکھتے ہیں تاکہ پوپو لائیو کے تجربے کو مزید بہتر بنا سکیں۔'
                : 'Your suggestions help our product and engineering team build a better platform for everyone.'}
            </p>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <span className="text-xs text-white/60">{isUr ? 'ریفرنس نمبر:' : 'Reference Number:'}</span>
              <span className="text-sm font-mono font-bold text-pink-400 tracking-wider">
                {submittedFeedback.feedbackNumber}
              </span>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <Link
                href="/help"
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-xs font-bold text-white shadow-lg shadow-pink-600/30 transition-all text-center"
              >
                {isUr ? 'ہیلپ سینٹر پر واپس جائیں' : 'Return to Help Center'}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSubmittedFeedback(null);
                  setForm({
                    feedbackType: 'general_feedback',
                    subject: '',
                    message: '',
                    rating: 5,
                    isAnonymous: false,
                    contactEmail: '',
                  });
                }}
                className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors"
              >
                {isUr ? 'مزید فیڈ بیک بھیجیں' : 'Send More Feedback'}
              </button>
            </div>
          </div>
        ) : (
          /* FEEDBACK FORM */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 rounded-3xl bg-[#140f2b]/90 border border-white/10 shadow-2xl space-y-4">

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* STAR RATING SELECTOR */}
            <div className="text-center py-2">
              <p className="text-xs font-semibold text-white/80 mb-2">
                {isUr ? 'آپ کے مجموعی تجربے کی درجہ بندی:' : 'Rate your overall experience:'}
              </p>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating !== null ? hoverRating : form.rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setForm({ ...form, rating: star })}
                      className="p-1 focus:outline-none transition-transform hover:scale-125"
                    >
                      <Star
                        className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                          isFilled
                            ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                            : 'text-white/20'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feedback Type */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                {isUr ? 'تاثرات کی قسم' : 'Feedback Type'} <span className="text-pink-400">*</span>
              </label>
              <select
                value={form.feedbackType}
                onChange={(e) => setForm({ ...form, feedbackType: e.target.value })}
                className="w-full py-2.5 px-3.5 rounded-xl bg-[#1d163d] border border-white/15 focus:border-pink-500 focus:outline-none text-xs sm:text-sm text-white"
              >
                {feedbackTypes.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#181135]">
                    {isUr ? t.ur : t.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                {isUr ? 'عنوان' : 'Subject'} <span className="text-pink-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder={isUr ? 'اپنی رائے یا تجویز کا عنوان' : 'Title of your feedback or suggestion'}
                className="w-full py-2.5 px-3.5 rounded-xl bg-white/5 border border-white/15 focus:border-pink-500 focus:outline-none text-xs sm:text-sm text-white placeholder:text-white/30"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                {isUr ? 'آپ کی تجویز یا پیغام' : 'Your Thoughts or Suggestions'} <span className="text-pink-400">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder={
                  isUr
                    ? 'ہمیں بتائیں کہ ہم اپنے پلیٹ فارم کو آپ کے لیے کس طرح مزید بہتر بنا سکتے ہیں...'
                    : 'Tell us what you like or what we can improve across live streaming, UI, or wallet features...'
                }
                className="w-full py-2.5 px-3.5 rounded-xl bg-white/5 border border-white/15 focus:border-pink-500 focus:outline-none text-xs sm:text-sm text-white placeholder:text-white/30 resize-y"
              />
            </div>

            {/* Anonymous Toggle & Email */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-white">
                    {isUr ? 'گمنام طور پر جمع کروائیں' : 'Submit Anonymously'}
                  </span>
                  <p className="text-[10px] text-white/50">
                    {isUr
                      ? 'آپ کا یوزر آئی ڈی اور نام اس فیڈ بیک سے منسلک نہیں ہو گا'
                      : 'Your user profile and ID will not be linked to this feedback'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.isAnonymous}
                  onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
                  className="w-4 h-4 rounded text-pink-600 focus:ring-0 accent-pink-500 cursor-pointer"
                />
              </label>

              {!form.isAnonymous && (
                <div>
                  <label className="block text-[11px] font-medium text-white/70 mb-1">
                    {isUr ? 'رابطہ کے لیے ای میل (اختیاری):' : 'Contact Email (Optional):'}
                  </label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full py-2 px-3 rounded-xl bg-white/5 border border-white/15 focus:border-pink-500 focus:outline-none text-xs text-white placeholder:text-white/30"
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
                    <span>{isUr ? 'بھیجا جا رہا ہے...' : 'Submitting Feedback...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{isUr ? 'فیڈ بیک بھیجیں' : 'Submit Feedback'}</span>
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

export default function FeedbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070514] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      }
    >
      <FeedbackContent />
    </Suspense>
  );
}
