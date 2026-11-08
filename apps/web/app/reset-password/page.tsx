'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  Loader2,
  AlertCircle,
  KeyRound,
  LogIn,
} from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { lang, setLang, isUr } = useLanguage();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError(
        isUr
          ? 'پاس ورڈ ری سیٹ ٹوکن غائب ہے۔ براہ کرم نئی درخواست دیں۔'
          : 'Password reset token is missing from the link. Please request a new link.'
      );
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setError(
        isUr
          ? 'نیا پاس ورڈ کم از کم ۸ حروف پر مشتمل ہونا چاہیے۔'
          : 'New password must be at least 8 characters long.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        isUr
          ? 'پاس ورڈز آپس میں میل نہیں کھاتے ہیں۔'
          : 'Passwords do not match. Please re-enter.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error updating password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      dir={isUr ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#07040E] text-white flex flex-col justify-between selection:bg-[#FF1A6C] selection:text-white relative overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[650px] h-[550px] sm:h-[650px] bg-gradient-to-tr from-purple-800/20 via-[#FF1A6C]/20 to-transparent rounded-full blur-[130px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-5 flex items-center justify-between z-10">
        <Link
          href="/login"
          className={`flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 ${
            isUr ? 'flex-row-reverse' : ''
          }`}
        >
          <ArrowLeft className={`w-3.5 h-3.5 ${isUr ? 'rotate-180' : ''}`} />
          <span>{isUr ? 'لاگ ان پر واپس جائیں' : 'Back to Log In'}</span>
        </Link>

        {/* Working Language selector */}
        <div className="flex items-center bg-white/10 rounded-full p-0.5 border border-white/10">
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              !isUr
                ? 'bg-gradient-to-r from-[#FF1A6C] to-[#E0125C] text-white shadow-sm'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLang('ur')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              isUr
                ? 'bg-gradient-to-r from-[#FF1A6C] to-[#E0125C] text-white shadow-sm'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            اردو
          </button>
        </div>
      </header>

      {/* Main Card Center */}
      <main className="max-w-[430px] mx-auto w-full px-4 py-6 z-10 my-auto">
        <div className="relative rounded-[32px] sm:rounded-[36px] bg-gradient-to-b from-[#140C29] via-[#0E091E] to-[#0A0614] border border-[#2D1B4E]/90 p-6 sm:p-8 shadow-[0_20px_70px_rgba(0,0,0,0.85),0_0_35px_rgba(168,85,247,0.18)] flex flex-col gap-5 text-center overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-[#FF1A6C] to-transparent opacity-80" />

          {/* Icon & Title */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF1A6C] to-purple-600 p-[2px] shadow-lg shadow-pink-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-[#0E091E] rounded-[14px] flex items-center justify-center text-[#FF1A6C]">
                <Lock className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {isUr ? 'نیا پاس ورڈ درج کریں' : 'Set New Password'}
              </h1>
              <p className="text-xs text-[#B3A8C7] mt-1 leading-relaxed">
                {isUr
                  ? 'اپنے اکاؤنٹ کو محفوظ رکھنے کے لیے کم از کم ۸ حروف کا نیا پاس ورڈ منتخب کریں۔'
                  : 'Choose a strong password with at least 8 characters to secure your account.'}
              </p>
            </div>
          </div>

          {!token && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs text-left flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {isUr
                  ? 'کوئی ری سیٹ ٹوکن فراہم نہیں کیا گیا۔ براہ کرم پہلے پاس ورڈ بحالی کا لنک طلب کریں۔'
                  : 'No reset token found in your URL. Please request a valid reset link first.'}
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-left flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isSuccess ? (
            /* Success State */
            <div className="py-3 flex flex-col items-center gap-4 animate-in zoom-in-95 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {isUr ? 'پاس ورڈ کامیابی سے تبدیل ہو گیا!' : 'Password Updated Successfully!'}
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {isUr
                    ? 'آپ کا نیا پاس ورڈ لاگو ہو چکا ہے۔ اب آپ اپنے نئے پاس ورڈ کے ساتھ لاگ ان کر سکتے ہیں۔'
                    : 'Your password has been securely reset. You can now log in using your new credentials.'}
                </p>
              </div>

              <div className="pt-2 w-full">
                <Link href="/login" className="w-full">
                  <button
                    type="button"
                    className="w-full py-3.5 px-6 rounded-full font-bold text-sm tracking-wide text-white bg-gradient-to-r from-[#FF1A6C] to-[#E0125C] shadow-lg shadow-pink-500/30 hover:brightness-105 transition-all flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{isUr ? 'نئے پاس ورڈ سے لاگ ان کریں' : 'Log In with New Password'}</span>
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            /* Reset Form */
            <form onSubmit={handleResetSubmit} className="flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-300">
                  {isUr ? 'نیا پاس ورڈ (کم از کم ۸ حروف)' : 'New Password (Min 8 characters)'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full bg-[#18102E] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 outline-none focus:border-[#FF1A6C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-300">
                  {isUr ? 'نئے پاس ورڈ کی تصدیق کریں' : 'Confirm New Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full bg-[#18102E] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 outline-none focus:border-[#FF1A6C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-3 text-gray-400 hover:text-white"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !token}
                className="w-full mt-2 py-3.5 px-6 rounded-full font-bold text-sm tracking-wide text-white bg-gradient-to-r from-[#FF1A6C] via-[#FF2E80] to-[#E0125C] shadow-[0_8px_25px_rgba(255,26,108,0.4)] hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isUr ? 'پاس ورڈ تبدیل ہو رہا ہے...' : 'Updating Password...'}</span>
                  </>
                ) : (
                  <span>{isUr ? 'پاس ورڈ محفوظ کریں' : 'Update & Save Password'}</span>
                )}
              </button>
            </form>
          )}

          {/* Links */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
            <Link href="/forgot-password" className="hover:text-white">
              {isUr ? 'نیا لنک حاصل کریں' : 'Request New Link'}
            </Link>
            <Link href="/login" className="text-[#FF1A6C] font-bold hover:underline">
              {isUr ? 'لاگ ان صفحہ' : 'Back to Log In'}
            </Link>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="max-w-7xl mx-auto w-full px-4 py-5 text-center text-xs text-gray-500 z-10">
        <span>© 2026 Popo Live Global Inc. All rights reserved.</span>
      </footer>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07040E] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF1A6C]" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
