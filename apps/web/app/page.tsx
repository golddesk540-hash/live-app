'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PoppoHeader } from '@/components/poppo/PoppoHeader';
import { PoppoFooter } from '@/components/poppo/PoppoFooter';
import { useLanguage } from '@/lib/languageContext';
import {
  Download,
  Radio,
  Users,
  Swords,
  Sparkles,
  Heart,
  Gift,
  ShieldCheck,
  Play,
  ArrowRight,
  Flame,
  ChevronRight,
  Camera,
  MessageCircle,
  Apple,
  Globe,
  Trophy,
  CheckCircle2,
  Volume2
} from 'lucide-react';

export default function MarketingHomePage() {
  const { lang, toggleLang, isUr } = useLanguage();
  const [activeGiftTab, setActiveGiftTab] = useState<'vehicles' | 'space' | 'luxury'>('vehicles');
  const [triggeredGiftEffect, setTriggeredGiftEffect] = useState<string | null>(null);

  useEffect(() => {
    if (triggeredGiftEffect) {
      const timer = setTimeout(() => setTriggeredGiftEffect(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [triggeredGiftEffect]);

  const giftItems = {
    vehicles: [
      { name: 'Pink Cyber Car', icon: '🏎️', coins: '10,000 Coins', color: 'from-pink-500 to-rose-500' },
      { name: 'Luxury Yacht', icon: '🛥️', coins: '25,000 Coins', color: 'from-blue-500 to-cyan-500' },
      { name: 'Golden Helicopter', icon: '🚁', coins: '50,000 Coins', color: 'from-amber-400 to-yellow-600' },
    ],
    space: [
      { name: 'Cosmic UFO', icon: '🛸', coins: '18,888 Coins', color: 'from-purple-600 to-indigo-600' },
      { name: 'Galaxy Rocket', icon: '🚀', coins: '38,000 Coins', color: 'from-red-500 to-orange-500' },
      { name: 'Solar Supernova', icon: '🪐', coins: '88,888 Coins', color: 'from-violet-500 to-purple-800' },
    ],
    luxury: [
      { name: 'Diamond Castle', icon: '🏰', coins: '99,999 Coins', color: 'from-indigo-500 to-blue-700' },
      { name: 'Crown of Kings', icon: '👑', coins: '15,000 Coins', color: 'from-yellow-400 to-amber-600' },
      { name: 'Meteor Shower', icon: '🌠', coins: '66,666 Coins', color: 'from-cyan-400 to-blue-600' },
    ],
  };

  return (
    <div
      dir={isUr ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-white text-gray-900 selection:bg-[#5653FE] selection:text-white ${
        isUr ? 'font-urdu' : 'font-sans'
      }`}
    >
      {/* 1. Header with mobile responsive drawer */}
      <PoppoHeader />

      <main className="overflow-hidden">
        
        {/* 2. HERO SECTION (02_marketing_homepage.png: "FROM STRANGERS TO FRIENDS") */}
        <section className="relative pt-6 sm:pt-12 pb-14 sm:pb-24 overflow-hidden bg-gradient-to-b from-[#FAF5FF]/70 via-[#F8F9FF]/40 to-white">
          
          {/* Subtle Ambient Glows */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[340px] sm:w-[720px] h-[300px] sm:h-[360px] bg-gradient-to-r from-purple-200/30 via-pink-200/25 to-blue-200/30 blur-3xl rounded-full" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
              
              {/* Left Column: Hero Text & App Store Downloads */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-center lg:text-left">
                
                {/* Official Community Pill */}
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:py-1.5 rounded-full bg-purple-50 border border-purple-150 text-[#5653FE] text-[11px] sm:text-xs font-semibold shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[#5653FE] animate-live-dot" />
                  <span>{isUr ? 'عالمی ویڈیو لائیو کمیونٹی' : 'Global Video Social Community'}</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-600 font-medium">150+ Countries</span>
                </div>

                {/* Main Heading: Scaled gracefully on small mobile screens */}
                <div className="relative">
                  <h1 className="text-[28px] xs:text-3xl sm:text-4xl md:text-5xl lg:text-[50px] font-extrabold text-gray-950 tracking-[-0.03em] leading-[1.14]">
                    <span>FROM </span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5653FE] via-purple-600 to-pink-500">
                      STRANGERS
                    </span>
                    <br className="inline" />
                    <span> TO </span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-[#5653FE]">
                      FRIENDS
                    </span>
                  </h1>

                  {/* Floating Micro-Animated Emojis */}
                  <div className="absolute -top-3 sm:-top-4 right-1 sm:right-6 lg:right-16 flex items-center gap-1.5 pointer-events-none select-none">
                    <span className="text-xl sm:text-3xl animate-gentle-bob drop-shadow-sm">💖</span>
                    <span className="text-lg sm:text-2xl animate-gentle-bob-delayed drop-shadow-sm">✨</span>
                  </div>
                </div>

                {/* Subtitle */}
                <p className="text-xs sm:text-sm md:text-[15px] text-gray-600 max-w-lg mx-auto lg:mx-0 leading-relaxed font-normal">
                  {isUr
                    ? 'پوپو لائیو پر دنیا بھر کے دوستوں سے جڑیں، ایچ ڈی لائیو سٹریمز دیکھیں، ۹ سیٹوں والے پارٹی رومز میں گفتگو کریں اور شاندار تھری ڈی تحائف سے دوستی کو یادگار بنائیں۔'
                    : 'Go live, meet interesting people worldwide, join lively audio & video party rooms, send stunning 3D virtual gifts, and celebrate friendship every single day.'}
                </p>

                {/* 4 App Store Download Buttons: 2x2 grid on mobile, inline on desktop */}
                <div className="pt-2 space-y-2">
                  <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-400 text-center lg:text-left">
                    {isUr ? 'مفت ایپ ڈاؤن لوڈ کریں:' : 'Get Started On Mobile:'}
                  </div>
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-2.5 max-w-sm sm:max-w-none mx-auto lg:mx-0">
                    {/* iOS */}
                    <Link
                      href="/download"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-950 hover:bg-gray-800 text-white shadow-sm transition-all hover:-translate-y-0.5 active:scale-95 justify-center sm:justify-start"
                    >
                      <Apple className="w-4 h-4 text-white shrink-0" />
                      <div className="text-left">
                        <div className="text-[8px] text-gray-300 leading-none">Download on</div>
                        <div className="text-[11px] sm:text-xs font-bold leading-tight">App Store</div>
                      </div>
                    </Link>

                    {/* Google Play */}
                    <Link
                      href="/download"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-950 hover:bg-gray-800 text-white shadow-sm transition-all hover:-translate-y-0.5 active:scale-95 justify-center sm:justify-start"
                    >
                      <Play className="w-4 h-4 text-emerald-400 fill-emerald-400 shrink-0" />
                      <div className="text-left">
                        <div className="text-[8px] text-gray-300 leading-none">GET IT ON</div>
                        <div className="text-[11px] sm:text-xs font-bold leading-tight">Google Play</div>
                      </div>
                    </Link>

                    {/* Huawei AppGallery */}
                    <Link
                      href="/download"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-950 hover:bg-gray-800 text-white shadow-sm transition-all hover:-translate-y-0.5 active:scale-95 justify-center sm:justify-start"
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-rose-600 flex items-center justify-center text-white text-[8px] font-black shrink-0">
                        H
                      </div>
                      <div className="text-left">
                        <div className="text-[8px] text-gray-300 leading-none">Explore on</div>
                        <div className="text-[11px] sm:text-xs font-bold leading-tight">AppGallery</div>
                      </div>
                    </Link>

                    {/* Direct Android APK */}
                    <Link
                      href="/download"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#5653FE] hover:bg-[#433ffd] text-white shadow-sm shadow-purple-500/20 transition-all hover:-translate-y-0.5 active:scale-95 justify-center sm:justify-start"
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      <div className="text-left">
                        <div className="text-[8px] text-purple-200 leading-none">Android Direct</div>
                        <div className="text-[11px] sm:text-xs font-bold leading-tight">Download APK</div>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Live Stats Indicators: Responsive 3 cols */}
                <div className="pt-3 sm:pt-4 flex items-center justify-around sm:justify-center lg:justify-start gap-4 sm:gap-8 border-t border-gray-150 max-w-sm sm:max-w-md mx-auto lg:mx-0">
                  <div>
                    <div className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight">50M+</div>
                    <div className="text-[10px] sm:text-[11px] text-gray-500 font-medium">{isUr ? 'عالمی صارفین' : 'Global Users'}</div>
                  </div>
                  <div className="w-px h-6 sm:h-8 bg-gray-200" />
                  <div>
                    <div className="text-lg sm:text-2xl font-black text-[#5653FE] tracking-tight">150+</div>
                    <div className="text-[10px] sm:text-[11px] text-gray-500 font-medium">{isUr ? 'ممالک' : 'Countries'}</div>
                  </div>
                  <div className="w-px h-6 sm:h-8 bg-gray-200" />
                  <div>
                    <div className="text-lg sm:text-2xl font-black text-pink-500 tracking-tight">24/7</div>
                    <div className="text-[10px] sm:text-[11px] text-gray-500 font-medium">{isUr ? 'نان سٹاپ لائیو' : 'HD Broadcast'}</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Smartphone Mockup (Scale down on mobile to avoid overflow) */}
              <div className="lg:col-span-5 relative flex justify-center py-2 px-2 sm:px-0">
                
                {/* Subtle Ambient Pulse Backdrop */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#5653FE]/20 via-pink-500/15 to-transparent filter blur-2xl rounded-full transform -rotate-3" />

                {/* Smartphone Device Frame: max 260px on small mobile, 300px on desktop */}
                <div className="relative w-[250px] xs:w-[270px] sm:w-[300px] aspect-[9/19] rounded-[40px] sm:rounded-[44px] bg-gray-950 p-2.5 sm:p-3 shadow-2xl ring-1 ring-black/10 shadow-purple-500/15">
                  
                  {/* Dynamic Island Notch */}
                  <div className="absolute top-4 sm:top-5 left-1/2 -translate-x-1/2 w-20 sm:w-24 h-3.5 sm:h-4 bg-black rounded-full z-30 flex items-center justify-center">
                    <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-gray-800 mr-2" />
                    <div className="w-5 sm:w-6 h-1 bg-gray-800 rounded-full" />
                  </div>

                  {/* Phone Screen Canvas */}
                  <div className="relative w-full h-full rounded-[30px] sm:rounded-[34px] overflow-hidden bg-gray-900 text-white flex flex-col justify-between">
                    
                    {/* Live Stream Background Photo */}
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80"
                      alt="Host Live"
                      className="absolute inset-0 w-full h-full object-cover filter brightness-95"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/50 pointer-events-none" />

                    {/* In-App Header */}
                    <div className="relative z-10 pt-6 sm:pt-7 px-3 sm:px-3.5 flex items-center justify-between">
                      {/* Host Tag with live ring */}
                      <div className="flex items-center gap-1.5 sm:gap-2 bg-black/45 backdrop-blur-md px-2 py-0.5 sm:py-1 rounded-full border border-white/15">
                        <div className="relative w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden border border-purple-400">
                          <img
                            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&auto=format&fit=crop&q=80"
                            alt="Host"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-left">
                          <div className="text-[9px] sm:text-[10px] font-bold leading-none">Bella ✨</div>
                          <div className="text-[7px] sm:text-[8px] text-yellow-300 font-mono">★ Lv.38</div>
                        </div>
                        <button className="px-1.5 sm:px-2 py-0.5 rounded-full bg-[#5653FE] text-[8px] sm:text-[9px] font-bold hover:bg-[#433ffd]">
                          + Follow
                        </button>
                      </div>

                      {/* Equalizer Audio Waves & Live Viewers */}
                      <div className="px-2 py-0.5 rounded-full bg-black/45 backdrop-blur-md text-[9px] sm:text-[10px] font-bold text-white flex items-center gap-1 border border-white/15">
                        <div className="flex items-center gap-0.5 h-2.5 sm:h-3">
                          <span className="w-0.5 bg-[#5653FE] animate-wave-bar-1" />
                          <span className="w-0.5 bg-pink-400 animate-wave-bar-2" />
                          <span className="w-0.5 bg-yellow-400 animate-wave-bar-3" />
                        </div>
                        <span>14.2K</span>
                      </div>
                    </div>

                    {/* Animated Gift Banner Trigger */}
                    <div className="relative z-10 px-2.5 sm:px-3 py-1">
                      <div className="bg-gradient-to-r from-pink-600/90 to-purple-600/90 backdrop-blur-md rounded-xl p-1.5 sm:p-2 flex items-center gap-2 border border-pink-400/30 shadow-md">
                        <div className="text-xl sm:text-2xl animate-bounce">🏎️</div>
                        <div className="text-left leading-tight">
                          <div className="text-[8px] sm:text-[9px] text-pink-200">Alex_King sent</div>
                          <div className="text-[10px] sm:text-[11px] font-bold text-white">Pink Cyber Supercar! 💥</div>
                        </div>
                      </div>
                    </div>

                    {/* In-App Live Chat Feed */}
                    <div className="relative z-10 p-2.5 sm:p-3 space-y-1 sm:space-y-1.5">
                      <div className="space-y-1 text-[9px] sm:text-[10px]">
                        <div className="px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md max-w-[85%] text-left">
                          <span className="text-yellow-400 font-bold">Sam: </span>
                          <span>Sing that new melody! 🎶</span>
                        </div>
                        <div className="px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md max-w-[85%] text-left">
                          <span className="text-cyan-300 font-bold">Farhan: </span>
                          <span>Love from Pakistan! 🇵🇰❤️</span>
                        </div>
                        <div className="px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md max-w-[85%] text-left">
                          <span className="text-rose-400 font-bold">Lily: </span>
                          <span>Let’s win this PK match!! 🔥</span>
                        </div>
                      </div>

                      {/* Interactive Bottom Gift Bar */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex-1 bg-white/20 backdrop-blur-md rounded-full px-2.5 py-1 text-[9px] sm:text-[10px] text-gray-200 text-left mr-1.5">
                          Say something...
                        </div>
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] sm:text-xs shadow-sm hover:scale-110 transition-transform">
                            ❤️
                          </div>
                          <Link
                            href="/recharge"
                            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-400 text-gray-950 flex items-center justify-center text-[10px] sm:text-xs shadow-sm hover:scale-110 transition-transform font-bold"
                          >
                            🎁
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Micro Badges: Hide on very small screens, show on md+ */}
                <div className="hidden md:flex absolute -bottom-3 -left-4 bg-white/95 backdrop-blur-md p-2.5 rounded-2xl shadow-xl border border-gray-150 items-center gap-2 animate-gentle-bob">
                  <div className="w-7 h-7 rounded-xl bg-purple-100 flex items-center justify-center text-[#5653FE]">
                    <Swords className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-gray-900 leading-none">PK Battles Live</div>
                    <div className="text-[9px] text-gray-500 mt-0.5">Real-time 1v1 Arena</div>
                  </div>
                </div>

                <div className="hidden md:flex absolute -top-3 -right-3 bg-white/95 backdrop-blur-md p-2.5 rounded-2xl shadow-xl border border-gray-150 items-center gap-2 animate-gentle-bob-delayed">
                  <div className="w-7 h-7 rounded-xl bg-rose-100 flex items-center justify-center text-rose-500">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-gray-900 leading-none">Party Rooms</div>
                    <div className="text-[9px] text-gray-500 mt-0.5">9-Seat Audio Lounges</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 3. SECTION 1: "EVERY STREAM TELLS A STORY" (02_marketing_homepage.png) */}
        <section className="py-14 sm:py-20 bg-[#F9FAFC] border-y border-gray-150">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Section Header */}
            <div className="text-center max-w-xl mx-auto mb-10 sm:mb-12">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#5653FE] uppercase tracking-wider bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                {isUr ? 'پوپو لائیو خصوصیات' : 'Core Experiences'}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-[34px] font-bold text-gray-950 mt-2 tracking-tight">
                {isUr ? 'ہر سٹریم کی ایک کہانی ہے' : 'Every Stream Tells A Story'}
              </h2>
              <p className="text-gray-500 mt-2 text-xs sm:text-sm leading-relaxed px-2">
                {isUr
                  ? 'دنیا بھر کے باصلاحیت ہوسٹس سے جڑیں، پارٹی رومز میں تفریح کریں اور اپنے لمحات شیئر کریں۔'
                  : 'Connect with authentic creators, showcase your talent, and immerse yourself in real-time entertainment.'}
              </p>
            </div>

            {/* 3 Feature Cards: 1 col on mobile, 3 on md+ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 max-w-sm sm:max-w-none mx-auto">
              
              {/* Card 1: Live Buzz */}
              <div className="group bg-white rounded-3xl p-5 sm:p-7 border border-gray-200/80 hover:border-[#5653FE]/40 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
                <div>
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-purple-50 text-[#5653FE] flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-105 transition-transform">
                    <Radio className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 group-hover:text-[#5653FE] transition-colors">
                    {isUr ? 'لائیو بز (Live Buzz)' : 'Live Buzz'}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-gray-500 leading-relaxed mb-4 sm:mb-5">
                    {isUr
                      ? 'چوبیس گھنٹے نان سٹاپ ایچ ڈی لائیو سٹریمنگ۔ گلوکاری، رقص، اور دلچسپ گفتگو کے ہزاروں لائیو رومز۔'
                      : '24/7 non-stop high-definition streaming. Discover dancers, singers, comedians, and storytellers worldwide.'}
                  </p>
                </div>
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-gray-100">
                  <img
                    src="https://images.unsplash.com/photo-1516726817505-f5ed825624d8?w=600&auto=format&fit=crop&q=80"
                    alt="Live Buzz"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-live-dot" />
                    <span>HD Live</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Spark Gifts */}
              <div className="group bg-white rounded-3xl p-5 sm:p-7 border border-gray-200/80 hover:border-[#5653FE]/40 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
                <div>
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 group-hover:text-pink-600 transition-colors">
                    {isUr ? 'سپارک گفٹس (Spark Gifts)' : 'Spark Gifts'}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-gray-500 leading-relaxed mb-4 sm:mb-5">
                    {isUr
                      ? 'شاندار تھری ڈی اینیمیشنز والے تحائف جیسے کہ سپر کارز، راکٹس اور ہیروں کے محلات جو پوری سکرین پر چمکتے ہیں۔'
                      : 'Send full-screen 3D animations: cyber sports cars, galaxy rockets, and diamond castles that light up rooms.'}
                  </p>
                </div>
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-gray-100">
                  <img
                    src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80"
                    alt="Spark Gifts"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5">
                    <span>🎁 3D Special FX</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Vlog & Square */}
              <div className="group bg-white rounded-3xl p-5 sm:p-7 border border-gray-200/80 hover:border-[#5653FE]/40 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
                <div>
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-105 transition-transform">
                    <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 group-hover:text-blue-600 transition-colors">
                    {isUr ? 'ولاگ اور اسکوائر (Vlog & Square)' : 'Vlog & Square'}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-gray-500 leading-relaxed mb-4 sm:mb-5">
                    {isUr
                      ? 'اپنی روزمرہ زندگی کی تصاویر اور ویڈیوز کمیونٹی فیڈ میں شیئر کریں اور اپنے وفادار مداح بنائیں۔'
                      : 'Share your daily highlights, lifestyle pictures, and clips in the community feed to grow your fan base.'}
                  </p>
                </div>
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-gray-100">
                  <img
                    src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&auto=format&fit=crop&q=80"
                    alt="Vlog & Square"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5">
                    <span>📸 Daily Moments</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 4. SECTION 2: "PARTY & PK" DUAL ANGLED SMARTPHONES (Responsive Scaled Container) */}
        <section className="py-16 sm:py-20 bg-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              
              {/* Left Column: Visual Mockup Showcase (Scaled on mobile) */}
              <div className="lg:col-span-6 relative flex items-center justify-center px-2">
                <div className="relative w-full max-w-[320px] sm:max-w-sm h-[380px] sm:h-[440px]">
                  
                  {/* Phone 1: 9-Seat Party Room */}
                  <div className="absolute left-0 top-2 sm:top-4 w-[190px] sm:w-[240px] aspect-[9/18] rounded-3xl bg-gray-950 p-2 sm:p-2.5 shadow-2xl transform -rotate-6 hover:rotate-0 transition-transform duration-300 z-10 border border-purple-500/30">
                    <div className="w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-purple-900 to-indigo-950 p-2 sm:p-3 text-white flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-bold">
                        <span className="flex items-center gap-1 text-purple-300">
                          <Users className="w-3 h-3" /> Party (9/9)
                        </span>
                        <span className="text-emerald-400">● Live</span>
                      </div>
                      
                      {/* 9-Seat Grid */}
                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 my-auto">
                        {['🎤', '🎵', '✨', '👑', '🎧', '🎸', '🌟', '💖', '🔥'].map((emoji, i) => (
                          <div key={i} className="flex flex-col items-center">
                            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/20 border border-purple-400/40 flex items-center justify-center text-[10px] sm:text-xs">
                              {emoji}
                            </div>
                            <span className="text-[7px] sm:text-[8px] text-gray-300 mt-0.5">Seat {i + 1}</span>
                          </div>
                        ))}
                      </div>

                      <div className="text-[8px] sm:text-[9px] bg-white/10 rounded-lg py-1 text-center font-medium">
                        Audio Chat & Games
                      </div>
                    </div>
                  </div>

                  {/* Phone 2: 1v1 PK Arena Battle */}
                  <div className="absolute right-0 bottom-2 sm:bottom-4 w-[190px] sm:w-[240px] aspect-[9/18] rounded-3xl bg-gray-950 p-2 sm:p-2.5 shadow-2xl transform rotate-6 hover:rotate-0 transition-transform duration-300 z-20 border border-rose-500/30">
                    <div className="w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-gray-900 to-black p-2 sm:p-3 text-white flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-bold">
                        <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-black text-[8px] sm:text-[9px]">PK BATTLE</span>
                        <span className="text-amber-400 font-mono text-[8px] sm:text-[9px]">01:45</span>
                      </div>

                      {/* Split PK Screen */}
                      <div className="my-auto space-y-1.5 sm:space-y-2">
                        <div className="grid grid-cols-2 gap-1 sm:gap-1.5 h-20 sm:h-24">
                          <div className="bg-blue-600/30 rounded-lg border border-blue-500/40 p-1 flex flex-col justify-between items-center text-center">
                            <span className="text-[7px] sm:text-[8px] text-blue-300 font-bold">Team Red</span>
                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-500 text-white text-[9px] sm:text-[10px] flex items-center justify-center">👤</div>
                            <span className="text-[8px] sm:text-[9px] font-black text-blue-400">12,450</span>
                          </div>
                          <div className="bg-rose-600/30 rounded-lg border border-rose-500/40 p-1 flex flex-col justify-between items-center text-center">
                            <span className="text-[7px] sm:text-[8px] text-rose-300 font-bold">Team Blue</span>
                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-rose-500 text-white text-[9px] sm:text-[10px] flex items-center justify-center">👤</div>
                            <span className="text-[8px] sm:text-[9px] font-black text-rose-400">15,890</span>
                          </div>
                        </div>

                        {/* VS Progress Bar */}
                        <div className="w-full h-1.5 rounded-full bg-gray-800 overflow-hidden flex">
                          <div className="w-[45%] bg-blue-500 h-full" />
                          <div className="w-[55%] bg-rose-500 h-full" />
                        </div>
                      </div>

                      <div className="text-[8px] sm:text-[9px] bg-rose-600/80 rounded-lg py-1 text-center font-bold">
                        Support Your Favorite Host!
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Copy & Details */}
              <div className="lg:col-span-6 space-y-4 sm:space-y-5 text-center lg:text-left">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#5653FE] uppercase tracking-wider bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                  {isUr ? 'پارٹی اور مقابلہ' : 'Party & Competitive PK'}
                </span>
                
                <h2 className="text-2xl sm:text-3xl md:text-[34px] font-bold text-gray-950 tracking-tight leading-tight">
                  {isUr ? 'پارٹی رومز اور سنسنی خیز پی کے مقابلے' : 'Party Rooms & Thrilling PK Battles'}
                </h2>

                <p className="text-xs sm:text-sm md:text-[15px] text-gray-600 leading-relaxed font-normal max-w-xl mx-auto lg:mx-0">
                  {isUr
                    ? 'ایک ہی وقت میں ۹ دوستوں کے ساتھ مل کر آڈیو یا ویڈیو پارٹی روم بنائیں، لڈو اور تفریحی گیمز کھیلیں، یا اپنے پسندیدہ ہوسٹ کو پی کے مقابلے میں فاتح بنانے کے لیے گفٹس بھیجیں۔'
                    : 'Jump into interactive multi-guest party rooms to sing karaoke, play community games, or turn up the excitement in live 1v1 PK battles where fans rally together to crown their champion.'}
                </p>

                <div className="space-y-3 pt-1 text-left">
                  <div className="flex items-start gap-3 bg-gray-50/60 p-3 rounded-2xl border border-gray-100">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-100 text-[#5653FE] flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                        {isUr ? '۹ سیٹوں والے پارٹی رومز' : '9-Seat Interactive Party Lounges'}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                        {isUr
                          ? 'دوستوں کے ساتھ فری مائیک پر گپ شپ، ہنسی مذاق اور گروپ تفریح۔'
                          : 'Host private or public hangouts, chat with crystal clear HD audio, and make friends.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-gray-50/60 p-3 rounded-2xl border border-gray-100">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                      <Swords className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                        {isUr ? 'لائیو 1v1 اور ٹیم پی کے' : 'Live 1v1 & Team PK Arena'}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                        {isUr
                          ? 'دو ہوسٹس کے درمیان سخت مقابلہ، شائقین کے ووٹ اور مضحکہ خیز سزائیں۔'
                          : 'Streamers face off in high stakes battles with fun penalties and real-time score gauges.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/live"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#5653FE] hover:bg-[#433ffd] text-white font-bold text-xs sm:text-sm shadow-sm transition-all hover:scale-105"
                  >
                    <span>{isUr ? 'ابھی لائیو دیکھیں' : 'Explore Live Streams'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 5. SECTION 3: "EXPRESS YOUR STYLE" (02_marketing_homepage.png: 3D GIFTS) */}
        <section className="py-14 sm:py-20 bg-gradient-to-b from-[#FAFAFC] to-white border-t border-gray-150">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#5653FE] uppercase tracking-wider bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                {isUr ? 'ورچوئل گفٹس کلیکشن' : 'Next-Gen 3D Gifts'}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-[34px] font-bold text-gray-950 mt-2 tracking-tight">
                {isUr ? 'اپنے انداز اور محبت کا اظہار کریں' : 'Express Your Style'}
              </h2>
              <p className="text-gray-500 mt-2 text-xs sm:text-sm leading-relaxed px-2">
                {isUr
                  ? 'شاندار اینیمیٹڈ تھری ڈی ورچوئل گفٹس کے ذریعے اپنے پسندیدہ تخلیق کاروں کو سراہیں۔'
                  : 'Stunning 3D effects, luxury supercars, cosmic spacecraft, and magnificent castles that make you unforgettable.'}
              </p>

              {/* Gift Categories Tab: Horizontal swipeable on mobile */}
              <div className="flex items-center justify-center gap-2 mt-5 overflow-x-auto pb-1">
                {[
                  { id: 'vehicles', label: isUr ? 'سپر کارز' : '🏎️ Supercars' },
                  { id: 'space', label: isUr ? 'خلائی کہکشائیں' : '🚀 Space & UFO' },
                  { id: 'luxury', label: isUr ? 'شاہی محلات' : '👑 Royal Castles' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveGiftTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                      activeGiftTab === tab.id
                        ? 'bg-[#5653FE] text-white shadow-sm'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Gift Showcase Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 max-w-3xl mx-auto">
              {giftItems[activeGiftTab].map((gift) => (
                <div
                  key={gift.name}
                  className="bg-white rounded-3xl p-5 border border-gray-200/80 hover:border-[#5653FE]/50 hover:shadow-lg transition-all text-center flex flex-col items-center justify-between group hover:-translate-y-1"
                >
                  <div
                    className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr ${gift.color} flex items-center justify-center text-3xl sm:text-4xl mb-3 group-hover:scale-110 transition-transform shadow-md`}
                  >
                    {gift.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{gift.name}</h4>
                    <p className="text-xs font-semibold text-[#5653FE] mt-0.5">{gift.coins}</p>
                  </div>
                  <Link
                    href="/recharge"
                    className="mt-3.5 w-full py-1.5 rounded-xl bg-gray-50 group-hover:bg-[#5653FE] group-hover:text-white text-gray-700 text-xs font-bold transition-colors"
                  >
                    {isUr ? 'کوائنز حاصل کریں' : 'Get Coins To Send'}
                  </Link>
                </div>
              ))}
            </div>

            {/* Coin Top Up CTA Banner */}
            <div className="mt-8 sm:mt-10 max-w-2xl mx-auto bg-gradient-to-r from-[#5653FE] to-indigo-700 rounded-3xl p-5 sm:p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-purple-500/15">
              <div className="text-center sm:text-left">
                <h3 className="text-base sm:text-xl font-bold">
                  {isUr ? 'سرکاری ویب سائٹ سے کوائنز ریچارج کریں' : 'Top Up Coins With Zero Extra Fees'}
                </h3>
                <p className="text-xs text-purple-100 mt-0.5">
                  {isUr ? 'فوری ڈلیوری اور بہترین رعایتی بنڈلز' : 'Official Poppo recharge portal with instant balance credit.'}
                </p>
              </div>
              <Link
                href="/recharge"
                className="w-full sm:w-auto text-center px-5 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-xs shrink-0 shadow-sm transition-transform hover:scale-105"
              >
                {isUr ? 'ابھی ریچارج کریں' : 'Go To Recharge →'}
              </Link>
            </div>
          </div>
        </section>

        {/* 6. SECTION 4: TRUST & 18+ CHILD PROTECTION BANNER */}
        <section className="py-10 sm:py-12 bg-white border-t border-gray-150">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6">
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gray-50 border border-gray-150">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 font-black text-base">
                  18+
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">
                    {isUr ? 'عمر کی سخت پابندی' : 'Strict 18+ Age Restriction'}
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {isUr ? 'نابالغوں کا داخلہ سختی سے ممنوع ہے۔' : 'Zero tolerance policy for underage usage.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gray-50 border border-gray-150">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">
                    {isUr ? '24/7 سیکیورٹی مانیٹرنگ' : '24/7 Security Monitoring'}
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {isUr ? 'جدید ترین AI اور انسانی معائنہ کار۔' : 'Real-time AI filtration and live moderation.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gray-50 border border-gray-150">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">
                    {isUr ? 'عالمی کمیونٹی قواعد' : 'Global Community Guidelines'}
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {isUr ? 'سب کے لیے محفوظ اور باوقار ماحول۔' : 'Respectful and supportive space for everyone.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* 7. Authentic Poppo Footer */}
      <PoppoFooter />
    </div>
  );
}
