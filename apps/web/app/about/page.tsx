'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/homepage/Navbar';
import { Footer } from '@/components/homepage/Footer';
import { AuthModal } from '@/components/homepage/AuthModal';
import { Button } from '@/components/ui/Button';
import {
  Video,
  Users,
  Swords,
  Gift,
  Heart,
  Sparkles,
  Shield,
  Flag,
  UserX,
  FileText,
  Lock,
  Download,
  ArrowRight,
  Compass,
} from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';
import { cn } from '@/lib/utils';

export default function AboutPage() {
  const { lang, toggleLang, isUr } = useLanguage();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Section 5: 6 Platform Feature Cards
  const platformFeatures = [
    {
      id: 'live',
      icon: <Video className="w-7 h-7 text-popo-pink" />,
      title: isUr ? 'لائیو اسٹریمنگ' : 'Live Streaming',
      desc: isUr
        ? 'بغیر کسی تاخیر کے ایچ ڈی ویڈیو اسٹریمنگ، ریئل ٹائم چیٹ اور دنیا بھر کے باصلاحیت ہوسٹس سے فوری رابطہ۔'
        : 'High-definition video broadcasting with ultra-low latency, real-time live chat, and global talent discovery.',
    },
    {
      id: 'party',
      icon: <Users className="w-7 h-7 text-purple-400" />,
      title: isUr ? 'پارٹی رومز' : 'Party Rooms',
      desc: isUr
        ? '۹ سیٹوں والے وائس اور ویڈیو لاؤنجز جہاں ہوسٹ اور آٹھ دوست ایک ساتھ گفتگو اور موسیقی سے لطف اندوز ہو سکتے ہیں۔'
        : 'Interactive 9-seat voice and video lounges allowing 1 host and 8 guest speakers to hang out and collaborate.',
    },
    {
      id: 'pk',
      icon: <Swords className="w-7 h-7 text-popo-cyan" />,
      title: isUr ? 'پی کے مقابلے' : 'PK Battles',
      desc: isUr
        ? 'دو ہوسٹس کا آمنے سامنے سنسنی خیز مقابلہ جس میں فین کلبز تحائف کے ذریعے اپنے پسندیدہ ہوسٹ کو جتواتے ہیں۔'
        : 'Intense 1v1 broadcaster showdowns where communities compete in real-time rounds to crown the champion.',
    },
    {
      id: 'gifts',
      icon: <Gift className="w-7 h-7 text-amber-400" />,
      title: isUr ? 'ورچوئل تحائف' : 'Virtual Gifts',
      desc: isUr
        ? 'شاندار تھری ڈی اینیمیٹڈ تحائف اور شفاف ۷۰ فیصد ہوسٹ پوائنٹ کنورژن کے ساتھ حقیقی کری ایٹر آمدنی۔'
        : 'Luxury 3D animated gifts and direct rewards powered by our transparent 70% host point conversion.',
    },
    {
      id: 'social',
      icon: <Heart className="w-7 h-7 text-rose-400" />,
      title: isUr ? 'سوشل رابطے' : 'Social Connections',
      desc: isUr
        ? 'دوستوں کو فالو کریں، پرائیویٹ میسجز میں بات کریں اور ہم خیال شائقین کے ساتھ دیرپا تعلقات قائم کریں۔'
        : 'Follow your favorite creators, chat directly via private messaging, and build lifelong friendships.',
    },
    {
      id: 'creator',
      icon: <Sparkles className="w-7 h-7 text-emerald-400" />,
      title: isUr ? 'کری ایٹر کمیونٹی' : 'Creator Community',
      desc: isUr
        ? 'روزانہ ہوسٹ ٹاسک، اسٹریک بونس، ایجنسی پارٹنرشپس اور آزادانہ کری ایٹر کیریئر بنانے کے بھرپور مواقع۔'
        : 'Daily streamer quests, streak bonuses, verified agency support, and rewarding career pathways.',
    },
  ];

  // Section 7: Safety & Community Standards (5 items)
  const safetyStandards = [
    {
      icon: <Flag className="w-5 h-5 text-popo-pink" />,
      title: isUr ? 'صارفین کی رپورٹنگ' : 'User Reporting',
      desc: isUr
        ? 'ناظرین کسی بھی لائیو روم سے ناپسندیدہ رویے کو ایک کلک میں باآسانی رپورٹ کر سکتے ہیں۔'
        : 'In-room reporting tools allowing viewers and hosts to flag inappropriate behavior instantly.',
    },
    {
      icon: <UserX className="w-5 h-5 text-purple-400" />,
      title: isUr ? 'بلاکنگ اور میوٹ ٹولز' : 'Blocking Tools',
      desc: isUr
        ? 'ہوسٹس اور صارفین اپنے تجربے کو پرسکون رکھنے کے لیے کسی بھی اکاؤنٹ کو فوری بلاک کر سکتے ہیں۔'
        : 'Immediate blocking and muting controls give users full autonomy over who can interact with them.',
    },
    {
      icon: <FileText className="w-5 h-5 text-popo-cyan" />,
      title: isUr ? 'کمیونٹی گائیڈ لائنز' : 'Community Guidelines',
      desc: isUr
        ? 'واضح اور شفاف اصول جو تمام صارفین کو ہراسانی، دھوکہ دہی اور غیر اخلاقی مواد سے بچاتے ہیں۔'
        : 'Clear, transparent standards enforced to protect all participants from harassment and fraud.',
    },
    {
      icon: <Shield className="w-5 h-5 text-emerald-400" />,
      title: isUr ? 'مواد کی مانیٹرنگ' : 'Content Moderation',
      desc: isUr
        ? 'خودکار حفاظتی فلٹرز اور انسانی نگرانوں کی مشترکہ ٹیم جو گائیڈ لائنز کی پاسداری یقینی بناتی ہے۔'
        : 'Automated policy filters paired with trained safety reviewers upholding community rules.',
    },
    {
      icon: <Lock className="w-5 h-5 text-amber-400" />,
      title: isUr ? 'اکاؤنٹ کی حفاظت اور ۱۸+' : 'Account Safety & 18+',
      desc: isUr
        ? 'سخت عمر کی تصدیق اور محفوظ سیشن سیکیورٹی کے ذریعے صارف کا ڈیٹا اور پرائیویسی محفوظ رہتی ہے۔'
        : 'Strict 18+ age verification, secure session tokens, and privacy controls keeping accounts safe.',
    },
  ];

  return (
    <div
      dir={isUr ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-[#0B0E17] text-popo-text-primary overflow-x-hidden selection:bg-popo-pink selection:text-white ${
        isUr ? 'font-urdu' : 'font-sans'
      }`}
    >
      {/* 1. Header (Navbar with active About link) */}
      <Navbar
        lang={lang}
        onToggleLang={toggleLang}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      <main className="flex flex-col">
        {/* =====================================================================
            2. ABOUT HERO SECTION (04_about_us.png)
        ===================================================================== */}
        <section className="relative py-16 md:py-24 overflow-hidden border-b border-white/5">
          {/* Ambient Lighting */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-popo-pink/20 via-purple-600/15 to-transparent blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Text Column */}
              <div className={`lg:col-span-7 flex flex-col gap-5 text-center ${isUr ? 'lg:text-right' : 'lg:text-left'}`}>
                <div className={`inline-flex items-center gap-2 self-center ${isUr ? 'lg:self-end' : 'lg:self-start'}`}>
                  <span className="text-xs font-bold uppercase tracking-widest text-popo-pink px-3.5 py-1.5 rounded-full bg-popo-pink/10 border border-popo-pink/20 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" />
                    {isUr ? 'پوپو لائیو کے بارے میں' : 'About Popo Live'}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                  {isUr ? 'پوپو لائیو' : 'About Popo Live'}
                </h1>

                <p className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-popo-pink via-purple-300 to-amber-300">
                  {isUr ? 'جڑیں • شیئر کریں • اسٹریم کریں • جشن منائیں' : 'Connect. Share. Stream. Celebrate.'}
                </p>

                <p className="text-base sm:text-lg text-popo-text-secondary leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  {isUr
                    ? 'پوپو لائیو ایک لائیو اسٹریمنگ سوشل پلیٹ فارم ہے جہاں لوگ لائیو جا سکتے ہیں، نئے دوست بنا سکتے ہیں، پارٹی رومز جوائن کر سکتے ہیں، پی کے مقابلوں سے لطف اندوز ہو سکتے ہیں اور ایک عالمی برادری کے ساتھ اپنے ہنر کا اشتراک کر سکتے ہیں۔'
                    : 'Popo Live is a social live streaming platform where people can connect with others, join live rooms, share moments and enjoy interactive entertainment.'}
                </p>

                {/* Quick Actions */}
                <div className={`flex flex-wrap items-center justify-center gap-4 pt-2 ${isUr ? 'lg:justify-end' : 'lg:justify-start'}`}>
                  <Link href="/download">
                    <Button variant="primary" size="lg" leftIcon={<Download className="w-5 h-5" />} className="shadow-glow-pink">
                      {isUr ? 'ایپ ڈاؤنلوڈ کریں' : 'Download App'}
                    </Button>
                  </Link>
                  <a href="#features">
                    <Button variant="secondary" size="lg" rightIcon={<ArrowRight className="w-4 h-4 text-popo-pink" />}>
                      {isUr ? 'خصوصیات دیکھیں' : 'Explore Features'}
                    </Button>
                  </a>
                </div>
              </div>

              {/* Visual Column: 3D Floating Isometric Popo Live Badge (04_about_us.png) */}
              <div className="lg:col-span-5 flex justify-center items-center relative">
                <div className="relative w-64 sm:w-80 aspect-square flex items-center justify-center">
                  {/* Outer Ambient Glow Haze */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-popo-pink/30 to-popo-purple/30 blur-3xl rounded-full" />

                  {/* 3D Isometric Tile Badge */}
                  <div className="relative z-10 w-48 sm:w-56 h-48 sm:h-56 rounded-[44px] bg-gradient-to-br from-[#FF1A6C] via-[#9333EA] to-[#4C1D95] p-[3px] shadow-[0_20px_60px_-10px_rgba(255,26,108,0.55)] transform hover:scale-105 transition-transform duration-500 animate-pulse duration-3000">
                    <div className="w-full h-full rounded-[41px] bg-gradient-to-b from-[#131A2B] to-[#0B0E17] flex flex-col items-center justify-center relative overflow-hidden">
                      {/* Glass Glare */}
                      <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

                      {/* Iconic 'P' glyph with play notch */}
                      <span className="text-7xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-pink-100 to-popo-pink select-none drop-shadow-lg">
                        P
                      </span>
                      <div className="absolute bottom-10 right-14 sm:right-16 w-3 h-3 bg-white transform rotate-45 shadow-glow-pink" />
                    </div>
                  </div>

                  {/* Bottom Marker Pill (04_about_us.png) */}
                  <div className="absolute -bottom-4 z-20">
                    <span className="px-5 py-1.5 rounded-full bg-[#8E0B3E] text-white text-xs font-bold tracking-wider shadow-lg">
                      04. About Us
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            3. OUR STORY & 4. OUR MISSION
        ===================================================================== */}
        <section className="py-16 md:py-20 bg-[#0B0E17] relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 3. Our Story Card */}
              <div className={cn('p-8 sm:p-10 rounded-3xl bg-[#131A2B]/80 border border-white/10 flex flex-col justify-between group hover:border-popo-pink/40 transition-all duration-300 shadow-xl', isUr ? 'text-right' : 'text-left')}>
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-popo-pink/15 border border-popo-pink/30 flex items-center justify-center mb-6">
                    <Compass className="w-6 h-6 text-popo-pink" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
                    {isUr ? 'ہماری کہانی' : 'Our Story'}
                  </h2>
                  <p className="text-base text-popo-text-secondary leading-relaxed mb-4">
                    {isUr
                      ? 'پوپو لائیو کا مقصد لوگوں کو لائیو اسٹریمنگ، سماجی تعامل اور ڈیجیٹل تفریح کے ذریعے قریب لانا ہے۔'
                      : 'Popo Live aims to bring people together through live streaming, social interaction and digital entertainment.'}
                  </p>
                  <p className="text-sm text-popo-text-secondary leading-relaxed">
                    {isUr
                      ? 'ہمارا پلیٹ فارم ایسی جگہیں فراہم کرتا ہے جہاں صارفین نئے لوگوں سے مل سکتے ہیں، اپنی صلاحیتوں کا اظہار کر سکتے ہیں اور باوقار برادریاں تشکیل دے سکتے ہیں۔'
                      : 'Our platform provides spaces where users can meet new people, share their talents and build communities.'}
                  </p>
                </div>

                <div className="w-full h-1 bg-white/5 rounded-full mt-8 overflow-hidden">
                  <div className="w-1/3 h-full bg-gradient-to-r from-popo-pink to-purple-500 group-hover:w-full transition-all duration-500" />
                </div>
              </div>

              {/* 4. Our Mission Card */}
              <div className={cn('p-8 sm:p-10 rounded-3xl bg-[#131A2B]/80 border border-white/10 flex flex-col justify-between group hover:border-purple-400/40 transition-all duration-300 shadow-xl', isUr ? 'text-right' : 'text-left')}>
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center mb-6">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
                    {isUr ? 'ہمارا مشن' : 'Our Mission'}
                  </h2>
                  <p className="text-base text-popo-text-secondary leading-relaxed mb-4">
                    {isUr
                      ? 'ہمارا مشن ایک ایسا پُرتپاک اور خیرمقدمی سوشل پلیٹ فارم تخلیق کرنا ہے جہاں لوگ آزادی سے اپنے جذبات کا اظہار کر سکیں، دوسروں سے جڑ سکیں اور براہ راست تفریح سے لطف اندوز ہو سکیں۔'
                      : 'Our mission is to create a welcoming social platform where people can express themselves, connect with others and enjoy live entertainment.'}
                  </p>
                  <p className="text-sm text-popo-text-secondary leading-relaxed">
                    {isUr
                      ? 'ہم باہمی احترام، سچی گفتگو اور تخلیق کاروں کے منصفانہ معاوضے کو اپنی بنیادی اقدار کا حصہ سمجھتے ہیں۔'
                      : 'We prioritize authentic human connections, mutual respect, and transparent creator earnings for all broadcasters.'}
                  </p>
                </div>

                <div className="w-full h-1 bg-white/5 rounded-full mt-8 overflow-hidden">
                  <div className="w-1/3 h-full bg-gradient-to-r from-purple-500 to-popo-cyan group-hover:w-full transition-all duration-500" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            5. OUR PLATFORM FEATURES (6 Cards)
        ===================================================================== */}
        <section id="features" className="py-16 md:py-20 bg-[#0B0E17] relative border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="text-xs font-bold uppercase tracking-widest text-popo-pink px-3.5 py-1.5 rounded-full bg-popo-pink/10 border border-popo-pink/20">
                {isUr ? 'پلیٹ فارم کی خصوصیات' : 'Our Platform Features'}
              </span>
              <h2 className={cn('text-3xl sm:text-4xl font-extrabold text-white mt-4', isUr && 'font-urdu')}>
                {isUr
                  ? 'انٹرایکٹو لائیو تفریح کا مکمل نظام'
                  : 'Everything You Need to Stream, Connect & Celebrate'}
              </h2>
              <p className="text-sm sm:text-base text-popo-text-secondary mt-3">
                {isUr
                  ? 'پوپو لائیو کے چھ اہم فیچرز جو صارفین کو بامعنی تجربات اور تفریح فراہم کرتے ہیں'
                  : 'Six core pillars engineered for joyful interaction, high engagement, and fair creator growth.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {platformFeatures.map((f) => (
                <div
                  key={f.id}
                  className={cn(
                    'p-6 sm:p-7 rounded-3xl bg-[#131A2B]/80 border border-white/10 hover:border-popo-pink/40 transition-all duration-300 hover:-translate-y-1 shadow-lg group',
                    isUr ? 'text-right' : 'text-left'
                  )}
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 group-hover:bg-popo-pink/15 group-hover:border-popo-pink/30 transition-colors">
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-popo-pink transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-sm text-popo-text-secondary leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================================
            6. OUR COMMUNITY SECTION
        ===================================================================== */}
        <section className="py-16 md:py-20 bg-[#0B0E17] relative border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#131A2B] via-popo-dark-900 to-[#131A2B] border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 blur-3xl rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-popo-pink/10 blur-3xl rounded-full pointer-events-none" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                <div className={`lg:col-span-7 flex flex-col gap-4 ${isUr ? 'text-right' : 'text-left'}`}>
                  <span className="text-xs font-bold uppercase tracking-widest text-popo-cyan px-3 py-1 rounded-full bg-popo-cyan/10 border border-popo-cyan/20 w-fit self-start">
                    {isUr ? 'ہماری کمیونٹی' : 'Our Community'}
                  </span>
                  <h2 className={cn('text-2xl sm:text-4xl font-extrabold text-white', isUr && 'font-urdu')}>
                    {isUr ? 'ایک برادری جو لوگوں کو باہم جوڑتی ہے' : 'A Community That Connects People'}
                  </h2>
                  <p className="text-base sm:text-lg text-popo-text-secondary leading-relaxed">
                    {isUr
                      ? 'ہم ایک دوستانہ اور باہمی تعاون پر مبنی کمیونٹی کی حمایت کرتے ہیں جہاں صارفین بات چیت کر سکتے ہیں، اپنے تجربات شیئر کر سکتے ہیں اور ایک ساتھ خوشگوار وقت گزار سکتے ہیں۔'
                      : 'We aim to support a friendly community where users can interact, share experiences and enjoy entertainment together.'}
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <span className="px-3.5 py-1.5 rounded-full bg-black/40 border border-white/10 text-xs font-semibold text-white">
                      🌍 {isUr ? 'عالمی رسائی' : 'Global Diversity'}
                    </span>
                    <span className="px-3.5 py-1.5 rounded-full bg-black/40 border border-white/10 text-xs font-semibold text-white">
                      🤝 {isUr ? 'باہمی احترام' : 'Mutual Respect'}
                    </span>
                    <span className="px-3.5 py-1.5 rounded-full bg-black/40 border border-white/10 text-xs font-semibold text-white">
                      🎙️ {isUr ? 'کھلا پلیٹ فارم' : 'Inclusive Stage'}
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 flex justify-center">
                  <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-center">
                      <span className="text-2xl font-black text-popo-pink block">100%</span>
                      <span className="text-xs text-popo-text-secondary">{isUr ? 'اصلی ہوسٹس' : 'Authentic Talent'}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-center">
                      <span className="text-2xl font-black text-purple-400 block">9-Seat</span>
                      <span className="text-xs text-popo-text-secondary">{isUr ? 'وائس لاؤنجز' : 'Audio Lounges'}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-center">
                      <span className="text-2xl font-black text-amber-400 block">70%</span>
                      <span className="text-xs text-popo-text-secondary">{isUr ? 'ہوسٹ گفٹ شیئر' : 'Host Gift Share'}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-center">
                      <span className="text-2xl font-black text-emerald-400 block">18+</span>
                      <span className="text-xs text-popo-text-secondary">{isUr ? 'محفوظ عمر کی حد' : 'Age Protection'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            7. SAFETY AND COMMUNITY STANDARDS (5 Items)
        ===================================================================== */}
        <section className="py-16 md:py-20 bg-[#0B0E17] relative border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                {isUr ? 'حفاظت اور ضوابط' : 'Safety and Standards'}
              </span>
              <h2 className={cn('text-3xl sm:text-4xl font-extrabold text-white mt-4', isUr && 'font-urdu')}>
                {isUr ? 'حفاظت سب سے پہلے' : 'Safety Comes First'}
              </h2>
              <p className="text-sm sm:text-base text-popo-text-secondary mt-3">
                {isUr
                  ? 'ایک پرامن اور باوقار کمیونٹی کے قیام کے لیے ہمارے حفاظتی ٹولز اور معیارات'
                  : 'Clear and simple safety practices designed to protect users and foster genuine respect.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {safetyStandards.map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'p-6 rounded-2xl bg-[#131A2B]/80 border border-white/10 hover:border-emerald-500/40 transition-all duration-300 flex flex-col gap-3 group',
                    isUr ? 'text-right' : 'text-left'
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/15 group-hover:border-emerald-500/30 transition-colors">
                    {item.icon}
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-popo-text-secondary leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================================
            8. CALL TO ACTION
        ===================================================================== */}
        <section className="py-16 md:py-24 bg-[#0B0E17] relative border-t border-white/5">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-popo-pink/20 via-purple-600/20 to-popo-cyan/20 border border-white/15 shadow-2xl flex flex-col items-center gap-6">
              <h2 className={cn('text-3xl sm:text-5xl font-black text-white tracking-tight', isUr && 'font-urdu')}>
                {isUr ? 'پوپو لائیو کا حصہ بنیں' : 'Be Part of Popo Live'}
              </h2>
              <p className="text-base sm:text-lg text-popo-text-secondary max-w-xl leading-relaxed">
                {isUr
                  ? 'کمیونٹی کا حصہ بنیں اور لائیو اسٹریمنگ، پارٹی رومز اور سوشل تفریح سے لطف اندوز ہوں۔'
                  : 'Join the community and enjoy live streaming, party rooms and social entertainment.'}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <Link href="/download">
                  <Button variant="primary" size="lg" leftIcon={<Download className="w-5 h-5" />} className="shadow-glow-pink">
                    {isUr ? 'ایپ ڈاؤنلوڈ کریں' : 'Download App'}
                  </Button>
                </Link>
                <a href="#features">
                  <Button variant="secondary" size="lg" rightIcon={<ArrowRight className="w-4 h-4 text-popo-pink" />}>
                    {isUr ? 'خصوصیات دیکھیں' : 'Explore Features'}
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 9. Footer (Reused existing footer) */}
      <Footer lang={lang} />

      <AuthModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}
