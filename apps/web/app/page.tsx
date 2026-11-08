'use client';

import React, { useState } from 'react';
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
  Globe
} from 'lucide-react';

export default function MarketingHomePage() {
  const { lang, toggleLang, isUr } = useLanguage();
  const [activeGiftTab, setActiveGiftTab] = useState<'vehicles' | 'space' | 'luxury'>('vehicles');

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
      {/* 1. Authentic Poppo Header */}
      <PoppoHeader />

      <main className="overflow-hidden">
        {/* 2. HERO SECTION (02_marketing_homepage.png: "FROM STRANGERS TO FRIENDS") */}
        <section className="relative pt-12 sm:pt-20 pb-20 sm:pb-28 overflow-hidden bg-gradient-to-b from-purple-50/50 via-white to-white">
          {/* Ambient Colorful Background Glows */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-purple-200/40 via-pink-200/40 to-blue-200/40 blur-3xl rounded-full" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* Left Column: Hero Text & Downloads */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100/70 border border-purple-200/60 text-[#5653FE] text-xs sm:text-sm font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#5653FE] animate-ping" />
                  <span>{isUr ? 'دنیا کا سب سے متحرک ویڈیو لائیو کمیونٹی' : 'Global Video Social Live Community'}</span>
                </div>

                {/* Main Authentic Heading */}
                <h1 className="text-4xl sm:text-6xl xl:text-7xl font-black text-gray-950 tracking-tight leading-[1.08]">
                  <span>FROM </span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5653FE] via-purple-600 to-pink-500">
                    STRANGERS
                  </span>
                  <br />
                  <span>TO </span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-[#5653FE]">
                    FRIENDS
                  </span>
                  {/* Floating 3D Emojis */}
                  <span className="inline-block ml-3 animate-bounce text-3xl sm:text-5xl">💖</span>
                  <span className="inline-block ml-2 text-3xl sm:text-5xl">✨</span>
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  {isUr
                    ? 'پوپو لائیو پر دنیا بھر کے دلچسپ لوگوں سے ملیں، ہائی ڈیفینیشن لائیو سٹریمز دیکھیں، 9 سیٹوں والے پارٹی رومز میں بات کریں، اور جادوئی ورچوئل تحائف سے دوستی کو یادگار بنائیں۔'
                    : 'Go live, meet interesting people worldwide, join lively audio & video party rooms, send stunning 3D virtual gifts, and celebrate friendship every single day.'}
                </p>

                {/* 4 App Store Download Buttons (Matching Screenshot) */}
                <div className="pt-4 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400 text-center lg:text-left">
                    {isUr ? 'مفت ڈاؤن لوڈ کریں:' : 'Available For All Devices:'}
                  </div>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                    {/* iOS */}
                    <Link
                      href="/download"
                      className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gray-950 hover:bg-gray-800 text-white shadow-md transition-all hover:scale-105"
                    >
                      <Apple className="w-5 h-5 text-white" />
                      <div className="text-left">
                        <div className="text-[10px] text-gray-300 leading-none">Download on</div>
                        <div className="text-xs font-bold leading-tight">App Store</div>
                      </div>
                    </Link>

                    {/* Google Play */}
                    <Link
                      href="/download"
                      className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gray-950 hover:bg-gray-800 text-white shadow-md transition-all hover:scale-105"
                    >
                      <Play className="w-5 h-5 text-emerald-400 fill-emerald-400" />
                      <div className="text-left">
                        <div className="text-[10px] text-gray-300 leading-none">GET IT ON</div>
                        <div className="text-xs font-bold leading-tight">Google Play</div>
                      </div>
                    </Link>

                    {/* Huawei AppGallery */}
                    <Link
                      href="/download"
                      className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gray-950 hover:bg-gray-800 text-white shadow-md transition-all hover:scale-105"
                    >
                      <div className="w-5 h-5 rounded-full bg-rose-600 flex items-center justify-center text-white text-[10px] font-black">
                        H
                      </div>
                      <div className="text-left">
                        <div className="text-[10px] text-gray-300 leading-none">Explore on</div>
                        <div className="text-xs font-bold leading-tight">AppGallery</div>
                      </div>
                    </Link>

                    {/* Direct Android APK */}
                    <Link
                      href="/download"
                      className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#5653FE] hover:bg-[#433ffd] text-white shadow-md shadow-purple-500/20 transition-all hover:scale-105"
                    >
                      <Download className="w-5 h-5" />
                      <div className="text-left">
                        <div className="text-[10px] text-purple-200 leading-none">Android Direct</div>
                        <div className="text-xs font-bold leading-tight">Download APK</div>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Live Stats Row */}
                <div className="pt-6 grid grid-cols-3 gap-4 border-t border-gray-150 max-w-lg mx-auto lg:mx-0">
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-gray-900">50M+</div>
                    <div className="text-xs text-gray-500 font-medium">{isUr ? 'عالمی صارفین' : 'Global Users'}</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-[#5653FE]">150+</div>
                    <div className="text-xs text-gray-500 font-medium">{isUr ? 'ممالک' : 'Countries'}</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-pink-500">24/7</div>
                    <div className="text-xs text-gray-500 font-medium">{isUr ? 'لائیو نشریات' : 'Non-Stop Live'}</div>
                  </div>
                </div>
              </div>

              {/* Right Column: 3D Angled Smartphone Mockup with Live Broadcast UI */}
              <div className="lg:col-span-5 relative flex justify-center">
                {/* Glowing Aura */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#5653FE]/30 to-pink-500/30 filter blur-3xl rounded-full transform -rotate-6" />

                {/* Smartphone Device Shell */}
                <div className="relative w-[300px] sm:w-[340px] aspect-[9/19] rounded-[48px] bg-gray-950 p-3.5 shadow-2xl ring-1 ring-black/10 shadow-purple-500/20">
                  {/* Speaker & Camera Notch */}
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-gray-800 mr-2" />
                    <div className="w-8 h-1 bg-gray-800 rounded-full" />
                  </div>

                  {/* Phone Screen Canvas */}
                  <div className="relative w-full h-full rounded-[38px] overflow-hidden bg-gray-900 text-white flex flex-col justify-between">
                    {/* Live Stream Background Video Simulation */}
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80"
                      alt="Host Live"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60" />

                    {/* In-App Header */}
                    <div className="relative z-10 pt-8 px-4 flex items-center justify-between">
                      {/* Host Tag */}
                      <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                        <div className="w-7 h-7 rounded-full bg-purple-500 overflow-hidden">
                          <img
                            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80"
                            alt="Host"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-left">
                          <div className="text-[11px] font-bold leading-none">Bella ✨</div>
                          <div className="text-[9px] text-yellow-300">★ Lv.38</div>
                        </div>
                        <button className="px-2 py-0.5 rounded-full bg-[#5653FE] text-[10px] font-bold">
                          + Follow
                        </button>
                      </div>

                      {/* Live Viewers */}
                      <div className="px-2 py-1 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                        <span>14.2K</span>
                      </div>
                    </div>

                    {/* Floating Gift Animation (Pink Supercar or Rocket) */}
                    <div className="relative z-10 px-4 py-2">
                      <div className="animate-pulse bg-gradient-to-r from-pink-600/90 to-purple-600/90 backdrop-blur-md rounded-2xl p-2.5 flex items-center gap-3 border border-pink-400/30 shadow-lg">
                        <div className="text-3xl animate-bounce">🏎️</div>
                        <div className="text-left">
                          <div className="text-[10px] text-pink-200">Alex_King sent</div>
                          <div className="text-xs font-black text-white">Pink Cyber Supercar! 💥</div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Chat and Stream Interactions */}
                    <div className="relative z-10 p-4 space-y-2">
                      {/* Chat Bubbles */}
                      <div className="space-y-1.5 text-[11px]">
                        <div className="px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md max-w-[85%] text-left">
                          <span className="text-yellow-400 font-bold">Sam: </span>
                          <span>Sing that new melody! 🎶</span>
                        </div>
                        <div className="px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md max-w-[85%] text-left">
                          <span className="text-cyan-300 font-bold">Farhan: </span>
                          <span>Love from Pakistan! 🇵🇰❤️</span>
                        </div>
                        <div className="px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md max-w-[85%] text-left">
                          <span className="text-rose-400 font-bold">Lily: </span>
                          <span>Let’s win this PK match!! 🔥🔥</span>
                        </div>
                      </div>

                      {/* Bottom Controls */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex-1 bg-white/20 backdrop-blur-md rounded-full px-3 py-1.5 text-[11px] text-gray-200 text-left mr-2">
                          Say something...
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center text-sm shadow-md">
                            ❤️
                          </div>
                          <div className="w-8 h-8 rounded-full bg-amber-400 text-gray-900 flex items-center justify-center text-sm shadow-md">
                            🎁
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Decorative Badges */}
                <div className="hidden sm:flex absolute -bottom-6 -left-6 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-gray-150 items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-[#5653FE]">
                    <Swords className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-gray-900">PK Battles Live</div>
                    <div className="text-[10px] text-gray-500">1v1 Real-Time Challenges</div>
                  </div>
                </div>

                <div className="hidden sm:flex absolute -top-4 -right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-gray-150 items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-500">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-gray-900">Party Rooms</div>
                    <div className="text-[10px] text-gray-500">9-Guest Audio Lounges</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 3. SECTION 1: "EVERY STREAM TELLS A STORY" (02_marketing_homepage.png) */}
        <section className="py-20 bg-[#F8F9FA] border-y border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold text-[#5653FE] uppercase tracking-wider bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                {isUr ? 'پوپو لائیو خصوصیات' : 'Core Experiences'}
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-950 mt-3 tracking-tight">
                {isUr ? 'ہر سٹریم کی ایک کہانی ہے' : 'Every Stream Tells A Story'}
              </h2>
              <p className="text-gray-600 mt-3 text-sm sm:text-base">
                {isUr
                  ? 'دنیا بھر کے ٹیلنٹڈ تخلیق کاروں سے جڑیں، پارٹی رومز میں تفریح کریں اور اپنے لمحات شیئر کریں۔'
                  : 'Discover authentic creators, unleash your inner talent, and immerse yourself in real-time social entertainment.'}
              </p>
            </div>

            {/* 3 Prominent Feature Cards (Matching Screenshot) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Card 1: Live Buzz */}
              <div className="group bg-white rounded-3xl p-8 border border-gray-200 hover:border-[#5653FE]/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-purple-100 text-[#5653FE] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Radio className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {isUr ? 'لائیو بز (Live Buzz)' : 'Live Buzz'}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-6">
                    {isUr
                      ? 'چوبیس گھنٹے نان سٹاپ لائیو سٹریمنگ۔ گلوکاری، رقص، بات چیت اور مزاح کے ہزاروں لائیو رومز میں شرکت کریں۔'
                      : '24/7 non-stop high definition streaming. Connect instantly with singers, dancers, comedians, and talk-show hosts globally.'}
                  </p>
                </div>
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-gray-100">
                  <img
                    src="https://images.unsplash.com/photo-1516726817505-f5ed825624d8?w=600&auto=format&fit=crop&q=80"
                    alt="Live Buzz"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    <span>HD Live</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Spark Gifts */}
              <div className="group bg-white rounded-3xl p-8 border border-gray-200 hover:border-[#5653FE]/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {isUr ? 'سپارک گفٹس (Spark Gifts)' : 'Spark Gifts'}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-6">
                    {isUr
                      ? 'شاندار تھری ڈی اینیمیشنز والے تحائف بھیجیں جیسے کہ سپر کارز، راکٹس اور ہیروں کے محلات جو پوری سکرین پر چمکتے ہیں۔'
                      : 'Express true appreciation with full-screen 3D effects, luxury supercars, cosmic space fleets, and fireworks.'}
                  </p>
                </div>
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-gray-100">
                  <img
                    src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80"
                    alt="Spark Gifts"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5">
                    <span>🎁 3D Special FX</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Vlog & Square */}
              <div className="group bg-white rounded-3xl p-8 border border-gray-200 hover:border-[#5653FE]/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Camera className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {isUr ? 'ولاگ اور اسکوائر (Vlog & Square)' : 'Vlog & Square'}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-6">
                    {isUr
                      ? 'اپنی روزمرہ کی زندگی، تصاویر اور ویڈیوز کمیونٹی فیڈ میں شیئر کریں اور نئے فالوورز اور مداح بنائیں۔'
                      : 'Share your everyday moments, short video clips, and lifestyle photos to build an engaged personal fan club.'}
                  </p>
                </div>
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-gray-100">
                  <img
                    src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&auto=format&fit=crop&q=80"
                    alt="Vlog & Square"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5">
                    <span>📸 Daily Moments</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 4. SECTION 2: "PARTY & PK" DUAL ANGLED SMARTPHONES (02_marketing_homepage.png) */}
        <section className="py-24 bg-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Column: Visual Mockup Showcase */}
              <div className="lg:col-span-6 relative flex items-center justify-center">
                <div className="relative w-full max-w-md h-[480px]">
                  {/* Phone 1: 9-Seat Party Room */}
                  <div className="absolute left-0 top-6 w-[240px] sm:w-[270px] aspect-[9/18] rounded-3xl bg-gray-950 p-2.5 shadow-2xl transform -rotate-6 hover:rotate-0 transition-transform duration-300 z-10 border border-purple-500/30">
                    <div className="w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-purple-900 to-indigo-950 p-3 text-white flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="flex items-center gap-1 text-purple-300">
                          <Users className="w-3 h-3" /> Party Room (9/9)
                        </span>
                        <span className="text-emerald-400">● Live Audio</span>
                      </div>
                      
                      {/* 9-Seat Grid */}
                      <div className="grid grid-cols-3 gap-2 my-auto">
                        {Array.from({ length: 9 }).map((_, i) => (
                          <div key={i} className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-white/20 border border-purple-400/40 p-0.5 flex items-center justify-center">
                              <span className="text-xs">{['🎤', '🎵', '✨', '👑', '🎧', '🎸', '🌟', '💖', '🔥'][i]}</span>
                            </div>
                            <span className="text-[8px] text-gray-300 mt-0.5">Seat {i + 1}</span>
                          </div>
                        ))}
                      </div>

                      <div className="text-[10px] bg-white/10 rounded-lg p-1.5 text-center font-medium">
                        Audio Chat & Games
                      </div>
                    </div>
                  </div>

                  {/* Phone 2: 1v1 PK Arena Battle */}
                  <div className="absolute right-0 bottom-6 w-[240px] sm:w-[270px] aspect-[9/18] rounded-3xl bg-gray-950 p-2.5 shadow-2xl transform rotate-6 hover:rotate-0 transition-transform duration-300 z-20 border border-rose-500/30">
                    <div className="w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-gray-900 to-black p-3 text-white flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-black">PK BATTLE</span>
                        <span className="text-amber-400">01:45</span>
                      </div>

                      {/* Split PK Screen */}
                      <div className="my-auto space-y-2">
                        <div className="grid grid-cols-2 gap-1.5 h-28">
                          <div className="bg-blue-600/30 rounded-lg border border-blue-500/40 p-1 flex flex-col justify-between items-center text-center">
                            <span className="text-[9px] text-blue-300 font-bold">Team Red</span>
                            <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">👤</div>
                            <span className="text-[10px] font-black text-blue-400">12,450 pts</span>
                          </div>
                          <div className="bg-rose-600/30 rounded-lg border border-rose-500/40 p-1 flex flex-col justify-between items-center text-center">
                            <span className="text-[9px] text-rose-300 font-bold">Team Blue</span>
                            <div className="w-8 h-8 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center">👤</div>
                            <span className="text-[10px] font-black text-rose-400">15,890 pts</span>
                          </div>
                        </div>

                        {/* VS Progress Gauge */}
                        <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden flex">
                          <div className="w-[45%] bg-blue-500 h-full" />
                          <div className="w-[55%] bg-rose-500 h-full" />
                        </div>
                      </div>

                      <div className="text-[10px] bg-rose-600/80 rounded-lg p-1.5 text-center font-bold">
                        Support Your Favorite Host!
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Copy & Details */}
              <div className="lg:col-span-6 space-y-6">
                <span className="text-xs font-bold text-[#5653FE] uppercase tracking-wider bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                  {isUr ? 'پارٹی اور مقابلہ' : 'Party & Competitive PK'}
                </span>
                
                <h2 className="text-3xl sm:text-5xl font-black text-gray-950 tracking-tight">
                  {isUr ? 'پارٹی رومز اور سنسنی خیز پی کے مقابلے' : 'Party Rooms & Thrilling PK Battles'}
                </h2>

                <p className="text-base text-gray-600 leading-relaxed">
                  {isUr
                    ? 'ایک ہی وقت میں 9 دوستوں کے ساتھ مل کر آڈیو یا ویڈیو پارٹی روم بنائیں، لڈو اور تفریحی گیمز کھیلیں، یا اپنے پسندیدہ ہوسٹ کو پی کے مقابلے میں فاتح بنانے کے لیے گفٹس کی بارش کریں۔'
                    : 'Jump into interactive multi-guest party rooms to sing karaoke, play community games, or turn up the excitement in live 1v1 PK battles where fans rally together to crown their champion.'}
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#5653FE] flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-gray-900">
                        {isUr ? '9 سیٹوں والے پارٹی رومز' : '9-Seat Interactive Party Lounges'}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {isUr
                          ? 'دوستوں کے ساتھ فری مائیک پر گپ شپ، ہنسی مذاق اور گروپ تفریح۔'
                          : 'Host private or public hangouts, chat with crystal clear HD audio, and make friends.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                      <Swords className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-gray-900">
                        {isUr ? 'لائیو 1v1 اور ٹیم پی کے' : 'Live 1v1 & Team PK Arena'}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {isUr
                          ? 'دو ہوسٹس کے درمیان سخت مقابلہ، شائقین کے ووٹ اور مضحکہ خیز سزائیں۔'
                          : 'Streamers face off in high stakes battles with fun penalties and real-time score gauges.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Link
                    href="/live"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#5653FE] hover:bg-[#433ffd] text-white font-bold text-sm shadow-md transition-all hover:scale-105"
                  >
                    <span>{isUr ? 'ابھی لائیو دیکھیں' : 'Explore Live Streams'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 5. SECTION 3: "EXPRESS YOUR STYLE" (02_marketing_homepage.png: 3D GIFTS) */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold text-[#5653FE] uppercase tracking-wider bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                {isUr ? 'ورچوئل گفٹس کلیکشن' : 'Next-Gen 3D Gifts'}
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-950 mt-3 tracking-tight">
                {isUr ? 'اپنے انداز اور محبت کا اظہار کریں' : 'Express Your Style'}
              </h2>
              <p className="text-gray-600 mt-3 text-sm sm:text-base">
                {isUr
                  ? 'شاندار اینیمیٹڈ تھری ڈی ورچوئل گفٹس کے ذریعے اپنے پسندیدہ تخلیق کاروں کو سراہیں۔'
                  : 'Stunning 3D effects, luxury supercars, cosmic spacecraft, and magnificent castles that make you unforgettable in every live room.'}
              </p>

              {/* Gift Categories Tab */}
              <div className="flex items-center justify-center gap-3 mt-8">
                {[
                  { id: 'vehicles', label: isUr ? 'سپر کارز اور کشتیاں' : '🏎️ Supercars & Fleet' },
                  { id: 'space', label: isUr ? 'خلائی اور کہکشائیں' : '🚀 Space & Galaxies' },
                  { id: 'luxury', label: isUr ? 'شاہی محلات اور ہیرے' : '👑 Royal & Castles' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveGiftTab(tab.id as any)}
                    className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                      activeGiftTab === tab.id
                        ? 'bg-[#5653FE] text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Gift Showcase Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {giftItems[activeGiftTab].map((gift) => (
                <div
                  key={gift.name}
                  className="bg-white rounded-3xl p-6 border border-gray-200 hover:border-[#5653FE]/50 hover:shadow-xl transition-all text-center flex flex-col items-center justify-between group"
                >
                  <div
                    className={`w-24 h-24 rounded-2xl bg-gradient-to-tr ${gift.color} flex items-center justify-center text-5xl mb-4 group-hover:scale-110 transition-transform shadow-lg`}
                  >
                    {gift.icon}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-gray-900">{gift.name}</h4>
                    <p className="text-xs font-semibold text-[#5653FE] mt-1">{gift.coins}</p>
                  </div>
                  <Link
                    href="/recharge"
                    className="mt-4 w-full py-2 rounded-xl bg-gray-50 group-hover:bg-[#5653FE] group-hover:text-white text-gray-700 text-xs font-bold transition-colors"
                  >
                    {isUr ? 'کوائنز حاصل کریں' : 'Get Coins To Send'}
                  </Link>
                </div>
              ))}
            </div>

            {/* Coin Top Up CTA Banner */}
            <div className="mt-12 max-w-3xl mx-auto bg-gradient-to-r from-[#5653FE] to-indigo-700 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-purple-500/20">
              <div className="text-center sm:text-left">
                <h3 className="text-xl sm:text-2xl font-black">
                  {isUr ? 'سرکاری ویب سائٹ سے کوائنز ریچارج کریں' : 'Top Up Coins With Zero Extra Fees'}
                </h3>
                <p className="text-xs sm:text-sm text-purple-100 mt-1">
                  {isUr ? 'فوری ڈلیوری اور بہترین رعایتی بنڈلز' : 'Official Poppo recharge portal with instant balance credit.'}
                </p>
              </div>
              <Link
                href="/recharge"
                className="px-6 py-3 rounded-full bg-amber-400 hover:bg-amber-300 text-gray-950 font-black text-sm shrink-0 shadow-lg transition-transform hover:scale-105"
              >
                {isUr ? 'ابھی ریچارج کریں' : 'Go To Recharge →'}
              </Link>
            </div>
          </div>
        </section>

        {/* 6. SECTION 4: TRUST & 18+ CHILD PROTECTION BANNER */}
        <section className="py-16 bg-white border-t border-gray-150">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-150">
                <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 font-black text-lg">
                  18+
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    {isUr ? 'عمر کی سخت پابندی' : 'Strict 18+ Age Restriction'}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isUr ? 'نابالغوں کا داخلہ سختی سے ممنوع ہے۔' : 'Zero tolerance policy for underage usage.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-150">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    {isUr ? '24/7 سیکیورٹی مانیٹرنگ' : '24/7 Security Monitoring'}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isUr ? 'جدید ترین AI اور انسانی معائنہ کار۔' : 'Real-time AI filtration and live moderation.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-150">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    {isUr ? 'عالمی کمیونٹی قواعد' : 'Global Community Guidelines'}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
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
