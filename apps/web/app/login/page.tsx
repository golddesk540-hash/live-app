'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/languageContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  ArrowLeft,
  ShieldCheck,
  Smartphone,
  Mail,
  AlertCircle,
  Globe,
  Lock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export default function LoginPage() {
  const { lang, toggleLang, isUr } = useLanguage();
  const [activeTab, setActiveTab] = useState<'social' | 'phone' | 'email'>('social');
  const [infoNotice, setInfoNotice] = useState<string | null>(null);

  const handleProviderClick = (provider: string) => {
    setInfoNotice(
      isUr
        ? `فیز ۲ نوٹس: ${provider} تصدیق فیز ۲ (اکاؤنٹس اور پروفائلز) میں فعال کی جائے گی۔ ابھی کوئی لاگ ان ڈیٹا طلب نہیں کیا جا رہا۔`
        : `Phase 2 Notice: ${provider} authentication will be activated in Phase 2 (Accounts & Profiles). No credentials are requested or stored during Phase 1.`
    );
  };

  return (
    <div
      dir={isUr ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-popo-dark-950 text-popo-text-primary flex flex-col justify-between selection:bg-popo-pink selection:text-white relative overflow-hidden ${
        isUr ? 'font-urdu' : 'font-sans'
      }`}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-popo-pink/15 via-purple-600/15 to-popo-cyan/15 blur-[140px] rounded-full pointer-events-none" />

      {/* Top Header Bar */}
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex items-center justify-between z-10">
        <Link
          href="/"
          className={`flex items-center gap-2 text-xs font-bold text-popo-text-secondary hover:text-white transition-colors bg-popo-dark-850 px-3.5 py-1.5 rounded-full border border-white/10 ${
            isUr ? 'flex-row-reverse' : ''
          }`}
        >
          <ArrowLeft className={`w-3.5 h-3.5 ${isUr ? 'rotate-180' : ''}`} />
          <span>{isUr ? 'ہوم پیج پر واپس جائیں' : 'Back to Home'}</span>
        </Link>

        {/* Language Switcher */}
        <button
          type="button"
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-popo-dark-850 hover:bg-popo-dark-800 text-xs font-bold text-popo-text-secondary hover:text-white border border-white/10 transition-colors"
        >
          <Globe className="w-3.5 h-3.5 text-popo-cyan" />
          <span>{lang === 'en' ? 'اردو' : 'English'}</span>
        </button>
      </header>

      {/* Main Login Card Center */}
      <main className="max-w-md mx-auto w-full px-4 py-8 z-10">
        <div className="rounded-3xl bg-popo-dark-900 border border-white/10 p-6 sm:p-8 shadow-2xl flex flex-col gap-6 text-center">
          {/* Brand Logo & Heading */}
          <div className="flex flex-col items-center gap-3">
            <Link href="/" className="group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-popo-pink via-purple-600 to-popo-cyan p-[2.5px] shadow-glow-pink transition-transform duration-300 group-hover:scale-105">
                <div className="w-full h-full bg-popo-dark-950 rounded-[13px] flex items-center justify-center font-black text-2xl text-popo-pink">
                  P
                </div>
              </div>
            </Link>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                {isUr ? 'پوپو لائیو میں خوش آمدید' : 'Welcome to Popo Live'}
              </h1>
              <p className="text-xs text-popo-text-secondary mt-1">
                {isUr
                  ? 'لائیو نشریات دیکھنے اور کمیونٹی سے جڑنے کے لیے سائن ان کریں'
                  : 'Sign in to watch streams, participate in party rooms & send gifts'}
              </p>
            </div>
          </div>

          {/* Phase 2 Informational Alert */}
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/25 p-3.5 flex items-start gap-2.5 text-left">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className={`text-xs text-amber-200/90 leading-relaxed ${isUr ? 'text-right' : 'text-left'}`}>
              <span className="font-bold block text-amber-400">
                {isUr ? 'فیز ۱ پریویو — فیز ۲ لاگ ان' : 'Phase 1 UI Preview — Phase 2 Authentication'}
              </span>
              <span>
                {isUr
                  ? 'یہ صرف فرنٹ اینڈ انٹری پوائنٹ ہے۔ اصل لاگ ان اور اکاؤنٹس فیز ۲ میں منسلک کیے جائیں گے۔'
                  : 'This is the visual login entry interface. OAuth providers and JWT sessions will be connected in Phase 2.'}
              </span>
            </div>
          </div>

          {infoNotice && (
            <div className="p-3 rounded-xl bg-popo-pink/15 border border-popo-pink/30 text-xs text-white animate-in fade-in duration-200">
              {infoNotice}
            </div>
          )}

          {/* Login Option Switcher Pills */}
          <div className="flex p-1 bg-popo-dark-850 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab('social')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'social' ? 'bg-popo-pink text-white shadow-sm font-bold' : 'text-popo-text-secondary hover:text-white'
              }`}
            >
              {isUr ? 'سوشل لاگ ان' : 'Social'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('phone')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'phone' ? 'bg-popo-pink text-white shadow-sm font-bold' : 'text-popo-text-secondary hover:text-white'
              }`}
            >
              {isUr ? 'فون نمبر' : 'Phone'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('email')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'email' ? 'bg-popo-pink text-white shadow-sm font-bold' : 'text-popo-text-secondary hover:text-white'
              }`}
            >
              {isUr ? 'ای میل' : 'Email'}
            </button>
          </div>

          {/* 1. Social Provider Buttons */}
          {activeTab === 'social' && (
            <div className="flex flex-col gap-3">
              {/* Google */}
              <button
                type="button"
                onClick={() => handleProviderClick('Google')}
                className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-2xl bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-sm transition-all shadow-md select-none active:scale-[0.99]"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.14 0 9.89 0 12s.45 3.86 1.24 5.42l4.04-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
                <span>{isUr ? 'گوگل کے ساتھ جاری رکھیں' : 'Continue with Google'}</span>
              </button>

              {/* Apple */}
              <button
                type="button"
                onClick={() => handleProviderClick('Apple')}
                className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-2xl bg-black hover:bg-neutral-900 text-white font-bold text-sm border border-white/20 transition-all shadow-md select-none active:scale-[0.99]"
              >
                <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.47c.64-.78 1.08-1.87.96-2.97-1 .04-2.14.64-2.81 1.42-.58.68-1.09 1.78-.96 2.85 1.12.09 2.19-.55 2.81-1.3" />
                </svg>
                <span>{isUr ? 'ایپل کے ساتھ جاری رکھیں' : 'Continue with Apple'}</span>
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={() => handleProviderClick('Facebook')}
                className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-2xl bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold text-sm transition-all shadow-md select-none active:scale-[0.99]"
              >
                <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>{isUr ? 'فیس بک کے ساتھ جاری رکھیں' : 'Continue with Facebook'}</span>
              </button>
            </div>
          )}

          {/* 2. Phone OTP Form Preview */}
          {activeTab === 'phone' && (
            <div className="flex flex-col gap-3">
              <Input
                label={isUr ? 'موبائل نمبر درج کریں' : 'Mobile Phone Number'}
                placeholder="+92 300 1234567"
                leftIcon={<Smartphone className="w-4 h-4" />}
              />
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => handleProviderClick('SMS Phone OTP')}
              >
                {isUr ? 'او ٹی پی کوڈ حاصل کریں (Preview)' : 'Send SMS OTP (Preview)'}
              </Button>
            </div>
          )}

          {/* 3. Email Form Preview */}
          {activeTab === 'email' && (
            <div className="flex flex-col gap-3">
              <Input
                label={isUr ? 'ای میل ایڈریس' : 'Email Address'}
                placeholder="name@example.com"
                type="email"
                leftIcon={<Mail className="w-4 h-4" />}
              />
              <Input
                label={isUr ? 'پاس ورڈ' : 'Password'}
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
              />
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => handleProviderClick('Email Password')}
              >
                {isUr ? 'لاگ ان کریں (Preview)' : 'Sign In (Preview)'}
              </Button>
            </div>
          )}

          {/* Legal Agreement Footer */}
          <div className="flex flex-col gap-2 pt-4 border-t border-white/10 text-xs text-popo-text-secondary leading-relaxed">
            <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>{isUr ? 'صرف ۱۸ سال اور زائد عمر کے لیے' : 'Strict 18+ Age Gate & Zero Child Abuse Policy'}</span>
            </div>
            <p className="text-[11px] text-popo-text-muted">
              {isUr ? (
                <>
                  جاری رکھ کر آپ پوپو لائیو کے{' '}
                  <Link href="/terms" className="text-white hover:underline font-bold">
                    استعمال کی شرائط
                  </Link>{' '}
                  اور{' '}
                  <Link href="/privacy" className="text-white hover:underline font-bold">
                    پرائیویسی پالیسی
                  </Link>{' '}
                  سے اتفاق کرتے ہیں۔
                </>
              ) : (
                <>
                  By continuing, you agree to Popo Live{' '}
                  <Link href="/terms" className="text-white hover:underline font-bold">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-white hover:underline font-bold">
                    Privacy Policy
                  </Link>
                  .
                </>
              )}
            </p>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="max-w-7xl mx-auto w-full px-4 py-6 text-center text-xs text-popo-text-muted z-10">
        <span>© 2026 Popo Live Global Inc. All rights reserved.</span>
      </footer>
    </div>
  );
}
