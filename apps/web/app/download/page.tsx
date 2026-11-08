'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/homepage/Navbar';
import { Footer } from '@/components/homepage/Footer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { QrCodePlaceholder } from '@/components/download/QrCodePlaceholder';
import { useLanguage } from '@/lib/languageContext';
import {
  Smartphone,
  Download,
  Apple,
  ShieldCheck,
  Radio,
  Users,
  Swords,
  Gift,
  MessageCircle,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  LogIn,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export default function DownloadPage() {
  const { lang, isUr } = useLanguage();
  const [activePlatformTab, setActivePlatformTab] = useState<'all' | 'android' | 'ios'>('all');

  const features = [
    {
      icon: <Radio className="w-5 h-5 text-popo-pink" />,
      title: isUr ? 'ایچ ڈی لائیو اسٹریمنگ' : 'Ultra-Low Latency Live Video',
      desc: isUr
        ? 'بغیر کسی تاخیر کے براہ راست نشریات دیکھیں اور ہوسٹس کے ساتھ فوری چیٹ کریں۔'
        : 'Sub-second real-time streaming connecting you with top creators worldwide.',
    },
    {
      icon: <Users className="w-5 h-5 text-popo-purple-light" />,
      title: isUr ? '۹ سیٹوں والے وائس لاؤنجز' : 'Nine-Seat Voice Parties',
      desc: isUr
        ? 'دوستوں کے ساتھ گروپ وائس روم میں شامل ہوں اور ہائی فیڈیلیٹی آڈیو کا لطف اٹھائیں۔'
        : 'Stereo audio lounges with 1 host + 8 speaker seats and interactive room themes.',
    },
    {
      icon: <Swords className="w-5 h-5 text-cyan-400" />,
      title: isUr ? 'سنسنی خیز پی کے مقابلے' : 'High-Stakes PK Battles',
      desc: isUr
        ? 'اپنے پسندیدہ ہوسٹ کو تحائف بھیج کر پی کے ٹورنامنٹس میں فتح دلوائیں۔'
        : 'Support your broadcaster in real-time tug-of-war battles against rival creators.',
    },
    {
      icon: <Gift className="w-5 h-5 text-amber-400" />,
      title: isUr ? 'شاندار ورچوئل تحائف' : 'Virtual Gifting Economy',
      desc: isUr
        ? 'فل اسکرین اینیمیٹڈ گفٹس بھیجیں، جس کا ۷۰٪ حصہ براہ راست ہوسٹ پوائنٹس بنتا ہے۔'
        : 'Send animated 3D gifts with a transparent 70% host earnings points conversion.',
    },
    {
      icon: <MessageCircle className="w-5 h-5 text-emerald-400" />,
      title: isUr ? 'چیٹ اور اسکوائر کمیونٹی' : 'Direct Messages & Square',
      desc: isUr
        ? 'کری ایٹرز کو فالو کریں، ون آن ون میسجز بھیجیں اور فین کلبز کا حصہ بنیں۔'
        : 'Follow top broadcasters, join exclusive fan clubs, and share photos on Square.',
    },
    {
      icon: <Sparkles className="w-5 h-5 text-amber-300" />,
      title: isUr ? 'کری ایٹر روزگار اور ٹاسکس' : 'Creator Growth & Tasks',
      desc: isUr
        ? 'لیول ۵ حاصل کریں، روزانہ اسٹریمنگ ٹاسکس مکمل کریں اور اسٹریک انعامات حاصل کریں۔'
        : 'Earn streak multipliers, level up your wealth badge, and withdraw points easily.',
    },
  ];

  return (
    <div
      dir={isUr ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-popo-dark-950 text-popo-text-primary overflow-x-hidden selection:bg-popo-pink selection:text-white ${
        isUr ? 'font-urdu' : 'font-sans'
      }`}
    >
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 flex flex-col gap-20">
        {/* Placeholder Store URLs Alert */}
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-popo-dark-850/80 border border-white/10 text-xs text-popo-text-secondary">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            {isUr
              ? 'وضاحت: آفیشل گوگل پلے اسٹور اور ایپل ایپ اسٹور کے لنکس اور کیو آر کوڈز کلائنٹ کی جانب سے فائنل اسٹور لنکس موصول ہونے تک ڈیمو پلیس ہولڈرز ہیں۔'
              : 'Notice: Official Google Play and Apple App Store buttons & QR codes are displayed as verified placeholders pending final store publishing links from client.'}
          </span>
        </div>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className={`lg:col-span-7 flex flex-col gap-6 ${isUr ? 'text-right' : 'text-left'}`}>
            <div className={`inline-flex items-center gap-2 ${isUr ? 'self-end' : 'self-start'}`}>
              <span className="text-xs font-bold uppercase tracking-widest text-popo-pink flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-popo-pink/10 border border-popo-pink/20">
                <Smartphone className="w-3.5 h-3.5" />
                {isUr ? 'موبائل ایپلیکیشن' : 'Official Mobile App'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              {isUr ? (
                <>
                  اینڈرائڈ اور آئی او ایس پر{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-popo-pink via-purple-400 to-popo-cyan">
                    پوپو لائیو ڈاؤنلوڈ کریں
                  </span>
                </>
              ) : (
                <>
                  Download Popo Live for{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-popo-pink via-purple-400 to-popo-cyan">
                    Android & iOS
                  </span>
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg text-popo-text-secondary leading-relaxed max-w-xl">
              {isUr
                ? 'اپنے اسمارٹ فون پر تیز ترین لائیو ویڈیو اسٹریمنگ، ۹ سیٹوں والے وائس پارٹی رومز اور شاندار ورچوئل گفٹنگ کا مکمل تجربہ حاصل کریں۔'
                : 'Experience real-time interactive live streaming, 9-seat party voice rooms, high-stakes PK battles, and verified creator earnings directly on your smartphone.'}
            </p>

            {/* Quick Action Badges */}
            <div className={`flex flex-wrap items-center gap-4 pt-2 ${isUr ? 'justify-end' : 'justify-start'}`}>
              {/* Google Play Button */}
              <a
                href="#android-section"
                className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-popo-dark-850 hover:bg-popo-dark-800 border border-white/15 hover:border-popo-pink/40 text-white transition-all shadow-lg group"
              >
                <svg className="w-6 h-6 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M3.609 1.814L13.792 12 3.61 22.186c-.367-.344-.61-.83-.61-1.393V3.207c0-.563.243-1.049.61-1.393z" />
                  <path fill="#FBBC05" d="M17.158 8.634l-3.366 3.366 3.366 3.366 3.793-2.189c1.082-.624 1.082-1.729 0-2.354l-3.793-2.189z" />
                  <path fill="#4285F4" d="M3.609 1.814l10.183 10.186 3.366-3.366L6.505.31c-.933-.538-2.029-.25-2.896.504z" />
                  <path fill="#34A853" d="M3.609 22.186l13.549-7.81-3.366-3.366L3.609 22.186z" />
                </svg>
                <div className="text-left flex flex-col">
                  <span className="text-[10px] text-popo-text-muted uppercase tracking-wider leading-none">
                    GET IT ON
                  </span>
                  <span className="text-sm font-bold text-white leading-tight">Google Play</span>
                </div>
              </a>

              {/* App Store Button */}
              <a
                href="#ios-section"
                className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-popo-dark-850 hover:bg-popo-dark-800 border border-white/15 hover:border-popo-cyan/40 text-white transition-all shadow-lg group"
              >
                <svg className="w-6 h-6 fill-white shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.47c.64-.78 1.08-1.87.96-2.97-1 .04-2.14.64-2.81 1.42-.58.68-1.09 1.78-.96 2.85 1.12.09 2.19-.55 2.81-1.3" />
                </svg>
                <div className="text-left flex flex-col">
                  <span className="text-[10px] text-popo-text-muted uppercase tracking-wider leading-none">
                    Download on the
                  </span>
                  <span className="text-sm font-bold text-white leading-tight">App Store</span>
                </div>
              </a>
            </div>

            {/* Login Link for existing web accounts */}
            <div className={`flex items-center gap-2 text-xs text-popo-text-secondary pt-2 ${isUr ? 'justify-end' : 'justify-start'}`}>
              <span>{isUr ? 'پہلے سے اکاؤنٹ موجود ہے؟' : 'Already have a Popo Live account?'}</span>
              <Link href="/login" className="text-popo-pink font-bold hover:underline flex items-center gap-1">
                <span>{isUr ? 'لاگ ان پورٹل پر جائیں' : 'Log In to Web Portal'}</span>
                <LogIn className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Visual: Dual Phone App Mockup */}
          <div className="lg:col-span-5 flex justify-center relative">
            <div className="relative w-full max-w-[340px] aspect-[9/16] rounded-[40px] overflow-hidden bg-popo-dark-900 border-4 border-white/20 shadow-2xl p-4 flex flex-col justify-between">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80"
                alt="App Interface"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/70 pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between text-white text-xs font-bold">
                <span className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-popo-live animate-ping" />
                  <span>POPO LIVE MOBILE</span>
                </span>
                <span className="bg-amber-400 text-black text-[10px] px-2 py-0.5 rounded-full font-black">
                  v1.0
                </span>
              </div>

              <div className="relative z-10 flex flex-col gap-3 text-left">
                <div className="p-3 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Official Flutter Release</span>
                    <span className="text-[10px] text-popo-text-muted">Android 8.0+ & iOS 14.0+</span>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Android Download Detailed */}
        <section
          id="android-section"
          className="rounded-3xl bg-popo-dark-900 border border-white/10 p-8 sm:p-12 scroll-mt-24 shadow-2xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className={`lg:col-span-8 flex flex-col gap-4 ${isUr ? 'text-right' : 'text-left'}`}>
              <div className={`flex items-center gap-2 text-emerald-400 font-extrabold text-xs uppercase tracking-wider ${isUr ? 'justify-end' : 'justify-start'}`}>
                <Smartphone className="w-4 h-4" />
                <span>Android Platform (Google Play)</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {isUr ? 'اینڈرائڈ پر پوپو لائیو انسٹال کریں' : 'Install Popo Live on Android'}
              </h2>

              <p className="text-xs sm:text-sm text-popo-text-secondary leading-relaxed">
                {isUr
                  ? 'گوگل پلے اسٹور سے باآسانی ڈاؤنلوڈ کریں۔ تمام مشہور اینڈرائڈ ڈیوائسز (سام سنگ، شیاؤمی، ویوو، اوپو وغیرہ) پر بغیر رکاوٹ چلتا ہے۔'
                  : 'Download directly from Google Play. Optimized for smooth playback across Samsung, Xiaomi, Vivo, Oppo, and all modern Android smartphones.'}
              </p>

              {/* Step-by-Step Instructions */}
              <div className="flex flex-col gap-2 pt-2">
                <div className={`flex items-center gap-2.5 text-xs text-white ${isUr ? 'flex-row-reverse' : ''}`}>
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                    1
                  </span>
                  <span>{isUr ? 'گوگل پلے بٹن پر کلک کریں یا دائیں جانب کیو آر کوڈ اسکین کریں۔' : 'Click the Google Play button below or scan the QR code with your camera.'}</span>
                </div>
                <div className={`flex items-center gap-2.5 text-xs text-white ${isUr ? 'flex-row-reverse' : ''}`}>
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                    2
                  </span>
                  <span>{isUr ? 'پلے اسٹور پر &quot;انسٹال&quot; پر کلک کریں۔' : 'Tap &quot;Install&quot; on the Google Play Store page.'}</span>
                </div>
                <div className={`flex items-center gap-2.5 text-xs text-white ${isUr ? 'flex-row-reverse' : ''}`}>
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                    3
                  </span>
                  <span>{isUr ? 'ایپ کھولیں، اپنی زبان (انگریزی یا اردو) منتخب کریں اور لطف اٹھائیں۔' : 'Open the app, select English or Urdu, and sign in to start watching live.'}</span>
                </div>
              </div>

              <div className={`pt-4 flex ${isUr ? 'justify-end' : 'justify-start'}`}>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => alert('Official Google Play store link will be provided upon store publication.')}
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  {isUr ? 'گوگل پلے سے انسٹال کریں (Placeholder)' : 'Get on Google Play (Placeholder)'}
                </Button>
              </div>
            </div>

            {/* Android QR Code Placeholder */}
            <div className="lg:col-span-4 flex justify-center">
              <QrCodePlaceholder platform="android" label="Scan for Android" />
            </div>
          </div>
        </section>

        {/* Section: iOS Download Detailed */}
        <section
          id="ios-section"
          className="rounded-3xl bg-popo-dark-900 border border-white/10 p-8 sm:p-12 scroll-mt-24 shadow-2xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className={`lg:col-span-8 flex flex-col gap-4 ${isUr ? 'text-right' : 'text-left'}`}>
              <div className={`flex items-center gap-2 text-popo-cyan font-extrabold text-xs uppercase tracking-wider ${isUr ? 'justify-end' : 'justify-start'}`}>
                <Apple className="w-4 h-4" />
                <span>iOS Platform (Apple App Store)</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {isUr ? 'آئی فون اور آئی پیڈ پر پوپو لائیو انسٹال کریں' : 'Install Popo Live on iPhone & iPad'}
              </h2>

              <p className="text-xs sm:text-sm text-popo-text-secondary leading-relaxed">
                {isUr
                  ? 'ایپل ایپ اسٹور سے باضابطہ تصدیق شدہ ورژن ڈاؤنلوڈ کریں۔ آئی او ایس ۱۴ اور اس کے بعد کے تمام ماڈلز پر مکمل مطابقت۔'
                  : 'Install officially from the Apple App Store. Fully optimized for iPhone with native Metal graphics rendering and low-power audio streaming.'}
              </p>

              {/* Step-by-Step Instructions */}
              <div className="flex flex-col gap-2 pt-2">
                <div className={`flex items-center gap-2.5 text-xs text-white ${isUr ? 'flex-row-reverse' : ''}`}>
                  <span className="w-5 h-5 rounded-full bg-popo-cyan/20 text-popo-cyan flex items-center justify-center font-bold text-[10px]">
                    1
                  </span>
                  <span>{isUr ? 'ایپ اسٹور بٹن پر کلک کریں یا کیو آر کوڈ اسکین کریں۔' : 'Tap the App Store button below or scan the QR code with your iPhone Camera.'}</span>
                </div>
                <div className={`flex items-center gap-2.5 text-xs text-white ${isUr ? 'flex-row-reverse' : ''}`}>
                  <span className="w-5 h-5 rounded-full bg-popo-cyan/20 text-popo-cyan flex items-center justify-center font-bold text-[10px]">
                    2
                  </span>
                  <span>{isUr ? 'فیس آئی ڈی یا پاس ورڈ کے ساتھ &quot;GET&quot; پر تصدیق کریں۔' : 'Authenticate with Face ID / Apple ID to download Popo Live.'}</span>
                </div>
                <div className={`flex items-center gap-2.5 text-xs text-white ${isUr ? 'flex-row-reverse' : ''}`}>
                  <span className="w-5 h-5 rounded-full bg-popo-cyan/20 text-popo-cyan flex items-center justify-center font-bold text-[10px]">
                    3
                  </span>
                  <span>{isUr ? 'ایپ شروع کریں اور فوری لاگ ان سے اپنے فین کلب میں شامل ہوں۔' : 'Launch the app, sign in with Apple, and enjoy interactive party rooms.'}</span>
                </div>
              </div>

              <div className={`pt-4 flex ${isUr ? 'justify-end' : 'justify-start'}`}>
                <Button
                  variant="cyan"
                  size="md"
                  onClick={() => alert('Official Apple App Store link will be provided upon store publication.')}
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  {isUr ? 'ایپل ایپ اسٹور سے حاصل کریں (Placeholder)' : 'Get on App Store (Placeholder)'}
                </Button>
              </div>
            </div>

            {/* iOS QR Code Placeholder */}
            <div className="lg:col-span-4 flex justify-center">
              <QrCodePlaceholder platform="ios" label="Scan for iPhone" />
            </div>
          </div>
        </section>

        {/* Features Showcase Section */}
        <section className="flex flex-col gap-10">
          <div className={`max-w-2xl ${isUr ? 'text-right ml-auto' : 'text-left'}`}>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              {isUr ? 'موبائل ایپ کی خصوصیات' : 'Everything in One Mobile App'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mt-1">
              {isUr ? 'آپ کی جیب میں ایک مکمل لائیو سوشل دنیا' : 'The Complete Live Streaming Social Suite'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <div
                key={i}
                className={`p-6 rounded-3xl bg-popo-dark-850 border border-white/10 flex flex-col gap-3 ${
                  isUr ? 'text-right' : 'text-left'
                }`}
              >
                <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 w-fit ${isUr ? 'self-end' : 'self-start'}`}>
                  {feat.icon}
                </div>
                <h3 className="text-base font-bold text-white">{feat.title}</h3>
                <p className="text-xs text-popo-text-secondary leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
