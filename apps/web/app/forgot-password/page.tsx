'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/languageContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  ArrowLeft,
  Mail,
  Smartphone,
  AlertCircle,
  Globe,
  CheckCircle,
  Loader2,
  KeyRound,
  LogIn,
  RefreshCw,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const { lang, toggleLang, isUr } = useLanguage();
  const [resetMethod, setResetMethod] = useState<'email' | 'phone'>('email');

  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = () => {
    if (!identifier.trim()) {
      setError(
        resetMethod === 'email'
          ? isUr ? 'ای میل ایڈریس درج کریں' : 'Please enter your email address'
          : isUr ? 'فون نمبر درج کریں' : 'Please enter your phone number'
      );
      return false;
    }

    if (resetMethod === 'email' && !/^\S+@\S+\.\S+$/.test(identifier)) {
      setError(isUr ? 'درست ای میل درج کریں' : 'Please enter a valid email address');
      return false;
    }

    if (resetMethod === 'phone' && identifier.trim().length < 7) {
      setError(isUr ? 'درست فون نمبر درج کریں' : 'Please enter a valid phone number');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1200);
  };

  return (
    <div
      dir={isUr ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-[#0B0E17] text-white flex flex-col justify-between selection:bg-popo-pink selection:text-white relative overflow-hidden ${
        isUr ? 'font-urdu' : 'font-sans'
      }`}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-pink-600/20 via-purple-600/20 to-indigo-600/15 blur-[140px] rounded-full pointer-events-none" />

      {/* Top Header Bar */}
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex items-center justify-between z-10">
        <Link
          href="/login"
          className={`flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors bg-[#171722] px-4 py-2 rounded-full border border-white/10 ${
            isUr ? 'flex-row-reverse' : ''
          }`}
        >
          <ArrowLeft className={`w-3.5 h-3.5 ${isUr ? 'rotate-180' : ''}`} />
          <span>{isUr ? 'لاگ ان پر واپس جائیں' : 'Back to Log In'}</span>
        </Link>

        {/* Language Switcher */}
        <button
          type="button"
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#171722] hover:bg-[#20202F] text-xs font-bold text-gray-300 hover:text-white border border-white/10 transition-colors"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>{lang === 'en' ? 'اردو' : 'English'}</span>
        </button>
      </header>

      {/* Main Card Center */}
      <main className="max-w-md mx-auto w-full px-4 py-8 z-10">
        <div className="rounded-3xl bg-gradient-to-b from-[#171722] to-[#12121A] border border-white/15 p-6 sm:p-8 shadow-2xl shadow-purple-950/40 flex flex-col gap-6 text-center">
          {/* Logo & Headings */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-popo-pink via-purple-600 to-indigo-500 p-[2.5px] shadow-lg shadow-popo-pink/30 flex items-center justify-center">
              <div className="w-full h-full bg-[#0B0E17] rounded-[13px] flex items-center justify-center text-popo-pink">
                <KeyRound className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {isUr ? 'اپنا پاس ورڈ ری سیٹ کریں' : 'Reset Your Password'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                {isUr
                  ? 'اکاؤنٹ بحالی کا تصدیقی کوڈ حاصل کرنے کے لیے اپنا ای میل یا فون نمبر درج کریں'
                  : 'Enter your email address or mobile phone number to receive a verification code.'}
              </p>
            </div>
          </div>

          {/* Staging Demo Alert */}
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/25 p-3 flex items-start gap-2.5 text-left">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className={`text-xs text-amber-200/90 leading-relaxed ${isUr ? 'text-right' : 'text-left'}`}>
              <span className="font-bold block text-amber-400">
                {isUr ? 'فیز ۱ پریویو — پاس ورڈ ری سیٹ' : 'Phase 1 UI Preview — Password Reset'}
              </span>
              <span>
                {isUr
                  ? 'یہ فرنٹ اینڈ فارم ڈیمو ہے۔ اصل ایس ایم ایس او ٹی پی اور ای میل ری سیٹ لنکس فیز ۲ میں فعال ہوں گے۔'
                  : 'This operates as a verified frontend demonstration. Live SMS gateway and email dispatcher will connect in Phase 2.'}
              </span>
            </div>
          </div>

          {isSuccess ? (
            /* Success Confirmation State */
            <div className="py-6 flex flex-col items-center gap-4 animate-in zoom-in-95 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-mono font-bold text-popo-pink uppercase">Reset Link Dispatched (Demo)</span>
                <h3 className="text-lg font-bold text-white">
                  {isUr ? 'بحالی کا کوڈ ارسال کر دیا گیا!' : 'Recovery Code Dispatched!'}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed max-w-xs">
                  {isUr
                    ? `ہم نے ${identifier} پر تصدیقی کوڈ بھیج دیا ہے۔ برائے مہربانی اپنا ان باکس چیک کریں۔`
                    : `We sent instructions to ${identifier}. In production, this delivers a one-time reset link / OTP.`}
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2 w-full">
                <Link href="/login" className="w-full">
                  <Button variant="primary" size="md" className="w-full font-bold" leftIcon={<LogIn className="w-4 h-4" />}>
                    {isUr ? 'لاگ ان صفحہ پر جائیں' : 'Back to Log In'}
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsSuccess(false)}
                  className="w-full bg-white/5 border-white/10"
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  {isUr ? 'کوئی دوسرا ایڈریس آزمائیں' : 'Try Another Address'}
                </Button>
              </div>
            </div>
          ) : (
            /* Reset Form */
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
              {/* Method Switcher */}
              <div className="flex p-1 bg-[#0B0E17] rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setResetMethod('email');
                    setError('');
                    setIdentifier('');
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    resetMethod === 'email'
                      ? 'bg-popo-pink text-white shadow-sm font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {isUr ? 'ای میل کے ذریعے' : 'Via Email'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResetMethod('phone');
                    setError('');
                    setIdentifier('');
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    resetMethod === 'phone'
                      ? 'bg-popo-pink text-white shadow-sm font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {isUr ? 'فون نمبر کے ذریعے' : 'Via Phone'}
                </button>
              </div>

              {resetMethod === 'email' ? (
                <Input
                  label={isUr ? 'اکاؤنٹ کا ای میل ایڈریس *' : 'Registered Email Address *'}
                  type="email"
                  placeholder="name@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  error={error}
                  leftIcon={<Mail className="w-4 h-4" />}
                />
              ) : (
                <Input
                  label={isUr ? 'رجسٹرڈ موبائل نمبر *' : 'Registered Phone Number *'}
                  type="tel"
                  placeholder="+92 300 1234567"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  error={error}
                  leftIcon={<Smartphone className="w-4 h-4" />}
                />
              )}

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                className="w-full mt-2 font-bold shadow-lg shadow-popo-pink/25"
                leftIcon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              >
                {isSubmitting
                  ? isUr ? 'کوڈ بھیجا جا رہا ہے...' : 'Sending Recovery Instructions...'
                  : isUr ? 'بحالی کا لنک بھیجیں' : 'Send Recovery Instructions'}
              </Button>
            </form>
          )}

          {/* Back to Login Link */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-300 pt-2 border-t border-white/10">
            <span>{isUr ? 'پاس ورڈ یاد آ گیا ہے؟' : 'Remembered your password?'}</span>
            <Link
              href="/login"
              className="text-popo-pink font-bold hover:underline flex items-center gap-1"
            >
              <span>{isUr ? 'یہاں لاگ ان کریں' : 'Log In Here'}</span>
              <LogIn className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="max-w-7xl mx-auto w-full px-4 py-6 text-center text-xs text-gray-400 z-10">
        <span>© 2026 Popo Live Global Inc. All rights reserved.</span>
      </footer>
    </div>
  );
}
