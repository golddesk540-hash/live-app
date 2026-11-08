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
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col font-sans pb-16 lg:pb-0">
      
      {/* 1. TOP HEADER (Responsive for mobile & desktop) */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Poppo Logo */}
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          <PoppoLogo size="sm" className="sm:hidden" />
          <PoppoLogo size="md" className="hidden sm:inline-flex" />
        </div>

        {/* Center: Search Bar (Desktop) */}
        <div className="flex-1 max-w-lg mx-2 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isUr ? 'لائیو براڈکاسٹ تلاش کریں...' : 'Search for live content you like'}
              className="w-full pl-9 pr-4 py-1.5 bg-gray-100 hover:bg-gray-150 focus:bg-white rounded-full text-xs sm:text-sm border border-transparent focus:border-[#5653FE] outline-none transition-all"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 text-xs sm:text-sm font-medium">
          {/* Get Coins Link */}
          <Link
            href="/recharge"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-gray-800 hover:text-amber-700 transition-colors border border-amber-200/60"
          >
            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-white text-[9px] font-black">
              💰
            </div>
            <span className="font-semibold text-xs">{isUr ? 'کوائنز' : 'Coins'}</span>
          </Link>

          {/* Language Toggle */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded-full transition-colors border border-gray-200"
          >
            <Globe className="w-3.5 h-3.5 text-[#5653FE]" />
            <span className="hidden xs:inline">{isUr ? 'اردو' : 'English'}</span>
          </button>

          {/* Login Button */}
          <Link
            href="/login"
            className="px-3.5 sm:px-5 py-1.5 rounded-full bg-[#5653FE] hover:bg-[#433ffd] text-white font-semibold text-xs shadow-sm transition-all"
          >
            {isUr ? 'لاگ ان' : 'Log in'}
          </Link>
        </div>
      </header>

      {/* 2. BODY LAYOUT: LEFT SIDEBAR (Desktop) + MAIN CONTENT */}
      <div className="flex-1 flex max-w-[1920px] w-full mx-auto">
        
        {/* LEFT SIDEBAR (Desktop only - hidden on mobile to maximize viewport) */}
        <aside className="hidden lg:flex w-56 xl:w-60 bg-white border-r border-gray-200 flex-col justify-between shrink-0 p-4">
          <div className="space-y-5">
            
            {/* Get The App Action */}
            <Link
              href="/download"
              className="w-full py-2 px-3 bg-[#5653FE] hover:bg-[#433ffd] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{isUr ? 'ایپ حاصل کریں' : 'Get the App'}</span>
            </Link>

            {/* Navigation Menu */}
            <nav className="space-y-1">
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
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    item.active
                      ? 'bg-purple-50 text-[#5653FE]'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`w-4 h-4 shrink-0 ${item.active ? 'text-[#5653FE]' : 'text-gray-500'}`} />
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500 text-white animate-live-dot">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Bottom Sidebar QR Box */}
          <div className="p-3 rounded-xl border border-gray-100 bg-gray-50 text-center">
            <div className="w-16 h-16 mx-auto bg-white p-1 rounded-lg border border-gray-200 mb-1.5 flex items-center justify-center">
              <div className="w-full h-full bg-gradient-to-br from-[#5653FE] to-indigo-950 rounded flex flex-col justify-between p-1">
                <div className="flex justify-between">
                  <div className="w-2 h-2 bg-white rounded-xs"></div>
                  <div className="w-2 h-2 bg-white rounded-xs"></div>
                </div>
                <div className="w-1 h-1 bg-yellow-300 rounded-full mx-auto"></div>
                <div className="flex justify-between">
                  <div className="w-2 h-2 bg-white rounded-xs"></div>
                  <div className="w-1 h-1 bg-white"></div>
                </div>
              </div>
            </div>
            <p className="text-[10px] font-bold text-gray-800">Scan for Mobile HD</p>
          </div>
        </aside>

        {/* MAIN FEED AREA */}
        <main className="flex-1 p-3 sm:p-5 lg:p-7 overflow-y-auto">
          
          {/* Mobile Search Bar (Visible on mobile/tablet) */}
          <div className="md:hidden mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search live streams..."
                className="w-full pl-8 pr-3 py-1.5 bg-white rounded-full text-xs border border-gray-200 focus:border-[#5653FE] outline-none"
              />
            </div>
          </div>

          {/* Country / Region Filter Pills: Smooth swipe on mobile */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-3 scrollbar-none mb-3 sm:mb-5">
            {countries.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveTab(c.id)}
                className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 shrink-0 transition-all ${
                  activeTab === c.id
                    ? 'bg-[#5653FE] text-white shadow-xs'
                    : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <span>{c.flag}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>

          {/* STREAM CARDS GRID (2 cols on mobile, 3 on tablet, 4 on desktop) */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
            {filteredStreams.map((stream) => (
              <div
                key={stream.id}
                onClick={() => setSelectedStream(stream)}
                className="group relative bg-white rounded-2xl overflow-hidden border border-gray-150 hover:border-[#5653FE]/50 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
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
                  <div className="absolute top-2 sm:top-2.5 right-2 sm:right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-xs font-semibold flex items-center gap-1 border border-white/10 shadow-xs">
                    <div className="flex items-center gap-0.5 h-2.5">
                      <span className="w-0.5 bg-[#5653FE] animate-wave-bar-1" />
                      <span className="w-0.5 bg-pink-400 animate-wave-bar-2" />
                      <span className="w-0.5 bg-yellow-400 animate-wave-bar-3" />
                    </div>
                    <span>{stream.viewers}</span>
                  </div>

                  {/* Top-Left: Country Flag */}
                  <div className="absolute top-2 sm:top-2.5 left-2 sm:left-2.5 flex items-center gap-1">
                    <span className="text-sm sm:text-base drop-shadow-sm">{stream.flag}</span>
                    <span className="hidden xs:inline-block px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-medium border border-white/10">
                      {stream.tag}
                    </span>
                  </div>

                  {/* Middle Badge: PK Battle / Party Room */}
                  {stream.isPk && (
                    <div className="absolute top-1/2 left-2 -translate-y-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-red-600 to-blue-600 text-white text-[9px] sm:text-[10px] font-black shadow-md">
                      <Swords className="w-2.5 h-2.5" />
                      <span>PK</span>
                    </div>
                  )}

                  {stream.isParty && (
                    <div className="absolute top-1/2 left-2 -translate-y-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[9px] sm:text-[10px] font-black shadow-md">
                      <Users className="w-2.5 h-2.5" />
                      <span>{stream.partySeats}</span>
                    </div>
                  )}

                  {/* Stream Title inside image */}
                  <div className="absolute bottom-2 left-2 right-2 text-white">
                    <p className="text-[11px] sm:text-xs font-semibold line-clamp-1 drop-shadow-md">
                      {stream.title}
                    </p>
                  </div>
                </div>

                {/* Card Info Footer */}
                <div className="p-2 sm:p-3 bg-white flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={stream.avatar}
                        alt={stream.name}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-[#5653FE]"
                      />
                      <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate group-hover:text-[#5653FE] transition-colors leading-tight">
                        {stream.name}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-mono truncate">ID: {stream.userId}</p>
                    </div>
                  </div>

                  <div className="shrink-0 hidden xs:block">
                    <span className="text-[10px] sm:text-xs font-bold text-[#5653FE] bg-purple-50 group-hover:bg-[#5653FE] group-hover:text-white px-2 py-0.5 rounded-full transition-colors">
                      Join
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Floating Action Button */}
          <div className="fixed bottom-20 lg:bottom-8 right-4 sm:right-8 flex flex-col gap-2 z-30">
            <button
              onClick={scrollToTop}
              title="Scroll to top"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-gray-700 hover:text-[#5653FE] hover:bg-gray-50 border border-gray-200 shadow-lg flex items-center justify-center transition-all"
            >
              <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </main>
      </div>

      {/* 3. MOBILE BOTTOM NAVIGATION BAR (Visible on mobile/tablet) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 py-1 px-4 flex items-center justify-around shadow-lg">
        <Link
          href="/live"
          className="flex flex-col items-center gap-0.5 py-1 text-[#5653FE] font-bold text-[10px]"
        >
          <Radio className="w-5 h-5 text-[#5653FE]" />
          <span>Live</span>
        </Link>
        <Link
          href="/live"
          className="flex flex-col items-center gap-0.5 py-1 text-gray-600 hover:text-gray-900 font-medium text-[10px]"
        >
          <Users className="w-5 h-5" />
          <span>Party</span>
        </Link>
        <Link
          href="/recharge"
          className="flex flex-col items-center gap-0.5 py-1 text-amber-600 font-bold text-[10px]"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-white text-xs shadow-xs">
            💰
          </div>
          <span>Coins</span>
        </Link>
        <Link
          href="/news"
          className="flex flex-col items-center gap-0.5 py-1 text-gray-600 hover:text-gray-900 font-medium text-[10px]"
        >
          <Sparkles className="w-5 h-5" />
          <span>News</span>
        </Link>
        <Link
          href="/login"
          className="flex flex-col items-center gap-0.5 py-1 text-gray-600 hover:text-gray-900 font-medium text-[10px]"
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </Link>
      </nav>

      {/* 4. INTERACTIVE LIVE ROOM PREVIEW MODAL */}
      {selectedStream && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="relative bg-gray-950 text-white rounded-2xl sm:rounded-3xl overflow-hidden max-w-4xl w-full max-h-[92vh] flex flex-col lg:flex-row shadow-2xl border border-white/10">
            {/* Close Button */}
            <button
              onClick={() => setSelectedStream(null)}
              className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Video Player Canvas (Left) */}
            <div className="relative flex-1 bg-black flex items-center justify-center min-h-[260px] sm:min-h-[360px] lg:min-h-[500px] overflow-hidden">
              <img
                src={selectedStream.cover}
                alt={selectedStream.name}
                className="w-full h-full object-cover filter brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60" />

              {/* Host Tag on Top Left */}
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                <img
                  src={selectedStream.avatar}
                  alt={selectedStream.name}
                  className="w-6 h-6 rounded-full border border-purple-400"
                />
                <div>
                  <div className="text-[11px] font-bold leading-tight">{selectedStream.name}</div>
                  <div className="text-[9px] text-gray-300">ID: {selectedStream.userId}</div>
                </div>
                <button className="ml-1.5 px-2 py-0.5 rounded-full bg-[#5653FE] text-white text-[10px] font-bold">
                  + Follow
                </button>
              </div>

              {/* Live Status Animation */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-live-dot"></span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Live Streaming</span>
                  <span className="text-[10px] text-gray-300">• {selectedStream.viewers} watching</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-2 line-clamp-1">{selectedStream.title}</h3>

                {/* Quick Interactive Gifts Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {['🌹 Rose', '🚀 Rocket', '👑 Crown', '🏎️ Car'].map((gift) => (
                    <Link
                      key={gift}
                      href="/recharge"
                      className="px-2 py-0.5 bg-white/15 hover:bg-[#5653FE] rounded-lg text-[10px] font-medium backdrop-blur-md transition-colors shrink-0"
                    >
                      {gift}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat & Interaction Sidebar (Right) */}
            <div className="w-full lg:w-72 bg-gray-900 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col justify-between p-3 sm:p-4 max-h-[220px] lg:max-h-none">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                  <h4 className="text-xs font-bold flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#5653FE]" />
                    <span>Live Room Chat</span>
                  </h4>
                  <span className="text-[9px] text-emerald-400 font-semibold">● Realtime</span>
                </div>

                <div className="space-y-1.5 max-h-[110px] lg:max-h-[260px] overflow-y-auto text-[11px] pr-1">
                  <div className="p-1.5 rounded bg-purple-950/40 border border-purple-800/40 text-purple-200 text-[10px]">
                    <span className="font-bold">System: </span>
                    <span>Welcome to {selectedStream.name}'s room! Please respect rules.</span>
                  </div>
                  <div className="text-gray-300">
                    <span className="font-bold text-amber-400">Alex_PH: </span>
                    <span>Hello from Philippines! 🇵🇭</span>
                  </div>
                  <div className="text-gray-300">
                    <span className="font-bold text-pink-400">Host_Star: </span>
                    <span>Sent 10x Roses 🌹</span>
                  </div>
                  <div className="text-gray-300">
                    <span className="font-bold text-blue-400">Farhan_Pk: </span>
                    <span>Let's win this round! 🔥</span>
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Say something..."
                  readOnly
                  className="flex-1 bg-gray-800 rounded-full px-3 py-1.5 text-[10px] text-gray-400 border border-white/10 cursor-pointer"
                  onClick={() => {
                    window.location.href = '/login';
                  }}
                />
                <Link
                  href="/login"
                  className="w-7 h-7 rounded-full bg-[#5653FE] text-white flex items-center justify-center shrink-0"
                >
                  <Send className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
