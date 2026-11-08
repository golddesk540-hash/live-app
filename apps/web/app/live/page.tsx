'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PoppoLogo } from '@/components/poppo/PoppoLogo';
import { useLanguage } from '@/lib/languageContext';
import {
  Search,
  Coins,
  Download,
  Globe,
  Radio,
  Users,
  Heart,
  MessageSquare,
  User,
  ChevronDown,
  ChevronUp,
  Volume2,
  Flame,
  Swords,
  Sparkles,
  Send,
  X,
  Share2,
  Gift,
  HelpCircle,
  Laptop
} from 'lucide-react';

interface StreamerCard {
  id: string;
  name: string;
  userId: string;
  country: string;
  flag: string;
  avatar: string;
  cover: string;
  viewers: string;
  title: string;
  tag: string;
  isPk?: boolean;
  pkOpponent?: string;
  isParty?: boolean;
  partySeats?: string;
}

const mockStreams: StreamerCard[] = [
  {
    id: '1',
    name: 'Ayla Rose ✨',
    userId: '9082341',
    country: 'Pakistan',
    flag: '🇵🇰',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    cover: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80',
    viewers: '12.4K',
    title: 'Lahore vibes & acoustic night 🎸 Come chat!',
    tag: 'Singing',
    isPk: true,
    pkOpponent: 'Sana_Queen',
  },
  {
    id: '2',
    name: 'Sofia Reyes',
    userId: '8839210',
    country: 'Philippines',
    flag: '🇵🇭',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    cover: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&auto=format&fit=crop&q=80',
    viewers: '9.8K',
    title: 'Manila sunset live! Party room open 🌸',
    tag: 'Party',
    isParty: true,
    partySeats: '8/9',
  },
  {
    id: '3',
    name: 'Zara Malik',
    userId: '7721894',
    country: 'Pakistan',
    flag: '🇵🇰',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    cover: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&auto=format&fit=crop&q=80',
    viewers: '7.3K',
    title: 'PK Battle Round 3! Need top support! 🏆',
    tag: 'PK Battle',
    isPk: true,
    pkOpponent: 'Roxana',
  },
  {
    id: '4',
    name: 'Aarav & Maya',
    userId: '6543128',
    country: 'India',
    flag: '🇮🇳',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    cover: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    viewers: '18.1K',
    title: 'Bollywood Hits & Dance Remix Non-Stop 💃',
    tag: 'Dance',
  },
  {
    id: '5',
    name: 'Anjali Sharma',
    userId: '5421098',
    country: 'Nepal',
    flag: '🇳🇵',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    cover: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&auto=format&fit=crop&q=80',
    viewers: '5.6K',
    title: 'Kathmandu evening chit chat ☕',
    tag: 'ChitChat',
  },
  {
    id: '6',
    name: 'Nayeem Hasan',
    userId: '4390123',
    country: 'Bangladesh',
    flag: '🇧🇩',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    cover: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop&q=80',
    viewers: '4.2K',
    title: 'Dhaka musical cafe - requesting your songs!',
    tag: 'Music',
  },
  {
    id: '7',
    name: 'Chloe Lin',
    userId: '3209841',
    country: 'Philippines',
    flag: '🇵🇭',
    avatar: 'https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?w=150&auto=format&fit=crop&q=80',
    cover: 'https://images.unsplash.com/photo-1516726817505-f5ed825624d8?w=600&auto=format&fit=crop&q=80',
    viewers: '11.5K',
    title: 'Cosplay Stream! Win Lucky Gift Bags 🎁',
    tag: 'Gaming',
    isParty: true,
    partySeats: '9/9 Full',
  },
  {
    id: '8',
    name: 'Hamza Khan',
    userId: '2109485',
    country: 'Pakistan',
    flag: '🇵🇰',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    cover: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80',
    viewers: '6.9K',
    title: 'Islamabad late night talk show & Q&A 🌙',
    tag: 'TalkShow',
    isPk: true,
    pkOpponent: 'Bilal_Pro',
  },
  {
    id: '9',
    name: 'Pooja Thapa',
    userId: '9841203',
    country: 'Nepal',
    flag: '🇳🇵',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    cover: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    viewers: '3.9K',
    title: 'Pokhara lake view live stream with friends',
    tag: 'Outdoor',
  },
  {
    id: '10',
    name: 'Rohan Verma',
    userId: '8754129',
    country: 'India',
    flag: '🇮🇳',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    cover: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
    viewers: '14.2K',
    title: 'Mega PK against Team Manila! Let’s Go! 🚀',
    tag: 'PK Battle',
    isPk: true,
    pkOpponent: 'Kiko_PH',
  },
  {
    id: '11',
    name: 'Tania Akter',
    userId: '7645120',
    country: 'Bangladesh',
    flag: '🇧🇩',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    cover: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80',
    viewers: '5.1K',
    title: 'Friday night party room! Come take a mic 🎙️',
    tag: 'Party',
    isParty: true,
    partySeats: '6/9',
  },
  {
    id: '12',
    name: 'Bea Santos',
    userId: '6512398',
    country: 'Philippines',
    flag: '🇵🇭',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    cover: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&auto=format&fit=crop&q=80',
    viewers: '8.4K',
    title: 'Acoustic covers & love songs ❤️ Request now',
    tag: 'Singing',
  },
];

export default function PoppoLiveExplorePage() {
  const { lang, toggleLang, isUr } = useLanguage();
  const [activeTab, setActiveTab] = useState('Popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStream, setSelectedStream] = useState<StreamerCard | null>(null);

  const countries = [
    { id: 'Popular', label: isUr ? 'مقبول ترین' : 'Popular', flag: '🔥' },
    { id: 'Philippines', label: isUr ? 'فلپائن' : 'Philippines', flag: '🇵🇭' },
    { id: 'Nepal', label: isUr ? 'نیپال' : 'Nepal', flag: '🇳🇵' },
    { id: 'India', label: isUr ? 'بھارت' : 'India', flag: '🇮🇳' },
    { id: 'Pakistan', label: isUr ? 'پاکستان' : 'Pakistan', flag: '🇵🇰' },
    { id: 'Bangladesh', label: isUr ? 'بنگلہ دیش' : 'Bangladesh', flag: '🇧🇩' },
  ];

  const filteredStreams = mockStreams.filter((stream) => {
    const matchesCountry = activeTab === 'Popular' || stream.country.toLowerCase() === activeTab.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      stream.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stream.userId.includes(searchQuery);
    return matchesCountry && matchesSearch;
  });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col font-sans">
      
      {/* 1. TOP HEADER (Matching 01_live_explore_web_app.png) */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 h-16 sm:h-18 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Poppo Logo */}
        <div className="flex items-center gap-6">
          <PoppoLogo />
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-xl mx-4 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isUr ? 'اپنی پسندیدہ لائیو براڈکاسٹ تلاش کریں...' : 'Search for live content you like'}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 hover:bg-gray-150 focus:bg-white rounded-full text-sm border border-transparent focus:border-[#5653FE] focus:ring-2 focus:ring-[#5653FE]/20 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-4 text-sm font-medium">
          {/* Get Coins Link */}
          <Link
            href="/recharge"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-amber-50 text-gray-800 hover:text-amber-600 transition-colors"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-white text-[10px] font-black shadow-xs">
              💰
            </div>
            <span className="hidden sm:inline font-semibold">{isUr ? 'کوائنز حاصل کریں' : 'Get Coins'}</span>
          </Link>

          {/* Get The App */}
          <Link
            href="/download"
            className="hidden lg:flex items-center gap-1.5 text-gray-600 hover:text-[#5653FE] transition-colors"
          >
            <Download className="w-4 h-4 text-[#5653FE]" />
            <span>{isUr ? 'ایپ ڈاؤن لوڈ' : 'Get the App'}</span>
          </Link>

          {/* Web Desktop Link */}
          <Link
            href="/"
            className="hidden xl:flex items-center gap-1 text-gray-500 hover:text-gray-800 transition-colors text-xs"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>web desktop</span>
          </Link>

          {/* Language Toggle */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded-full transition-colors border border-gray-200"
          >
            <Globe className="w-3.5 h-3.5 text-[#5653FE]" />
            <span>{isUr ? 'اردو' : 'English'}</span>
          </button>

          {/* Login Button (Poppo Purple Pill) */}
          <Link
            href="/login"
            className="px-5 py-2 rounded-full bg-[#5653FE] hover:bg-[#433ffd] text-white font-semibold text-xs sm:text-sm shadow-sm transition-all transform hover:scale-[1.02]"
          >
            {isUr ? 'لاگ ان' : 'Log in'}
          </Link>
        </div>
      </header>

      {/* 2. BODY LAYOUT: LEFT SIDEBAR + MAIN LIVE STREAM CONTENT */}
      <div className="flex-1 flex max-w-[1920px] w-full mx-auto">
        
        {/* LEFT SIDEBAR (Matching 01_live_explore_web_app.png) */}
        <aside className="w-16 sm:w-20 lg:w-60 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 p-3 sm:p-4">
          <div className="space-y-6">
            
            {/* Get The App Purple Action Button (Desktop Only) */}
            <div className="hidden lg:block">
              <Link
                href="/download"
                className="w-full py-2.5 px-4 bg-[#5653FE] hover:bg-[#433ffd] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                <span>{isUr ? 'ایپ حاصل کریں' : 'Get the App'}</span>
              </Link>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1.5">
              {[
                { name: isUr ? 'لائیو' : 'Live', icon: Radio, active: true, href: '/live', badge: 'LIVE' },
                { name: isUr ? 'پارٹی روم' : 'Party', icon: Users, active: false, href: '/live', badge: null },
                { name: isUr ? 'فالوئنگ' : 'Following', icon: Heart, active: false, href: '/login', badge: null },
                { name: isUr ? 'پیغامات' : 'Message', icon: MessageSquare, active: false, href: '/login', badge: null },
                { name: isUr ? 'پروفائل' : 'Profile', icon: User, active: false, href: '/login', badge: null },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    item.active
                      ? 'bg-purple-50 text-[#5653FE]'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  } justify-center lg:justify-start`}
                  title={item.name}
                >
                  <item.icon className={`w-5 h-5 shrink-0 ${item.active ? 'text-[#5653FE]' : 'text-gray-500'}`} />
                  <span className="hidden lg:inline">{item.name}</span>
                  {item.badge && (
                    <span className="hidden lg:inline ml-auto text-[10px] font-black px-1.5 py-0.5 rounded bg-rose-500 text-white animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Bottom Sidebar QR Code Box */}
          <div className="hidden lg:block p-3 rounded-xl border border-gray-100 bg-gray-50 text-center">
            <div className="w-20 h-20 mx-auto bg-white p-1 rounded-lg border border-gray-200 mb-2 flex items-center justify-center">
              <div className="w-full h-full bg-gradient-to-br from-[#5653FE] to-indigo-950 rounded flex flex-col justify-between p-1">
                <div className="flex justify-between">
                  <div className="w-2.5 h-2.5 bg-white rounded-xs"></div>
                  <div className="w-2.5 h-2.5 bg-white rounded-xs"></div>
                </div>
                <div className="w-1.5 h-1.5 bg-yellow-300 rounded-full mx-auto"></div>
                <div className="flex justify-between">
                  <div className="w-2.5 h-2.5 bg-white rounded-xs"></div>
                  <div className="w-1 h-1 bg-white"></div>
                </div>
              </div>
            </div>
            <p className="text-[11px] font-bold text-gray-800">Scan to watch on mobile</p>
            <p className="text-[9px] text-gray-400">Available on iOS & Android</p>
          </div>
        </aside>

        {/* MAIN FEED AREA */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          
          {/* Country / Region Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
            {countries.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveTab(c.id)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 shrink-0 transition-all ${
                  activeTab === c.id
                    ? 'bg-[#5653FE] text-white shadow-md shadow-purple-500/20'
                    : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <span>{c.flag}</span>
                <span>{c.label}</span>
              </button>
            ))}

            <div className="ml-auto pl-2 shrink-0">
              <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 px-3 py-2 bg-white rounded-full border border-gray-200">
                <span>{isUr ? 'مزید ممالک' : 'More'}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Mobile Search Bar if viewport < md */}
          <div className="md:hidden mb-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search live streams..."
                className="w-full pl-10 pr-4 py-2 bg-white rounded-full text-sm border border-gray-200 focus:border-[#5653FE] outline-none"
              />
            </div>
          </div>

          {/* STREAM CARDS GRID (4-COLUMNS DESKTOP MATCHING SCREENSHOT) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredStreams.map((stream) => (
              <div
                key={stream.id}
                onClick={() => setSelectedStream(stream)}
                className="group relative bg-white rounded-2xl overflow-hidden border border-gray-150 hover:border-[#5653FE]/40 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer flex flex-col"
              >
                {/* Thumbnail Image Container */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-900">
                  <img
                    src={stream.cover}
                    alt={stream.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  {/* Top-Right: Audio Waves & Viewer Count */}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10">
                    {/* Animated audio wave bars */}
                    <div className="flex items-center gap-0.5 h-3">
                      <span className="w-0.5 h-1.5 bg-[#5653FE] animate-pulse"></span>
                      <span className="w-0.5 h-3 bg-pink-400 animate-pulse delay-75"></span>
                      <span className="w-0.5 h-2 bg-yellow-400 animate-pulse delay-150"></span>
                    </div>
                    <span>{stream.viewers}</span>
                  </div>

                  {/* Top-Left: Country Flag + Tag Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="text-base drop-shadow-sm">{stream.flag}</span>
                    <span className="px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-md text-white text-[11px] font-medium border border-white/10">
                      {stream.tag}
                    </span>
                  </div>

                  {/* Middle Badge: PK Battle / Party Room */}
                  {stream.isPk && (
                    <div className="absolute top-1/2 left-3 -translate-y-1/2 flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-red-600 via-rose-500 to-blue-600 text-white text-[11px] font-black shadow-lg shadow-rose-600/30">
                      <Swords className="w-3 h-3" />
                      <span>PK 1v1</span>
                    </div>
                  )}

                  {stream.isParty && (
                    <div className="absolute top-1/2 left-3 -translate-y-1/2 flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[11px] font-black shadow-lg">
                      <Users className="w-3 h-3" />
                      <span>{stream.partySeats}</span>
                    </div>
                  )}

                  {/* Hover Quick Action Play Icon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <div className="w-14 h-14 rounded-full bg-[#5653FE]/90 text-white flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                      <Radio className="w-6 h-6 animate-pulse" />
                    </div>
                  </div>

                  {/* Bottom Stream Title Inside Image */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-xs font-semibold line-clamp-1 drop-shadow-md">
                      {stream.title}
                    </p>
                  </div>
                </div>

                {/* Card Info Footer */}
                <div className="p-3.5 bg-white flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={stream.avatar}
                        alt={stream.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-[#5653FE]"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-[#5653FE] transition-colors">
                        {stream.name}
                      </h4>
                      <p className="text-[11px] text-gray-400">ID: {stream.userId}</p>
                    </div>
                  </div>

                  {/* Follow / Enter mini button */}
                  <div className="shrink-0">
                    <span className="text-xs font-bold text-[#5653FE] bg-purple-50 group-hover:bg-[#5653FE] group-hover:text-white px-2.5 py-1 rounded-full transition-colors">
                      Join
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Floating Scroll To Top & Feedback Action */}
          <div className="fixed bottom-8 right-8 flex flex-col gap-3 z-30">
            <button
              onClick={scrollToTop}
              title="Scroll to top"
              className="w-11 h-11 rounded-full bg-white text-gray-700 hover:text-[#5653FE] hover:bg-gray-50 border border-gray-200 shadow-lg flex items-center justify-center transition-all"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            <Link
              href="/contact"
              title="Customer Support"
              className="w-11 h-11 rounded-full bg-[#5653FE] text-white hover:bg-[#433ffd] shadow-lg shadow-purple-500/30 flex items-center justify-center transition-all"
            >
              <HelpCircle className="w-5 h-5" />
            </Link>
          </div>
        </main>
      </div>

      {/* 3. INTERACTIVE LIVE ROOM PREVIEW MODAL */}
      {selectedStream && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-gray-950 text-white rounded-3xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col lg:flex-row shadow-2xl border border-white/10">
            {/* Close Button */}
            <button
              onClick={() => setSelectedStream(null)}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Video Player Canvas (Left) */}
            <div className="relative flex-1 bg-black flex items-center justify-center min-h-[350px] lg:min-h-[550px] overflow-hidden">
              <img
                src={selectedStream.cover}
                alt={selectedStream.name}
                className="w-full h-full object-cover filter brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60" />

              {/* Host Tag on Top Left */}
              <div className="absolute top-4 left-4 flex items-center gap-3 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <img
                  src={selectedStream.avatar}
                  alt={selectedStream.name}
                  className="w-8 h-8 rounded-full border border-purple-400"
                />
                <div>
                  <div className="text-xs font-bold leading-tight">{selectedStream.name}</div>
                  <div className="text-[10px] text-gray-300">ID: {selectedStream.userId}</div>
                </div>
                <button className="ml-2 px-3 py-1 rounded-full bg-[#5653FE] text-white text-[11px] font-bold">
                  + Follow
                </button>
              </div>

              {/* Live Status Animation */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Live Streaming</span>
                  <span className="text-xs text-gray-300">• {selectedStream.viewers} watching</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{selectedStream.title}</h3>

                {/* Quick Interactive Gifts Bar */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  {['🌹 Rose (1 Coin)', '🚀 Rocket (100)', '👑 Crown (500)', '🏎️ Sports Car (1,000)'].map((gift) => (
                    <Link
                      key={gift}
                      href="/recharge"
                      className="px-2.5 py-1 bg-white/10 hover:bg-[#5653FE] rounded-lg text-xs font-medium backdrop-blur-md transition-colors"
                    >
                      {gift}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat & Interaction Sidebar (Right) */}
            <div className="w-full lg:w-80 bg-gray-900 border-l border-white/10 flex flex-col justify-between p-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#5653FE]" />
                    <span>Live Room Chat</span>
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-semibold">● Realtime</span>
                </div>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto text-xs pr-1">
                  <div className="p-2 rounded bg-purple-950/40 border border-purple-800/40 text-purple-200">
                    <span className="font-bold">System: </span>
                    <span>Welcome to {selectedStream.name}'s room! Please respect Poppo Community Rules.</span>
                  </div>
                  <div className="text-gray-300">
                    <span className="font-bold text-amber-400">VIP_Alex: </span>
                    <span>Hello from Philippines! 🇵🇭 Amazing voice!</span>
                  </div>
                  <div className="text-gray-300">
                    <span className="font-bold text-pink-400">Star_Host_99: </span>
                    <span>Sent 10x Roses 🌹🌹🌹</span>
                  </div>
                  <div className="text-gray-300">
                    <span className="font-bold text-blue-400">Rana_Pk: </span>
                    <span>Hit the PK target today! Zabardast! 🔥</span>
                  </div>
                </div>
              </div>

              {/* Chat Input & Download Prompt */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Log in to send comments..."
                    readOnly
                    className="flex-1 bg-gray-800 rounded-full px-3.5 py-2 text-xs text-gray-400 border border-white/10 cursor-pointer"
                    onClick={() => {
                      window.location.href = '/login';
                    }}
                  />
                  <Link
                    href="/login"
                    className="w-8 h-8 rounded-full bg-[#5653FE] text-white flex items-center justify-center shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="text-center">
                  <Link
                    href="/download"
                    className="text-[11px] text-[#5653FE] hover:underline font-semibold"
                  >
                    Download App for full HD streaming & Party Seats →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
