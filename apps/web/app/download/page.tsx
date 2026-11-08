'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PoppoHeader } from '@/components/poppo/PoppoHeader';
import { PoppoFooter } from '@/components/poppo/PoppoFooter';
import { AuthModal } from '@/components/homepage/AuthModal';
import { Button } from '@/components/ui/Button';
import { QrCodePlaceholder } from '@/components/download/QrCodePlaceholder';
import { useLanguage } from '@/lib/languageContext';
import {
  Smartphone,
  Download,
  Apple,
  Radio,
  Users,
  Swords,
  Gift,
  HeartHandshake,
  Trophy,
  CheckCircle2,
  AlertCircle,
  LogIn,
  ChevronDown,
  QrCode,
  ShieldCheck,
  Sparkles,
  Flame,
  ArrowRight,
  Headphones,
  Check,
  Star,
  Zap,
} from 'lucide-react';

export default function DownloadAppPage() {
  const { lang, toggleLang, isUr } = useLanguage();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedPreviewScreen, setSelectedPreviewScreen] = useState<number>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showStoreNoticeModal, setShowStoreNoticeModal] = useState<string | null>(null);

  // Section 5: Main App Features (6 items)
  const appFeatures = [
    {
      title: isUr ? 'لائیو اسٹریمنگ' : 'Live Streaming',
      desc: isUr ? 'لائیو اسٹریمز دیکھیں اور خود لائیو براڈکاسٹ کریں۔' : 'Watch and host live streams.',
      icon: Radio,
      badgeColor: 'from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/30',
    },
    {
      title: isUr ? 'پارٹی رومز' : 'Party Rooms',
      desc: isUr ? 'انٹرایکٹو گروپ رومز میں شامل ہو کر دوستوں سے بات کریں۔' : 'Join interactive group rooms.',
      icon: Users,
      badgeColor: 'from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30',
    },
    {
      title: isUr ? 'پی کے مقابلے' : 'PK Battles',
      desc: isUr ? 'سنسنی خیز اور مسابقتی لائیو مقابلوں سے لطف اٹھائیں۔' : 'Enjoy competitive live battles.',
      icon: Swords,
      badgeColor: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
    },
    {
      title: isUr ? 'ورچوئل تحائف' : 'Virtual Gifts',
      desc: isUr ? 'اپنے پسندیدہ کری ایٹرز کو اینیمیٹڈ تحائف بھیجیں۔' : 'Send virtual gifts to creators.',
      icon: Gift,
      badgeColor: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      title: isUr ? 'سوشل رابطے' : 'Social Connections',
      desc: isUr ? 'کری ایٹرز کو فالو کریں اور نئے دوستوں سے رابطہ بنائیں۔' : 'Follow creators and connect with people.',
      icon: HeartHandshake,
      badgeColor: 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30',
    },
    {
      title: isUr ? 'کری ایٹر کمیونٹی' : 'Creator Community',
      desc: isUr ? 'ایک مستند لائیو اسٹریمر کے طور پر اپنی شناخت بنائیں۔' : 'Build your presence as a creator.',
      icon: Trophy,
      badgeColor: 'from-yellow-500/20 to-amber-500/20 text-yellow-400 border-yellow-500/30',
    },
  ];

  // Section 4: App Preview 6 Sample Screens
  const previewScreens = [
    {
      id: 'home',
      nameEn: 'Home Screen',
      nameUr: 'ہوم اسکرین',
      subtitleEn: 'Explore Feed & Top Rankings',
      subtitleUr: 'ایکسپلور اور ٹاپ رینکنگز',
      render: (
        <div className="w-full h-full bg-[#0D111D] flex flex-col justify-between text-white text-[11px] p-3.5">
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-black text-xs text-popo-pink tracking-wider">POPO LIVE</span>
            <div className="flex items-center gap-2 text-[10px] text-gray-300">
              <span className="text-popo-pink font-bold border-b border-popo-pink pb-0.5">Explore</span>
              <span>Following</span>
              <span>Party</span>
            </div>
          </div>
          {/* Banner */}
          <div className="rounded-xl bg-gradient-to-r from-purple-900 to-pink-900 p-2.5 my-2 border border-white/10 text-left">
            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest block">Weekend PK Carnival</span>
            <span className="text-xs font-black text-white">Win 2,000,000 Coins Pool</span>
          </div>
          {/* Stream Cards Grid */}
          <div className="grid grid-cols-2 gap-2 flex-1 my-1">
            <div className="rounded-xl bg-gradient-to-b from-[#1C1C2A] to-[#12121A] p-2 border border-white/5 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between text-[9px]">
                <span className="bg-red-500 text-white font-bold px-1.5 py-0.2 rounded-full">● LIVE</span>
                <span className="text-gray-400">1.4K</span>
              </div>
              <div className="mt-8 text-left">
                <span className="font-bold text-white block truncate">Ayesha_Voice</span>
                <span className="text-[9px] text-pink-400">Singing Lounge</span>
              </div>
            </div>
            <div className="rounded-xl bg-gradient-to-b from-[#1C1C2A] to-[#12121A] p-2 border border-white/5 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between text-[9px]">
                <span className="bg-purple-600 text-white font-bold px-1.5 py-0.2 rounded-full">9-Seat</span>
                <span className="text-gray-400">890</span>
              </div>
              <div className="mt-8 text-left">
                <span className="font-bold text-white block truncate">Karachi Nights</span>
                <span className="text-[9px] text-cyan-400">Party Audio</span>
              </div>
            </div>
          </div>
          {/* Bottom Tabs */}
          <div className="flex items-center justify-around border-t border-white/10 pt-2 text-[9px] text-gray-400">
            <span className="text-popo-pink font-bold">Home</span>
            <span>Party</span>
            <span className="w-5 h-5 rounded-full bg-popo-pink flex items-center justify-center text-white font-bold text-[10px]">+</span>
            <span>Inbox</span>
            <span>Me</span>
          </div>
        </div>
      ),
    },
    {
      id: 'live',
      nameEn: 'Live Streaming Screen',
      nameUr: 'لائیو اسٹریمنگ اسکرین',
      subtitleEn: 'High-Definition Broadcast & Chat',
      subtitleUr: 'ایچ ڈی نشریات اور لائیو چیٹ',
      render: (
        <div className="w-full h-full bg-[#0A0D18] flex flex-col justify-between text-white text-[11px] p-3.5 relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-full border border-white/10">
              <div className="w-4 h-4 rounded-full bg-pink-500 font-bold text-[8px] flex items-center justify-center">S</div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-bold leading-none">Sara_Online</span>
                <span className="text-[8px] text-amber-400">Lv.5 Streamer</span>
              </div>
            </div>
            <span className="bg-black/60 px-2 py-0.5 rounded-full text-[9px] text-gray-300">👥 2,410</span>
          </div>
          {/* Animated Float effect */}
          <div className="my-auto text-center flex flex-col items-center gap-1">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 via-purple-600 to-cyan-400 p-1 animate-pulse">
              <div className="w-full h-full rounded-full bg-black/60 flex items-center justify-center text-xl">
                🚀
              </div>
            </div>
            <span className="text-[9px] font-bold text-amber-300 bg-black/70 px-2 py-0.5 rounded-full">Super Rocket Gift Sent!</span>
          </div>
          {/* Chat overlay */}
          <div className="flex flex-col gap-1 text-[9px] text-left z-10">
            <span className="bg-black/40 px-2 py-0.5 rounded-lg text-gray-300"><strong className="text-cyan-400">Ali99:</strong> Beautiful music today! 🎵</span>
            <span className="bg-black/40 px-2 py-0.5 rounded-lg text-gray-300"><strong className="text-pink-400">Zoya:</strong> Sent 100 Hearts ❤️</span>
            <div className="flex items-center justify-between pt-1">
              <span className="bg-white/10 px-3 py-1 rounded-full text-gray-400 text-[9px]">Say something...</span>
              <span className="w-7 h-7 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">🎁</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'party',
      nameEn: 'Party Room Screen',
      nameUr: 'پارٹی روم اسکرین',
      subtitleEn: '9-Seat Real-Time Voice Lounges',
      subtitleUr: '۹ سیٹ وائس پارٹی لاؤنج',
      render: (
        <div className="w-full h-full bg-[#0D111D] flex flex-col justify-between text-white text-[11px] p-3">
          {/* Room Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-left">
            <div>
              <span className="text-[10px] font-bold text-white block">Night Owl Club 🌙</span>
              <span className="text-[8px] text-emerald-400">9 Seats Active &bull; Safe Zone</span>
            </div>
            <span className="text-[9px] text-popo-pink bg-popo-pink/10 px-2 py-0.5 rounded-full border border-popo-pink/20">Lv.8</span>
          </div>
          {/* 9 Seat Grid */}
          <div className="grid grid-cols-3 gap-2 my-auto">
            {/* Host Seat */}
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 to-pink-500 p-0.5 relative">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center font-bold text-[9px]">👑</div>
                <span className="absolute -bottom-1 text-[7px] bg-red-500 px-1 rounded-full">Host</span>
              </div>
              <span className="text-[8px] mt-1 text-gray-300">Tariq</span>
            </div>
            {/* 8 Guest Seats */}
            {['Zain', 'Maya', 'Hassan', 'Noor', 'Bilal', 'Sana', 'Seat 7', 'Seat 8'].map((seat, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-[8px] text-gray-400">
                  {i < 6 ? '🎙️' : '🔒'}
                </div>
                <span className="text-[8px] mt-1 text-gray-400">{seat}</span>
              </div>
            ))}
          </div>
          {/* Bottom Bar */}
          <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[9px]">
            <span className="bg-white/10 px-2 py-1 rounded-full text-gray-300">Take a Seat</span>
            <span className="text-emerald-400">Mic ON</span>
          </div>
        </div>
      ),
    },
    {
      id: 'pk',
      nameEn: 'PK Battle Screen',
      nameUr: 'پی کے بیٹل اسکرین',
      subtitleEn: '1v1 Live Tug-of-War Competition',
      subtitleUr: '۱ تا ۱ لائیو سنسنی خیز مقابلہ',
      render: (
        <div className="w-full h-full bg-[#0A0D18] flex flex-col justify-between text-white text-[11px] p-3">
          {/* PK Header & Timer */}
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">BLUE</span>
            <div className="bg-red-500/20 px-2 py-0.5 rounded-full border border-red-500/30 text-red-400 font-mono font-bold text-[9px]">
              02:18
            </div>
            <span className="text-[9px] font-black text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">PINK</span>
          </div>
          {/* Dynamic Score Bar */}
          <div className="my-2">
            <div className="flex items-center justify-between text-[9px] font-bold mb-1">
              <span className="text-cyan-400">18,400 pts</span>
              <span className="text-pink-400">14,200 pts</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden flex">
              <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: '56%' }} />
              <div className="h-full bg-pink-500 transition-all duration-300" style={{ width: '44%' }} />
            </div>
          </div>
          {/* Split Hosts Visual */}
          <div className="grid grid-cols-2 gap-1.5 flex-1 my-1">
            <div className="rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex flex-col items-center justify-center text-center p-2">
              <span className="text-lg">🔥</span>
              <span className="font-bold text-[9px] text-white">Hamza_Live</span>
              <span className="text-[8px] text-cyan-300">Leading</span>
            </div>
            <div className="rounded-xl bg-pink-950/40 border border-pink-500/30 flex flex-col items-center justify-center text-center p-2">
              <span className="text-lg">⚡</span>
              <span className="font-bold text-[9px] text-white">Komal_Star</span>
              <span className="text-[8px] text-pink-300">Catching up!</span>
            </div>
          </div>
          <span className="text-[8px] text-center text-gray-400">Send Gifts to Boost Score</span>
        </div>
      ),
    },
    {
      id: 'wallet',
      nameEn: 'Gifts & Wallet Screen',
      nameUr: 'گفٹس اور والٹ اسکرین',
      subtitleEn: 'Coins, Points & 70% Host Shares',
      subtitleUr: 'کوائنز، پوائنٹس اور ۷۰٪ ریونیو',
      render: (
        <div className="w-full h-full bg-[#0D111D] flex flex-col justify-between text-white text-[11px] p-3 text-left">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="font-bold text-white text-[10px]">Popo Wallet</span>
            <span className="text-[8px] text-emerald-400">Verified Ledger</span>
          </div>
          {/* Balance Cards */}
          <div className="grid grid-cols-2 gap-1.5 my-2">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <span className="text-[8px] text-gray-400 block uppercase">Coins Balance</span>
              <span className="text-xs font-black text-amber-400">42,500</span>
            </div>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
              <span className="text-[8px] text-gray-400 block uppercase">Host Points</span>
              <span className="text-xs font-black text-purple-400">189,200</span>
            </div>
          </div>
          {/* Gift Catalog Sample */}
          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Send Gift</span>
          <div className="grid grid-cols-3 gap-1 my-1">
            <div className="p-1 rounded-lg bg-white/5 border border-white/10 text-center">
              <span className="text-sm block">🌹</span>
              <span className="text-[8px] text-amber-300 font-bold">10 C</span>
            </div>
            <div className="p-1 rounded-lg bg-pink-500/15 border border-pink-500/30 text-center">
              <span className="text-sm block">🏎️</span>
              <span className="text-[8px] text-pink-300 font-bold">1,200 C</span>
            </div>
            <div className="p-1 rounded-lg bg-white/5 border border-white/10 text-center">
              <span className="text-sm block">🏰</span>
              <span className="text-[8px] text-amber-300 font-bold">5,000 C</span>
            </div>
          </div>
          <span className="text-[7px] text-gray-500 text-center">70% Value Converts to Host Points</span>
        </div>
      ),
    },
    {
      id: 'profile',
      nameEn: 'User Profile Screen',
      nameUr: 'یوزر پروفائل اسکرین',
      subtitleEn: 'Me Center, User ID & Wealth Badge',
      subtitleUr: 'پروفائل سینٹر، یوزر آئی ڈی اور لیول',
      render: (
        <div className="w-full h-full bg-[#0D111D] flex flex-col justify-between text-white text-[11px] p-3 text-left">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="font-bold text-white text-[10px]">Me Center</span>
            <span className="text-[8px] text-popo-pink font-mono">ID: 619402</span>
          </div>
          {/* Profile Card */}
          <div className="flex items-center gap-2.5 my-2">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 p-0.5">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center font-bold text-xs">
                P
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-white text-xs">PopoCreator_PK</span>
              <span className="text-[8px] text-amber-400 font-semibold">🏆 Wealth Level 5 &bull; Host</span>
            </div>
          </div>
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-1 p-1.5 rounded-xl bg-black/40 border border-white/5 text-center my-1">
            <div>
              <span className="text-[8px] text-gray-400 block">Followers</span>
              <span className="text-[10px] font-bold text-white">12.4K</span>
            </div>
            <div>
              <span className="text-[8px] text-gray-400 block">Following</span>
              <span className="text-[10px] font-bold text-white">142</span>
            </div>
            <div>
              <span className="text-[8px] text-gray-400 block">Likes</span>
              <span className="text-[10px] font-bold text-popo-pink">480K</span>
            </div>
          </div>
          {/* Quick Menu */}
          <div className="flex flex-col gap-1 text-[8px] text-gray-300">
            <span className="p-1 rounded bg-white/5 flex justify-between"><span>Settings & Privacy</span><span>&rarr;</span></span>
            <span className="p-1 rounded bg-white/5 flex justify-between"><span>Creator Task Center</span><span>&rarr;</span></span>
          </div>
        </div>
      ),
    },
  ];

  // Section 6: How to Download (3 Steps)
  const downloadSteps = [
    {
      step: '01',
      title: isUr ? 'اپنی ڈیوائس کا انتخاب کریں' : 'Choose Your Device',
      desc: isUr
        ? 'اپنے اسمارٹ فون کے آپریٹنگ سسٹم (اینڈرائڈ یا آئی فون) کا انتخاب کریں۔'
        : 'Select your preferred smartphone platform (Android smartphone, tablet, or Apple iPhone/iPad).',
      icon: Smartphone,
    },
    {
      step: '02',
      title: isUr ? 'آفیشل ایپ اسٹور وزٹ کریں' : 'Visit the Official App Store',
      desc: isUr
        ? 'گوگل پلے اسٹور یا ایپل ایپ اسٹور پر جائیں اور محفوظ اسٹور پیج کھولیں۔'
        : 'Navigate directly to Google Play Store or Apple App Store listing for verified installation.',
      icon: Download,
    },
    {
      step: '03',
      title: isUr ? 'پوپو لائیو انسٹال کر کے کھولیں' : 'Install Popo Live and Open the App',
      desc: isUr
        ? 'انسٹال مکمل ہونے پر ایپ کھولیں، زبان منتخب کریں اور لائیو کمیونٹی کا حصہ بنیں۔'
        : 'Launch Popo Live, set your preferred language (English or Urdu), and start connecting instantly.',
      icon: CheckCircle2,
    },
  ];

  // Section 8: Frequently Asked Questions (6 exact items)
  const faqs = [
    {
      q: isUr ? 'کیا پوپو لائیو اینڈرائڈ پر دستیاب ہے؟' : 'Is Popo Live available on Android?',
      a: isUr
        ? 'جی ہاں! پوپو لائیو اینڈرائڈ 8.0 اور اس سے جدید تمام اسمارٹ فونز اور ٹیبلٹس کے لیے تیار کیا گیا ہے اور گوگل پلے اسٹور کے ذریعے باضابطہ فراہم کیا جائے گا۔'
        : 'Yes. Popo Live is engineered for Android 8.0 and above, supporting high-definition streaming across all modern smartphones and tablets via the Google Play Store.',
    },
    {
      q: isUr ? 'کیا پوپو لائیو آئی فون (iPhone) پر دستیاب ہے؟' : 'Is Popo Live available on iPhone?',
      a: isUr
        ? 'جی ہاں! پوپو لائیو ایپل آئی او ایس 14.0 اور اس سے بعد کے تمام آئی فون اور آئی پیڈ ماڈلز کے لیے ایپل ایپ اسٹور پر دستیاب ہوگا۔'
        : 'Yes. Popo Live is fully optimized for Apple iOS 14.0 and higher on iPhone and iPad, featuring low-latency Agora audio and video integration.',
    },
    {
      q: isUr ? 'میں پوپو لائیو کہاں سے ڈاؤنلوڈ کر سکتا ہوں؟' : 'Where can I download Popo Live?',
      a: isUr
        ? 'آپ پوپو لائیو کو صرف آفیشل گوگل پلے اسٹور اور ایپل ایپ اسٹور سے ڈاؤنلوڈ کر سکتے ہیں۔ سیکیورٹی تحفظ کے پیشِ نظر براہ راست APK فائلیں فراہم نہیں کی جاتیں۔'
        : 'Popo Live is distributed exclusively through the official Google Play Store and Apple App Store. Direct APK downloads are intentionally disabled for user safety and store compliance.',
    },
    {
      q: isUr ? 'کیا پوپو لائیو ڈاؤنلوڈ کرنا مفت ہے؟' : 'Is Popo Live free to download?',
      a: isUr
        ? 'جی ہاں! پوپو لائیو مکمل طور پر مفت ڈاؤنلوڈ کیا جا سکتا ہے۔ ایپ میں لائیو براڈکاسٹ دیکھنا اور پارٹی رومز میں شامل ہونا مفت ہے، جبکہ اضافی تحائف کے لیے ورچوئل کوائنز اختیاری ہیں۔'
        : 'Yes. Popo Live is 100% free to download and install. Viewing streams, joining party rooms, and chatting are free, with optional in-app coin packages available for social gifting.',
    },
    {
      q: isUr ? 'میں ایپلی کیشن کو کیسے اپ ڈیٹ کروں؟' : 'How do I update the application?',
      a: isUr
        ? 'جب بھی نیا ورژن جاری ہوگا، آپ گوگل پلے اسٹور یا ایپل ایپ اسٹور کے ذریعے &quot;Update&quot; بٹن دبا کر تازہ ترین ورژن حاصل کر سکتے ہیں۔'
        : 'You can update Popo Live directly through Google Play or Apple App Store. Automatic updates can also be toggled within your device app store settings.',
    },
    {
      q: isUr ? 'مجھے تکنیکی سپورٹ کہاں سے مل سکتی ہے؟' : 'Where can I get technical support?',
      a: isUr
        ? 'کسی بھی تکنیکی مسئلے، لاگ ان سپورٹ یا سوال کے لیے آپ ہماری ٹیم سے tech@popolive.com پر رابطہ کر سکتے ہیں یا ہماری ویب سائٹ کے Contact پیج سے پیغام بھیج سکتے ہیں۔'
        : 'For technical troubleshooting, bug reporting, or account recovery, reach out to our dedicated technical desk at tech@popolive.com or visit our Contact Us page.',
    },
  ];

  const handleDownloadClick = (platform: 'android' | 'ios') => {
    setShowStoreNoticeModal(platform);
  };

  return (
    <div
      dir={isUr ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-[#0B0E17] text-white selection:bg-popo-pink selection:text-white ${
        isUr ? 'font-urdu' : 'font-sans'
      }`}
    >
      {/* 1. Website Header */}
      <PoppoHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 flex flex-col gap-24 overflow-x-hidden">
        {/* Staging Placeholder Alert */}
        <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            {isUr
              ? 'وضاحت: آفیشل گوگل پلے اسٹور اور ایپل ایپ اسٹور کے لنکس اور کیو آر کوڈز کلائنٹ پبلشنگ کے اختتام تک باضابطہ پلیس ہولڈرز کے طور پر دکھائے گئے ہیں۔'
              : 'Notice: Official store links and QR codes are displayed with verified staging placeholders pending official app store publication release.'}
          </span>
        </div>

        {/* 2. Download Hero Section */}
        <section className="relative pt-6 pb-6">
          {/* Ambient Lighting Gradients */}
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-popo-pink/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-96 h-96 bg-popo-purple/20 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            {/* Left Content */}
            <div className={`lg:col-span-7 flex flex-col gap-6 ${isUr ? 'text-right' : 'text-left'}`}>
              <div className={`inline-flex items-center gap-2 ${isUr ? 'self-end' : 'self-start'}`}>
                <span className="text-xs font-bold uppercase tracking-widest text-popo-pink flex items-center gap-2 px-4 py-1.5 rounded-full bg-popo-pink/10 border border-popo-pink/25">
                  <Smartphone className="w-3.5 h-3.5" />
                  {isUr ? 'آفیشل موبائل ایپ' : 'Official Mobile Application'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                {isUr ? (
                  <>
                    پوپو لائیو ڈاؤنلوڈ کریں{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-popo-pink via-purple-400 to-indigo-400">
                      اور لائیو جڑیں
                    </span>
                  </>
                ) : (
                  <>
                    Download{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-popo-pink via-purple-400 to-indigo-400">
                      Popo Live
                    </span>
                  </>
                )}
              </h1>

              <div className="flex flex-col gap-2">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-200">
                  {isUr
                    ? 'آپ کی لائیو اسٹریمنگ کمیونٹی صرف ایک کلک کی دوری پر ہے۔'
                    : 'Your Live Streaming Community Is Just One Tap Away.'}
                </h2>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-2xl">
                  {isUr
                    ? 'پوپو لائیو ڈاؤنلوڈ کریں اور لوگوں سے جڑیں، لائیو اسٹریمنگ رومز میں شامل ہوں، پارٹی رومز کا لطف اٹھائیں اور سماجی تفریح دریافت کریں۔'
                    : 'Download Popo Live and connect with people, join live streaming rooms, enjoy party rooms and discover social entertainment.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className={`flex flex-wrap items-center gap-4 pt-2 ${isUr ? 'justify-end' : 'justify-start'}`}>
                {/* Android Button */}
                <button
                  type="button"
                  onClick={() => handleDownloadClick('android')}
                  className="flex items-center gap-3.5 px-6 py-3.5 rounded-2xl bg-[#171722] hover:bg-[#1F1F2E] border border-white/15 hover:border-popo-pink text-white transition-all shadow-xl group cursor-pointer"
                >
                  <svg className="w-6 h-6 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M3.609 1.814L13.792 12 3.61 22.186c-.367-.344-.61-.83-.61-1.393V3.207c0-.563.243-1.049.61-1.393z" />
                    <path fill="#FBBC05" d="M17.158 8.634l-3.366 3.366 3.366 3.366 3.793-2.189c1.082-.624 1.082-1.729 0-2.354l-3.793-2.189z" />
                    <path fill="#4285F4" d="M3.609 1.814l10.183 10.186 3.366-3.366L6.505.31c-.933-.538-2.029-.25-2.896.504z" />
                    <path fill="#34A853" d="M3.609 22.186l13.549-7.81-3.366-3.366L3.609 22.186z" />
                  </svg>
                  <div className="text-left flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">GET IT ON</span>
                    <span className="text-sm font-bold text-white">Google Play</span>
                  </div>
                </button>

                {/* iOS Button */}
                <button
                  type="button"
                  onClick={() => handleDownloadClick('ios')}
                  className="flex items-center gap-3.5 px-6 py-3.5 rounded-2xl bg-[#171722] hover:bg-[#1F1F2E] border border-white/15 hover:border-purple-400 text-white transition-all shadow-xl group cursor-pointer"
                >
                  <Apple className="w-6 h-6 text-white shrink-0 transition-transform group-hover:scale-110" />
                  <div className="text-left flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Download on the</span>
                    <span className="text-sm font-bold text-white">App Store</span>
                  </div>
                </button>
              </div>

              {/* Login link for existing web users */}
              <div className={`flex items-center gap-2 text-xs text-gray-400 pt-2 ${isUr ? 'justify-end' : 'justify-start'}`}>
                <span>{isUr ? 'کیا آپ کے پاس پہلے سے اکاؤنٹ ہے؟' : 'Already have a Popo Live account?'}</span>
                <Link href="/login" className="text-popo-pink font-bold hover:underline flex items-center gap-1">
                  <span>{isUr ? 'ویب لاگ ان پر جائیں' : 'Log In to Web Portal'}</span>
                  <LogIn className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right Original Smartphone Mockup with Real Popo Live UI Sample */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[320px] aspect-[9/18.5] rounded-[44px] bg-black border-[5px] border-white/20 shadow-2xl shadow-purple-950/50 p-3 flex flex-col justify-between overflow-hidden">
                {/* Phone Speaker Notch */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-20 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                </div>

                {/* Display Current Active Preview Screen */}
                <div className="w-full h-full rounded-[34px] overflow-hidden relative z-10 pt-4">
                  {previewScreens[selectedPreviewScreen].render}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Platform Download Cards (Android & iOS) */}
        <section className="flex flex-col gap-10">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-popo-pink">
              {isUr ? 'پلیٹ فارم ڈیوائسز' : 'Choose Your Platform'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              {isUr ? 'آفیشل اسٹورز سے حاصل کریں' : 'Download Cards for Android & iOS'}
            </h2>
            <p className="text-sm text-gray-400">
              {isUr
                ? 'اپنے موبائل ڈیوائس کے لیے آفیشل اور تصدیق شدہ ایپلی کیشن انسٹال کریں۔'
                : 'Verified store distributions. Select your platform below to download or scan QR code.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Android Card */}
            <div className="p-8 sm:p-10 rounded-3xl bg-[#171722] border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-6 shadow-xl">
              <div className="flex flex-col gap-4 text-left">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                    <Smartphone className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    Android 8.0+
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white">Android App</h3>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1 leading-relaxed">
                    Download directly from Google Play. Optimized for smooth playback across Samsung, Xiaomi, Vivo, Oppo, and all modern Android devices.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-white/10">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleDownloadClick('android')}
                  className="w-full sm:w-auto font-bold"
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Coming Soon (Google Play)
                </Button>

                <div className="shrink-0">
                  <QrCodePlaceholder platform="android" label="Scan for Android" size="sm" />
                </div>
              </div>
            </div>

            {/* iOS Card */}
            <div className="p-8 sm:p-10 rounded-3xl bg-[#171722] border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between gap-6 shadow-xl">
              <div className="flex flex-col gap-4 text-left">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
                    <Apple className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                    iOS 14.0+
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white">iOS App</h3>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1 leading-relaxed">
                    Download officially from the Apple App Store. Specially tuned for iPhone and iPad with hardware-accelerated streaming and crisp audio.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-white/10">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => handleDownloadClick('ios')}
                  className="w-full sm:w-auto font-bold bg-white/10 border-white/15"
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Coming Soon (App Store)
                </Button>

                <div className="shrink-0">
                  <QrCodePlaceholder platform="ios" label="Scan for iOS" size="sm" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. App Preview Section (6 Interactive Screens) */}
        <section className="flex flex-col gap-10">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
              {isUr ? 'ایپ انٹرفیس پریویو' : 'App Preview'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              {isUr ? 'پوپو لائیو کے اصل اسکرینز کا معائنہ کریں' : 'Explore Sample Popo Live Screens'}
            </h2>
            <p className="text-sm text-gray-400">
              {isUr
                ? 'ہوم فیڈ، لائیو اسٹریمنگ، ۹ سیٹ پارٹی لاؤنجز، پی کے بیٹلز، اور یوزر پروفائل کی جھلک دیکھیں۔'
                : 'Click through our sample mobile UI screens to discover the core features built into the mobile experience.'}
            </p>
          </div>

          {/* Screen Selection Tabs */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {previewScreens.map((screen, idx) => (
              <button
                key={screen.id}
                type="button"
                onClick={() => setSelectedPreviewScreen(idx)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  selectedPreviewScreen === idx
                    ? 'bg-popo-pink text-white shadow-lg shadow-popo-pink/25'
                    : 'bg-[#171722] text-gray-400 hover:text-white border border-white/10'
                }`}
              >
                {idx + 1}. {isUr ? screen.nameUr : screen.nameEn}
              </button>
            ))}
          </div>

          {/* Interactive Screen Display Box */}
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#171722] to-[#12121A] border border-white/10 flex flex-col lg:flex-row items-center justify-around gap-8">
            <div className={`flex flex-col gap-3 max-w-md ${isUr ? 'text-right' : 'text-left'}`}>
              <span className="text-xs font-mono font-bold text-popo-pink uppercase tracking-widest">
                Screen 0{selectedPreviewScreen + 1} of 06
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                {isUr ? previewScreens[selectedPreviewScreen].nameUr : previewScreens[selectedPreviewScreen].nameEn}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {isUr ? previewScreens[selectedPreviewScreen].subtitleUr : previewScreens[selectedPreviewScreen].subtitleEn}
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  <Check className="w-3.5 h-3.5" />
                  Original Popo Live UI Architecture
                </span>
              </div>
            </div>

            {/* Simulated Phone Frame */}
            <div className="w-[280px] aspect-[9/18.5] rounded-[38px] bg-black border-4 border-white/20 p-2.5 shadow-2xl relative overflow-hidden">
              <div className="w-full h-full rounded-[28px] overflow-hidden">
                {previewScreens[selectedPreviewScreen].render}
              </div>
            </div>
          </div>
        </section>

        {/* 5. Main App Features (6 Feature Cards) */}
        <section className="flex flex-col gap-10">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              {isUr ? 'اہم خصوصیات' : 'Core Capabilities'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              {isUr ? 'پوپو لائیو ایپ کے نمایاں فیچرز' : 'Main App Features'}
            </h2>
            <p className="text-sm text-gray-400">
              {isUr
                ? 'لائیو نشریات، گروپ پارٹی رومز اور ورچوئل گفٹنگ کی تمام تر سہولیات ایک ہی جگہ پر۔'
                : 'Everything you need to broadcast, connect, and enjoy social live entertainment.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appFeatures.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <div
                  key={idx}
                  className={`p-7 rounded-3xl bg-[#171722] border border-white/10 hover:border-popo-pink/40 hover:bg-[#1C1C2A] transition-all duration-300 flex flex-col gap-4 group ${
                    isUr ? 'text-right' : 'text-left'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feat.badgeColor} border flex items-center justify-center shrink-0 ${
                      isUr ? 'self-end' : 'self-start'
                    }`}
                  >
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-popo-pink transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. How to Download (3 Simple Steps) */}
        <section className="flex flex-col gap-10">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              {isUr ? 'آسان انسٹالیشن گائیڈ' : 'Simple Setup'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              {isUr ? 'پوپو لائیو ڈاؤنلوڈ کیسے کریں' : 'How to Download'}
            </h2>
            <p className="text-sm text-gray-400">
              {isUr
                ? 'تین آسان مراحل میں آفیشل اسٹور سے انسٹال کریں اور لائیو کمیونٹی کا حصہ بنیں۔'
                : 'Three straightforward steps to get started on your device.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {downloadSteps.map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={idx}
                  className={`p-7 rounded-3xl bg-[#171722] border border-white/10 flex flex-col gap-4 relative overflow-hidden ${
                    isUr ? 'text-right' : 'text-left'
                  }`}
                >
                  <span className="text-5xl font-black text-white/5 absolute top-3 right-4 select-none pointer-events-none">
                    {step.step}
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-popo-pink/10 border border-popo-pink/20 flex items-center justify-center text-popo-pink">
                    <StepIcon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-mono font-bold text-popo-pink">Step {step.step}</span>
                    <h3 className="text-lg font-bold text-white">{step.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 7. QR Code Section */}
        <section className="rounded-3xl bg-gradient-to-r from-purple-900/30 via-[#171722] to-pink-900/30 border border-white/10 p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className={`flex flex-col gap-3 max-w-lg ${isUr ? 'text-right' : 'text-left'}`}>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              {isUr ? 'فوری اسکیننگ' : 'Instant Device Scan'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {isUr ? 'کیو آر کوڈ اسکین کر کے ڈاؤنلوڈ کریں' : 'Scan to Download Popo Live'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              {isUr
                ? 'اپنے موبائل کیمرہ سے کیو آر کوڈ اسکین کریں اور سیدھا متعلقہ اسٹور پر پہنچیں۔'
                : 'Point your smartphone camera at the corresponding QR code to open the official verified store listing directly.'}
            </p>
            <div className="text-xs text-gray-400 pt-2 flex flex-col gap-1">
              <span>&bull; Step 1: Open default camera app on your phone.</span>
              <span>&bull; Step 2: Align camera frame over the QR code.</span>
              <span>&bull; Step 3: Tap the pop-up notification link.</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <QrCodePlaceholder platform="android" label="Android (Google Play)" size="md" />
            <QrCodePlaceholder platform="ios" label="iOS (App Store)" size="md" />
          </div>
        </section>

        {/* 8. Frequently Asked Questions (Expandable FAQ - 6 Questions) */}
        <section className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
          <div className="text-center flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              {isUr ? 'عام سوالات' : 'Help & FAQ'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              {isUr ? 'اکثر پوچھے جانے والے سوالات' : 'Frequently Asked Questions'}
            </h2>
            <p className="text-sm text-gray-400">
              {isUr
                ? 'پوپو لائیو کی ڈاؤنلوڈ اور دستیابی کے متعلق اہم ترین معلومات۔'
                : 'Everything you need to know about Popo Live app availability and installation.'}
            </p>
          </div>

          <div className="flex flex-col gap-3.5">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-[#171722] border border-white/10 overflow-hidden transition-colors hover:border-white/20"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className={`w-full p-5 sm:p-6 flex items-center justify-between text-left gap-4 transition-colors ${
                      isOpen ? 'bg-white/5' : ''
                    } ${isUr ? 'flex-row-reverse text-right' : ''}`}
                  >
                    <span className="text-sm sm:text-base font-bold text-white flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-popo-pink/15 text-popo-pink text-xs font-mono font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-popo-pink' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div
                      className={`px-6 pb-6 pt-2 text-xs sm:text-sm text-gray-300 leading-relaxed border-t border-white/5 animate-in fade-in-50 duration-150 ${
                        isUr ? 'text-right' : 'text-left'
                      }`}
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 9. Download Call to Action (CTA) */}
        <section className="relative rounded-3xl bg-gradient-to-r from-purple-900/60 via-[#171722] to-pink-900/50 border border-white/15 p-8 sm:p-12 lg:p-16 overflow-hidden text-center flex flex-col items-center gap-6 shadow-2xl">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-popo-pink/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center gap-3 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-popo-pink px-4 py-1.5 rounded-full bg-popo-pink/10 border border-popo-pink/20">
              {isUr ? 'آج ہی شامل ہوں' : 'Ready to Stream?'}
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white">
              {isUr ? 'آج ہی پوپو لائیو کمیونٹی کا حصہ بنیں' : 'Join the Popo Live Community Today'}
            </h2>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              {isUr
                ? 'ایپ ڈاؤنلوڈ کریں اور دنیا بھر کے کری ایٹرز سے فوری رابطہ قائم کریں۔'
                : 'Get the app and start connecting with the community.'}
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleDownloadClick('android')}
              className="shadow-xl shadow-popo-pink/30 font-bold px-8"
              leftIcon={<Download className="w-5 h-5" />}
            >
              Get for Android
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => handleDownloadClick('ios')}
              className="font-medium bg-white/10 hover:bg-white/15 border-white/15 px-8"
              leftIcon={<Apple className="w-5 h-5" />}
            >
              Get for iOS
            </Button>
            <Link href="/contact">
              <Button
                variant="ghost"
                size="lg"
                className="text-gray-400 hover:text-white"
                leftIcon={<Headphones className="w-4 h-4" />}
              >
                Contact Support
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* 10. Website Footer */}
      <PoppoFooter />

      <AuthModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        lang={lang}
      />

      {/* Store Notice Staging Modal */}
      {showStoreNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#171722] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col gap-4 text-center animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white">
              {showStoreNoticeModal === 'android' ? 'Google Play Store Release' : 'Apple App Store Release'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Official store URLs are staged for publication. Live store links will be activated once Google Play and Apple App Store review cycles are finalized.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <Link href="/contact">
                <Button variant="primary" size="sm" className="w-full">
                  Request Early Access on Staging
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowStoreNoticeModal(null)}
                className="w-full bg-white/5 border-white/10"
              >
                Close Notice
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
