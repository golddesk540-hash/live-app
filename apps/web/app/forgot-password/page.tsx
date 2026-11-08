'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/languageContext';
import {
  ArrowLeft,
  Mail,
  Smartphone,
  CheckCircle,
  Loader2,
  KeyRound,
  LogIn,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const { lang, setLang, isUr } = useLanguage();
  const [resetMethod, setResetMethod] = useState<'email' | 'phone'>('email');

  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = identifier.trim();
    if (!trimmed) {
      setError(
        resetMethod === 'email'
          ? isUr ? 'ای میل ایڈریس درج کریں' : 'Please enter your email address'
          : isUr ? 'فون نمبر درج کریں' : 'Please enter your phone number'
      );
      return;
    }

    if (resetMethod === 'email' && !/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError(isUr ? 'درست ای میل درج کریں' : 'Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: trimmed }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch password recovery');
      }

      setIsSuccess(true);
      if (data.devResetUrl) {
        setDevResetUrl(data.devResetUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Error processing request.');
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
                <KeyRound className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {isUr ? 'پاس ورڈ بحال کریں' : 'Reset Your Password'}
              </h1>
              <p className="text-xs text-[#B3A8C7] mt-1 leading-relaxed">
                {isUr
                  ? 'اکاؤنٹ بحالی کی ہدایات حاصل کرنے کے لیے اپنا رجسٹرڈ ای میل یا فون نمبر درج کریں۔'
                  : 'Enter your registered email or phone to receive secure password recovery instructions.'}
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-left flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isSuccess ? (
            /* Success Confirmation State */
            <div className="py-3 flex flex-col items-center gap-4 animate-in zoom-in-95 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {isUr ? 'بحالی کی ہدایات ارسال کر دی گئیں!' : 'Instructions Dispatched!'}
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {isUr
                    ? `اگر ${identifier} سے کوئی اکاؤنٹ منسلک ہے، تو پاس ورڈ ری سیٹ کرنے کی ہدایات روانہ کر دی گئی ہیں۔`
                    : `If an account is associated with ${identifier}, password recovery instructions have been sent.`}
                </p>
              </div>

              {/* Development helper link */}
              {devResetUrl && (
                <div className="w-full p-3 rounded-xl bg-purple-500/15 border border-purple-500/30 text-xs text-purple-200 flex flex-col gap-2">
                  <span className="font-semibold text-purple-300">Local Testing Reset Link:</span>
                  <a
                    href={devResetUrl}
                    className="py-2 px-3 rounded-lg bg-gradient-to-r from-[#FF1A6C] to-[#E0125C] text-white font-bold flex items-center justify-center gap-1.5 hover:brightness-110"
                  >
                    <span>Click to Open Password Reset Screen</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              <div className="pt-2 flex flex-col gap-2 w-full">
                <Link href="/login" className="w-full">
                  <button
                    type="button"
                    className="w-full py-3 rounded-full font-bold text-xs sm:text-sm text-white bg-white/10 hover:bg-white/15 transition-all flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{isUr ? 'لاگ ان صفحہ پر جائیں' : 'Back to Log In'}</span>
                  </button>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsSuccess(false);
                    setDevResetUrl(null);
                  }}
                  className="text-xs text-gray-400 hover:text-white flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{isUr ? 'کوئی دوسرا ایڈریس آزمائیں' : 'Try Another Address'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Reset Form */
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
              {/* Method Switcher */}
              <div className="flex p-1 bg-[#0A0614] rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setResetMethod('email');
                    setError(null);
                    setIdentifier('');
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    resetMethod === 'email'
                      ? 'bg-gradient-to-r from-[#FF1A6C] to-[#E0125C] text-white font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {isUr ? 'ای میل کے ذریعے' : 'Via Email'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResetMethod('phone');
                    setError(null);
                    setIdentifier('');
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    resetMethod === 'phone'
                      ? 'bg-gradient-to-r from-[#FF1A6C] to-[#E0125C] text-white font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {isUr ? 'فون نمبر کے ذریعے' : 'Via Phone'}
                </button>
              </div>

              {resetMethod === 'email' ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-300">
                    {isUr ? 'رجسٹرڈ ای میل ایڈریس' : 'Registered Email Address'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full bg-[#18102E] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 outline-none focus:border-[#FF1A6C]"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-300">
                    {isUr ? 'رجسٹرڈ موبائل نمبر (ملکی کوڈ کے ساتھ)' : 'Registered Phone (with country code)'}
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="tel"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="+92 300 1234567"
                      required
                      className="w-full bg-[#18102E] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 outline-none focus:border-[#FF1A6C]"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3.5 px-6 rounded-full font-bold text-sm tracking-wide text-white bg-gradient-to-r from-[#FF1A6C] via-[#FF2E80] to-[#E0125C] shadow-[0_8px_25px_rgba(255,26,108,0.4)] hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isUr ? 'درخواست بھیجی جا رہی ہے...' : 'Sending Instructions...'}</span>
                  </>
                ) : (
                  <span>{isUr ? 'بحالی کی ہدایات حاصل کریں' : 'Send Reset Instructions'}</span>
                )}
              </button>
            </form>
          )}

          {/* Back to Login Link */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <span>{isUr ? 'پاس ورڈ یاد آ گیا ہے؟' : 'Remembered your password?'}</span>
            <Link
              href="/login"
              className="text-[#FF1A6C] font-bold hover:underline"
            >
              {isUr ? 'یہاں لاگ ان کریں' : 'Log In Here'}
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
