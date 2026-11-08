'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/homepage/Navbar';
import { Footer } from '@/components/homepage/Footer';
import { AuthModal } from '@/components/homepage/AuthModal';
import { Button } from '@/components/ui/Button';
import {
  Compass,
  Radio,
  Users,
  Swords,
  Gift,
  ShieldCheck,
  Globe2,
  Sparkles,
  Server,
  Lock,
  Download,
  CheckCircle2,
} from 'lucide-react';

import { useLanguage } from '@/lib/languageContext';

export default function AboutPage() {
  const { lang, toggleLang, isUr } = useLanguage();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const pillars = [
    {
      icon: <Radio className="w-6 h-6 text-popo-pink" />,
      title: isUr ? 'ایچ ڈی لائیو اسٹریمنگ' : 'Ultra-Low Latency Live Video',
      description: isUr
        ? 'بغیر کسی تاخیر کے ریئل ٹائم انٹرایکٹو ویڈیو براڈکاسٹنگ۔ ہوسٹس اپنے شائقین کے ساتھ فوری چیٹ اور گفٹس کا تبادلہ کرتے ہیں۔'
        : 'Sub-second real-time interactive video powered by industry-grade RTC technology, connecting broadcasters with viewers globally.',
      tag: 'Agora Video Engine',
    },
    {
      icon: <Users className="w-6 h-6 text-popo-purple-light" />,
      title: isUr ? '۹ سیٹوں والے وائس پارٹی رومز' : 'Nine-Seat Voice & Audio Lounges',
      description: isUr
        ? '۱ ہوسٹ اور ۸ مہمان اسپیکرز کے لیے مخصوص سٹیریو آڈیو سیٹیں، کسٹم تھری ڈی بیک گراؤنڈز اور جدید مائیکروفون کنٹرولز۔'
        : '1 Host position + 8 Guest speaker seats with studio stereo fidelity, custom atmospheric visual skins, and host mic moderation.',
      tag: 'Group Audio Social',
    },
    {
      icon: <Swords className="w-6 h-6 text-cyan-400" />,
      title: isUr ? 'سنسنی خیز پی کے بیٹلز' : 'Competitive 1v1 PK Battles',
      description: isUr
        ? 'دو ہوسٹس کے درمیان براہ راست مقابلہ جہاں ان کے فین کلبز تحائف بھیج کر پوائنٹس کے اسکور بار کو جیت کی طرف دھکیلتے ہیں۔'
        : 'Two broadcasters battle live while fan communities send gifts to push dynamic tug-of-war score bars within intense timed rounds.',
      tag: 'Gamified Showdown',
    },
    {
      icon: <Gift className="w-6 h-6 text-amber-400" />,
      title: isUr ? '۷۰٪ شفاف ہوسٹ شیئر' : 'Transparent 70% Host Gift Share',
      description: isUr
        ? 'ورچوئل گفٹ سکے کا ۷۰٪ حصہ براہ راست ہوسٹ پوائنٹس میں تبدیل ہوتا ہے، جس سے کری ایٹرز کو محفوظ اور خود مختار روزگار ملتا ہے۔'
        : 'Exactly 70% of virtual gift coin values convert directly into withdrawable host points, backed by an immutable central ledger.',
      tag: 'Fair Virtual Economy',
    },
  ];

  const highlights = [
    {
      icon: <Server className="w-5 h-5 text-popo-cyan" />,
      title: isUr ? 'ایک مشترکہ بیک اینڈ اور والٹ' : 'Single Unified Backend',
      desc: isUr
        ? 'موبائل ایپس، ویب اور ایڈمن کے لیے ایک ہی مرکزی لیجر اور ایک ہی گلوبل بین لسٹ۔'
        : 'Android, iOS, Web and Admin share one NestJS backend, one wallet system, and one global ban list.',
    },
    {
      icon: <Lock className="w-5 h-5 text-emerald-400" />,
      title: isUr ? '۱۸+ سخت عمر کی حد اور چائلڈ سیفٹی' : 'Strict 18+ Age Gate & Child Safety',
      desc: isUr
        ? 'کم عمر افراد کے تحفظ کے لیے سخت اصول اور غیر اخلاقی مواد پر فوری کارروائی کا خودکار نظام۔'
        : 'Zero-tolerance safety policies, mandatory age gates at onboarding, and real-time AI live stream monitoring.',
    },
    {
      icon: <Globe2 className="w-5 h-5 text-popo-pink" />,
      title: isUr ? 'انگریزی اور اردو دو زبانی آغاز' : 'Bilingual Launch Architecture',
      desc: isUr
        ? 'شروع دن سے مکمل انگریزی اور اردو زبان کی سپورٹ اور علاقائی مواد کی فلٹرنگ۔'
        : 'Native English and Urdu localization across all user interfaces, terms, and community guidelines.',
    },
    {
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      title: isUr ? 'لیول ۵ ویلتھ گیٹ برائے لائیو' : 'Level 5 Broadcaster Gate',
      desc: isUr
        ? 'براہ راست اسٹریمنگ شروع کرنے سے قبل لیول ۵ ویلتھ حاصل کرنا اور تصدیق کروانا لازمی ہے۔'
        : 'Quality and anti-spam protection requiring users to attain Wealth Level 5 and KYC facial check before going live.',
    },
  ];

  return (
    <div
      dir={isUr ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-popo-dark-950 text-popo-text-primary overflow-x-hidden selection:bg-popo-pink selection:text-white ${
        isUr ? 'font-urdu' : 'font-sans'
      }`}
    >
      <Navbar
        lang={lang}
        onToggleLang={toggleLang}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col gap-20">
        {/* Hero Section */}
        <div className={`flex flex-col gap-4 text-center max-w-4xl mx-auto`}>
          <div className="inline-flex items-center gap-2 self-center">
            <span className="text-xs font-bold uppercase tracking-widest text-popo-pink flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-popo-pink/10 border border-popo-pink/20">
              <Compass className="w-3.5 h-3.5" />
              {isUr ? 'پوپو لائیو کے بارے میں' : 'About Popo Live'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            {isUr ? (
              <>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-popo-pink via-purple-400 to-amber-300">
                  لوگوں کو لائیو تفریح اور گفتگو سے جوڑنا
                </span>
              </>
            ) : (
              <>
                Connecting the World Through{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-popo-pink via-purple-400 to-amber-300">
                  Live Streaming & Voice Parties
                </span>
              </>
            )}
          </h1>

          <p className="text-base sm:text-lg text-popo-text-secondary leading-relaxed max-w-2xl mx-auto">
            {isUr
              ? 'پوپو لائیو ایک جدید اور انٹرایکٹو لائیو اسٹریمنگ سوشل پلیٹ فارم ہے جو باصلاحیت ہوسٹس، دوستانہ وائس لاؤنجز اور سنسنی خیز مقابلوں کو یکجا کرتا ہے۔'
              : 'Popo Live is an interactive live streaming social platform engineered to empower broadcasters, bring voice party communities together, and provide transparent digital rewards.'}
          </p>
        </div>

        {/* Mission & Vision Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className={`p-8 rounded-3xl bg-popo-dark-900 border border-white/10 flex flex-col gap-4 ${isUr ? 'text-right' : 'text-left'}`}>
            <span className="text-xs font-extrabold uppercase tracking-wider text-popo-pink">
              {isUr ? 'ہمارا مشن' : 'Our Mission'}
            </span>
            <h2 className="text-2xl font-bold text-white">
              {isUr ? 'ہر باصلاحیت آواز کو عالمی سطح پر روشناس کرانا' : 'Empower Voices and Build Meaningful Social Connections'}
            </h2>
            <p className="text-sm text-popo-text-secondary leading-relaxed">
              {isUr
                ? 'ہمارا مقصد ہر کری ایٹر کو ایک ایسا محفوظ اور پرکشش پلیٹ فارم مہیا کرنا ہے جہاں وہ اپنی صلاحیتیں دکھا سکیں، حقیقی فین کمیونٹیز بنا سکیں اور شفاف ورچوئل گفٹ سسٹم کے ذریعے خود مختار آمدنی حاصل کر سکیں۔'
                : 'To deliver a safe, ultra-responsive stage where broadcasters can showcase creative talents, cultivate loyal fan communities, and earn dignified livelihoods through transparent 70% gift sharing.'}
            </p>
          </div>

          <div className={`p-8 rounded-3xl bg-popo-dark-900 border border-white/10 flex flex-col gap-4 ${isUr ? 'text-right' : 'text-left'}`}>
            <span className="text-xs font-extrabold uppercase tracking-wider text-popo-cyan">
              {isUr ? 'ہمارا وژن' : 'Our Vision'}
            </span>
            <h2 className="text-2xl font-bold text-white">
              {isUr ? 'عالمی انٹرایکٹو اسٹریمنگ کا سب سے معتبر ادارہ' : 'The Most Trusted and Vibrant Real-Time Live Social Ecosystem'}
            </h2>
            <p className="text-sm text-popo-text-secondary leading-relaxed">
              {isUr
                ? 'ہم ایک ایسا ڈیجیٹل تفریحی ماحول تشکیل دے رہے ہیں جہاں جدید ترین ویڈیو ٹیکنالوجی، آڈیو پارٹیز اور منصفانہ مانیٹرنگ کے ساتھ ہر صارف کی عزت اور حفاظت اولین ترجیح ہو۔'
                : 'Pioneering next-generation social entertainment where low-latency video streaming, group voice lounges, and ethical platform governance unite millions in joyous digital celebration.'}
            </p>
          </div>
        </div>

        {/* 4 Core Pillars */}
        <div className="flex flex-col gap-8">
          <div className={`max-w-2xl ${isUr ? 'text-right ml-auto' : 'text-left'}`}>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              {isUr ? 'بنیادی خصوصیات' : 'The Experience Pillars'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mt-1">
              {isUr ? 'پوپو لائیو کا مکمل ماحولیاتی نظام' : 'Engineered for Real Engagement'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((pillar, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-3xl bg-popo-dark-850 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between gap-4 ${
                  isUr ? 'text-right' : 'text-left'
                }`}
              >
                <div className="flex flex-col gap-3">
                  <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 w-fit ${isUr ? 'self-end' : 'self-start'}`}>
                    {pillar.icon}
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-popo-text-muted">
                    {pillar.tag}
                  </span>
                  <h3 className="text-lg font-bold text-white">{pillar.title}</h3>
                  <p className="text-xs text-popo-text-secondary leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Architecture & Trust Highlights */}
        <div className="rounded-3xl bg-gradient-to-br from-popo-dark-900 via-popo-dark-850 to-popo-dark-900 border border-white/10 p-8 sm:p-12">
          <div className={`max-w-2xl mb-8 ${isUr ? 'text-right ml-auto' : 'text-left'}`}>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              {isUr ? 'حفاظت اور معمارانہ اصول' : 'Architectural & Trust Standards'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              {isUr ? 'مضبوط ٹیکنالوجی اور منصفانہ اصول' : 'Built on Firm Technical & Safety Rules'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {highlights.map((h, i) => (
              <div
                key={i}
                className={`flex gap-4 p-5 rounded-2xl bg-black/40 border border-white/5 ${
                  isUr ? 'flex-row-reverse text-right' : 'text-left'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 shrink-0 h-fit">
                  {h.icon}
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-base font-bold text-white">{h.title}</h4>
                  <p className="text-xs text-popo-text-secondary leading-relaxed">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA Card */}
        <div className="rounded-3xl bg-gradient-to-r from-popo-pink/20 via-purple-600/20 to-popo-cyan/20 border border-white/15 p-8 sm:p-12 text-center flex flex-col items-center gap-6">
          <div className="max-w-xl flex flex-col gap-2">
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              {isUr ? 'آج ہی پوپو لائیو کا حصہ بنیں' : 'Be Part of the Popo Live Movement'}
            </h3>
            <p className="text-xs sm:text-sm text-popo-text-secondary">
              {isUr
                ? 'اینڈرائڈ اور آئی او ایس پر لائیو اسٹریمز دیکھیں، اپنے پسندیدہ ہوسٹس سے بات کریں اور نئی دوستیاں قائم کریں۔'
                : 'Download Popo Live for Android and iOS. Stream, party in voice rooms, and celebrate talent with a global community.'}
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              window.location.href = '/#download';
            }}
            leftIcon={<Download className="w-5 h-5" />}
          >
            {isUr ? 'ایپ ڈاؤنلوڈ کریں' : 'Download Popo Live App'}
          </Button>
        </div>
      </main>

      <Footer lang={lang} />

      <AuthModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}
